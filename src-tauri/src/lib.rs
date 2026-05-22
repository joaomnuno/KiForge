mod commands;
mod domain;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::projects::healthcheck,
            commands::projects::load_projects,
            commands::projects::create_project,
            commands::projects::load_project,
            commands::projects::save_project,
            commands::projects::rename_project,
            commands::projects::duplicate_project,
            commands::projects::delete_project,
            commands::projects::export_project,
            commands::projects::write_kicad_bundle
        ])
        .run(tauri::generate_context!())
        .expect("failed to run KiForge desktop shell");
}
