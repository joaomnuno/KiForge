use crate::domain::project::{CreateProjectInput, ProjectDocument, ProjectStore};
use tauri::{AppHandle, Manager};

fn project_store(app: &AppHandle) -> Result<ProjectStore, String> {
    let root_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("Failed to resolve app data directory: {}", error))?;

    Ok(ProjectStore::new(root_dir))
}

#[tauri::command]
pub fn healthcheck() -> &'static str {
    "ok"
}

#[tauri::command]
pub fn load_projects(app: AppHandle) -> Result<Vec<ProjectDocument>, String> {
    project_store(&app)?.list_projects()
}

#[tauri::command]
pub fn create_project(
    app: AppHandle,
    input: CreateProjectInput,
) -> Result<ProjectDocument, String> {
    project_store(&app)?.create_project(input)
}

#[tauri::command]
pub fn load_project(app: AppHandle, project_id: String) -> Result<ProjectDocument, String> {
    project_store(&app)?.load_project(&project_id)
}

#[tauri::command]
pub fn save_project(app: AppHandle, project: ProjectDocument) -> Result<ProjectDocument, String> {
    project_store(&app)?.save_project(project)
}

#[tauri::command]
pub fn rename_project(
    app: AppHandle,
    project_id: String,
    name: String,
) -> Result<ProjectDocument, String> {
    project_store(&app)?.rename_project(&project_id, &name)
}

#[tauri::command]
pub fn duplicate_project(
    app: AppHandle,
    project_id: String,
    name: Option<String>,
) -> Result<ProjectDocument, String> {
    project_store(&app)?.duplicate_project(&project_id, name)
}

#[tauri::command]
pub fn delete_project(app: AppHandle, project_id: String) -> Result<(), String> {
    project_store(&app)?.delete_project(&project_id)
}

#[tauri::command]
pub fn export_project(app: AppHandle, project_id: String) -> Result<String, String> {
    project_store(&app)?.export_project(&project_id)
}
