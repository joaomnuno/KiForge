use crate::domain::project::ProjectRecord;

#[tauri::command]
pub fn healthcheck() -> &'static str {
    "ok"
}

#[tauri::command]
pub fn load_projects() -> Vec<ProjectRecord> {
    vec![ProjectRecord {
        id: "rocket-fc".into(),
        name: "Rocket FC Rev A".into(),
        controller: "STM32H743ZI".into(),
        status: "Pin Mapping Incomplete".into(),
        updated_at: "2026-04-07T00:00:00Z".into(),
    }]
}

#[tauri::command]
pub fn save_project(project: ProjectRecord) -> ProjectRecord {
    project
}

#[tauri::command]
pub fn export_project(project_id: String) -> String {
    format!("export queued for {}", project_id)
}
