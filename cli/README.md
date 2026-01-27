# Rhinolabs AI CLI

Command-line interface for managing Rhinolabs AI profiles and plugin configuration.

## Installation

### Via Homebrew (Recommended)

```bash
brew tap rhinolabs/tap
brew install rhinolabs-ai
```

### Via Cargo

```bash
cargo install --path .
```

### From Source

```bash
cd cli
cargo build --release
# Binary at: target/release/rhinolabs-ai
```

## Usage

The CLI is available as `rhinolabs-ai` or the shorter alias `rlai`.

### Auto-Sync

On the first command of each terminal session, the CLI automatically syncs configuration from GitHub. This ensures your team always has the latest profiles and skills.

```bash
# First command triggers auto-sync
rhinolabs-ai profile list

# Output:
# ━━━ Configuration Sync ━━━
# Checking for updates...
# ✓ Configuration synced: v1.2.0
#
# ━━━ Main-Profile Setup ━━━
# Main-Profile is not installed in your user memory (~/.claude/).
# Install Main-Profile now? [Y/n]:
```

### Commands

#### Profile Management

```bash
# List all available profiles
rhinolabs-ai profile list

# Show profile details
rhinolabs-ai profile show <profile-id>

# Install profile to current directory
rhinolabs-ai profile install <profile-name>

# Install profile to specific path
rhinolabs-ai profile install <profile-name> -P /path/to/project

# Update installed profile (detects profile automatically)
rhinolabs-ai profile update

# Update specific profile
rhinolabs-ai profile update <profile-name>

# Uninstall profile from current directory
rhinolabs-ai profile uninstall

# Uninstall from specific path
rhinolabs-ai profile uninstall -P /path/to/project
```

#### Configuration Sync

```bash
# Manual sync from GitHub
rhinolabs-ai sync
```

#### Plugin Management

```bash
# Install base plugin
rhinolabs-ai install

# Install from local directory (development)
rhinolabs-ai install --local /path/to/rhinolabs-claude

# Update plugin
rhinolabs-ai update

# Uninstall plugin
rhinolabs-ai uninstall

# Show status
rhinolabs-ai status

# Run diagnostics
rhinolabs-ai doctor
```

#### MCP Configuration

```bash
# Sync MCP servers from configured source
rhinolabs-ai sync-mcp

# Sync from URL
rhinolabs-ai sync-mcp --url https://config.example.com/mcp.json

# Sync from file
rhinolabs-ai sync-mcp --file ./mcp-config.json

# Dry run (show what would be done)
rhinolabs-ai sync-mcp --dry-run
```

## Profile Types

### User Profile (Main-Profile)

- **Scope**: Applies to ALL projects
- **Location**: `~/.claude/`
- **Purpose**: Agency-wide standards and general skills
- **Installation**: Prompted automatically on first sync

```bash
# Main-Profile is installed automatically when you accept the prompt
# Or install manually:
rhinolabs-ai profile install main
```

### Project Profiles

- **Scope**: Applies only to specific project
- **Location**: `<project>/.claude-plugin/`
- **Purpose**: Tech-stack specific skills

```bash
# Install to current directory
cd ~/my-react-app
rhinolabs-ai profile install react-stack

# This creates:
# .claude-plugin/plugin.json  - Profile manifest
# .claude/skills/             - Skills directory
# CLAUDE.md                   - Instructions
```

## Monorepo Example

```bash
cd ~/monorepo

# Frontend app (React)
rhinolabs-ai profile install react-stack -P ./apps/web

# Backend API (Rust)
rhinolabs-ai profile install rust-backend -P ./apps/api

# Shared library (TypeScript)
rhinolabs-ai profile install ts-lib -P ./packages/shared

# Claude Code combines profiles:
# Working in ~/monorepo/apps/web/ loads:
#   - Main-Profile (user-level)
#   - react-stack (project-level)
```

## Configuration

Configuration is stored in `~/.config/rhinolabs-ai/`:

```
~/.config/rhinolabs-ai/
├── profiles.json       # Profile definitions
├── .project.json       # GitHub repository settings
└── ...
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GITHUB_TOKEN` | Not required for CLI (read-only operations) |

## Troubleshooting

### Sync Failed

```bash
# Check GitHub configuration
rhinolabs-ai doctor

# Verify network connectivity
curl -I https://github.com

# Manual sync with verbose output
rhinolabs-ai sync
```

### Profile Not Found

```bash
# List available profiles
rhinolabs-ai profile list

# Ensure sync has completed
rhinolabs-ai sync
```

### Permission Denied

```bash
# Check installation path permissions
ls -la ~/.claude/
ls -la ~/.config/rhinolabs-ai/
```

## Development

### Building

```bash
cargo build
```

### Testing

```bash
cargo test
```

### Running Locally

```bash
cargo run -- profile list
cargo run -- sync
```

## Architecture

The CLI uses the shared `rhinolabs-core` library for all operations:

```
cli/
├── src/
│   ├── main.rs           # Entry point, command parsing
│   ├── commands/
│   │   ├── profile.rs    # Profile commands
│   │   ├── deploy.rs     # Sync command
│   │   ├── auto_sync.rs  # Auto-sync logic
│   │   ├── install.rs    # Plugin install
│   │   ├── update.rs     # Plugin update
│   │   ├── uninstall.rs  # Plugin uninstall
│   │   ├── status.rs     # Status display
│   │   ├── doctor.rs     # Diagnostics
│   │   └── sync_mcp.rs   # MCP sync
│   └── ui.rs             # Terminal UI helpers
└── Cargo.toml
```

## Security

The CLI is designed for **read-only operations**:

- **Sync**: Downloads configuration from GitHub (no write access needed)
- **Profile install**: Installs locally to user's machine
- **No deploy**: Deploy is GUI-only to prevent unauthorized config changes

This ensures team developers cannot accidentally (or intentionally) modify the shared configuration.

---

**Version**: 1.0.0
**Last Updated**: 2026-01-28
