# Rhinolabs AI - Architecture

This document describes the architecture of the Rhinolabs AI system for Claude Code customization.

## Assets

The system is composed of three independent assets that can be installed separately:

### 1. CLI (`rhinolabs`)

**Location**: `/cli/`

Standalone command-line tool for managing skills, profiles, and plugin configuration.

```bash
# Installation
cargo install --path cli

# Or via Homebrew (when published)
brew install rhinolabs/tap/rhinolabs
```

**Commands**:
- `rhinolabs skill list|show|install|disable|enable`
- `rhinolabs profile list|show|install|update|uninstall`
- `rhinolabs mcp list|add|remove|sync`
- `rhinolabs config show|set`

### 2. Plugin (`rhinolabs-claude`)

**Location**: `/rhinolabs-claude/`

The base plugin that gets installed to the user's Claude Code plugins directory.

**Installation paths**:
- Linux: `~/.config/claude-code/plugins/rhinolabs-claude/`
- macOS: `~/Library/Application Support/Claude Code/plugins/rhinolabs-claude/`
- Windows: `%APPDATA%\Claude Code\plugins\rhinolabs-claude\`

**Structure**:
```
rhinolabs-claude/
├── .claude-plugin/
│   └── plugin.json       # Plugin manifest (name, version, author)
├── .claude/
│   └── (empty)           # Claude config placeholder
├── skills/               # Skill definitions
│   ├── react-19/
│   │   └── SKILL.md
│   ├── typescript/
│   │   └── SKILL.md
│   └── ...
├── output-styles/        # Output style definitions
│   └── *.md
├── CLAUDE.md             # Default instructions
├── settings.json         # Default settings
├── .mcp.json             # MCP server configurations
└── .skills-config.json   # Skills state (enabled/disabled)
```

### 3. GUI (`rhinolabs-gui`)

**Location**: `/gui/`

Tauri-based desktop application for visual management.

**Tech stack**:
- Frontend: React + TypeScript + Vite
- Backend: Tauri (Rust)
- Core: Shared Rust library (`rhinolabs-core`)

---

## Profiles System

Profiles organize skills into reusable bundles that can be installed at different scopes.

### Profile Types

#### User Profile (Main-Profile)

- **Scope**: User-level, applies to ALL projects
- **Install location**: `~/.claude/`
- **Use case**: Agency-wide standards that every dev should have
- **Only one**: The "main" profile is the only User type profile

**What gets installed**:
```
~/.claude/
├── skills/           # All skills from Main-Profile
├── CLAUDE.md         # Instructions (linked from plugin)
├── settings.json     # Settings (linked from plugin)
└── .output-style     # Active output style
```

#### Project Profile

- **Scope**: Project-level, applies only to specific project
- **Install location**: `<project-path>/` (as a plugin)
- **Use case**: Tech-stack specific skills (React, Django, etc.)

**What gets installed** (as a plugin structure):
```
<project-path>/
├── .claude-plugin/
│   └── plugin.json   # Profile as plugin manifest
├── .claude/
│   └── skills/       # Skills from the profile
├── CLAUDE.md         # Profile instructions (if defined)
└── settings.json     # Profile settings (if defined)
```

### Profile Installation Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      rhinolabs CLI                          │
├─────────────────────────────────────────────────────────────┤
│  rhinolabs profile install --profile <id> [--path <dir>]    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │     Profile Type Check        │
              └───────────────────────────────┘
                     │              │
            User Profile      Project Profile
                     │              │
                     ▼              ▼
         ┌─────────────────┐  ┌──────────────────────┐
         │  Install to     │  │  Install as Plugin   │
         │  ~/.claude/     │  │  to <project-path>/  │
         │                 │  │                      │
         │  + Instructions │  │  + plugin.json       │
         │  + Settings     │  │  + skills/           │
         │  + Output Style │  │  + CLAUDE.md (opt)   │
         │  + Skills       │  │  + settings (opt)    │
         └─────────────────┘  └──────────────────────┘
```

---

## Skill Sources

Skills can come from multiple sources:

1. **Built-in**: Bundled with the plugin (`rhinolabs-claude/skills/`)
2. **Remote**: Fetched from GitHub repositories
   - `anthropic-official`: https://github.com/anthropics/skills
   - `vercel-agent-skills`: https://github.com/vercel-labs/agent-skills
3. **Custom**: User-created skills

### Skill Structure

```
skill-name/
├── SKILL.md          # Skill definition with YAML frontmatter
└── assets/           # Optional supporting files
    └── templates/
```

**SKILL.md format**:
```markdown
---
id: skill-name
name: Skill Display Name
description: What this skill does
version: 1.0.0
category: framework|library|tool|pattern
triggers:
  - "keyword1"
  - "keyword2"
---

# Skill Content

Instructions for Claude...
```

---

## Data Storage

### Configuration Files

| File | Location | Purpose |
|------|----------|---------|
| `profiles.json` | `~/.config/rhinolabs-ai/` | Profile definitions |
| `.skills-config.json` | Plugin directory | Skill states |
| `settings.json` | Plugin directory | Plugin settings |
| `.mcp.json` | Plugin directory | MCP server config |
| `.project.json` | Plugin directory | GitHub release config |

### Claude Code Integration

Claude Code automatically loads:
- User-level: `~/.claude/CLAUDE.md`, `~/.claude/skills/*`
- Project-level: `./.claude/CLAUDE.md`, `./.claude/skills/*`
- Plugins: `<plugins-dir>/*/` with `.claude-plugin/plugin.json`

---

## Development

### Core Library (`rhinolabs-core`)

Shared Rust library used by CLI and GUI.

**Modules**:
- `skills.rs` - Skill CRUD, remote fetching
- `profiles.rs` - Profile management, installation
- `settings.rs` - Plugin settings
- `instructions.rs` - CLAUDE.md management
- `output_styles.rs` - Output style management
- `mcp.rs` - MCP server configuration
- `paths.rs` - Cross-platform path resolution
- `project.rs` - GitHub release management

### Building

```bash
# CLI
cd cli && cargo build --release

# GUI
cd gui && pnpm install && pnpm tauri build

# Core (library)
cd core && cargo build
```

### Testing

```bash
# Unit tests
cargo test

# E2E tests (GUI)
cd gui && pnpm test:e2e
```

---

## Distribution

### For Agency Developers

1. Clone the repo
2. Run install script: `./rhinolabs-claude/scripts/install.sh`
3. CLI installs automatically, plugin copies to Claude Code
4. Use CLI to install profiles to projects

### Publishing Updates

1. Update version in `plugin.json`
2. Create GitHub release with assets
3. Developers pull and re-run install script

---

**Last Updated**: 2026-01-27
**Version**: 2.0.0
