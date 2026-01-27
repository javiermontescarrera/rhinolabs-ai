# Rhinolabs AI

Enterprise-grade plugin and configuration management system for Claude Code.

## Overview

Rhinolabs AI provides a complete solution for standardizing Claude Code across development teams:

- **Plugin**: Curated skills for consistent coding standards
- **CLI**: Command-line tool for profile installation and team sync
- **GUI**: Desktop application for plugin management (lead developers)
- **Profiles**: Organize skills into reusable bundles (user-level and project-level)
- **Deploy/Sync**: Distribute configurations across your team via GitHub releases

## Architecture

```
rhinolabs-ai/
├── cli/                    # Command-line interface (rhinolabs-ai, rlai)
├── core/                   # Shared Rust library
├── gui/                    # Desktop application (Tauri + React)
├── rhinolabs-claude/       # Base plugin with skills
└── docs/                   # Documentation
```

### How It Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           LEAD DEVELOPER (GUI)                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  1. Create Profiles    2. Assign Skills    3. Deploy to GitHub      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                        ┌───────────────────────┐
                        │   GitHub Release      │
                        │   rhinolabs-config.zip│
                        └───────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TEAM DEVELOPERS (CLI)                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  rhinolabs-ai sync              # Auto-runs on first command        │   │
│  │  rhinolabs-ai profile install X # Install profile to project        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Quick Start

### For Team Developers

```bash
# 1. Install CLI via Homebrew
brew tap rhinolabs/tap
brew install rhinolabs-ai

# 2. Run any command (auto-syncs configuration on first run)
rhinolabs-ai profile list

# 3. Install Main-Profile (user-level, applies to all projects)
# (Prompted automatically on first sync)

# 4. Install project-specific profile
cd ~/your-project
rhinolabs-ai profile install react-stack
```

### For Lead Developers

1. Download and install the GUI from [Releases](https://github.com/rhinolabs/rhinolabs-ai/releases)
2. Configure GitHub repository in Project Settings
3. Create profiles and assign skills
4. Deploy configuration for your team

## CLI Commands

```bash
# Aliases: rhinolabs-ai or rlai

# Configuration sync (auto-runs on first command of terminal session)
rhinolabs-ai sync                    # Manual sync from GitHub

# Profile management
rhinolabs-ai profile list            # List all profiles
rhinolabs-ai profile show <id>       # Show profile details
rhinolabs-ai profile install <name>  # Install profile (current directory)
rhinolabs-ai profile install <name> -P /path  # Install to specific path
rhinolabs-ai profile update          # Update installed profile
rhinolabs-ai profile uninstall       # Remove profile from current directory

# Plugin management
rhinolabs-ai install                 # Install base plugin
rhinolabs-ai update                  # Update plugin
rhinolabs-ai uninstall               # Remove plugin
rhinolabs-ai status                  # Show installation status
rhinolabs-ai doctor                  # Run diagnostics

# MCP configuration
rhinolabs-ai sync-mcp                # Sync MCP servers from source
```

## Profiles System

Profiles organize skills into reusable bundles:

### User Profile (Main-Profile)

- Installs to `~/.claude/`
- Applies to **ALL** projects
- Contains agency-wide standards
- Auto-installed on first sync (with confirmation)

### Project Profiles

- Installs to `<project>/.claude-plugin/`
- Applies only to that project
- Tech-stack specific skills (React, Django, etc.)
- Installed as Claude Code plugins

### Example: Monorepo Setup

```bash
cd ~/monorepo

# Install different profiles for each subproject
rhinolabs-ai profile install react-stack -P ./apps/web
rhinolabs-ai profile install rust-backend -P ./apps/api
rhinolabs-ai profile install ts-lib -P ./packages/shared

# Claude Code automatically combines:
# - Main-Profile (user-level) + Project Profile (per directory)
```

## Installation Paths

| Component | Path |
|-----------|------|
| CLI Config | `~/.config/rhinolabs-ai/` |
| User Skills | `~/.claude/skills/` |
| Project Skills | `<project>/.claude/skills/` |
| Plugin (macOS) | `~/Library/Application Support/Claude Code/plugins/rhinolabs-claude/` |
| Plugin (Linux) | `~/.config/claude-code/plugins/rhinolabs-claude/` |
| Plugin (Windows) | `%APPDATA%\Claude Code\plugins\rhinolabs-claude\` |

## Deploy & Sync (Team Distribution)

### Deploy (Lead Developer - GUI Only)

1. Open GUI
2. Configure GitHub repository (Settings > Project)
3. Create/modify profiles and assign skills
4. Click **Deploy** to publish configuration

**Requirements:**
- `GITHUB_TOKEN` environment variable with repo write access
- Configured GitHub repository

### Sync (Team Developers - CLI)

```bash
# Auto-sync on first command of terminal session
rhinolabs-ai profile list  # Triggers auto-sync

# Or manual sync
rhinolabs-ai sync
```

**Note:** Team developers do NOT need `GITHUB_TOKEN` (read-only operations).

## Development

### Prerequisites

- Rust 1.70+
- Node.js 18+
- pnpm (for GUI)

### Building

```bash
# CLI
cd cli && cargo build --release

# GUI
cd gui && pnpm install && pnpm tauri build

# Core library
cd core && cargo build
```

### Testing

```bash
# Unit tests
cargo test --workspace

# GUI E2E tests
cd gui/tests && pnpm test
```

## Project Structure

| Directory | Description |
|-----------|-------------|
| `cli/` | Rust CLI (rhinolabs-ai, rlai) |
| `core/` | Shared Rust library |
| `gui/` | Tauri desktop app |
| `rhinolabs-claude/` | Base plugin with skills |
| `docs/` | Documentation |

## Documentation

- [Architecture](ARCHITECTURE.md) - System design and data flow
- [CLI Guide](cli/README.md) - Detailed CLI documentation
- [GUI Guide](gui/README.md) - Desktop app documentation
- [Plugin Structure](rhinolabs-claude/README.md) - Skills and plugin details
- [Skill Guidelines](docs/SKILL_GUIDELINES.md) - Creating custom skills
- [MCP Integration](docs/MCP_INTEGRATION.md) - MCP server configuration

## Support

- Issues: [GitHub Issues](https://github.com/rhinolabs/rhinolabs-ai/issues)
- Internal: Contact DevOps team

## License

Proprietary - Rhinolabs Internal Use Only

---

**Version**: 2.1.0
**Last Updated**: 2026-01-28
