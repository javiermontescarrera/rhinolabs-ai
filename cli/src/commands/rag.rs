//! RAG (Retrieval-Augmented Generation) CLI commands
//!
//! Manages local RAG configuration. All RAG operations (save, search, etc.)
//! are performed by the centralized MCP Worker and accessed via Claude Code.

use crate::ui::Ui;
use anyhow::Result;
use colored::Colorize;
use reqwest::Client;
use rhinolabs_core::Rag;
use serde::{Deserialize, Serialize};
use std::env;
use std::path::PathBuf;

const DEFAULT_MCP_URL: &str = "https://rhinolabs-rag-mcp.rhinolabs.workers.dev";

/// Response from creating an API key
#[derive(Debug, Deserialize)]
struct CreateKeyResponse {
    key: String,
    #[allow(dead_code)]
    message: String,
}

/// API key info from list response
#[derive(Debug, Deserialize)]
struct KeyInfo {
    key: String,
    data: KeyData,
}

#[derive(Debug, Deserialize)]
struct KeyData {
    name: String,
    projects: Vec<String>,
    created: String,
    #[allow(dead_code)]
    #[serde(rename = "createdBy")]
    created_by: String,
}

#[derive(Debug, Deserialize)]
struct ListKeysResponse {
    keys: Vec<KeyInfo>,
}

/// Get the current working directory
fn get_cwd() -> Result<PathBuf> {
    Ok(env::current_dir()?)
}

/// Initialize RAG for the current project
pub fn init(project: String, api_key: String) -> Result<()> {
    Ui::header("Initialize RAG");

    let cwd = get_cwd()?;

    // Validate API key format
    if !api_key.starts_with("rl_") {
        Ui::error("Invalid API key format. Keys should start with 'rl_'");
        return Ok(());
    }

    Ui::step(&format!("Initializing RAG for project '{}'...", project));

    match Rag::init(&cwd, &project, &api_key) {
        Ok(config) => {
            println!();
            Ui::success("RAG initialized!");
            println!();
            println!("  {}:    {}", "Project ID".bold(), config.project_id);
            println!(
                "  {}:       {}",
                "API Key".bold(),
                mask_key(&config.api_key)
            );
            println!(
                "  {}:       {}",
                "MCP URL".bold(),
                Rag::get_mcp_url(&config)
            );
            println!();
            println!("  Config saved to: {}", ".claude/rag.json".cyan());
            println!();
            Ui::section("Next Steps");
            println!();
            println!("  Claude Code will automatically use the RAG tools:");
            println!("  - Ask Claude to save decisions: \"Save this decision about auth\"");
            println!("  - Ask Claude to search: \"What did we decide about authentication?\"");
            println!();
        }
        Err(e) => {
            Ui::error(&format!("Failed to initialize RAG: {}", e));
        }
    }

    Ok(())
}

/// Show RAG status for the current project
pub fn status() -> Result<()> {
    Ui::header("RAG Status");

    let cwd = get_cwd()?;

    match Rag::load_config(&cwd)? {
        Some(config) => {
            println!();
            println!("  {}:    {}", "Project ID".bold(), config.project_id);
            println!(
                "  {}:       {}",
                "API Key".bold(),
                mask_key(&config.api_key)
            );
            println!(
                "  {}:       {}",
                "MCP URL".bold(),
                Rag::get_mcp_url(&config)
            );
            println!();
            println!("  Config file: {}", ".claude/rag.json".cyan());
            println!();
            Ui::info("Claude Code can use RAG tools to save and search project decisions.");
        }
        None => {
            Ui::warning("RAG not configured for this project.");
            println!();
            Ui::info("Initialize with:");
            println!("  rhinolabs-ai rag init --project <id> --api-key <key>");
            println!();
            Ui::info("Get an API key with:");
            println!("  rhinolabs-ai rag create-key --name \"My Team\"");
        }
    }

    println!();
    Ok(())
}

/// Create a new API key (requires admin key)
pub async fn create_key(name: String, projects: Option<Vec<String>>) -> Result<()> {
    Ui::header("Create API Key");

    // Get admin key from settings or env
    let admin_key = Rag::get_admin_key()?.or_else(|| env::var("RHINOLABS_RAG_ADMIN_KEY").ok());

    let admin_key = match admin_key {
        Some(key) => key,
        None => {
            Ui::error("Admin key not configured.");
            println!();
            Ui::info("Set admin key with:");
            println!("  rhinolabs-ai rag set-admin-key <key>");
            println!();
            Ui::info("Or set environment variable:");
            println!("  export RHINOLABS_RAG_ADMIN_KEY=<key>");
            return Ok(());
        }
    };

    Ui::step(&format!("Creating API key '{}'...", name));

    let client = Client::new();
    let mcp_url = env::var("RHINOLABS_RAG_MCP_URL").unwrap_or_else(|_| DEFAULT_MCP_URL.to_string());

    #[derive(Serialize)]
    struct CreateKeyRequest {
        name: String,
        projects: Vec<String>,
    }

    let request_body = CreateKeyRequest {
        name: name.clone(),
        projects: projects.unwrap_or_else(|| vec!["*".to_string()]),
    };

    let response = client
        .post(format!("{}/admin/keys", mcp_url))
        .header("Authorization", format!("Bearer {}", admin_key))
        .json(&request_body)
        .send()
        .await?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        Ui::error(&format!("Failed to create key: {} - {}", status, body));
        return Ok(());
    }

    let result: CreateKeyResponse = response.json().await?;

    println!();
    Ui::success("API key created!");
    println!();
    println!("  {}:  {}", "Name".bold(), name);
    println!("  {}:   {}", "Key".bold(), result.key.green().bold());
    println!();
    Ui::warning("Save this key! It won't be shown again.");
    println!();
    Ui::info("Use this key to initialize RAG in a project:");
    println!(
        "  rhinolabs-ai rag init --project <id> --api-key {}",
        result.key
    );

    Ok(())
}

/// List all API keys (requires admin key)
pub async fn list_keys() -> Result<()> {
    Ui::header("API Keys");

    // Get admin key
    let admin_key = Rag::get_admin_key()?.or_else(|| env::var("RHINOLABS_RAG_ADMIN_KEY").ok());

    let admin_key = match admin_key {
        Some(key) => key,
        None => {
            Ui::error("Admin key not configured.");
            println!();
            Ui::info("Set admin key with:");
            println!("  rhinolabs-ai rag set-admin-key <key>");
            return Ok(());
        }
    };

    Ui::step("Fetching API keys...");

    let client = Client::new();
    let mcp_url = env::var("RHINOLABS_RAG_MCP_URL").unwrap_or_else(|_| DEFAULT_MCP_URL.to_string());

    let response = client
        .get(format!("{}/admin/keys", mcp_url))
        .header("Authorization", format!("Bearer {}", admin_key))
        .send()
        .await?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        Ui::error(&format!("Failed to list keys: {} - {}", status, body));
        return Ok(());
    }

    let result: ListKeysResponse = response.json().await?;

    if result.keys.is_empty() {
        println!();
        Ui::info("No API keys found.");
        println!();
        Ui::info("Create one with:");
        println!("  rhinolabs-ai rag create-key --name \"Team Name\"");
        return Ok(());
    }

    println!();
    for key_info in &result.keys {
        println!("  {} {}", "•".cyan(), key_info.data.name.bold());
        println!("    Key:      {}", key_info.key.dimmed());
        println!(
            "    Projects: {}",
            if key_info.data.projects.contains(&"*".to_string()) {
                "all".to_string()
            } else {
                key_info.data.projects.join(", ")
            }
        );
        println!("    Created:  {}", key_info.data.created);
        println!();
    }

    Ok(())
}

/// Set admin key for key management
pub fn set_admin_key(key: String) -> Result<()> {
    Ui::header("Set Admin Key");

    Rag::set_admin_key(&key)?;

    Ui::success("Admin key saved to global settings.");
    Ui::info("You can now create and manage API keys.");

    Ok(())
}

/// Remove RAG configuration from the current project
pub fn remove() -> Result<()> {
    Ui::header("Remove RAG");

    let cwd = get_cwd()?;

    match Rag::remove(&cwd) {
        Ok(()) => {
            Ui::success("RAG configuration removed from this project.");
            Ui::info("The .claude/rag.json file has been deleted.");
        }
        Err(e) => {
            Ui::error(&format!("{}", e));
        }
    }

    Ok(())
}

/// Mask an API key for display
fn mask_key(key: &str) -> String {
    if key.len() <= 10 {
        "*".repeat(key.len())
    } else {
        format!("{}...{}", &key[..7], &key[key.len() - 4..])
    }
}
