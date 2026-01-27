# Rhinolabs AI GUI

Desktop application for managing the Rhinolabs AI plugin and team configuration.

## Overview

The GUI is designed for **lead developers** who need to:

- Manage skills and profiles
- Configure MCP servers
- **Deploy configuration to GitHub** (GUI-only feature)
- Manage plugin settings and instructions

Team developers use the CLI for read-only operations (sync, profile install).

## Installation

### From Releases

Download the latest release for your platform:

- **macOS**: `rhinolabs-ai_x.x.x_x64.dmg`
- **Windows**: `rhinolabs-ai_x.x.x_x64-setup.exe`
- **Linux**: `rhinolabs-ai_x.x.x_amd64.AppImage`

### From Source

```bash
cd gui
pnpm install
pnpm tauri build
```

## Features

### Dashboard

Overview of plugin status and quick actions.

- Installation status
- Version information
- Quick access to common actions

### Skills

Manage available skills.

- Browse built-in and remote skills
- Enable/disable skills
- Fetch skills from remote sources
- View skill details and content

### Profiles

Organize skills into reusable bundles.

**All Profiles Tab:**
- Create, edit, delete profiles
- Set profile type (User or Project)
- View assigned skills count

**Assign Skills Tab:**
- Select a profile
- Filter skills by category
- Assign/unassign skills with checkboxes
- See skill descriptions

### MCP Servers

Configure Model Context Protocol servers.

**Add Server Tab:**
- Add MCP servers manually
- Configure command, args, environment

**Sync from Source Tab:**
- Sync from remote URL
- Sync from local file
- Centralized MCP configuration

### Settings

Configure plugin behavior.

- Auto-update settings
- Output style selection
- CLAUDE.md instructions editor

### Project

GitHub repository configuration and deployment.

**Settings:**
- Configure GitHub owner/repo
- View current configuration

**Deploy (GUI-Only):**
- Export current configuration
- Deploy to GitHub releases
- Version management

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript |
| Build | Vite |
| Backend | Tauri (Rust) |
| Styling | Tailwind CSS |
| Core Logic | rhinolabs-core (shared library) |

## Development

### Prerequisites

- Node.js 18+
- pnpm
- Rust 1.70+

### Setup

```bash
cd gui
pnpm install
```

### Development Mode

```bash
pnpm tauri dev
```

### Build

```bash
pnpm tauri build
```

### Testing

```bash
# E2E tests
cd tests
pnpm install
pnpm test
```

## Project Structure

```
gui/
├── src/                    # React frontend
│   ├── pages/              # Page components
│   │   ├── Dashboard.tsx
│   │   ├── Skills.tsx
│   │   ├── Profiles.tsx
│   │   ├── Mcp.tsx
│   │   ├── Settings.tsx
│   │   └── Project.tsx
│   ├── components/         # Reusable components
│   ├── api.ts              # Tauri command bindings
│   ├── types.ts            # TypeScript types
│   └── App.tsx             # Main app component
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── main.rs         # Entry point
│   │   ├── commands.rs     # Tauri commands
│   │   └── lib.rs          # Library exports
│   ├── Cargo.toml
│   └── tauri.conf.json     # Tauri configuration
├── tests/                  # E2E tests
│   └── e2e/
└── package.json
```

## Tauri Commands

The GUI communicates with the backend via Tauri commands:

### Profiles

```typescript
// List profiles
const profiles = await invoke<Profile[]>('list_profiles');

// Get profile
const profile = await invoke<Profile>('get_profile', { id: 'react-stack' });

// Create profile
await invoke('create_profile', { input: { ... } });

// Update profile
await invoke('update_profile', { id: 'react-stack', input: { ... } });

// Delete profile
await invoke('delete_profile', { id: 'react-stack' });

// Assign skills
await invoke('assign_skills_to_profile', {
  profileId: 'react-stack',
  skillIds: ['react-19', 'typescript']
});

// Get profile skills
const skills = await invoke<Skill[]>('get_profile_skills', { profileId: 'react-stack' });
```

### Skills

```typescript
// List skills
const skills = await invoke<Skill[]>('list_skills');

// Get skill
const skill = await invoke<Skill>('get_skill', { id: 'react-19' });

// Toggle skill
await invoke('toggle_skill', { id: 'react-19', enabled: true });

// Fetch remote skills
await invoke('fetch_remote_skills', { source: 'anthropic-official' });
```

### Deploy

```typescript
// Deploy to GitHub (GUI-only)
const result = await invoke<DeployResult>('deploy_config', {
  version: '1.0.0',
  changelog: 'Release notes'
});

// Export configuration
const result = await invoke<ExportResult>('export_config', {
  outputPath: '/path/to/output'
});
```

## Security

The GUI has exclusive access to **deploy** operations:

- Only lead developers with the GUI can publish configuration changes
- Team developers use CLI for read-only sync
- Requires `GITHUB_TOKEN` environment variable with repo write access

This separation ensures configuration integrity across the team.

## Troubleshooting

### App Won't Start

```bash
# Check Tauri logs
cd gui
pnpm tauri dev

# Check for missing dependencies
cargo check -p rhinolabs-gui
```

### Deploy Failed

1. Verify `GITHUB_TOKEN` is set
2. Check repository permissions
3. Verify GitHub owner/repo in Project settings

### Skills Not Loading

```bash
# Check plugin installation
rhinolabs-ai status

# Verify skills directory
ls ~/.config/claude-code/plugins/rhinolabs-claude/skills/
```

---

**Version**: 1.0.0
**Last Updated**: 2026-01-28
