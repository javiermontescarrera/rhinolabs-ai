use crate::{Paths, Result, RhinolabsError};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

/// MCP Server configuration supporting both stdio and HTTP transports.
///
/// For stdio transport (local process):
/// - `command`: The command to run
/// - `args`: Arguments for the command
/// - `env`: Optional environment variables
///
/// For HTTP transport (remote server):
/// - `url`: The HTTP URL of the MCP server
/// - `transport`: Must be "http"
/// - `headers`: Optional HTTP headers (e.g., Authorization)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpServer {
    // stdio transport fields
    #[serde(skip_serializing_if = "Option::is_none")]
    pub command: Option<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub args: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub env: Option<HashMap<String, String>>,

    // http transport fields
    #[serde(skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub transport: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub headers: Option<HashMap<String, String>>,
}

impl McpServer {
    /// Create a new stdio-based MCP server
    pub fn stdio(command: String, args: Vec<String>) -> Self {
        Self {
            command: Some(command),
            args,
            env: None,
            url: None,
            transport: None,
            headers: None,
        }
    }

    /// Create a new HTTP-based MCP server
    pub fn http(url: String) -> Self {
        Self {
            command: None,
            args: Vec::new(),
            env: None,
            url: Some(url),
            transport: Some("http".to_string()),
            headers: None,
        }
    }

    /// Check if this is an HTTP transport server
    pub fn is_http(&self) -> bool {
        self.transport.as_deref() == Some("http") || self.url.is_some()
    }

    /// Check if this is a stdio transport server
    pub fn is_stdio(&self) -> bool {
        self.command.is_some()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct McpSettings {
    pub default_timeout: u32,
    pub retry_attempts: u32,
    pub log_level: String,
}

impl Default for McpSettings {
    fn default() -> Self {
        Self {
            default_timeout: 30000,
            retry_attempts: 3,
            log_level: "info".into(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct McpConfig {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub _note: Option<String>,
    pub mcp_servers: HashMap<String, McpServer>,
    #[serde(default)]
    pub settings: McpSettings,
}

impl Default for McpConfig {
    fn default() -> Self {
        Self {
            _note: Some("This file is managed by Rhinolabs GUI. See docs/MCP_CENTRALIZED_CONFIG.md for details.".into()),
            mcp_servers: HashMap::new(),
            settings: McpSettings::default(),
        }
    }
}

pub struct McpConfigManager;

impl McpConfigManager {
    /// Get the MCP config file path
    fn config_path() -> Result<PathBuf> {
        Paths::mcp_config_path()
    }

    /// Get the full MCP config
    pub fn get() -> Result<McpConfig> {
        let path = Self::config_path()?;

        if !path.exists() {
            return Ok(McpConfig::default());
        }

        let content = fs::read_to_string(&path)?;
        let config: McpConfig = serde_json::from_str(&content)?;

        Ok(config)
    }

    /// Update the full MCP config
    /// Creates the directory if it doesn't exist
    pub fn update(config: &McpConfig) -> Result<()> {
        let path = Self::config_path()?;

        // Create parent directory if it doesn't exist
        if let Some(parent) = path.parent() {
            if !parent.exists() {
                fs::create_dir_all(parent)?;
            }
        }

        let content = serde_json::to_string_pretty(config)?;
        fs::write(&path, content)?;

        Ok(())
    }

    // ========================================
    // MCP Servers
    // ========================================

    /// List all MCP servers
    pub fn list_servers() -> Result<HashMap<String, McpServer>> {
        let config = Self::get()?;
        Ok(config.mcp_servers)
    }

    /// Get a specific MCP server
    pub fn get_server(name: &str) -> Result<Option<McpServer>> {
        let config = Self::get()?;
        Ok(config.mcp_servers.get(name).cloned())
    }

    /// Add a new MCP server
    pub fn add_server(name: &str, server: McpServer) -> Result<()> {
        let mut config = Self::get()?;

        if config.mcp_servers.contains_key(name) {
            return Err(RhinolabsError::ConfigError(format!(
                "MCP server '{}' already exists",
                name
            )));
        }

        config.mcp_servers.insert(name.to_string(), server);
        Self::update(&config)
    }

    /// Update an existing MCP server
    pub fn update_server(name: &str, server: McpServer) -> Result<()> {
        let mut config = Self::get()?;

        if !config.mcp_servers.contains_key(name) {
            return Err(RhinolabsError::ConfigError(format!(
                "MCP server '{}' not found",
                name
            )));
        }

        config.mcp_servers.insert(name.to_string(), server);
        Self::update(&config)
    }

    /// Remove an MCP server
    pub fn remove_server(name: &str) -> Result<()> {
        let mut config = Self::get()?;

        if config.mcp_servers.remove(name).is_none() {
            return Err(RhinolabsError::ConfigError(format!(
                "MCP server '{}' not found",
                name
            )));
        }

        Self::update(&config)
    }

    // ========================================
    // MCP Settings
    // ========================================

    /// Get MCP settings
    pub fn get_settings() -> Result<McpSettings> {
        let config = Self::get()?;
        Ok(config.settings)
    }

    /// Update MCP settings
    pub fn update_settings(settings: McpSettings) -> Result<()> {
        let mut config = Self::get()?;
        config.settings = settings;
        Self::update(&config)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_mcp_config_default() {
        let config = McpConfig::default();

        assert!(config.mcp_servers.is_empty());
        assert_eq!(config.settings.default_timeout, 30000);
        assert_eq!(config.settings.retry_attempts, 3);
        assert_eq!(config.settings.log_level, "info");
    }

    #[test]
    fn test_mcp_settings_default() {
        let settings = McpSettings::default();

        assert_eq!(settings.default_timeout, 30000);
        assert_eq!(settings.retry_attempts, 3);
        assert_eq!(settings.log_level, "info");
    }

    #[test]
    fn test_mcp_server_stdio_serialization() {
        let server = McpServer::stdio(
            "npx".into(),
            vec!["-y".into(), "@modelcontextprotocol/server-git".into()],
        );

        let json = serde_json::to_string(&server).unwrap();
        let deserialized: McpServer = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.command, Some("npx".into()));
        assert_eq!(deserialized.args.len(), 2);
        assert!(deserialized.is_stdio());
        assert!(!deserialized.is_http());
    }

    #[test]
    fn test_mcp_server_http_serialization() {
        let server = McpServer::http("https://example.com/mcp".into());

        let json = serde_json::to_string(&server).unwrap();
        let deserialized: McpServer = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.url, Some("https://example.com/mcp".into()));
        assert_eq!(deserialized.transport, Some("http".into()));
        assert!(deserialized.is_http());
        assert!(!deserialized.is_stdio());
    }

    #[test]
    fn test_mcp_server_with_env() {
        let mut env = HashMap::new();
        env.insert("TOKEN".into(), "secret".into());

        let mut server = McpServer::stdio("node".into(), vec!["server.js".into()]);
        server.env = Some(env);

        let json = serde_json::to_string(&server).unwrap();
        assert!(json.contains("TOKEN"));
        assert!(json.contains("secret"));
    }

    #[test]
    fn test_mcp_server_http_with_headers() {
        let mut headers = HashMap::new();
        headers.insert("Authorization".into(), "Bearer token".into());

        let mut server = McpServer::http("https://example.com/mcp".into());
        server.headers = Some(headers);

        let json = serde_json::to_string(&server).unwrap();
        assert!(json.contains("Authorization"));
        assert!(json.contains("Bearer token"));
    }

    #[test]
    fn test_mcp_config_path() {
        let path = McpConfigManager::config_path();
        assert!(path.is_ok());

        let path = path.unwrap();
        assert!(path.to_str().unwrap().contains(".mcp.json"));
    }
}
