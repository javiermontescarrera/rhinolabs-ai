use rhinolabs_core::{
    Installer, Updater, McpSync, Paths, Version, Doctor,
    Manifest, PluginManifest,
    Settings, PluginSettings, PermissionConfig, StatusLineConfig,
    OutputStyles, OutputStyle,
    Skills, Skill, CreateSkillInput, UpdateSkillInput,
    InstructionsManager, Instructions,
    McpConfigManager, McpConfig, McpServer, McpSettings,
};
use rhinolabs_core::diagnostics::DiagnosticReport;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// ============================================
// Status Types
// ============================================

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StatusInfo {
    is_installed: bool,
    version: Option<String>,
    installed_at: Option<String>,
    plugin_path: Option<String>,
    claude_code_installed: bool,
    mcp_configured: bool,
}

// ============================================
// Status & Installation Commands
// ============================================

#[tauri::command]
pub fn get_status() -> Result<StatusInfo, String> {
    let is_installed = Paths::is_plugin_installed();
    let version_info = Version::installed().ok().flatten();

    let status = StatusInfo {
        is_installed,
        version: version_info.as_ref().map(|v| v.version.clone()),
        installed_at: version_info.map(|v| v.installed_at.to_rfc3339()),
        plugin_path: Paths::plugin_dir().ok().map(|p| p.display().to_string()),
        claude_code_installed: Paths::is_claude_code_installed(),
        mcp_configured: Paths::mcp_config_path()
            .map(|p| p.exists())
            .unwrap_or(false),
    };

    Ok(status)
}

#[tauri::command]
pub async fn install_plugin(local_path: Option<String>) -> Result<(), String> {
    let installer = Installer::new();

    if let Some(path) = local_path {
        installer
            .install_from_local(std::path::Path::new(&path))
            .map_err(|e| e.to_string())
    } else {
        installer.install().await.map_err(|e| e.to_string())
    }
}

#[tauri::command]
pub async fn update_plugin() -> Result<(), String> {
    let updater = Updater::new();
    updater.update().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub fn uninstall_plugin() -> Result<(), String> {
    let installer = Installer::new();
    installer.uninstall().map_err(|e| e.to_string())
}

// ============================================
// Diagnostics Commands
// ============================================

#[tauri::command]
pub async fn run_diagnostics() -> Result<DiagnosticReport, String> {
    Doctor::run().await.map_err(|e| e.to_string())
}

// ============================================
// Manifest Commands
// ============================================

#[tauri::command]
pub fn get_manifest() -> Result<PluginManifest, String> {
    Manifest::get().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_manifest(manifest: PluginManifest) -> Result<(), String> {
    Manifest::update(&manifest).map_err(|e| e.to_string())
}

// ============================================
// Settings Commands
// ============================================

#[tauri::command]
pub fn get_settings() -> Result<PluginSettings, String> {
    Settings::get().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_settings(settings: PluginSettings) -> Result<(), String> {
    Settings::update(&settings).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_permissions() -> Result<PermissionConfig, String> {
    Settings::get_permissions().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_permissions(permissions: PermissionConfig) -> Result<(), String> {
    Settings::update_permissions(permissions).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn add_permission(permission_type: String, permission: String) -> Result<(), String> {
    Settings::add_permission(&permission_type, &permission).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn remove_permission(permission_type: String, permission: String) -> Result<(), String> {
    Settings::remove_permission(&permission_type, &permission).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_env_vars() -> Result<HashMap<String, String>, String> {
    Settings::get_env_vars().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_env_var(key: String, value: String) -> Result<(), String> {
    Settings::set_env_var(&key, &value).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn remove_env_var(key: String) -> Result<(), String> {
    Settings::remove_env_var(&key).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_status_line() -> Result<StatusLineConfig, String> {
    Settings::get_status_line().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_status_line(config: StatusLineConfig) -> Result<(), String> {
    Settings::update_status_line(config).map_err(|e| e.to_string())
}

// ============================================
// MCP Configuration Commands
// ============================================

#[tauri::command]
pub fn get_mcp_config() -> Result<McpConfig, String> {
    McpConfigManager::get().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_mcp_config(config: McpConfig) -> Result<(), String> {
    McpConfigManager::update(&config).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_mcp_servers() -> Result<HashMap<String, McpServer>, String> {
    McpConfigManager::list_servers().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_mcp_server(name: String) -> Result<Option<McpServer>, String> {
    McpConfigManager::get_server(&name).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn add_mcp_server(name: String, server: McpServer) -> Result<(), String> {
    McpConfigManager::add_server(&name, server).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_mcp_server(name: String, server: McpServer) -> Result<(), String> {
    McpConfigManager::update_server(&name, server).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn remove_mcp_server(name: String) -> Result<(), String> {
    McpConfigManager::remove_server(&name).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_mcp_settings() -> Result<McpSettings, String> {
    McpConfigManager::get_settings().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_mcp_settings(settings: McpSettings) -> Result<(), String> {
    McpConfigManager::update_settings(settings).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn sync_mcp_config(url: Option<String>, file_path: Option<String>) -> Result<(), String> {
    let sync = match (url, file_path) {
        (Some(url), None) => McpSync::from_remote(url),
        (None, Some(file)) => McpSync::from_local(file),
        _ => return Err("Must specify either url or file_path".into()),
    };

    sync.sync().await.map_err(|e| e.to_string())
}

// ============================================
// Output Styles Commands
// ============================================

#[tauri::command]
pub fn list_output_styles() -> Result<Vec<OutputStyle>, String> {
    OutputStyles::list().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_output_style(id: String) -> Result<Option<OutputStyle>, String> {
    OutputStyles::get(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_active_output_style() -> Result<Option<OutputStyle>, String> {
    OutputStyles::get_active().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_active_output_style(id: String) -> Result<(), String> {
    OutputStyles::set_active(&id).map_err(|e| e.to_string())
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateOutputStyleInput {
    name: String,
    description: String,
    keep_coding_instructions: bool,
    content: String,
}

#[tauri::command]
pub fn create_output_style(style: CreateOutputStyleInput) -> Result<OutputStyle, String> {
    OutputStyles::create(
        &style.name,
        &style.description,
        style.keep_coding_instructions,
        &style.content,
    ).map_err(|e| e.to_string())
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateOutputStyleInput {
    name: Option<String>,
    description: Option<String>,
    keep_coding_instructions: Option<bool>,
    content: Option<String>,
}

#[tauri::command]
pub fn update_output_style(id: String, style: UpdateOutputStyleInput) -> Result<(), String> {
    OutputStyles::update(
        &id,
        style.name.as_deref(),
        style.description.as_deref(),
        style.keep_coding_instructions,
        style.content.as_deref(),
    ).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_output_style(id: String) -> Result<(), String> {
    OutputStyles::delete(&id).map_err(|e| e.to_string())
}

// ============================================
// Skills Commands
// ============================================

#[tauri::command]
pub fn list_skills() -> Result<Vec<Skill>, String> {
    Skills::list().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_skill(id: String) -> Result<Option<Skill>, String> {
    Skills::get(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_skill(input: CreateSkillInput) -> Result<Skill, String> {
    Skills::create(input).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_skill(id: String, input: UpdateSkillInput) -> Result<(), String> {
    Skills::update(&id, input).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn toggle_skill(id: String, enabled: bool) -> Result<(), String> {
    Skills::toggle(&id, enabled).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_skill(id: String) -> Result<(), String> {
    Skills::delete(&id).map_err(|e| e.to_string())
}

// ============================================
// Instructions Commands
// ============================================

#[tauri::command]
pub fn get_instructions() -> Result<Instructions, String> {
    InstructionsManager::get().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_instructions(content: String) -> Result<(), String> {
    InstructionsManager::update(&content).map_err(|e| e.to_string())
}
