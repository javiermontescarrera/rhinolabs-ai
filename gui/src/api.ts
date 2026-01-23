import { invoke } from '@tauri-apps/api/core';
import type {
  PluginManifest,
  PluginSettings,
  PluginStatus,
  McpConfig,
  McpServer,
  McpSettings,
  McpSyncSource,
  OutputStyle,
  Skill,
  CreateSkillInput,
  UpdateSkillInput,
  Instructions,
  DiagnosticReport,
  PermissionConfig,
  StatusLineConfig,
} from './types';

export const api = {
  // ============================================
  // Status & Installation
  // ============================================

  getStatus(): Promise<PluginStatus> {
    return invoke('get_status');
  },

  installPlugin(localPath?: string): Promise<void> {
    return invoke('install_plugin', { localPath: localPath ?? null });
  },

  updatePlugin(): Promise<void> {
    return invoke('update_plugin');
  },

  uninstallPlugin(): Promise<void> {
    return invoke('uninstall_plugin');
  },

  // ============================================
  // Diagnostics
  // ============================================

  runDiagnostics(): Promise<DiagnosticReport> {
    return invoke('run_diagnostics');
  },

  // ============================================
  // Plugin Manifest
  // ============================================

  getManifest(): Promise<PluginManifest> {
    return invoke('get_manifest');
  },

  updateManifest(manifest: PluginManifest): Promise<void> {
    return invoke('update_manifest', { manifest });
  },

  // ============================================
  // Settings
  // ============================================

  getSettings(): Promise<PluginSettings> {
    return invoke('get_settings');
  },

  updateSettings(settings: PluginSettings): Promise<void> {
    return invoke('update_settings', { settings });
  },

  // Permissions shortcuts
  getPermissions(): Promise<PermissionConfig> {
    return invoke('get_permissions');
  },

  updatePermissions(permissions: PermissionConfig): Promise<void> {
    return invoke('update_permissions', { permissions });
  },

  addPermission(type: 'deny' | 'ask' | 'allow', permission: string): Promise<void> {
    return invoke('add_permission', { permissionType: type, permission });
  },

  removePermission(type: 'deny' | 'ask' | 'allow', permission: string): Promise<void> {
    return invoke('remove_permission', { permissionType: type, permission });
  },

  // Env vars shortcuts
  getEnvVars(): Promise<Record<string, string>> {
    return invoke('get_env_vars');
  },

  setEnvVar(key: string, value: string): Promise<void> {
    return invoke('set_env_var', { key, value });
  },

  removeEnvVar(key: string): Promise<void> {
    return invoke('remove_env_var', { key });
  },

  // Status line shortcuts
  getStatusLine(): Promise<StatusLineConfig> {
    return invoke('get_status_line');
  },

  updateStatusLine(config: StatusLineConfig): Promise<void> {
    return invoke('update_status_line', { config });
  },

  // ============================================
  // MCP Configuration
  // ============================================

  getMcpConfig(): Promise<McpConfig> {
    return invoke('get_mcp_config');
  },

  updateMcpConfig(config: McpConfig): Promise<void> {
    return invoke('update_mcp_config', { config });
  },

  // MCP Servers
  listMcpServers(): Promise<Record<string, McpServer>> {
    return invoke('list_mcp_servers');
  },

  getMcpServer(name: string): Promise<McpServer | null> {
    return invoke('get_mcp_server', { name });
  },

  addMcpServer(name: string, server: McpServer): Promise<void> {
    return invoke('add_mcp_server', { name, server });
  },

  updateMcpServer(name: string, server: McpServer): Promise<void> {
    return invoke('update_mcp_server', { name, server });
  },

  removeMcpServer(name: string): Promise<void> {
    return invoke('remove_mcp_server', { name });
  },

  // MCP Settings
  getMcpSettings(): Promise<McpSettings> {
    return invoke('get_mcp_settings');
  },

  updateMcpSettings(settings: McpSettings): Promise<void> {
    return invoke('update_mcp_settings', { settings });
  },

  // MCP Sync
  syncMcpConfig(source: McpSyncSource): Promise<void> {
    return invoke('sync_mcp_config', {
      url: source.type === 'url' ? source.value : null,
      filePath: source.type === 'file' ? source.value : null,
    });
  },

  // ============================================
  // Output Styles
  // ============================================

  listOutputStyles(): Promise<OutputStyle[]> {
    return invoke('list_output_styles');
  },

  getOutputStyle(id: string): Promise<OutputStyle | null> {
    return invoke('get_output_style', { id });
  },

  getActiveOutputStyle(): Promise<OutputStyle | null> {
    return invoke('get_active_output_style');
  },

  setActiveOutputStyle(id: string): Promise<void> {
    return invoke('set_active_output_style', { id });
  },

  createOutputStyle(style: Omit<OutputStyle, 'id'>): Promise<OutputStyle> {
    return invoke('create_output_style', { style });
  },

  updateOutputStyle(id: string, style: Partial<OutputStyle>): Promise<void> {
    return invoke('update_output_style', { id, style });
  },

  deleteOutputStyle(id: string): Promise<void> {
    return invoke('delete_output_style', { id });
  },

  // ============================================
  // Skills
  // ============================================

  listSkills(): Promise<Skill[]> {
    return invoke('list_skills');
  },

  getSkill(id: string): Promise<Skill | null> {
    return invoke('get_skill', { id });
  },

  createSkill(input: CreateSkillInput): Promise<Skill> {
    return invoke('create_skill', { input });
  },

  updateSkill(id: string, input: UpdateSkillInput): Promise<void> {
    return invoke('update_skill', { id, input });
  },

  toggleSkill(id: string, enabled: boolean): Promise<void> {
    return invoke('toggle_skill', { id, enabled });
  },

  deleteSkill(id: string): Promise<void> {
    return invoke('delete_skill', { id });
  },

  // ============================================
  // Instructions (CLAUDE.md)
  // ============================================

  getInstructions(): Promise<Instructions> {
    return invoke('get_instructions');
  },

  updateInstructions(content: string): Promise<void> {
    return invoke('update_instructions', { content });
  },
};
