import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to navigate to Settings tab in Main Profile
async function navigateToSettings(page: import('@playwright/test').Page) {
  const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
  await page.addInitScript(mockContent);
  await page.goto('/profiles');
  await page.waitForLoadState('networkidle');

  // Click Edit on Main Profile
  const mainProfile = page.locator('.list-item').filter({ hasText: 'Main Profile' });
  await mainProfile.getByRole('button', { name: /edit/i }).click();

  // Click Settings tab
  await page.getByRole('button', { name: /settings/i }).click();
}

test.describe('Settings Tab (Main Profile)', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToSettings(page);
  });

  test('should show Settings tab only for main profile', async ({ page }) => {
    await expect(page.getByRole('button', { name: /settings/i })).toBeVisible();
  });

  test('should show settings sections', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Permissions' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Environment Variables' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Status Line' })).toBeVisible();
  });
});

test.describe('Settings - Permissions', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToSettings(page);
  });

  test('should display permission tabs', async ({ page }) => {
    await expect(page.getByRole('button', { name: /allow/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /ask/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /deny/i })).toBeVisible();
  });

  test('should show allow permissions by default', async ({ page }) => {
    // Allow tab should be active and show permissions
    const permissionsCard = page.locator('.card').filter({ hasText: 'Permissions' });
    await expect(permissionsCard.getByText('Read').first()).toBeVisible();
    await expect(permissionsCard.getByText('Edit').first()).toBeVisible();
    await expect(permissionsCard.getByText('Write').first()).toBeVisible();
  });

  test('should switch to deny tab and show permissions', async ({ page }) => {
    await page.getByRole('button', { name: /deny/i }).click();

    await expect(page.getByText('Read(.env)')).toBeVisible();
    await expect(page.getByText('Read(.env.*)')).toBeVisible();
  });

  test('should switch to ask tab and show permissions', async ({ page }) => {
    await page.getByRole('button', { name: /ask/i }).click();

    await expect(page.getByText('Bash(git commit:*)')).toBeVisible();
    await expect(page.getByText('Bash(git push:*)')).toBeVisible();
  });

  test('should add new permission', async ({ page }) => {
    await page.getByRole('button', { name: /deny/i }).click();

    const permissionsCard = page.locator('.card').filter({ hasText: 'Permissions' });
    await permissionsCard.getByPlaceholder(/e\.g\./i).fill('Read(.secrets)');
    await permissionsCard.getByRole('button', { name: /^add$/i }).click();

    await expect(page.getByText(/permission added/i)).toBeVisible();
  });

  test('should remove permission', async ({ page }) => {
    await page.getByRole('button', { name: /deny/i }).click();

    const permissionItem = page.locator('.list-item').filter({ hasText: 'Read(.env)' }).first();
    await permissionItem.getByRole('button', { name: /remove/i }).click();

    await expect(page.getByText(/permission removed/i)).toBeVisible();
  });
});

test.describe('Settings - Environment Variables', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToSettings(page);
  });

  test('should display existing env vars', async ({ page }) => {
    await expect(page.getByText('ENABLE_TOOL_SEARCH')).toBeVisible();
    await expect(page.getByText('true')).toBeVisible();
  });

  test('should add new env var', async ({ page }) => {
    await page.getByPlaceholder('VAR_NAME').fill('MY_NEW_VAR');
    await page.getByPlaceholder('value').fill('my-value');
    await page.locator('.card').filter({ hasText: 'Environment Variables' }).getByRole('button', { name: /^add$/i }).click();

    await expect(page.getByText(/environment variable added/i)).toBeVisible();
  });

  test('should remove env var', async ({ page }) => {
    const envItem = page.locator('.list-item').filter({ hasText: 'ENABLE_TOOL_SEARCH' });
    await envItem.getByRole('button', { name: /remove/i }).click();

    await expect(page.getByText(/environment variable removed/i)).toBeVisible();
  });
});

test.describe('Settings - Status Line', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToSettings(page);
    // Wait for settings to load
    await expect(page.getByText(/loading settings/i)).not.toBeVisible({ timeout: 5000 });
  });

  test('should display status line section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Status Line' })).toBeVisible();
  });

  test('should display type selector', async ({ page }) => {
    const statusLineCard = page.locator('.card').filter({ hasText: 'Status Line' });
    await expect(statusLineCard.locator('select')).toBeVisible();
  });
});

test.describe('Settings - Not Available for Other Profiles', () => {
  test('should not show Settings tab for project profiles', async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/profiles');
    await page.waitForLoadState('networkidle');

    // Click Edit on React 19 Stack (project profile)
    const projectProfile = page.locator('.list-item').filter({ hasText: 'React 19 Stack' });
    await projectProfile.getByRole('button', { name: /edit/i }).click();

    // Settings tab should NOT be visible
    await expect(page.getByRole('button', { name: /^settings$/i })).not.toBeVisible();
  });
});
