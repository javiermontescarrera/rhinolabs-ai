mod commands;

use commands::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            // Status & Installation
            get_status,
            install_plugin,
            update_plugin,
            uninstall_plugin,
            // Diagnostics
            run_diagnostics,
            // Manifest
            get_manifest,
            update_manifest,
            // Settings
            get_settings,
            update_settings,
            get_permissions,
            update_permissions,
            add_permission,
            remove_permission,
            get_env_vars,
            set_env_var,
            remove_env_var,
            get_status_line,
            update_status_line,
            // MCP Configuration
            get_mcp_config,
            update_mcp_config,
            list_mcp_servers,
            get_mcp_server,
            add_mcp_server,
            update_mcp_server,
            remove_mcp_server,
            get_mcp_settings,
            update_mcp_settings,
            sync_mcp_config,
            // Output Styles
            list_output_styles,
            get_output_style,
            get_active_output_style,
            set_active_output_style,
            create_output_style,
            update_output_style,
            delete_output_style,
            // Skills
            list_skills,
            get_skill,
            create_skill,
            update_skill,
            toggle_skill,
            delete_skill,
            // Instructions
            get_instructions,
            update_instructions,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
