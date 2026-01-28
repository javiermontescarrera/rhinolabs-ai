import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('MCP Configuration Page', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/mcp');
    await page.waitForLoadState('networkidle');
  });

  test('should display MCP page with heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /mcp servers/i, level: 1 })).toBeVisible();
  });

  test('should show servers and settings sections', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Configured Servers' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'MCP Settings' })).toBeVisible();
  });

  test('should show Add Server and Sync buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: /add server/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /sync from source/i })).toBeVisible();
  });
});

test.describe('MCP - Servers Management', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/mcp');
    await page.waitForLoadState('networkidle');
  });

  test('should list existing MCP servers', async ({ page }) => {
    // Use heading role to avoid matching command text
    await expect(page.getByRole('heading', { name: 'github', level: 4 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'filesystem', level: 4 })).toBeVisible();
  });

  test('should open add server form', async ({ page }) => {
    await page.getByRole('button', { name: /add server/i }).click();

    await expect(page.getByRole('heading', { name: /add mcp server/i })).toBeVisible();
  });

  test('should show form fields in add server', async ({ page }) => {
    await page.getByRole('button', { name: /add server/i }).click();

    await expect(page.getByPlaceholder('my-mcp-server')).toBeVisible();
    await expect(page.getByPlaceholder(/npx or/i)).toBeVisible();
  });

  test('should add new MCP server', async ({ page }) => {
    await page.getByRole('button', { name: /add server/i }).click();

    await page.getByPlaceholder('my-mcp-server').fill('new-server');
    await page.getByPlaceholder(/npx or/i).fill('npx');

    await page.getByRole('button', { name: /^add server$/i }).click();

    // Should show success toast
    await expect(page.getByText(/mcp server added/i)).toBeVisible();
  });

  test('should show validation error for missing required fields', async ({ page }) => {
    await page.getByRole('button', { name: /add server/i }).click();

    // Try to add without filling required fields
    await page.getByRole('button', { name: /^add server$/i }).click();

    await expect(page.getByText(/required/i)).toBeVisible();
  });

  test('should cancel server creation', async ({ page }) => {
    await page.getByRole('button', { name: /add server/i }).click();
    await page.getByRole('button', { name: /cancel/i }).click();

    // Should return to list
    await expect(page.getByRole('heading', { name: /mcp servers/i, level: 1 })).toBeVisible();
  });

  test('should edit existing server', async ({ page }) => {
    const serverItem = page.locator('.list-item').filter({ hasText: 'github' });
    await serverItem.getByRole('button', { name: /edit/i }).click();

    await expect(page.getByRole('heading', { name: /edit mcp server/i })).toBeVisible();
    await expect(page.getByPlaceholder(/npx or/i)).toHaveValue('npx');
  });

  test('should update server', async ({ page }) => {
    const serverItem = page.locator('.list-item').filter({ hasText: 'github' });
    await serverItem.getByRole('button', { name: /edit/i }).click();

    await page.getByPlaceholder(/npx or/i).fill('node');
    await page.getByRole('button', { name: /^save$/i }).click();

    // Should show success toast
    await expect(page.getByText(/mcp server updated/i)).toBeVisible();
  });

  test('should delete server with confirmation', async ({ page }) => {
    const serverItem = page.locator('.list-item').filter({ hasText: 'filesystem' });

    page.on('dialog', dialog => dialog.accept());
    await serverItem.getByRole('button', { name: /delete/i }).click();

    // Should show success toast
    await expect(page.getByText(/mcp server removed/i)).toBeVisible();
  });

  test('should cancel server deletion', async ({ page }) => {
    const serverItem = page.locator('.list-item').filter({ hasText: 'filesystem' });

    page.on('dialog', dialog => dialog.dismiss());
    await serverItem.getByRole('button', { name: /delete/i }).click();

    // Server should still be visible - use heading to avoid matching command
    await expect(page.getByRole('heading', { name: 'filesystem', level: 4 })).toBeVisible();
  });
});

test.describe('MCP - Sync Configuration', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/mcp');
    await page.waitForLoadState('networkidle');
  });

  test('should show sync panel when clicking Sync from Source', async ({ page }) => {
    await page.getByRole('button', { name: /sync from source/i }).click();

    await expect(page.getByRole('heading', { name: /sync mcp configuration/i })).toBeVisible();
  });

  test('should show URL and File source options', async ({ page }) => {
    await page.getByRole('button', { name: /sync from source/i }).click();

    const syncCard = page.locator('.card').filter({ hasText: 'Sync MCP' });
    await expect(syncCard.locator('select')).toBeVisible();
  });

  test('should sync from URL', async ({ page }) => {
    await page.getByRole('button', { name: /sync from source/i }).click();

    await page.getByPlaceholder(/https/i).fill('https://example.com/mcp.json');
    await page.getByRole('button', { name: /^sync$/i }).click();

    // Should show success toast
    await expect(page.getByText(/mcp configuration synced/i)).toBeVisible();
  });

  test('should sync from file', async ({ page }) => {
    await page.getByRole('button', { name: /sync from source/i }).click();

    // Switch to file
    const syncCard = page.locator('.card').filter({ hasText: 'Sync MCP' });
    await syncCard.locator('select').selectOption('file');

    await page.getByPlaceholder(/path/i).fill('/home/user/mcp.json');
    await page.getByRole('button', { name: /^sync$/i }).click();

    // Should show success toast
    await expect(page.getByText(/mcp configuration synced/i)).toBeVisible();
  });

  test('should show error for empty source', async ({ page }) => {
    await page.getByRole('button', { name: /sync from source/i }).click();
    await page.getByRole('button', { name: /^sync$/i }).click();

    // Should show error
    await expect(page.getByText(/please enter/i)).toBeVisible();
  });
});

test.describe('MCP - Settings', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/mcp');
    await page.waitForLoadState('networkidle');
  });

  test('should display MCP settings section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'MCP Settings' })).toBeVisible();
  });

  test('should show timeout input', async ({ page }) => {
    const settingsCard = page.locator('.card').filter({ hasText: 'MCP Settings' });
    await expect(settingsCard.getByText('Default Timeout')).toBeVisible();
    await expect(settingsCard.locator('input[type="number"]').first()).toBeVisible();
  });

  test('should show retry attempts input', async ({ page }) => {
    const settingsCard = page.locator('.card').filter({ hasText: 'MCP Settings' });
    await expect(settingsCard.getByText('Retry Attempts')).toBeVisible();
  });

  test('should show log level select', async ({ page }) => {
    const settingsCard = page.locator('.card').filter({ hasText: 'MCP Settings' });
    await expect(settingsCard.getByText('Log Level')).toBeVisible();
    await expect(settingsCard.locator('select')).toBeVisible();
  });

  test('should update timeout', async ({ page }) => {
    const settingsCard = page.locator('.card').filter({ hasText: 'MCP Settings' });
    const timeoutInput = settingsCard.locator('input[type="number"]').first();

    await timeoutInput.fill('60000');
    await timeoutInput.blur();

    // Should show success toast
    await expect(page.getByText(/settings updated/i)).toBeVisible();
  });

  test('should update log level', async ({ page }) => {
    const settingsCard = page.locator('.card').filter({ hasText: 'MCP Settings' });
    await settingsCard.locator('select').selectOption('debug');

    // Should show success toast
    await expect(page.getByText(/settings updated/i)).toBeVisible();
  });
});
