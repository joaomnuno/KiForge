use serde::{Deserialize, Serialize};
use std::{
    fs,
    path::{Path, PathBuf},
};
use time::{format_description::well_known::Rfc3339, OffsetDateTime};

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
        let entries = fs::read_dir(&projects_dir)
            .map_err(|error| format_path_error("Failed to read projects directory", &projects_dir, &error))?;

        for entry in entries {
            let entry = entry.map_err(|error| {
                format!("Failed to enumerate project directories in {}: {}", projects_dir.display(), error)
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

        fs::remove_dir_all(&project_dir)
            .map_err(|error| format_path_error("Failed to delete project directory", &project_dir, &error))
    }

    pub fn export_project(&self, project_id: &str) -> Result<String, String> {
        let project = self.load_project(project_id)?;
        let exports_dir = self.exports_dir();
        fs::create_dir_all(&exports_dir)
            .map_err(|error| format_path_error("Failed to create export directory", &exports_dir, &error))?;

        let export_path = exports_dir.join(format!("{}-project.json", project.id));
        let serialized = serde_json::to_string_pretty(&project)
            .map_err(|error| format!("Failed to serialize project {}: {}", project.id, error))?;

        fs::write(&export_path, serialized)
            .map_err(|error| format_path_error("Failed to write exported project", &export_path, &error))?;

        Ok(export_path.display().to_string())
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
        fs::create_dir_all(&projects_dir)
            .map_err(|error| format_path_error("Failed to create projects directory", &projects_dir, &error))
    }

    fn read_project_file(&self, path: &Path) -> Result<ProjectDocument, String> {
        let contents = fs::read_to_string(path)
            .map_err(|error| format_path_error("Failed to read project file", path, &error))?;

        serde_json::from_str(&contents)
            .map_err(|error| format!("Failed to parse project file {}: {}", path.display(), error))
    }

    fn write_project_file(&self, project: &ProjectDocument) -> Result<ProjectDocument, String> {
        let project_dir = self.project_dir(&project.id);
        fs::create_dir_all(&project_dir)
            .map_err(|error| format_path_error("Failed to create project directory", &project_dir, &error))?;

        let project_file = self.project_file(&project.id);
        let serialized = serde_json::to_string_pretty(project)
            .map_err(|error| format!("Failed to serialize project {}: {}", project.id, error))?;

        fs::write(&project_file, serialized)
            .map_err(|error| format_path_error("Failed to write project file", &project_file, &error))?;

        Ok(project.clone())
    }

    fn make_unique_project_id(&self, name: &str) -> String {
        let base_id = slugify(name);
        let mut candidate_id = base_id.clone();
        let mut duplicate_index = 2;

        while self.project_dir(&candidate_id).exists() {
            candidate_id = format!("{}-{}", base_id, duplicate_index);
            duplicate_index += 1;
        }

        candidate_id
    }
}

fn validate_project_id(project_id: &str) -> Result<(), String> {
    if project_id.trim().is_empty() {
        return Err("Project id cannot be empty.".into());
    }

    Ok(())
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
        return "project".into();
    }

    slug
}

#[cfg(test)]
mod tests {
    use super::{CreateProjectInput, ProjectStore};
    use std::path::Path;
    use tempfile::tempdir;

    #[test]
    fn project_store_crud_round_trip() {
        let temp_dir = tempdir().expect("tempdir");
        let store = ProjectStore::new(temp_dir.path().to_path_buf());

        let created = store
            .create_project(CreateProjectInput {
                name: "Rocket FC Rev A".into(),
                description: "Primary flight controller.".into(),
                controller_id: "stm32h743zi".into(),
                template: "Blank project".into(),
                voltage_domain: "3.3V".into(),
                output_target: "Generate KiCad starter project".into(),
            })
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
        assert!(Path::new(&export_path).exists());

        store.delete_project(&created.id).expect("delete project");

        let remaining = store.list_projects().expect("list after delete");
        assert_eq!(remaining.len(), 1);
        assert_eq!(remaining[0].id, duplicate.id);
    }
}
