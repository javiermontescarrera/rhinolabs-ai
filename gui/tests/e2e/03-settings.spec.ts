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
    await expect(page.getByRole('heading', { name: /settings/i, level: 1 })).toBeVisible();
  });

  test('should show settings sections', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Permissions' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Environment Variables' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Status Line' })).toBeVisible();
  });

  test('should show Main-Profile notice', async ({ page }) => {
    await expect(page.getByText(/linked to main-profile/i)).toBeVisible();
  });
});

test.describe('Settings - Permissions', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
  });

  test('should display permission tabs', async ({ page }) => {
    // Tabs are buttons, not role="tab"
    await expect(page.getByRole('button', { name: /allow/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /ask/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /deny/i })).toBeVisible();
  });

  test('should show allow permissions by default', async ({ page }) => {
    // Allow tab should be active and show permissions
    await expect(page.getByText('Read')).toBeVisible();
    await expect(page.getByText('Edit')).toBeVisible();
    await expect(page.getByText('Write')).toBeVisible();
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

    // Use the input field in the Permissions card
    const permissionsCard = page.locator('.card').filter({ hasText: 'Permissions' });
    await permissionsCard.getByPlaceholder(/e\.g\./i).fill('Read(.secrets)');
    await permissionsCard.getByRole('button', { name: /^add$/i }).click();

    // Should show success toast
    await expect(page.getByText(/permission added/i)).toBeVisible();
  });

  test('should remove permission', async ({ page }) => {
    await page.getByRole('button', { name: /deny/i }).click();

    const permissionItem = page.locator('.list-item').filter({ hasText: 'Read(.env)' }).first();
    await permissionItem.getByRole('button', { name: /remove/i }).click();

    // Should show success toast
    await expect(page.getByText(/permission removed/i)).toBeVisible();
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
    // Use placeholders to find inputs
    await page.getByPlaceholder('VAR_NAME').fill('MY_NEW_VAR');
    await page.getByPlaceholder('value').fill('my-value');
    await page.locator('.card').filter({ hasText: 'Environment Variables' }).getByRole('button', { name: /^add$/i }).click();

    // Should show success toast
    await expect(page.getByText(/environment variable added/i)).toBeVisible();
  });

  test('should remove env var', async ({ page }) => {
    const envItem = page.locator('.list-item').filter({ hasText: 'ENABLE_TOOL_SEARCH' });
    await envItem.getByRole('button', { name: /remove/i }).click();

    // Should show success toast
    await expect(page.getByText(/environment variable removed/i)).toBeVisible();
  });
});

test.describe('Settings - Status Line', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
  });

  test('should display status line section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Status Line' })).toBeVisible();
  });

  test('should display type selector', async ({ page }) => {
    const statusLineCard = page.locator('.card').filter({ hasText: 'Status Line' });
    await expect(statusLineCard.locator('select')).toBeVisible();
  });

  test('should switch between command and static type', async ({ page }) => {
    const statusLineCard = page.locator('.card').filter({ hasText: 'Status Line' });
    await statusLineCard.locator('select').selectOption('static');

    // Should show text input for static type
    await expect(page.getByPlaceholder(/status line text/i)).toBeVisible();
  });

  test('should show command input when type is command', async ({ page }) => {
    const statusLineCard = page.locator('.card').filter({ hasText: 'Status Line' });
    await statusLineCard.locator('select').selectOption('command');

    // Should show command input
    await expect(page.getByPlaceholder(/command to execute/i)).toBeVisible();
  });

  test('should have padding input', async ({ page }) => {
    const statusLineCard = page.locator('.card').filter({ hasText: 'Status Line' });
    await expect(statusLineCard.locator('input[type="number"]')).toBeVisible();
  });

  test('should update status line on change', async ({ page }) => {
    const statusLineCard = page.locator('.card').filter({ hasText: 'Status Line' });
    await statusLineCard.locator('select').selectOption('static');
    await page.getByPlaceholder(/status line text/i).fill('Test status');

    // Should show success toast
    await expect(page.getByText(/status line updated/i)).toBeVisible();
  });
});
