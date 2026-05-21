use serde::{Deserialize, Serialize};
use std::{
    collections::{HashMap, HashSet},
    fs::{self, File, OpenOptions},
    io::{ErrorKind, Write},
    path::{Path, PathBuf},
};
use time::{format_description::well_known::Rfc3339, OffsetDateTime};

const MAX_PROJECT_ID_LEN: usize = 96;
const MAX_KICAD_BUNDLE_FILENAME_BYTES: usize = 255;
const ALLOWED_KICAD_BUNDLE_EXTENSIONS: [&str; 6] = [
    ".kicad_sch",
    ".kicad_pro",
    ".kicad_sym",
    ".kicad_pcb",
    ".kicad_mod",
    ".kicad_wks",
];

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CreateProjectInput {
    pub name: String,
    pub description: String,
    pub controller_id: String,
    pub template: String,
    pub voltage_domain: String,
    pub output_target: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ProjectComponentRecord {
    pub id: String,
    pub catalog_id: String,
    pub instance_name: String,
    pub status: String,
    pub preferred_protocol: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SignalAssignment {
    pub signal: String,
    pub selected_pin: String,
    pub alternate_pins: Vec<String>,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ConnectionRecord {
    pub id: String,
    pub component_id: String,
    pub protocol: String,
    pub controller_interface: String,
    pub pins: Vec<String>,
    pub bus_mode: String,
    pub optional_signals: Vec<String>,
    pub status: String,
    pub assignments: Vec<SignalAssignment>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ValidationIssue {
    pub id: String,
    pub severity: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ProjectDocument {
    pub id: String,
    pub name: String,
    pub description: String,
    pub controller_id: String,
    pub status: String,
    pub voltage_domain: String,
    pub template: String,
    pub output_target: String,
    pub components: Vec<ProjectComponentRecord>,
    pub connections: Vec<ConnectionRecord>,
    pub issues: Vec<ValidationIssue>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ProjectExportManifest<'a> {
    format_version: u8,
    generated_at: String,
    project_id: &'a str,
    project_name: &'a str,
    controller: ExportController<'a>,
    summary: ExportSummary,
    files: Vec<&'static str>,
    components: &'a [ProjectComponentRecord],
    connections: &'a [ConnectionRecord],
    issues: &'a [ValidationIssue],
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ExportController<'a> {
    id: &'a str,
    voltage_domain: &'a str,
    template: &'a str,
    output_target: &'a str,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ExportSummary {
    component_count: usize,
    connection_count: usize,
    issue_count: usize,
}

pub struct ProjectStore {
    root_dir: PathBuf,
}

impl ProjectStore {
    pub fn new(root_dir: PathBuf) -> Self {
        Self { root_dir }
    }

    pub fn list_projects(&self) -> Result<Vec<ProjectDocument>, String> {
        self.ensure_projects_dir()?;

        let mut projects = Vec::new();
        let projects_dir = self.projects_dir();
        let entries = fs::read_dir(&projects_dir).map_err(|error| {
            format_path_error("Failed to read projects directory", &projects_dir, &error)
        })?;

        for entry in entries {
            let entry = entry.map_err(|error| {
                format!(
                    "Failed to enumerate project directories in {}: {}",
                    projects_dir.display(),
                    error
                )
            })?;
            let entry_type = entry.file_type().map_err(|error| {
                format!(
                    "Failed to inspect project directory type at {}: {}",
                    entry.path().display(),
                    error
                )
            })?;

            if !entry_type.is_dir() {
                continue;
            }

            let project_file = entry.path().join("project.json");
            if project_file.exists() {
                projects.push(self.read_project_file(&project_file)?);
            }
        }

        projects.sort_by(|left, right| right.updated_at.cmp(&left.updated_at));
        Ok(projects)
    }

    pub fn create_project(&self, input: CreateProjectInput) -> Result<ProjectDocument, String> {
        self.ensure_projects_dir()?;

        let name = input.name.trim();
        if name.is_empty() {
            return Err("Project name cannot be empty.".into());
        }

        let description = input.description.trim();
        if description.is_empty() {
            return Err("Project description cannot be empty.".into());
        }

        let timestamp = current_timestamp()?;
        let project = ProjectDocument {
            id: self.make_unique_project_id(name),
            name: name.to_string(),
            description: description.to_string(),
            controller_id: input.controller_id,
            status: "Draft".into(),
            voltage_domain: input.voltage_domain,
            template: input.template.trim().to_string(),
            output_target: input.output_target,
            components: Vec::new(),
            connections: Vec::new(),
            issues: Vec::new(),
            created_at: timestamp.clone(),
            updated_at: timestamp,
        };

        self.write_project_file(&project)
    }

    pub fn load_project(&self, project_id: &str) -> Result<ProjectDocument, String> {
        validate_project_id(project_id)?;

        let project_file = self.project_file(project_id);
        if !project_file.exists() {
            return Err(format!("Project \"{}\" was not found.", project_id));
        }

        self.read_project_file(&project_file)
    }

    pub fn save_project(&self, mut project: ProjectDocument) -> Result<ProjectDocument, String> {
        self.ensure_projects_dir()?;
        validate_project_id(&project.id)?;

        project.name = project.name.trim().to_string();
        project.description = project.description.trim().to_string();
        project.template = project.template.trim().to_string();

        if project.name.is_empty() {
            return Err("Project name cannot be empty.".into());
        }

        if project.description.is_empty() {
            return Err("Project description cannot be empty.".into());
        }

        if project.created_at.trim().is_empty() {
            project.created_at = current_timestamp()?;
        }

        project.updated_at = current_timestamp()?;
        self.write_project_file(&project)
    }

    pub fn rename_project(&self, project_id: &str, name: &str) -> Result<ProjectDocument, String> {
        let trimmed_name = name.trim();
        if trimmed_name.is_empty() {
            return Err("Project name cannot be empty.".into());
        }

        let mut project = self.load_project(project_id)?;
        project.name = trimmed_name.to_string();
        self.save_project(project)
    }

    pub fn duplicate_project(
        &self,
        project_id: &str,
        name: Option<String>,
    ) -> Result<ProjectDocument, String> {
        let mut project = self.load_project(project_id)?;
        let duplicate_name = name
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty())
            .unwrap_or_else(|| format!("{} Copy", project.name));
        let timestamp = current_timestamp()?;

        project.id = self.make_unique_project_id(&duplicate_name);
        project.name = duplicate_name;
        project.created_at = timestamp.clone();
        project.updated_at = timestamp;

        self.write_project_file(&project)
    }

    pub fn delete_project(&self, project_id: &str) -> Result<(), String> {
        validate_project_id(project_id)?;

        let project_dir = self.project_dir(project_id);
        if !project_dir.exists() {
            return Err(format!("Project \"{}\" was not found.", project_id));
        }

        fs::remove_dir_all(&project_dir).map_err(|error| {
            format_path_error("Failed to delete project directory", &project_dir, &error)
        })
    }

    pub fn export_project(&self, project_id: &str) -> Result<String, String> {
        let project = self.load_project(project_id)?;
        let exports_dir = self.exports_dir();
        fs::create_dir_all(&exports_dir).map_err(|error| {
            format_path_error("Failed to create export directory", &exports_dir, &error)
        })?;

        let export_dir = exports_dir.join(format!("{}-export", project.id));
        fs::create_dir_all(&export_dir).map_err(|error| {
            format_path_error(
                "Failed to create project export directory",
                &export_dir,
                &error,
            )
        })?;

        let manifest = ProjectExportManifest {
            format_version: 1,
            generated_at: current_timestamp()?,
            project_id: &project.id,
            project_name: &project.name,
            controller: ExportController {
                id: &project.controller_id,
                voltage_domain: &project.voltage_domain,
                template: &project.template,
                output_target: &project.output_target,
            },
            summary: ExportSummary {
                component_count: project.components.len(),
                connection_count: project.connections.len(),
                issue_count: project.issues.len(),
            },
            files: vec!["project.json", "manifest.json"],
            components: &project.components,
            connections: &project.connections,
            issues: &project.issues,
        };

        self.write_json_file(
            &export_dir.join("project.json"),
            &project,
            "Failed to write exported project",
        )?;
        self.write_json_file(
            &export_dir.join("manifest.json"),
            &manifest,
            "Failed to write export manifest",
        )?;

        Ok(export_dir.display().to_string())
    }

    pub fn write_kicad_bundle(
        &self,
        project_id: &str,
        files: HashMap<String, String>,
    ) -> Result<String, String> {
        validate_project_id(project_id)?;
        validate_kicad_bundle_filenames(files.keys().map(String::as_str))?;

        let kicad_dir = self.project_dir(project_id).join("kicad");
        fs::create_dir_all(&kicad_dir).map_err(|error| {
            format_path_error(
                "Failed to create KiCad bundle directory",
                &kicad_dir,
                &error,
            )
        })?;

        for (filename, contents) in files {
            let file_path = kicad_dir.join(filename);
            write_file_atomically(
                &file_path,
                contents.as_bytes(),
                "Failed to write KiCad bundle file",
            )?;
        }

        let absolute_kicad_dir = fs::canonicalize(&kicad_dir).map_err(|error| {
            format_path_error(
                "Failed to resolve KiCad bundle directory",
                &kicad_dir,
                &error,
            )
        })?;

        Ok(absolute_kicad_dir.display().to_string())
    }

    fn projects_dir(&self) -> PathBuf {
        self.root_dir.join("projects")
    }

    fn exports_dir(&self) -> PathBuf {
        self.root_dir.join("exports")
    }

    fn project_dir(&self, project_id: &str) -> PathBuf {
        self.projects_dir().join(project_id)
    }

    fn project_file(&self, project_id: &str) -> PathBuf {
        self.project_dir(project_id).join("project.json")
    }

    fn ensure_projects_dir(&self) -> Result<(), String> {
        let projects_dir = self.projects_dir();
        fs::create_dir_all(&projects_dir).map_err(|error| {
            format_path_error("Failed to create projects directory", &projects_dir, &error)
        })
    }

    fn read_project_file(&self, path: &Path) -> Result<ProjectDocument, String> {
        let contents = fs::read_to_string(path)
            .map_err(|error| format_path_error("Failed to read project file", path, &error))?;

        serde_json::from_str(&contents)
            .map_err(|error| format!("Failed to parse project file {}: {}", path.display(), error))
    }

    fn write_project_file(&self, project: &ProjectDocument) -> Result<ProjectDocument, String> {
        validate_project_id(&project.id)?;

        let project_dir = self.project_dir(&project.id);
        fs::create_dir_all(&project_dir).map_err(|error| {
            format_path_error("Failed to create project directory", &project_dir, &error)
        })?;

        let project_file = self.project_file(&project.id);
        self.write_json_file(&project_file, project, "Failed to write project file")?;

        Ok(project.clone())
    }

    fn write_json_file<T: Serialize>(
        &self,
        path: &Path,
        value: &T,
        context: &str,
    ) -> Result<(), String> {
        let serialized = serde_json::to_vec_pretty(value).map_err(|error| {
            format!("Failed to serialize JSON for {}: {}", path.display(), error)
        })?;

        write_file_atomically(path, &serialized, context)
    }

    fn make_unique_project_id(&self, name: &str) -> String {
        let base_id = slugify(name);
        let mut candidate_id = base_id.clone();
        let mut duplicate_index = 2;

        while self.project_dir(&candidate_id).exists() {
            candidate_id = project_id_with_suffix(&base_id, duplicate_index);
            duplicate_index += 1;
        }

        candidate_id
    }
}

fn validate_project_id(project_id: &str) -> Result<(), String> {
    if project_id.is_empty() || project_id.trim() != project_id {
        return Err("Project id cannot be empty.".into());
    }

    if project_id.len() > MAX_PROJECT_ID_LEN {
        return Err(format!(
            "Project id cannot be longer than {} characters.",
            MAX_PROJECT_ID_LEN
        ));
    }

    if project_id == "."
        || project_id == ".."
        || project_id.contains('/')
        || project_id.contains('\\')
    {
        return Err("Project id cannot contain path separators or traversal segments.".into());
    }

    if !project_id
        .bytes()
        .all(|byte| byte.is_ascii_alphanumeric() || byte == b'-')
    {
        return Err("Project id may only contain ASCII letters, numbers, and hyphens.".into());
    }

    if !project_id
        .bytes()
        .next()
        .is_some_and(|byte| byte.is_ascii_alphanumeric())
        || !project_id
            .bytes()
            .last()
            .is_some_and(|byte| byte.is_ascii_alphanumeric())
    {
        return Err("Project id must start and end with an ASCII letter or number.".into());
    }

    if is_reserved_project_id(project_id) {
        return Err("Project id uses a reserved system name.".into());
    }

    Ok(())
}

fn validate_kicad_bundle_filenames<'a>(
    filenames: impl IntoIterator<Item = &'a str>,
) -> Result<(), String> {
    let mut normalized_filenames = HashSet::new();

    for filename in filenames {
        if filename.is_empty() {
            return Err("KiCad bundle filename \"\" cannot be empty.".into());
        }

        if filename.starts_with('.') {
            return Err(format!(
                "KiCad bundle filename {:?} cannot start with a dot.",
                filename
            ));
        }

        if filename.contains('/')
            || filename.contains('\\')
            || filename.contains("..")
            || filename.contains('\0')
        {
            return Err(format!(
                "KiCad bundle filename {:?} cannot contain path separators, traversal segments, or NUL bytes.",
                filename
            ));
        }

        if filename.len() > MAX_KICAD_BUNDLE_FILENAME_BYTES {
            return Err(format!(
                "KiCad bundle filename {:?} cannot be longer than {} bytes.",
                filename, MAX_KICAD_BUNDLE_FILENAME_BYTES
            ));
        }

        let lower_filename = filename.to_ascii_lowercase();
        if !ALLOWED_KICAD_BUNDLE_EXTENSIONS
            .iter()
            .any(|extension| lower_filename.ends_with(extension))
        {
            return Err(format!(
                "KiCad bundle filename {:?} must use one of these extensions: {}.",
                filename,
                ALLOWED_KICAD_BUNDLE_EXTENSIONS.join(", ")
            ));
        }

        let normalized_filename = filename.to_lowercase();
        if !normalized_filenames.insert(normalized_filename) {
            return Err(format!(
                "KiCad bundle filename {:?} conflicts with another filename after case-insensitive comparison.",
                filename
            ));
        }
    }

    Ok(())
}

fn write_file_atomically(path: &Path, contents: &[u8], context: &str) -> Result<(), String> {
    let (temp_path, mut temp_file) = create_atomic_temp_file(path, context)?;

    if let Err(error) = temp_file
        .write_all(contents)
        .and_then(|_| temp_file.sync_all())
    {
        let _ = fs::remove_file(&temp_path);
        return Err(format_path_error(context, path, &error));
    }

    drop(temp_file);

    if let Err(error) = fs::rename(&temp_path, path) {
        let _ = fs::remove_file(&temp_path);
        return Err(format_path_error(context, path, &error));
    }

    Ok(())
}

fn create_atomic_temp_file(path: &Path, context: &str) -> Result<(PathBuf, File), String> {
    let parent = path
        .parent()
        .ok_or_else(|| format!("Failed to resolve parent directory for {}", path.display()))?;
    let file_name = path
        .file_name()
        .and_then(|value| value.to_str())
        .ok_or_else(|| format!("Failed to resolve file name for {}", path.display()))?;
    let unique_part = OffsetDateTime::now_utc().unix_timestamp_nanos();

    for attempt in 0..100 {
        let temp_path = parent.join(format!(
            ".{}.{}.{}.tmp",
            file_name,
            std::process::id(),
            unique_part + attempt
        ));

        match OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&temp_path)
        {
            Ok(file) => return Ok((temp_path, file)),
            Err(error) if error.kind() == ErrorKind::AlreadyExists => continue,
            Err(error) => return Err(format_path_error(context, path, &error)),
        }
    }

    Err(format!(
        "Failed to create temporary file for {} after multiple attempts.",
        path.display()
    ))
}

fn format_path_error(context: &str, path: &Path, error: &std::io::Error) -> String {
    format!("{} {}: {}", context, path.display(), error)
}

fn current_timestamp() -> Result<String, String> {
    OffsetDateTime::now_utc()
        .format(&Rfc3339)
        .map_err(|error| format!("Failed to format current timestamp: {}", error))
}

fn slugify(value: &str) -> String {
    let mut slug = String::new();
    let mut last_was_separator = false;

    for character in value.chars() {
        if character.is_ascii_alphanumeric() {
            slug.push(character.to_ascii_lowercase());
            last_was_separator = false;
            continue;
        }

        if !slug.is_empty() && !last_was_separator {
            slug.push('-');
            last_was_separator = true;
        }
    }

    while slug.ends_with('-') {
        slug.pop();
    }

    if slug.is_empty() {
        slug = "project".into();
    }

    normalize_project_id_slug(slug)
}

fn normalize_project_id_slug(mut slug: String) -> String {
    if slug.len() > MAX_PROJECT_ID_LEN {
        slug.truncate(MAX_PROJECT_ID_LEN);
        while slug.ends_with('-') {
            slug.pop();
        }
    }

    if slug.is_empty() {
        slug = "project".into();
    }

    if is_reserved_project_id(&slug) {
        slug = format!("project-{}", slug);
    }

    slug
}

fn project_id_with_suffix(base_id: &str, duplicate_index: usize) -> String {
    let suffix = format!("-{}", duplicate_index);
    let max_base_len = MAX_PROJECT_ID_LEN.saturating_sub(suffix.len());
    let mut base = base_id.chars().take(max_base_len).collect::<String>();

    while base.ends_with('-') {
        base.pop();
    }

    if base.is_empty() {
        base = "project".into();
    }

    format!("{}{}", base, suffix)
}

fn is_reserved_project_id(project_id: &str) -> bool {
    matches!(
        project_id.to_ascii_lowercase().as_str(),
        "con"
            | "prn"
            | "aux"
            | "nul"
            | "com1"
            | "com2"
            | "com3"
            | "com4"
            | "com5"
            | "com6"
            | "com7"
            | "com8"
            | "com9"
            | "lpt1"
            | "lpt2"
            | "lpt3"
            | "lpt4"
            | "lpt5"
            | "lpt6"
            | "lpt7"
            | "lpt8"
            | "lpt9"
    )
}

#[cfg(test)]
mod tests {
    use super::{
        validate_project_id, ConnectionRecord, CreateProjectInput, ProjectComponentRecord,
        ProjectDocument, ProjectStore, SignalAssignment, ValidationIssue,
    };
    use std::{collections::HashMap, fs, path::Path};
    use tempfile::tempdir;

    fn sample_input() -> CreateProjectInput {
        CreateProjectInput {
            name: "Rocket FC Rev A".into(),
            description: "Primary flight controller.".into(),
            controller_id: "stm32h743zi".into(),
            template: "Blank project".into(),
            voltage_domain: "3.3V".into(),
            output_target: "Generate KiCad starter project".into(),
        }
    }

    #[test]
    fn project_store_crud_round_trip() {
        let temp_dir = tempdir().expect("tempdir");
        let store = ProjectStore::new(temp_dir.path().to_path_buf());

        let created = store
            .create_project(sample_input())
            .expect("create project");

        assert_eq!(created.id, "rocket-fc-rev-a");

        let loaded = store.load_project(&created.id).expect("load project");
        assert_eq!(loaded.name, created.name);

        let renamed = store
            .rename_project(&created.id, "Rocket FC Rev B")
            .expect("rename project");
        assert_eq!(renamed.name, "Rocket FC Rev B");

        let duplicate = store
            .duplicate_project(&created.id, None)
            .expect("duplicate project");
        assert_ne!(duplicate.id, created.id);
        assert_eq!(duplicate.name, "Rocket FC Rev B Copy");

        let listed = store.list_projects().expect("list projects");
        assert_eq!(listed.len(), 2);

        let export_path = store.export_project(&duplicate.id).expect("export project");
        assert!(Path::new(&export_path).is_dir());
        assert!(Path::new(&export_path).join("project.json").exists());
        assert!(Path::new(&export_path).join("manifest.json").exists());

        store.delete_project(&created.id).expect("delete project");

        let remaining = store.list_projects().expect("list after delete");
        assert_eq!(remaining.len(), 1);
        assert_eq!(remaining[0].id, duplicate.id);
    }

    #[test]
    fn project_id_validation_rejects_path_traversal_and_unsafe_ids() {
        let invalid_ids = [
            "",
            " ",
            ".",
            "..",
            "../escape",
            "nested/project",
            "nested\\project",
            "/absolute",
            "rocket fc",
            "rocket.fc",
            "rocket_fc",
            "-rocket",
            "rocket-",
            "con",
        ];

        for project_id in invalid_ids {
            assert!(
                validate_project_id(project_id).is_err(),
                "expected invalid project id {project_id:?}"
            );
        }

        let temp_dir = tempdir().expect("tempdir");
        let store = ProjectStore::new(temp_dir.path().to_path_buf());
        let created = store
            .create_project(sample_input())
            .expect("create project");
        let attempted_escape = ProjectDocument {
            id: "../escape".into(),
            ..created
        };

        assert!(store.save_project(attempted_escape).is_err());
        assert!(!temp_dir.path().join("escape").exists());
    }

    #[test]
    fn export_project_writes_bundle_with_project_and_manifest() {
        let temp_dir = tempdir().expect("tempdir");
        let store = ProjectStore::new(temp_dir.path().to_path_buf());
        let mut project = store
            .create_project(sample_input())
            .expect("create project");

        project.components.push(ProjectComponentRecord {
            id: "imu-1".into(),
            catalog_id: "bosch-bmi088".into(),
            instance_name: "Flight IMU".into(),
            status: "Ready".into(),
            preferred_protocol: Some("SPI".into()),
        });
        project.connections.push(ConnectionRecord {
            id: "conn-imu-1".into(),
            component_id: "imu-1".into(),
            protocol: "SPI".into(),
            controller_interface: "SPI1".into(),
            pins: vec!["PA5".into(), "PA6".into(), "PA7".into()],
            bus_mode: "Dedicated".into(),
            optional_signals: vec!["INT1".into()],
            status: "Assigned".into(),
            assignments: vec![SignalAssignment {
                signal: "SCK".into(),
                selected_pin: "PA5".into(),
                alternate_pins: vec!["PB3".into()],
                status: "Selected".into(),
            }],
        });
        project.issues.push(ValidationIssue {
            id: "issue-1".into(),
            severity: "warning".into(),
            message: "INT1 is optional but unassigned.".into(),
        });

        let saved = store.save_project(project).expect("save project");
        let export_path = store.export_project(&saved.id).expect("export project");
        let export_dir = Path::new(&export_path);

        assert!(export_dir.is_dir());

        let exported_project: ProjectDocument = serde_json::from_str(
            &fs::read_to_string(export_dir.join("project.json")).expect("read project export"),
        )
        .expect("parse project export");
        assert_eq!(exported_project, saved);

        let manifest: serde_json::Value = serde_json::from_str(
            &fs::read_to_string(export_dir.join("manifest.json")).expect("read manifest"),
        )
        .expect("parse manifest");

        assert_eq!(manifest["projectId"], saved.id);
        assert_eq!(manifest["controller"]["id"], saved.controller_id);
        assert_eq!(manifest["summary"]["componentCount"], 1);
        assert_eq!(manifest["summary"]["connectionCount"], 1);
        assert_eq!(manifest["summary"]["issueCount"], 1);
        assert_eq!(manifest["components"][0]["id"], "imu-1");
        assert_eq!(manifest["connections"][0]["id"], "conn-imu-1");
        assert_eq!(manifest["issues"][0]["id"], "issue-1");
        assert_eq!(manifest["files"][0], "project.json");
        assert_eq!(manifest["files"][1], "manifest.json");
    }

    #[test]
    fn write_kicad_bundle_writes_files_to_project_kicad_directory() {
        let temp_dir = tempdir().expect("tempdir");
        let store = ProjectStore::new(temp_dir.path().to_path_buf());
        let files = HashMap::from([
            (
                "rocket-fc.kicad_sch".to_string(),
                "(kicad_sch (version 20250114))\n".to_string(),
            ),
            (
                "rocket-fc.kicad_pro".to_string(),
                "{\"meta\":{\"version\":1}}\n".to_string(),
            ),
        ]);

        let kicad_path = store
            .write_kicad_bundle("rocket-fc", files)
            .expect("write KiCad bundle");
        let kicad_dir = temp_dir
            .path()
            .join("projects")
            .join("rocket-fc")
            .join("kicad");

        assert_eq!(
            Path::new(&kicad_path),
            fs::canonicalize(&kicad_dir)
                .expect("canonicalize KiCad directory")
                .as_path()
        );
        assert_eq!(
            fs::read(kicad_dir.join("rocket-fc.kicad_sch")).expect("read schematic"),
            b"(kicad_sch (version 20250114))\n"
        );
        assert_eq!(
            fs::read(kicad_dir.join("rocket-fc.kicad_pro")).expect("read project"),
            b"{\"meta\":{\"version\":1}}\n"
        );
    }

    #[test]
    fn write_kicad_bundle_overwrites_existing_file() {
        let temp_dir = tempdir().expect("tempdir");
        let store = ProjectStore::new(temp_dir.path().to_path_buf());

        store
            .write_kicad_bundle(
                "rocket-fc",
                HashMap::from([("rocket-fc.kicad_sch".to_string(), "old".to_string())]),
            )
            .expect("write initial KiCad bundle");

        store
            .write_kicad_bundle(
                "rocket-fc",
                HashMap::from([("rocket-fc.kicad_sch".to_string(), "new".to_string())]),
            )
            .expect("rewrite KiCad bundle");

        let schematic_path = temp_dir
            .path()
            .join("projects")
            .join("rocket-fc")
            .join("kicad")
            .join("rocket-fc.kicad_sch");
        assert_eq!(fs::read(schematic_path).expect("read schematic"), b"new");
    }

    #[test]
    fn write_kicad_bundle_rejects_path_traversal_filename() {
        let temp_dir = tempdir().expect("tempdir");
        let store = ProjectStore::new(temp_dir.path().to_path_buf());

        let result = store.write_kicad_bundle(
            "rocket-fc",
            HashMap::from([("../escape.txt".to_string(), "escape".to_string())]),
        );

        assert!(result.is_err());
        assert!(!temp_dir.path().join("projects").exists());
        assert!(!temp_dir.path().join("escape.txt").exists());
    }

    #[test]
    fn write_kicad_bundle_rejects_nested_filename() {
        let temp_dir = tempdir().expect("tempdir");
        let store = ProjectStore::new(temp_dir.path().to_path_buf());

        let result = store.write_kicad_bundle(
            "rocket-fc",
            HashMap::from([("nested/file.kicad_sch".to_string(), "contents".to_string())]),
        );

        assert!(result.is_err());
        assert!(!temp_dir.path().join("projects").exists());
    }

    #[test]
    fn write_kicad_bundle_rejects_empty_filename() {
        let temp_dir = tempdir().expect("tempdir");
        let store = ProjectStore::new(temp_dir.path().to_path_buf());

        let result = store.write_kicad_bundle(
            "rocket-fc",
            HashMap::from([("".to_string(), "contents".to_string())]),
        );

        assert!(result.is_err());
        assert!(!temp_dir.path().join("projects").exists());
    }

    #[test]
    fn write_kicad_bundle_rejects_disallowed_extension() {
        let temp_dir = tempdir().expect("tempdir");
        let store = ProjectStore::new(temp_dir.path().to_path_buf());

        let result = store.write_kicad_bundle(
            "rocket-fc",
            HashMap::from([("rocket-fc.txt".to_string(), "contents".to_string())]),
        );

        let error = result.expect_err("reject disallowed extension");
        assert!(error.contains("rocket-fc.txt"));
        assert!(error.contains(".kicad_sch"));
        assert!(error.contains(".kicad_wks"));
        assert!(!temp_dir.path().join("projects").exists());
    }

    #[test]
    fn write_kicad_bundle_rejects_overlong_filename() {
        let temp_dir = tempdir().expect("tempdir");
        let store = ProjectStore::new(temp_dir.path().to_path_buf());
        let overlong_filename = format!("{}.kicad_sch", "a".repeat(246));

        let result = store.write_kicad_bundle(
            "rocket-fc",
            HashMap::from([(overlong_filename, "contents".to_string())]),
        );

        let error = result.expect_err("reject overlong filename");
        assert!(error.contains("255 bytes"));
        assert!(!temp_dir.path().join("projects").exists());
    }

    #[test]
    fn write_kicad_bundle_rejects_invalid_project_id() {
        let temp_dir = tempdir().expect("tempdir");
        let store = ProjectStore::new(temp_dir.path().to_path_buf());

        let result = store.write_kicad_bundle(
            "../escape",
            HashMap::from([("rocket-fc.kicad_sch".to_string(), "contents".to_string())]),
        );

        assert!(result.is_err());
        assert!(!temp_dir.path().join("projects").exists());
        assert!(!temp_dir.path().join("escape").exists());
    }

    #[test]
    fn write_kicad_bundle_rejects_case_conflicting_filenames() {
        let temp_dir = tempdir().expect("tempdir");
        let store = ProjectStore::new(temp_dir.path().to_path_buf());

        let result = store.write_kicad_bundle(
            "rocket-fc",
            HashMap::from([
                ("Foo.kicad_sch".to_string(), "upper".to_string()),
                ("foo.kicad_sch".to_string(), "lower".to_string()),
            ]),
        );

        assert!(result.is_err());
        assert!(!temp_dir.path().join("projects").exists());
    }
}
