#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Serialize;

#[derive(Serialize)]
struct FontInfo {
    name: String,
    family: String,
    is_system: bool,
}

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

#[tauri::command]
fn get_system_fonts() -> Result<Vec<FontInfo>, String> {
    // macOS: 使用 system_profiler 获取字体列表
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;

        let output = Command::new("system_profiler")
            .arg("SPFontsDataType")
            .output()
            .map_err(|e| format!("Failed to execute system_profiler: {}", e))?;

        let output_str = String::from_utf8_lossy(&output.stdout);
        let mut fonts = Vec::new();

        for line in output_str.lines() {
            if line.contains("Name:") {
                let name = line.split(':').nth(1)
                    .unwrap_or("")
                    .trim()
                    .to_string();
                if !name.is_empty() {
                    fonts.push(FontInfo {
                        name: name.clone(),
                        family: name,
                        is_system: true,
                    });
                }
            }
        }

        fonts.truncate(500); // 限制返回数量
        return Ok(fonts);
    }

    // Linux: 使用 fc-list
    #[cfg(target_os = "linux")]
    {
        use std::process::Command;

        let output = Command::new("fc-list")
            .arg("--format=%{family}\\n")
            .output()
            .map_err(|e| format!("Failed to execute fc-list: {}", e))?;

        let output_str = String::from_utf8_lossy(&output.stdout);
        let mut fonts = Vec::new();
        let mut seen = std::collections::HashSet::new();

        for line in output_str.lines() {
            let family = line.trim();
            if !family.is_empty() && seen.insert(family.to_string()) {
                fonts.push(FontInfo {
                    name: family.to_string(),
                    family: family.to_string(),
                    is_system: true,
                });
            }
        }

        fonts.truncate(500);
        return Ok(fonts);
    }

    // Windows: 返回常见字体
    #[cfg(target_os = "windows")]
    {
        return Ok(vec![
            FontInfo { name: "Microsoft YaHei".to_string(), family: "Microsoft YaHei".to_string(), is_system: true },
            FontInfo { name: "SimSun".to_string(), family: "SimSun".to_string(), is_system: true },
            FontInfo { name: "SimHei".to_string(), family: "SimHei".to_string(), is_system: true },
            FontInfo { name: "KaiTi".to_string(), family: "KaiTi".to_string(), is_system: true },
            FontInfo { name: "FangSong".to_string(), family: "FangSong".to_string(), is_system: true },
        ]);
    }

    #[cfg(not(any(target_os = "macos", target_os = "linux", target_os = "windows")))]
    {
        Ok(vec![])
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![save_image, get_system_fonts])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
