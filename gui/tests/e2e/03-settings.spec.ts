import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
  });

  test('should display settings page with heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
  });

  test('should show settings sections', async ({ page }) => {
    await expect(page.getByText(/permissions/i)).toBeVisible();
    await expect(page.getByText(/environment variables/i)).toBeVisible();
    await expect(page.getByText(/status line/i)).toBeVisible();
    await expect(page.getByText(/attribution/i)).toBeVisible();
  });
});

test.describe('Settings - Permissions', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
  });

  test('should display permission categories', async ({ page }) => {
    await expect(page.getByRole('tab', { name: /deny/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /ask/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /allow/i })).toBeVisible();
  });

  test('should list deny permissions', async ({ page }) => {
    await page.getByRole('tab', { name: /deny/i }).click();

    await expect(page.getByText('Read(.env)')).toBeVisible();
    await expect(page.getByText('Read(.env.*)')).toBeVisible();
  });

  test('should list ask permissions', async ({ page }) => {
    await page.getByRole('tab', { name: /ask/i }).click();

    await expect(page.getByText('Bash(git commit:*)')).toBeVisible();
    await expect(page.getByText('Bash(git push:*)')).toBeVisible();
  });

  test('should list allow permissions', async ({ page }) => {
    await page.getByRole('tab', { name: /allow/i }).click();

    await expect(page.getByText(/^Read$/)).toBeVisible();
    await expect(page.getByText(/^Edit$/)).toBeVisible();
    await expect(page.getByText(/^Write$/)).toBeVisible();
  });

  test('should add new permission', async ({ page }) => {
    await page.getByRole('tab', { name: /deny/i }).click();
    await page.getByRole('button', { name: /add permission/i }).click();

    await page.getByPlaceholder(/enter permission/i).fill('Read(.secrets)');
    await page.getByRole('button', { name: /add/i }).click();

    await expect(page.getByText('Read(.secrets)')).toBeVisible();
  });

  test('should remove permission', async ({ page }) => {
    await page.getByRole('tab', { name: /deny/i }).click();

    const permissionItem = page.locator('[data-testid="permission-item"]').filter({ hasText: 'Read(.env)' });
    await permissionItem.getByRole('button', { name: /remove/i }).click();

    await expect(page.getByText('Read(.env)')).not.toBeVisible();
  });

  test('should move permission between categories', async ({ page }) => {
    await page.getByRole('tab', { name: /ask/i }).click();

    const permissionItem = page.locator('[data-testid="permission-item"]').filter({ hasText: 'Bash(git commit:*)' });
    await permissionItem.getByRole('button', { name: /move to allow/i }).click();

    await page.getByRole('tab', { name: /allow/i }).click();
    await expect(page.getByText('Bash(git commit:*)')).toBeVisible();
  });
});

test.describe('Settings - Environment Variables', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
  });

  test('should display existing env vars', async ({ page }) => {
    await expect(page.getByText('ENABLE_TOOL_SEARCH')).toBeVisible();
    await expect(page.getByText('true')).toBeVisible();
  });

  test('should add new env var', async ({ page }) => {
    await page.getByRole('button', { name: /add variable/i }).click();

    await page.getByLabel(/key/i).fill('MY_NEW_VAR');
    await page.getByLabel(/value/i).fill('my-value');
    await page.getByRole('button', { name: /save/i }).click();

    await expect(page.getByText('MY_NEW_VAR')).toBeVisible();
    await expect(page.getByText('my-value')).toBeVisible();
  });

  test('should edit env var value', async ({ page }) => {
    const envRow = page.locator('[data-testid="env-row-ENABLE_TOOL_SEARCH"]');
    await envRow.getByRole('button', { name: /edit/i }).click();

    await page.getByLabel(/value/i).fill('false');
    await page.getByRole('button', { name: /save/i }).click();

    await expect(page.getByText('false')).toBeVisible();
  });

  test('should delete env var', async ({ page }) => {
    const envRow = page.locator('[data-testid="env-row-ENABLE_TOOL_SEARCH"]');
    await envRow.getByRole('button', { name: /delete/i }).click();

    await page.getByRole('button', { name: /confirm/i }).click();

    await expect(page.getByText('ENABLE_TOOL_SEARCH')).not.toBeVisible();
  });
});

test.describe('Settings - Status Line', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
  });

  test('should display current status line config', async ({ page }) => {
    await expect(page.getByText(/command/i)).toBeVisible();
    await expect(page.getByText('~/.claude/statusline.sh')).toBeVisible();
  });

  test('should switch between command and static type', async ({ page }) => {
    await page.getByLabel(/type/i).selectOption('static');

    await expect(page.getByLabel(/text/i)).toBeVisible();
    await expect(page.getByLabel(/command/i)).not.toBeVisible();
  });

  test('should update command value', async ({ page }) => {
    await page.getByLabel(/command/i).fill('/usr/local/bin/my-status.sh');
    await page.getByRole('button', { name: /save/i }).click();

    await expect(page.getByText('/usr/local/bin/my-status.sh')).toBeVisible();
  });

  test('should update padding value', async ({ page }) => {
    await page.getByLabel(/padding/i).fill('10');
    await page.getByRole('button', { name: /save/i }).click();

    await expect(page.getByLabel(/padding/i)).toHaveValue('10');
  });
});

test.describe('Settings - Attribution', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
  });

  test('should display attribution fields', async ({ page }) => {
    await expect(page.getByLabel(/commit attribution/i)).toBeVisible();
    await expect(page.getByLabel(/pr attribution/i)).toBeVisible();
  });

  test('should update commit attribution', async ({ page }) => {
    await page.getByLabel(/commit attribution/i).fill('Co-Authored-By: AI <ai@example.com>');
    await page.getByRole('button', { name: /save/i }).click();

    await expect(page.getByLabel(/commit attribution/i)).toHaveValue('Co-Authored-By: AI <ai@example.com>');
  });

  test('should update pr attribution', async ({ page }) => {
    await page.getByLabel(/pr attribution/i).fill('Generated with AI assistance');
    await page.getByRole('button', { name: /save/i }).click();

    await expect(page.getByLabel(/pr attribution/i)).toHaveValue('Generated with AI assistance');
  });
});
