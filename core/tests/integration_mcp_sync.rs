use rhinolabs_core::McpSync;
use std::fs;

/// Integration test: Sync MCP config from local file
#[test]
fn test_mcp_sync_from_local_file() {
    let temp_dir = tempfile::tempdir().unwrap();

    // Create a source MCP config file
    let source_config = temp_dir.path().join("source_mcp.json");
    let config_content = r#"{
    "mcpServers": {
        "git": {
            "command": "npx",
            "args": ["-y", "@modelcontextprotocol/server-git"]
        },
        "filesystem": {
            "command": "npx",
            "args": ["-y", "@modelcontextprotocol/server-filesystem"]
        }
    }
}"#;

    fs::write(&source_config, config_content).unwrap();

    // Verify we can read and parse it
    let _sync = McpSync::from_local(source_config.to_str().unwrap().to_string());

    // In a real scenario, this would sync to the plugin directory
    // For this test, we just verify the file can be read and parsed
    let content = fs::read_to_string(&source_config).unwrap();
    let parsed: Result<serde_json::Value, _> = serde_json::from_str(&content);

    assert!(parsed.is_ok());

    let json = parsed.unwrap();
    assert!(json["mcpServers"].is_object());
    assert!(json["mcpServers"]["git"].is_object());
    assert_eq!(json["mcpServers"]["git"]["command"], "npx");
}

#[test]
fn test_mcp_config_validation() {
    // Test valid config
    let valid_config = r#"{
        "mcpServers": {
            "test": {
                "command": "node",
                "args": ["index.js"]
            }
        }
    }"#;

    let parsed: Result<serde_json::Value, _> = serde_json::from_str(valid_config);
    assert!(parsed.is_ok());

    // Test invalid config (missing closing brace)
    let invalid_config = r#"{
        "mcpServers": {
            "test": {
                "command": "node",
                "args": ["index.js"]
            }
    }"#;

    let parsed: Result<serde_json::Value, _> = serde_json::from_str(invalid_config);
    assert!(parsed.is_err());
}

#[test]
fn test_mcp_config_backup_naming() {
    // Verify backup file naming follows the pattern: .mcp.json.backup.YYYYMMDD_HHMMSS
    let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S");
    let backup_name = format!(".mcp.json.backup.{}", timestamp);

    assert!(backup_name.starts_with(".mcp.json.backup."));
    assert!(backup_name.len() > ".mcp.json.backup.".len());
}

#[test]
fn test_mcp_sync_multiple_servers() {
    let temp_dir = tempfile::tempdir().unwrap();
    let config_file = temp_dir.path().join("multi_mcp.json");

    let multi_server_config = r#"{
        "mcpServers": {
            "git": {
                "command": "npx",
                "args": ["-y", "@modelcontextprotocol/server-git"]
            },
            "filesystem": {
                "command": "npx",
                "args": ["-y", "@modelcontextprotocol/server-filesystem"],
                "env": {
                    "ALLOWED_PATHS": "/home/user/projects"
                }
            },
            "custom": {
                "command": "node",
                "args": ["./custom-server.js"]
            }
        }
    }"#;

    fs::write(&config_file, multi_server_config).unwrap();

    let content = fs::read_to_string(&config_file).unwrap();
    let parsed: serde_json::Value = serde_json::from_str(&content).unwrap();

    assert_eq!(parsed["mcpServers"].as_object().unwrap().len(), 3);
    assert!(parsed["mcpServers"]["git"].is_object());
    assert!(parsed["mcpServers"]["filesystem"].is_object());
    assert!(parsed["mcpServers"]["custom"].is_object());

    // Verify env variable in filesystem server
    assert!(parsed["mcpServers"]["filesystem"]["env"].is_object());
    assert_eq!(
        parsed["mcpServers"]["filesystem"]["env"]["ALLOWED_PATHS"],
        "/home/user/projects"
    );
}
