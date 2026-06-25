/// Tauri 命令：获取应用版本
#[tauri::command]
fn get_app_version(app: tauri::AppHandle) -> String {
    app.config().version.clone().unwrap_or_default()
}

/// 启动 Tauri 应用
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![get_app_version])
        .run(tauri::generate_context!())
        .expect("运行 Tauri 应用时出错");
}
