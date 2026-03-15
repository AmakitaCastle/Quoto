#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[tauri::command]
async fn save_image(
    app_handle: tauri::AppHandle,
    data_url: String,
    filename: String,
) -> Result<String, String> {
    use base64::{engine::general_purpose, Engine as _};
    use std::fs;

    let base64_data = data_url.strip_prefix("data:image/png;base64,").unwrap_or(&data_url);
    let bytes = general_purpose::STANDARD.decode(base64_data).map_err(|e| e.to_string())?;

    let dialog = tauri_plugin_dialog::DialogExt::dialog(&app_handle);
    let file_path = dialog
        .file()
        .set_file_name(&filename)
        .blocking_save_file();

    if let Some(path) = file_path {
        let path_buf = path.into_path().map_err(|e| e.to_string())?;
        fs::write(&path_buf, &bytes).map_err(|e| e.to_string())?;
        Ok(path_buf.to_string_lossy().to_string())
    } else {
        Err("User cancelled save dialog".to_string())
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![save_image])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
