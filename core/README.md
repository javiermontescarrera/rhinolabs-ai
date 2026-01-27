# Rhinolabs Core

Shared Rust library providing core functionality for the Rhinolabs AI ecosystem.

## Overview

`rhinolabs-core` is used by both the CLI and GUI to ensure consistent behavior across all interfaces. It handles:

- Profile management (CRUD, installation)
- Skill management
- Plugin installation and updates
- Configuration sync (deploy/sync)
- MCP server configuration
- Cross-platform path resolution

## Modules

### `profiles.rs`

Profile management and installation.

```rust
use rhinolabs_core::{Profiles, ProfileType};

// List all profiles
let profiles = Profiles::list()?;

// Get specific profile
let profile = Profiles::get("react-stack")?;

// Create profile
let profile = Profiles::create(CreateProfileInput {
    id: "my-profile".to_string(),
    name: "My Profile".to_string(),
    description: "Custom profile".to_string(),
    profile_type: ProfileType::Project,
})?;

// Install profile to path
let result = Profiles::install("react-stack", Some(Path::new("./project")))?;

// Update installed profile
let result = Profiles::update_installed("react-stack", Some(Path::new("./project")))?;

// Uninstall profile
Profiles::uninstall(Path::new("./project"))?;
```

### `skills.rs`

Skill management and retrieval.

```rust
use rhinolabs_core::Skills;

// List all skills
let skills = Skills::list()?;

// Get skill by ID
let skill = Skills::get("react-19")?;

// List skills by profile
let skills = Skills::list_by_profile("react-stack")?;

// Fetch remote skills
Skills::fetch_remote("anthropic-official")?;
```

### `deploy.rs`

Configuration export, deploy, and sync.

```rust
use rhinolabs_core::Deploy;

// Export configuration to zip
let (zip_path, manifest) = Deploy::export_config(Path::new("./output"))?;

// Deploy to GitHub (requires GITHUB_TOKEN)
let result = Deploy::deploy("1.0.0", "Release notes").await?;

// Sync from GitHub
let result = Deploy::sync().await?;
```

### `paths.rs`

Cross-platform path resolution.

```rust
use rhinolabs_core::Paths;

// Plugin installation path
let plugin_path = Paths::plugins_dir()?;

// User Claude directory
let claude_dir = Paths::claude_user_dir()?;

// Rhinolabs config directory
let config_dir = Paths::rhinolabs_config_dir()?;

// Check if Claude Code is installed
if Paths::is_claude_code_installed() {
    // ...
}
```

### `installer.rs`

Plugin installation and updates.

```rust
use rhinolabs_core::Installer;

let installer = Installer::new()
    .dry_run(false);

// Install from GitHub releases
installer.install().await?;

// Install from local directory
installer.install_from_local(Path::new("./rhinolabs-claude"))?;

// Update existing installation
installer.update().await?;

// Uninstall
installer.uninstall()?;
```

### `settings.rs`

Plugin settings management.

```rust
use rhinolabs_core::Settings;

// Get current settings
let settings = Settings::get()?;

// Update settings
Settings::set("autoUpdate", serde_json::json!(true))?;
```

### `instructions.rs`

CLAUDE.md management.

```rust
use rhinolabs_core::Instructions;

// Get current instructions
let content = Instructions::get()?;

// Set instructions
Instructions::set("# My Instructions\n...")?;
```

### `output_styles.rs`

Output style management.

```rust
use rhinolabs_core::OutputStyles;

// List available styles
let styles = OutputStyles::list()?;

// Get active style
let active = OutputStyles::get_active()?;

// Set active style
OutputStyles::set_active("concise")?;
```

### `mcp.rs`

MCP server configuration.

```rust
use rhinolabs_core::Mcp;

// List configured servers
let servers = Mcp::list()?;

// Add server
Mcp::add(McpServer {
    name: "my-server".to_string(),
    command: "node".to_string(),
    args: vec!["server.js".to_string()],
    env: HashMap::new(),
})?;

// Remove server
Mcp::remove("my-server")?;

// Sync from source
Mcp::sync_from_url("https://config.example.com/mcp.json").await?;
```

### `project.rs`

GitHub project configuration.

```rust
use rhinolabs_core::Project;

// Get project config
let config = Project::get_config()?;

// Set GitHub repository
Project::set_github("rhinolabs", "rhinolabs-ai")?;
```

## Data Types

### Profile

```rust
pub struct Profile {
    pub id: String,
    pub name: String,
    pub description: String,
    pub profile_type: ProfileType,
    pub skills: Vec<String>,
    pub created_at: String,
    pub updated_at: String,
}

pub enum ProfileType {
    User,      // Installs to ~/.claude/
    Project,   // Installs to project/.claude-plugin/
}
```

### Skill

```rust
pub struct Skill {
    pub id: String,
    pub name: String,
    pub description: String,
    pub version: String,
    pub category: String,
    pub source: SkillSource,
    pub enabled: bool,
}

pub enum SkillSource {
    Builtin,
    Remote(String),
    Custom,
}
```

### Installation Results

```rust
pub struct ProfileInstallResult {
    pub target_path: String,
    pub skills_installed: Vec<String>,
    pub skills_failed: Vec<SkillError>,
    pub instructions_installed: Option<bool>,
    pub settings_installed: Option<bool>,
    pub output_style_installed: Option<String>,
}

pub struct SyncResult {
    pub version: String,
    pub profiles_installed: usize,
    pub skills_installed: usize,
    pub instructions_installed: bool,
    pub settings_installed: bool,
    pub output_styles_installed: usize,
}
```

## Configuration Files

| File | Location | Purpose |
|------|----------|---------|
| `profiles.json` | `~/.config/rhinolabs-ai/` | Profile definitions |
| `.project.json` | Plugin directory | GitHub settings |
| `.skills-config.json` | Plugin directory | Skill states |
| `settings.json` | Plugin directory | Plugin settings |
| `.mcp.json` | Plugin directory | MCP configuration |

## Building

```bash
cargo build
```

## Testing

```bash
cargo test
```

## Usage in Other Crates

```toml
# Cargo.toml
[dependencies]
rhinolabs-core = { path = "../core" }
```

```rust
use rhinolabs_core::{Profiles, Skills, Deploy};
```

## Architecture

```
core/src/
├── lib.rs              # Public exports
├── profiles.rs         # Profile management
├── skills.rs           # Skill management
├── deploy.rs           # Deploy/sync
├── paths.rs            # Path resolution
├── installer.rs        # Plugin installation
├── settings.rs         # Settings management
├── instructions.rs     # CLAUDE.md
├── output_styles.rs    # Output styles
├── mcp.rs              # MCP servers
└── project.rs          # GitHub config
```

---

**Version**: 1.0.0
**Last Updated**: 2026-01-28
