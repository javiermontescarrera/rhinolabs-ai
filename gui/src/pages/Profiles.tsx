import { useEffect, useState } from 'react';
import { api } from '../api';
import type { Profile, ProfileType, CreateProfileInput, UpdateProfileInput, Skill, IdeInfo, PermissionConfig, StatusLineConfig, OutputStyle } from '../types';
import toast from 'react-hot-toast';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

type PermissionType = 'deny' | 'ask' | 'allow';

const PROFILE_TYPE_COLORS: Record<ProfileType, string> = {
  user: '#10b981',
  project: '#8b5cf6',
};

const SCROLLABLE_LIST_STYLE: React.CSSProperties = {
  maxHeight: '300px',
  overflowY: 'auto',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  background: 'var(--bg-primary)',
};

type EditSection = 'basic' | 'instructions' | 'skills' | 'settings' | 'output-style';

export default function Profiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [defaultUserProfile, setDefaultUserProfile] = useState<string | null>(null);
  const [availableIdes, setAvailableIdes] = useState<IdeInfo[]>([]);

  // Create/Edit state
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [activeSection, setActiveSection] = useState<EditSection>('basic');
  const [formData, setFormData] = useState<CreateProfileInput>({
    id: '',
    name: '',
    description: '',
    profileType: 'project',
  });

  // Skills assignment state (in edit mode)
  const [assignedSkills, setAssignedSkills] = useState<Set<string>>(new Set());
  const [savingSkills, setSavingSkills] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  // Instructions state (in edit mode)
  const [instructionsContent, setInstructionsContent] = useState<string>('');
  const [instructionsLoading, setInstructionsLoading] = useState(false);

  // Settings state (for main profile only)
  const [permissions, setPermissions] = useState<PermissionConfig | null>(null);
  const [statusLine, setStatusLine] = useState<StatusLineConfig | null>(null);
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [activePermissionTab, setActivePermissionTab] = useState<PermissionType>('allow');
  const [newPermissionValue, setNewPermissionValue] = useState('');
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvValue, setNewEnvValue] = useState('');

  // Output Style state (for main profile only)
  const [outputStyle, setOutputStyle] = useState<OutputStyle | null>(null);
  const [outputStyleLoading, setOutputStyleLoading] = useState(false);

  // Computed values
  const categories = [...new Set(skills.map(s => s.category))].sort();
  const filteredSkills = categoryFilter
    ? skills.filter(s => s.category === categoryFilter)
    : skills;

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [profileList, skillList, defaultProfile, ides] = await Promise.all([
        api.listProfiles(),
        api.listSkills(),
        api.getDefaultUserProfile(),
        api.listAvailableIdes(),
      ]);
      setProfiles(profileList);
      setSkills(skillList);
      setDefaultUserProfile(defaultProfile?.id ?? null);
      setAvailableIdes(ides.filter((ide) => ide.available));
    } catch (err) {
      toast.error('Failed to load profiles data');
    } finally {
      setLoading(false);
    }
  }

  // ============================================
  // Profile CRUD
  // ============================================

  async function handleCreate() {
    if (!formData.id.trim() || !formData.name.trim()) {
      toast.error('ID and name are required');
      return;
    }
    try {
      // Create the profile with skills included
      // Skills are used to generate the instructions template with auto-invoke table
      await api.createProfile({
        ...formData,
        skills: Array.from(assignedSkills),
      });

      toast.success('Profile created');
      closeEdit();
      loadData();
    } catch (err) {
      const message = typeof err === 'string' ? err : 'Failed to create profile';
      toast.error(message, { duration: 10000 });
    }
  }

  async function handleUpdate() {
    if (!editing) return;
    try {
      const input: UpdateProfileInput = {
        name: formData.name,
        description: formData.description,
        profileType: formData.profileType,
      };
      await api.updateProfile(editing.id, input);
      toast.success('Profile updated');
      loadData();
    } catch (err) {
      toast.error('Failed to update profile');
    }
  }

  async function handleDelete(profile: Profile) {
    if (!confirm(`Delete profile "${profile.name}"?`)) return;
    try {
      await api.deleteProfile(profile.id);
      toast.success('Profile deleted');
      loadData();
    } catch (err) {
      toast.error('Failed to delete profile');
    }
  }

  async function handleSetDefault(profile: Profile) {
    if (profile.profileType !== 'user') {
      toast.error('Only User profiles can be set as default');
      return;
    }
    try {
      await api.setDefaultUserProfile(profile.id);
      toast.success('Default profile updated');
      setDefaultUserProfile(profile.id);
    } catch (err) {
      toast.error('Failed to set default profile');
    }
  }

  async function startEdit(profile: Profile) {
    setEditing(profile);
    setFormData({
      id: profile.id,
      name: profile.name,
      description: profile.description,
      profileType: profile.profileType,
    });
    setAssignedSkills(new Set(profile.skills));
    setActiveSection('basic');
    setCategoryFilter(null);

    // Load instructions
    setInstructionsLoading(true);
    try {
      const content = await api.getProfileInstructions(profile.id);
      setInstructionsContent(content);
    } catch {
      setInstructionsContent('');
    } finally {
      setInstructionsLoading(false);
    }

    // Load settings and output style for main profile
    if (profile.id === 'main') {
      loadSettings();
      loadOutputStyle();
    }
  }

  function closeEdit() {
    setCreating(false);
    setEditing(null);
    setFormData({
      id: '',
      name: '',
      description: '',
      profileType: 'project',
    });
    setAssignedSkills(new Set());
    setInstructionsContent('');
    setActiveSection('basic');
    setCategoryFilter(null);
  }

  // ============================================
  // Skill Assignment
  // ============================================

  function toggleSkillAssignment(skillId: string) {
    setAssignedSkills(prev => {
      const next = new Set(prev);
      if (next.has(skillId)) {
        next.delete(skillId);
      } else {
        next.add(skillId);
      }
      return next;
    });
  }

  async function handleSaveSkills() {
    if (!editing) return;
    setSavingSkills(true);
    try {
      await api.assignSkillsToProfile(editing.id, Array.from(assignedSkills));
      toast.success('Skills saved');
      loadData();
    } catch (err) {
      toast.error('Failed to save skills');
    } finally {
      setSavingSkills(false);
    }
  }

  // ============================================
  // Instructions
  // ============================================

  async function handleOpenInstructionsInIde() {
    if (!editing) return;
    if (availableIdes.length === 0) {
      toast.error('No IDE available. Install VS Code, Cursor, or Zed.');
      return;
    }
    try {
      await api.openProfileInstructionsInIde(editing.id, availableIdes[0].command);
      toast.success('Opened in ' + availableIdes[0].name);
    } catch (err) {
      toast.error('Failed to open in IDE');
    }
  }

  async function handleRefreshInstructions() {
    if (!editing) return;
    setInstructionsLoading(true);
    try {
      const content = await api.getProfileInstructions(editing.id);
      setInstructionsContent(content);
      toast.success('Instructions refreshed');
    } catch (err) {
      toast.error('Failed to refresh instructions');
    } finally {
      setInstructionsLoading(false);
    }
  }

  // ============================================
  // Settings (main profile only)
  // ============================================

  async function loadSettings() {
    setSettingsLoading(true);
    try {
      const [perms, status, env] = await Promise.all([
        api.getPermissions(),
        api.getStatusLine(),
        api.getEnvVars(),
      ]);
      setPermissions(perms);
      setStatusLine(status);
      setEnvVars(env);
    } catch (err) {
      toast.error('Failed to load settings');
    } finally {
      setSettingsLoading(false);
    }
  }

  async function handleAddPermission() {
    if (!newPermissionValue.trim()) return;
    try {
      await api.addPermission(activePermissionTab, newPermissionValue);
      toast.success('Permission added');
      setNewPermissionValue('');
      loadSettings();
    } catch (err) {
      toast.error('Failed to add permission');
    }
  }

  async function handleRemovePermission(type: PermissionType, value: string) {
    try {
      await api.removePermission(type, value);
      toast.success('Permission removed');
      loadSettings();
    } catch (err) {
      toast.error('Failed to remove permission');
    }
  }

  async function handleUpdateStatusLine(updates: Partial<StatusLineConfig>) {
    if (!statusLine) return;
    const updated = { ...statusLine, ...updates };
    try {
      await api.updateStatusLine(updated);
      setStatusLine(updated);
      toast.success('Status line updated');
    } catch (err) {
      toast.error('Failed to update status line');
    }
  }

  async function handleAddEnvVar() {
    if (!newEnvKey.trim()) return;
    try {
      await api.setEnvVar(newEnvKey, newEnvValue);
      toast.success('Environment variable added');
      setNewEnvKey('');
      setNewEnvValue('');
      loadSettings();
    } catch (err) {
      toast.error('Failed to add environment variable');
    }
  }

  async function handleRemoveEnvVar(key: string) {
    try {
      await api.removeEnvVar(key);
      toast.success('Environment variable removed');
      loadSettings();
    } catch (err) {
      toast.error('Failed to remove environment variable');
    }
  }

  // ============================================
  // Output Style (main profile only)
  // ============================================

  async function loadOutputStyle() {
    setOutputStyleLoading(true);
    try {
      const active = await api.getActiveOutputStyle();
      setOutputStyle(active);
    } catch {
      setOutputStyle(null);
    } finally {
      setOutputStyleLoading(false);
    }
  }

  async function handleOpenOutputStyleInIde() {
    if (!outputStyle) {
      toast.error('No output style to edit');
      return;
    }
    if (availableIdes.length === 0) {
      toast.error('No IDE available. Install VS Code, Cursor, or Zed.');
      return;
    }
    try {
      await api.openOutputStyleInIde(outputStyle.id, availableIdes[0].command);
      toast.success('Opened in ' + availableIdes[0].name);
    } catch (err) {
      toast.error('Failed to open in IDE');
    }
  }

  // ============================================
  // Render
  // ============================================

  if (loading) {
    return <div className="loading">Loading profiles...</div>;
  }

  // Edit/Create Mode
  if (creating || editing) {
    return (
      <div className="page profiles-page">
        {/* Header with actions */}
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>{creating ? 'Create Profile' : `Edit: ${editing?.name}`}</h1>
            <p className="subtitle">
              Configure profile settings, skills, and instructions
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {creating ? (
              <button className="btn btn-primary" onClick={handleCreate}>
                Create
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleUpdate}>
                Save
              </button>
            )}
            <button className="btn btn-secondary" onClick={closeEdit}>
              {creating ? 'Cancel' : 'Close'}
            </button>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="tabs" style={{ marginBottom: '24px' }}>
          <button
            className={`tab ${activeSection === 'basic' ? 'active' : ''}`}
            onClick={() => setActiveSection('basic')}
          >
            Basic Info
          </button>
          {!creating && (
            <button
              className={`tab ${activeSection === 'instructions' ? 'active' : ''}`}
              onClick={() => setActiveSection('instructions')}
            >
              Instructions
            </button>
          )}
          <button
            className={`tab ${activeSection === 'skills' ? 'active' : ''}`}
            onClick={() => setActiveSection('skills')}
          >
            Skills ({assignedSkills.size})
          </button>
          {!creating && editing?.id === 'main' && (
            <button
              className={`tab ${activeSection === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveSection('settings')}
            >
              Settings
            </button>
          )}
          {!creating && editing?.id === 'main' && (
            <button
              className={`tab ${activeSection === 'output-style' ? 'active' : ''}`}
              onClick={() => setActiveSection('output-style')}
            >
              Output Style
            </button>
          )}
        </div>

        {/* Basic Info Section */}
        {activeSection === 'basic' && (
          <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
            <h3>Profile Information</h3>
            <div className="form-group">
              <label>ID (kebab-case, cannot be changed)</label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                placeholder="react-stack"
                disabled={!!editing}
              />
            </div>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="React 19 Stack"
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Skills for React 19 projects with TypeScript and Tailwind"
                rows={3}
              />
            </div>
            {editing && (
              <div className="form-group">
                <label>Type</label>
                <input
                  type="text"
                  value={formData.profileType === 'user' ? 'User (installs to ~/.claude/)' : 'Project (installs to project/.claude/)'}
                  disabled
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                />
              </div>
            )}
          </div>
        )}

        {/* Skills Section */}
        {activeSection === 'skills' && (
          <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>Assign Skills</h3>
              {editing && (
                <button
                  className="btn btn-primary"
                  onClick={handleSaveSkills}
                  disabled={savingSkills}
                >
                  {savingSkills ? 'Saving...' : 'Save Skills'}
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <button
                className={`btn btn-sm ${categoryFilter === null ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setCategoryFilter(null)}
              >
                All ({skills.length})
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`btn btn-sm ${categoryFilter === cat ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat} ({skills.filter(s => s.category === cat).length})
                </button>
              ))}
            </div>

            {/* Skills Checklist */}
            <div style={SCROLLABLE_LIST_STYLE}>
              {filteredSkills.map((skill) => (
                <label
                  key={skill.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    padding: '12px',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={assignedSkills.has(skill.id)}
                    onChange={() => toggleSkillAssignment(skill.id)}
                    style={{ marginRight: '12px', marginTop: '4px' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500 }}>{skill.name}</div>
                    <div
                      title={skill.description || ''}
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-tertiary)',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {skill.description || 'No description'}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Instructions Section (edit mode only - can't edit instructions until profile exists) */}
        {!creating && activeSection === 'instructions' && (
          <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>Profile Instructions</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-secondary"
                  onClick={handleRefreshInstructions}
                  disabled={instructionsLoading}
                >
                  Refresh
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleOpenInstructionsInIde}
                  disabled={availableIdes.length === 0}
                >
                  Edit in IDE
                </button>
              </div>
            </div>

            {/* Info Notice */}
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
            }}>
              <span style={{ color: '#8b5cf6' }}>●</span>
              <span>
                These instructions are included in <code>CLAUDE.md</code> when the profile is installed.
                Click "Edit in IDE" to modify, then "Refresh" to see changes.
              </span>
            </div>

            {/* Content Viewer */}
            {instructionsLoading ? (
              <div className="loading">Loading instructions...</div>
            ) : (
              <div style={{
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                overflow: 'auto',
                maxHeight: 'calc(100vh - 400px)',
              }}>
                <SyntaxHighlighter
                  language="markdown"
                  style={vscDarkPlus}
                  showLineNumbers
                  customStyle={{
                    margin: 0,
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                  }}
                >
                  {instructionsContent || '# No instructions yet\n\nClick "Edit in IDE" to create instructions.'}
                </SyntaxHighlighter>
              </div>
            )}
          </div>
        )}

        {/* Settings Section (main profile only) */}
        {!creating && editing?.id === 'main' && activeSection === 'settings' && (
          <div>
            {settingsLoading ? (
              <div className="loading">Loading settings...</div>
            ) : (
              <>
                {/* Permissions */}
                <div className="card" style={{ marginBottom: '16px' }}>
                  <h3>Permissions</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Control what actions Claude Code can perform
                  </p>

                  {/* Tabs */}
                  <div style={{ display: 'flex', gap: '0', marginBottom: '1rem', borderBottom: '2px solid var(--border)' }}>
                    {(['allow', 'ask', 'deny'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActivePermissionTab(tab)}
                        style={{
                          padding: '0.75rem 1.5rem',
                          background: activePermissionTab === tab ? 'var(--bg-secondary)' : 'transparent',
                          border: 'none',
                          borderBottom: activePermissionTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                          marginBottom: '-2px',
                          color: activePermissionTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontWeight: activePermissionTab === tab ? '600' : '400',
                          textTransform: 'capitalize',
                          transition: 'all 0.2s',
                        }}
                      >
                        {tab} ({permissions?.[tab]?.length || 0})
                      </button>
                    ))}
                  </div>

                  {/* Scrollable list */}
                  <div style={{
                    maxHeight: '200px',
                    overflowY: 'auto',
                    marginBottom: '1rem',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    background: 'var(--bg-primary)',
                  }}>
                    {permissions?.[activePermissionTab]?.length ? (
                      permissions[activePermissionTab].map((perm, i) => (
                        <div key={i} className="list-item" style={{ margin: 0, borderRadius: 0, borderBottom: '1px solid var(--border)' }}>
                          <div className="item-info">
                            <code>{perm}</code>
                          </div>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleRemovePermission(activePermissionTab, perm)}
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    ) : (
                      <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', padding: '1.5rem', textAlign: 'center' }}>
                        No {activePermissionTab} permissions configured
                      </p>
                    )}
                  </div>

                  {/* Add permission */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                      <label>Add to {activePermissionTab}</label>
                      <input
                        type="text"
                        placeholder="e.g., Bash(git*)"
                        value={newPermissionValue}
                        onChange={(e) => setNewPermissionValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddPermission()}
                      />
                    </div>
                    <button className="btn btn-primary" onClick={handleAddPermission}>
                      Add
                    </button>
                  </div>
                </div>

                {/* Status Line */}
                <div className="card" style={{ marginBottom: '16px' }}>
                  <h3>Status Line</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Configure the status line display in Claude Code
                  </p>

                  <div className="form-group">
                    <label>Type</label>
                    <select
                      value={statusLine?.type ?? 'static'}
                      onChange={(e) => handleUpdateStatusLine({ type: e.target.value as 'command' | 'static' })}
                    >
                      <option value="static">Static Text</option>
                      <option value="command">Command Output</option>
                    </select>
                  </div>

                  {statusLine?.type === 'static' ? (
                    <div className="form-group">
                      <label>Text</label>
                      <input
                        type="text"
                        value={statusLine?.text ?? ''}
                        onChange={(e) => handleUpdateStatusLine({ text: e.target.value })}
                        placeholder="Status line text"
                      />
                    </div>
                  ) : (
                    <div className="form-group">
                      <label>Command</label>
                      <input
                        type="text"
                        value={statusLine?.command ?? ''}
                        onChange={(e) => handleUpdateStatusLine({ command: e.target.value })}
                        placeholder="Command to execute"
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label>Padding</label>
                    <input
                      type="number"
                      value={statusLine?.padding ?? 0}
                      onChange={(e) => handleUpdateStatusLine({ padding: parseInt(e.target.value) || 0 })}
                      min={0}
                      max={20}
                    />
                  </div>
                </div>

                {/* Environment Variables */}
                <div className="card">
                  <h3>Environment Variables</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Set environment variables for Claude Code sessions
                  </p>

                  {Object.entries(envVars).length > 0 ? (
                    Object.entries(envVars).map(([key, value]) => (
                      <div key={key} className="list-item">
                        <div className="item-info">
                          <h4>{key}</h4>
                          <p>{value}</p>
                        </div>
                        <button className="btn btn-sm btn-danger" onClick={() => handleRemoveEnvVar(key)}>
                          Remove
                        </button>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '1rem' }}>
                      No environment variables configured
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div className="form-group" style={{ marginBottom: 0, minWidth: '150px' }}>
                      <label>Key</label>
                      <input
                        type="text"
                        placeholder="VAR_NAME"
                        value={newEnvKey}
                        onChange={(e) => setNewEnvKey(e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '200px' }}>
                      <label>Value</label>
                      <input
                        type="text"
                        placeholder="value"
                        value={newEnvValue}
                        onChange={(e) => setNewEnvValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddEnvVar()}
                      />
                    </div>
                    <button className="btn btn-primary" onClick={handleAddEnvVar}>
                      Add
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Output Style Section (main profile only) */}
        {!creating && editing?.id === 'main' && activeSection === 'output-style' && (
          <div>
            {outputStyleLoading ? (
              <div className="loading">Loading output style...</div>
            ) : (
              <>
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ marginBottom: '0.25rem' }}>{outputStyle?.name || 'No style configured'}</h3>
                      {outputStyle?.description && (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                          {outputStyle.description}
                        </p>
                      )}
                      {outputStyle && (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                          Keep coding instructions: <strong>{outputStyle.keepCodingInstructions ? 'Yes' : 'No'}</strong>
                        </p>
                      )}
                    </div>
                    <button className="btn btn-primary" onClick={handleOpenOutputStyleInIde}>
                      Edit
                    </button>
                  </div>

                  <div style={{
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    overflow: 'auto',
                    maxHeight: '400px',
                  }}>
                    <SyntaxHighlighter
                      language="markdown"
                      style={vscDarkPlus}
                      showLineNumbers
                      customStyle={{
                        margin: 0,
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                      }}
                    >
                      {outputStyle?.content || '# No content yet\n\nClick "Edit" to create your output style.'}
                    </SyntaxHighlighter>
                  </div>
                </div>

                {/* Quick Reference */}
                <div className="card">
                  <h3>Quick Reference</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Common sections to include in your output style:
                  </p>
                  <div className="grid-2">
                    <div>
                      <h4 style={{ marginBottom: '0.5rem' }}>Structure</h4>
                      <ul style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', paddingLeft: '1.25rem' }}>
                        <li># Personality - Overall character</li>
                        <li># Tone - How to communicate</li>
                        <li># Language - Response language</li>
                        <li># Behavior - Specific actions</li>
                      </ul>
                    </div>
                    <div>
                      <h4 style={{ marginBottom: '0.5rem' }}>Tips</h4>
                      <ul style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', paddingLeft: '1.25rem' }}>
                        <li>Be specific with tone descriptors</li>
                        <li>Include example phrases if needed</li>
                        <li>Define when to use formal/informal</li>
                        <li>Specify preferred terminology</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  // List Mode
  return (
    <div className="page profiles-page">
      <div className="page-header">
        <h1>Profiles</h1>
        <p className="subtitle">Organize skills into reusable profiles for different projects</p>
      </div>

      {/* Create Button */}
      <button className="btn btn-primary" onClick={() => setCreating(true)} style={{ marginBottom: '16px' }}>
        + Create Profile
      </button>

      {/* Profiles List */}
      {profiles.length === 0 ? (
        <div className="empty-state">
          <p>No profiles yet. Create one to organize your skills.</p>
        </div>
      ) : (
        <div style={{
          ...SCROLLABLE_LIST_STYLE,
          maxHeight: 'calc(100vh - 340px)',
        }}>
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="list-item"
              style={{
                padding: '16px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 600 }}>{profile.name}</span>
                  <span
                    className="badge"
                    style={{
                      background: PROFILE_TYPE_COLORS[profile.profileType],
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      textTransform: 'capitalize',
                    }}
                  >
                    {profile.profileType}
                  </span>
                  {defaultUserProfile === profile.id && (
                    <span
                      className="badge"
                      style={{
                        background: '#f59e0b',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}
                    >
                      Default
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {profile.description || 'No description'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                  {profile.skills.length} skills assigned
                  {profile.instructions && ' • Has instructions'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {profile.profileType === 'user' && defaultUserProfile !== profile.id && (
                  <button
                    className="btn btn-small"
                    onClick={() => handleSetDefault(profile)}
                    title="Set as default user profile"
                  >
                    Set Default
                  </button>
                )}
                <button
                  className="btn btn-small btn-primary"
                  onClick={() => startEdit(profile)}
                >
                  Edit
                </button>
                {profile.id !== 'main' && (
                  <button
                    className="btn btn-small btn-danger"
                    onClick={() => handleDelete(profile)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Section */}
      <div className="info-section" style={{ marginTop: '32px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
        <h4>How Profiles Work</h4>
        <ul style={{ margin: '8px 0', paddingLeft: '20px', color: 'var(--text-secondary)' }}>
          <li><strong>User Profiles:</strong> Install to ~/.claude/skills/ and apply to all projects</li>
          <li><strong>Project Profiles:</strong> Install to project/.claude/skills/ for project-specific skills</li>
          <li><strong>Instructions:</strong> Each profile has custom instructions included in CLAUDE.md</li>
          <li>Use the CLI to install: <code>rhinolabs profile install --profile react-stack --path ./myproject</code></li>
          <li>Claude Code automatically loads skills from both user and project directories</li>
        </ul>
      </div>
    </div>
  );
}
