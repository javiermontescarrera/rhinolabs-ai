//! RAG (Retrieval-Augmented Generation) local configuration
//!
//! Manages per-project RAG configuration stored in `.claude/rag.json`.
//! All actual RAG operations are performed by the centralized MCP Worker.

use crate::{Paths, Result, RhinolabsError};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

const RAG_CONFIG_FILE: &str = "rag.json";
const DEFAULT_MCP_URL: &str = "https://rhinolabs-rag-mcp.rhinolabs.workers.dev";

/// Local RAG project configuration
///
/// Stored in `.claude/rag.json` within each project.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RagConfig {
    /// Unique project identifier (e.g., "prowler-api")
    pub project_id: String,

    /// API key for authenticating with the MCP Worker
    pub api_key: String,

    /// Optional MCP Worker URL override (uses default if not specified)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mcp_url: Option<String>,
}

/// Global RAG settings (stored in ~/.config/rhinolabs-ai/rag-settings.json)
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct RagSettings {
    /// Default MCP Worker URL
    pub default_mcp_url: Option<String>,

    /// Admin API key for creating/managing project keys
    pub admin_key: Option<String>,
}

/// RAG configuration management
pub struct Rag;

impl Rag {
    /// Get the path to local project RAG config (.claude/rag.json)
    fn project_config_path(project_path: &Path) -> PathBuf {
        project_path.join(".claude").join(RAG_CONFIG_FILE)
    }

    /// Get the path to global RAG settings
    fn settings_path() -> Result<PathBuf> {
        Ok(Paths::rhinolabs_config_dir()?.join("rag-settings.json"))
    }

    /// Load project RAG configuration from .claude/rag.json
    pub fn load_config(project_path: &Path) -> Result<Option<RagConfig>> {
        let path = Self::project_config_path(project_path);

        if !path.exists() {
            return Ok(None);
        }

        let content = fs::read_to_string(&path)?;
        let config: RagConfig = serde_json::from_str(&content)?;
        Ok(Some(config))
    }

    /// Save project RAG configuration to .claude/rag.json
    pub fn save_config(project_path: &Path, config: &RagConfig) -> Result<()> {
        let path = Self::project_config_path(project_path);

        // Ensure .claude directory exists
        if let Some(parent) = path.parent() {
            if !parent.exists() {
                fs::create_dir_all(parent)?;
            }
        }

        let content = serde_json::to_string_pretty(config)?;
        fs::write(&path, content)?;
        Ok(())
    }

    /// Load global RAG settings
    pub fn load_settings() -> Result<RagSettings> {
        let path = Self::settings_path()?;

        if !path.exists() {
            return Ok(RagSettings::default());
        }

        let content = fs::read_to_string(&path)?;
        let settings: RagSettings = serde_json::from_str(&content)?;
        Ok(settings)
    }

    /// Save global RAG settings
    pub fn save_settings(settings: &RagSettings) -> Result<()> {
        let path = Self::settings_path()?;

        // Ensure parent directory exists
        if let Some(parent) = path.parent() {
            if !parent.exists() {
                fs::create_dir_all(parent)?;
            }
        }

        let content = serde_json::to_string_pretty(settings)?;
        fs::write(&path, content)?;
        Ok(())
    }

    /// Initialize RAG for a project
    ///
    /// Creates .claude/rag.json with the provided project ID and API key.
    pub fn init(project_path: &Path, project_id: &str, api_key: &str) -> Result<RagConfig> {
        // Check if already initialized
        if let Some(existing) = Self::load_config(project_path)? {
            return Err(RhinolabsError::Other(format!(
                "RAG already initialized for project '{}'. Use 'rag status' to see config.",
                existing.project_id
            )));
        }

        let config = RagConfig {
            project_id: project_id.to_string(),
            api_key: api_key.to_string(),
            mcp_url: None,
        };

        Self::save_config(project_path, &config)?;
        Ok(config)
    }

    /// Get the MCP URL for a project
    ///
    /// Priority: project config > global settings > default
    pub fn get_mcp_url(config: &RagConfig) -> String {
        if let Some(url) = &config.mcp_url {
            return url.clone();
        }

        if let Ok(settings) = Self::load_settings() {
            if let Some(url) = settings.default_mcp_url {
                return url;
            }
        }

        DEFAULT_MCP_URL.to_string()
    }

    /// Check if RAG is configured for a project
    pub fn is_configured(project_path: &Path) -> Result<bool> {
        Ok(Self::load_config(project_path)?.is_some())
    }

    /// Remove RAG configuration from a project
    pub fn remove(project_path: &Path) -> Result<()> {
        let path = Self::project_config_path(project_path);

        if !path.exists() {
            return Err(RhinolabsError::Other(
                "RAG not configured for this project".to_string(),
            ));
        }

        fs::remove_file(&path)?;
        Ok(())
    }

    /// Set admin key in global settings
    pub fn set_admin_key(admin_key: &str) -> Result<()> {
        let mut settings = Self::load_settings()?;
        settings.admin_key = Some(admin_key.to_string());
        Self::save_settings(&settings)?;
        Ok(())
    }

    /// Get admin key from global settings
    pub fn get_admin_key() -> Result<Option<String>> {
        let settings = Self::load_settings()?;
        Ok(settings.admin_key)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_rag_config_serialization() {
        let config = RagConfig {
            project_id: "test-project".to_string(),
            api_key: "rl_abc123".to_string(),
            mcp_url: None,
        };

        let json = serde_json::to_string_pretty(&config).unwrap();
        assert!(json.contains("test-project"));
        assert!(json.contains("rl_abc123"));

        let parsed: RagConfig = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.project_id, "test-project");
        assert_eq!(parsed.api_key, "rl_abc123");
    }

    #[test]
    fn test_rag_config_with_mcp_url() {
        let config = RagConfig {
            project_id: "test".to_string(),
            api_key: "rl_xxx".to_string(),
            mcp_url: Some("https://custom.example.com".to_string()),
        };

        let json = serde_json::to_string(&config).unwrap();
        assert!(json.contains("custom.example.com"));
    }

    #[test]
    fn test_rag_settings_default() {
        let settings = RagSettings::default();
        assert!(settings.default_mcp_url.is_none());
        assert!(settings.admin_key.is_none());
    }

    #[test]
    fn test_project_config_path() {
        let project_path = Path::new("/home/user/my-project");
        let config_path = Rag::project_config_path(project_path);
        assert_eq!(
            config_path,
            PathBuf::from("/home/user/my-project/.claude/rag.json")
        );
    }

    #[test]
    fn test_get_mcp_url_default() {
        let config = RagConfig {
            project_id: "test".to_string(),
            api_key: "rl_xxx".to_string(),
            mcp_url: None,
        };

        let url = Rag::get_mcp_url(&config);
        assert_eq!(url, DEFAULT_MCP_URL);
    }

    #[test]
    fn test_get_mcp_url_from_config() {
        let config = RagConfig {
            project_id: "test".to_string(),
            api_key: "rl_xxx".to_string(),
            mcp_url: Some("https://custom.workers.dev".to_string()),
        };

        let url = Rag::get_mcp_url(&config);
        assert_eq!(url, "https://custom.workers.dev");
    }

    #[test]
    fn test_init_and_load_config() {
        let temp_dir = TempDir::new().unwrap();
        let project_path = temp_dir.path();

        // Init should succeed
        let config = Rag::init(project_path, "my-project", "rl_test123").unwrap();
        assert_eq!(config.project_id, "my-project");
        assert_eq!(config.api_key, "rl_test123");

        // Load should return the config
        let loaded = Rag::load_config(project_path).unwrap();
        assert!(loaded.is_some());
        assert_eq!(loaded.unwrap().project_id, "my-project");

        // Init again should fail
        let result = Rag::init(project_path, "another", "rl_xxx");
        assert!(result.is_err());
    }

    #[test]
    fn test_is_configured() {
        let temp_dir = TempDir::new().unwrap();
        let project_path = temp_dir.path();

        // Not configured initially
        assert!(!Rag::is_configured(project_path).unwrap());

        // Init
        Rag::init(project_path, "test", "rl_xxx").unwrap();

        // Now configured
        assert!(Rag::is_configured(project_path).unwrap());
    }

    #[test]
    fn test_remove_config() {
        let temp_dir = TempDir::new().unwrap();
        let project_path = temp_dir.path();

        // Remove on unconfigured project should fail
        assert!(Rag::remove(project_path).is_err());

        // Init
        Rag::init(project_path, "test", "rl_xxx").unwrap();
        assert!(Rag::is_configured(project_path).unwrap());

        // Remove should succeed
        Rag::remove(project_path).unwrap();
        assert!(!Rag::is_configured(project_path).unwrap());
    }
}
