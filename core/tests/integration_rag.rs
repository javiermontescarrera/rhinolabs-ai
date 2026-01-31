//! Integration tests for RAG module
//!
//! Tests local configuration management for RAG.
//! All actual RAG operations are handled by the MCP Worker.

use rhinolabs_core::{Rag, RagConfig, RagSettings};
use std::fs;
use std::sync::Mutex;
use tempfile::TempDir;

// Mutex to serialize tests that modify environment variables
static ENV_MUTEX: Mutex<()> = Mutex::new(());

/// Helper to set up test environment with isolated config
struct TestEnv {
    #[allow(dead_code)]
    temp_dir: TempDir,
    project_dir: TempDir,
    _lock: std::sync::MutexGuard<'static, ()>,
}

impl TestEnv {
    fn new() -> Self {
        // Acquire mutex to ensure exclusive access to env vars
        let lock = ENV_MUTEX.lock().unwrap();

        let temp_dir = TempDir::new().unwrap();
        let project_dir = TempDir::new().unwrap();

        // RHINOLABS_CONFIG_PATH points to a file, and rhinolabs_config_dir() takes its parent
        // So we create a dummy file path that, when .parent() is called, gives us the temp dir
        let dummy_file = temp_dir.path().join("profiles.json");

        // Set env var - rhinolabs_config_dir() will use parent of this path
        std::env::set_var("RHINOLABS_CONFIG_PATH", dummy_file.to_str().unwrap());

        Self {
            temp_dir,
            project_dir,
            _lock: lock,
        }
    }

    fn project_path(&self) -> &std::path::Path {
        self.project_dir.path()
    }
}

impl Drop for TestEnv {
    fn drop(&mut self) {
        std::env::remove_var("RHINOLABS_CONFIG_PATH");
    }
}

// =============================================================================
// Project Configuration Tests
// =============================================================================

#[test]
fn test_rag_load_config_returns_none_when_no_file() {
    let env = TestEnv::new();

    let config = Rag::load_config(env.project_path()).unwrap();
    assert!(config.is_none());
}

#[test]
fn test_rag_init_creates_config() {
    let env = TestEnv::new();

    let config = Rag::init(env.project_path(), "my-project", "rl_test123").unwrap();

    assert_eq!(config.project_id, "my-project");
    assert_eq!(config.api_key, "rl_test123");
    assert!(config.mcp_url.is_none());

    // Verify file was created
    let config_path = env.project_path().join(".claude").join("rag.json");
    assert!(config_path.exists());
}

#[test]
fn test_rag_init_fails_if_already_initialized() {
    let env = TestEnv::new();

    // First init succeeds
    Rag::init(env.project_path(), "project-a", "rl_key1").unwrap();

    // Second init should fail
    let result = Rag::init(env.project_path(), "project-b", "rl_key2");
    assert!(result.is_err());

    let err = result.unwrap_err().to_string();
    assert!(err.contains("already initialized"));
}

#[test]
fn test_rag_load_config_returns_saved_config() {
    let env = TestEnv::new();

    // Create config manually
    let claude_dir = env.project_path().join(".claude");
    fs::create_dir_all(&claude_dir).unwrap();

    let config = RagConfig {
        project_id: "test-project".to_string(),
        api_key: "rl_abc123".to_string(),
        mcp_url: Some("https://custom.workers.dev".to_string()),
    };

    let content = serde_json::to_string_pretty(&config).unwrap();
    fs::write(claude_dir.join("rag.json"), content).unwrap();

    // Load and verify
    let loaded = Rag::load_config(env.project_path()).unwrap().unwrap();

    assert_eq!(loaded.project_id, "test-project");
    assert_eq!(loaded.api_key, "rl_abc123");
    assert_eq!(
        loaded.mcp_url,
        Some("https://custom.workers.dev".to_string())
    );
}

#[test]
fn test_rag_is_configured() {
    let env = TestEnv::new();

    // Not configured initially
    assert!(!Rag::is_configured(env.project_path()).unwrap());

    // Init
    Rag::init(env.project_path(), "test", "rl_xxx").unwrap();

    // Now configured
    assert!(Rag::is_configured(env.project_path()).unwrap());
}

#[test]
fn test_rag_remove_deletes_config() {
    let env = TestEnv::new();

    // Init
    Rag::init(env.project_path(), "test", "rl_xxx").unwrap();
    assert!(Rag::is_configured(env.project_path()).unwrap());

    // Remove
    Rag::remove(env.project_path()).unwrap();
    assert!(!Rag::is_configured(env.project_path()).unwrap());
}

#[test]
fn test_rag_remove_fails_if_not_configured() {
    let env = TestEnv::new();

    let result = Rag::remove(env.project_path());
    assert!(result.is_err());

    let err = result.unwrap_err().to_string();
    assert!(err.contains("not configured"));
}

// =============================================================================
// MCP URL Tests
// =============================================================================

#[test]
fn test_get_mcp_url_returns_default() {
    let config = RagConfig {
        project_id: "test".to_string(),
        api_key: "rl_xxx".to_string(),
        mcp_url: None,
    };

    let url = Rag::get_mcp_url(&config);
    assert!(url.contains("rhinolabs-rag-mcp"));
    assert!(url.starts_with("https://"));
}

#[test]
fn test_get_mcp_url_returns_custom_url() {
    let config = RagConfig {
        project_id: "test".to_string(),
        api_key: "rl_xxx".to_string(),
        mcp_url: Some("https://custom-mcp.example.com".to_string()),
    };

    let url = Rag::get_mcp_url(&config);
    assert_eq!(url, "https://custom-mcp.example.com");
}

// =============================================================================
// Global Settings Tests
// =============================================================================

#[test]
fn test_rag_settings_default() {
    let _env = TestEnv::new();

    let settings = Rag::load_settings().unwrap();
    assert!(settings.default_mcp_url.is_none());
    assert!(settings.admin_key.is_none());
}

#[test]
fn test_rag_set_admin_key() {
    let _env = TestEnv::new();

    Rag::set_admin_key("admin_secret_123").unwrap();

    let key = Rag::get_admin_key().unwrap();
    assert_eq!(key, Some("admin_secret_123".to_string()));
}

#[test]
fn test_rag_settings_persistence() {
    let _env = TestEnv::new();

    let settings = RagSettings {
        default_mcp_url: Some("https://my-mcp.workers.dev".to_string()),
        admin_key: Some("my_admin_key".to_string()),
    };

    Rag::save_settings(&settings).unwrap();

    let loaded = Rag::load_settings().unwrap();
    assert_eq!(
        loaded.default_mcp_url,
        Some("https://my-mcp.workers.dev".to_string())
    );
    assert_eq!(loaded.admin_key, Some("my_admin_key".to_string()));
}

// =============================================================================
// Serialization Tests
// =============================================================================

#[test]
fn test_rag_config_serialization_camel_case() {
    let config = RagConfig {
        project_id: "test-project".to_string(),
        api_key: "rl_abc123".to_string(),
        mcp_url: Some("https://example.com".to_string()),
    };

    let json = serde_json::to_string(&config).unwrap();

    // Verify camelCase keys
    assert!(json.contains("\"projectId\""));
    assert!(json.contains("\"apiKey\""));
    assert!(json.contains("\"mcpUrl\""));

    // Verify no snake_case
    assert!(!json.contains("project_id"));
    assert!(!json.contains("api_key"));
    assert!(!json.contains("mcp_url"));
}

#[test]
fn test_rag_config_deserialization_camel_case() {
    let json = r#"{
        "projectId": "my-project",
        "apiKey": "rl_test123",
        "mcpUrl": "https://custom.workers.dev"
    }"#;

    let config: RagConfig = serde_json::from_str(json).unwrap();

    assert_eq!(config.project_id, "my-project");
    assert_eq!(config.api_key, "rl_test123");
    assert_eq!(
        config.mcp_url,
        Some("https://custom.workers.dev".to_string())
    );
}

#[test]
fn test_rag_config_skips_none_mcp_url() {
    let config = RagConfig {
        project_id: "test".to_string(),
        api_key: "rl_xxx".to_string(),
        mcp_url: None,
    };

    let json = serde_json::to_string(&config).unwrap();

    // mcpUrl should not be present when None
    assert!(!json.contains("mcpUrl"));
}

// =============================================================================
// Error Handling Tests
// =============================================================================

#[test]
fn test_rag_handles_corrupted_config() {
    let env = TestEnv::new();

    // Create corrupted config
    let claude_dir = env.project_path().join(".claude");
    fs::create_dir_all(&claude_dir).unwrap();
    fs::write(claude_dir.join("rag.json"), "{ invalid json }").unwrap();

    // Should fail gracefully
    let result = Rag::load_config(env.project_path());
    assert!(result.is_err());
}

#[test]
fn test_rag_save_creates_claude_directory() {
    let env = TestEnv::new();

    // .claude directory doesn't exist
    let claude_dir = env.project_path().join(".claude");
    assert!(!claude_dir.exists());

    // Init creates .claude directory
    Rag::init(env.project_path(), "test", "rl_xxx").unwrap();

    assert!(claude_dir.exists());
    assert!(claude_dir.join("rag.json").exists());
}

// =============================================================================
// API Key Format Tests
// =============================================================================

#[test]
fn test_api_key_format() {
    // API keys should start with rl_ prefix
    let config = RagConfig {
        project_id: "test".to_string(),
        api_key: "rl_abc123def456".to_string(),
        mcp_url: None,
    };

    assert!(config.api_key.starts_with("rl_"));
}
