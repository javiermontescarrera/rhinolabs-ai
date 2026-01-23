// ============================================
// Plugin Manifest (.claude-plugin/plugin.json)
// ============================================
export interface PluginManifest {
  name: string;
  description: string;
  version: string;
  author: {
    name: string;
  };
}

// ============================================
// Settings (settings.json)
// ============================================
export interface PluginSettings {
  outputStyle: string;
  env: Record<string, string>;
  attribution: {
    commit: string;
    pr: string;
  };
  statusLine: StatusLineConfig;
  permissions: PermissionConfig;
}

export interface StatusLineConfig {
  type: 'command' | 'static';
  command?: string;
  text?: string;
  padding: number;
}

export interface PermissionConfig {
  deny: string[];
  ask: string[];
  allow: string[];
}

// ============================================
// MCP Configuration (.mcp.json)
// ============================================
export interface McpConfig {
  mcpServers: Record<string, McpServer>;
  settings: McpSettings;
}

export interface McpServer {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface McpSettings {
  defaultTimeout: number;
  retryAttempts: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

// ============================================
// Output Style (output-styles/*.md)
// ============================================
export interface OutputStyle {
  id: string;
  name: string;
  description: string;
  keepCodingInstructions: boolean;
  content: string;
}

// ============================================
// Skills (skills/**/SKILL.md)
// ============================================
export interface Skill {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: SkillCategory;
  path: string;
  content: string;
  createdAt?: string;
  isCustom: boolean;
}

export type SkillCategory =
  | 'corporate'
  | 'frontend'
  | 'testing'
  | 'ai-sdk'
  | 'utilities'
  | 'custom';

export interface CreateSkillInput {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  content: string;
}

export interface UpdateSkillInput {
  name?: string;
  description?: string;
  content?: string;
  enabled?: boolean;
}

// ============================================
// Instructions (CLAUDE.md)
// ============================================
export interface Instructions {
  content: string;
  lastModified: string;
}

// ============================================
// Diagnostics
// ============================================
export type CheckStatus = 'Pass' | 'Fail' | 'Warning';

export interface DiagnosticCheck {
  name: string;
  status: CheckStatus;
  message: string;
}

export interface DiagnosticReport {
  checks: DiagnosticCheck[];
  passed: number;
  failed: number;
  warnings: number;
}

// ============================================
// Plugin Status
// ============================================
export interface PluginStatus {
  isInstalled: boolean;
  version: string | null;
  installedAt: string | null;
  pluginPath: string | null;
  claudeCodeInstalled: boolean;
  mcpConfigured: boolean;
}

// ============================================
// MCP Sync
// ============================================
export interface McpSyncSource {
  type: 'url' | 'file';
  value: string;
}
