mod commands;
mod domain;

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::projects::healthcheck,
            commands::projects::load_projects,
            commands::projects::create_project,
            commands::projects::load_project,
            commands::projects::save_project,
            commands::projects::rename_project,
            commands::projects::duplicate_project,
            commands::projects::delete_project,
            commands::projects::export_project
        ])
        .run(tauri::generate_context!())
        .expect("failed to run KiForge desktop shell");
}
