import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display dashboard with plugin status', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByText(/rhinolabs-claude/i)).toBeVisible();
    await expect(page.getByText(/v1.0.0/i)).toBeVisible();
  });

  test('should show installed status indicator', async ({ page }) => {
    await expect(page.getByTestId('status-installed')).toBeVisible();
    await expect(page.getByTestId('status-installed')).toContainText(/installed/i);
  });

  test('should display quick actions', async ({ page }) => {
    await expect(page.getByRole('button', { name: /update/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /run diagnostics/i })).toBeVisible();
  });

  test('should navigate to diagnostics when clicking run diagnostics', async ({ page }) => {
    await page.getByRole('button', { name: /run diagnostics/i }).click();
    await expect(page).toHaveURL(/diagnostics/);
  });

  test('should display diagnostics summary on dashboard', async ({ page }) => {
    await expect(page.getByTestId('diagnostics-summary')).toBeVisible();
    await expect(page.getByText(/6 passed/i)).toBeVisible();
  });

  test('should show Claude Code installation status', async ({ page }) => {
    await expect(page.getByText(/claude code/i)).toBeVisible();
    await expect(page.getByTestId('claude-code-status')).toContainText(/installed/i);
  });

  test('should show MCP configuration status', async ({ page }) => {
    await expect(page.getByTestId('mcp-status')).toContainText(/configured/i);
  });
});

test.describe('Dashboard - Uninstalled State', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    // Modify mock to simulate uninstalled state
    const modifiedMock = mockContent.replace(
      'isInstalled: true',
      'isInstalled: false'
    ).replace(
      "version: '1.0.0'",
      'version: null'
    );
    await page.addInitScript(modifiedMock);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should show install button when plugin not installed', async ({ page }) => {
    await expect(page.getByRole('button', { name: /install/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /update/i })).not.toBeVisible();
  });

  test('should show not installed status', async ({ page }) => {
    await expect(page.getByTestId('status-installed')).toContainText(/not installed/i);
  });
});
