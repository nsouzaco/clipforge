mod recording;
mod video;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn import_video(path: String) -> Result<video::VideoMetadata, String> {
    video::import_video(path).map_err(|e| e.to_string())
}

#[tauri::command]
fn generate_thumbnail(path: String) -> Result<String, String> {
    video::generate_thumbnail(path).map_err(|e| e.to_string())
}

#[tauri::command]
fn export_video(config: video::ExportConfig) -> Result<(), String> {
    video::export_video(config).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_mpv::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            import_video,
            generate_thumbnail,
            export_video
        ])
        .setup(|_app| Ok(()))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
