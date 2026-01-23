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
    await expect(page.getByRole('heading', { name: /mcp/i })).toBeVisible();
  });

  test('should show servers and settings sections', async ({ page }) => {
    await expect(page.getByText(/servers/i)).toBeVisible();
    await expect(page.getByText(/settings/i)).toBeVisible();
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
    await expect(page.getByText('git')).toBeVisible();
    await expect(page.getByText('npx')).toBeVisible();
    await expect(page.getByText('@modelcontextprotocol/server-git')).toBeVisible();
  });

  test('should show add server button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /add server/i })).toBeVisible();
  });

  test('should open add server modal', async ({ page }) => {
    await page.getByRole('button', { name: /add server/i }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: /add mcp server/i })).toBeVisible();
  });

  test('should show required fields in add server modal', async ({ page }) => {
    await page.getByRole('button', { name: /add server/i }).click();

    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/command/i)).toBeVisible();
    await expect(page.getByLabel(/args/i)).toBeVisible();
  });

  test('should add new MCP server', async ({ page }) => {
    await page.getByRole('button', { name: /add server/i }).click();

    await page.getByLabel(/name/i).fill('filesystem');
    await page.getByLabel(/command/i).fill('npx');
    await page.getByLabel(/args/i).fill('-y, @modelcontextprotocol/server-filesystem');

    await page.getByRole('button', { name: /add/i }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByText('filesystem')).toBeVisible();
  });

  test('should show error for duplicate server name', async ({ page }) => {
    await page.getByRole('button', { name: /add server/i }).click();

    await page.getByLabel(/name/i).fill('git'); // Already exists
    await page.getByLabel(/command/i).fill('test');
    await page.getByLabel(/args/i).fill('arg1');

    await page.getByRole('button', { name: /add/i }).click();

    await expect(page.getByText(/already exists/i)).toBeVisible();
  });

  test('should edit existing server', async ({ page }) => {
    const serverRow = page.locator('[data-testid="mcp-server-git"]');
    await serverRow.getByRole('button', { name: /edit/i }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByLabel(/command/i)).toHaveValue('npx');

    await page.getByLabel(/args/i).fill('-y, @modelcontextprotocol/server-git, --verbose');
    await page.getByRole('button', { name: /save/i }).click();

    await expect(page.getByText('--verbose')).toBeVisible();
  });

  test('should delete server', async ({ page }) => {
    const serverRow = page.locator('[data-testid="mcp-server-git"]');
    await serverRow.getByRole('button', { name: /delete/i }).click();

    await expect(page.getByRole('alertdialog')).toBeVisible();
    await page.getByRole('button', { name: /confirm/i }).click();

    await expect(page.getByTestId('mcp-server-git')).not.toBeVisible();
  });

  test('should cancel server deletion', async ({ page }) => {
    const serverRow = page.locator('[data-testid="mcp-server-git"]');
    await serverRow.getByRole('button', { name: /delete/i }).click();

    await page.getByRole('button', { name: /cancel/i }).click();

    await expect(page.getByTestId('mcp-server-git')).toBeVisible();
  });
});

test.describe('MCP - Server Environment Variables', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/mcp');
    await page.waitForLoadState('networkidle');
  });

  test('should show env vars section in edit modal', async ({ page }) => {
    const serverRow = page.locator('[data-testid="mcp-server-git"]');
    await serverRow.getByRole('button', { name: /edit/i }).click();

    await expect(page.getByText(/environment variables/i)).toBeVisible();
  });

  test('should add env var to server', async ({ page }) => {
    const serverRow = page.locator('[data-testid="mcp-server-git"]');
    await serverRow.getByRole('button', { name: /edit/i }).click();

    await page.getByRole('button', { name: /add env var/i }).click();
    await page.getByPlaceholder(/key/i).fill('GIT_TOKEN');
    await page.getByPlaceholder(/value/i).fill('secret-token');

    await page.getByRole('button', { name: /save/i }).click();

    // Re-open to verify
    await serverRow.getByRole('button', { name: /edit/i }).click();
    await expect(page.getByText('GIT_TOKEN')).toBeVisible();
  });
});

test.describe('MCP - Settings', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/mcp');
    await page.waitForLoadState('networkidle');
  });

  test('should display MCP settings', async ({ page }) => {
    await expect(page.getByLabel(/timeout/i)).toBeVisible();
    await expect(page.getByLabel(/retry attempts/i)).toBeVisible();
    await expect(page.getByLabel(/log level/i)).toBeVisible();
  });

  test('should show current settings values', async ({ page }) => {
    await expect(page.getByLabel(/timeout/i)).toHaveValue('30000');
    await expect(page.getByLabel(/retry attempts/i)).toHaveValue('3');
    await expect(page.getByLabel(/log level/i)).toHaveValue('info');
  });

  test('should update timeout', async ({ page }) => {
    await page.getByLabel(/timeout/i).fill('60000');
    await page.getByRole('button', { name: /save settings/i }).click();

    await expect(page.getByLabel(/timeout/i)).toHaveValue('60000');
  });

  test('should update retry attempts', async ({ page }) => {
    await page.getByLabel(/retry attempts/i).fill('5');
    await page.getByRole('button', { name: /save settings/i }).click();

    await expect(page.getByLabel(/retry attempts/i)).toHaveValue('5');
  });

  test('should update log level', async ({ page }) => {
    await page.getByLabel(/log level/i).selectOption('debug');
    await page.getByRole('button', { name: /save settings/i }).click();

    await expect(page.getByLabel(/log level/i)).toHaveValue('debug');
  });
});

test.describe('MCP - Sync Configuration', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/mcp');
    await page.waitForLoadState('networkidle');
  });

  test('should show sync options', async ({ page }) => {
    await expect(page.getByRole('button', { name: /sync from url/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /sync from file/i })).toBeVisible();
  });

  test('should open sync from URL modal', async ({ page }) => {
    await page.getByRole('button', { name: /sync from url/i }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByLabel(/url/i)).toBeVisible();
  });

  test('should sync from URL', async ({ page }) => {
    await page.getByRole('button', { name: /sync from url/i }).click();

    await page.getByLabel(/url/i).fill('https://example.com/mcp-config.json');
    await page.getByRole('button', { name: /sync/i }).click();

    // Should show success message
    await expect(page.getByText(/synced successfully/i)).toBeVisible();
  });

  test('should open sync from file modal', async ({ page }) => {
    await page.getByRole('button', { name: /sync from file/i }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByLabel(/file path/i)).toBeVisible();
  });

  test('should sync from local file', async ({ page }) => {
    await page.getByRole('button', { name: /sync from file/i }).click();

    await page.getByLabel(/file path/i).fill('/home/user/mcp-config.json');
    await page.getByRole('button', { name: /sync/i }).click();

    await expect(page.getByText(/synced successfully/i)).toBeVisible();
  });
});
