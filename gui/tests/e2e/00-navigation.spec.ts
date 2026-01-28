import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display sidebar navigation', async ({ page }) => {
    await expect(page.locator('nav.sidebar')).toBeVisible();
  });

  test('should show app title in sidebar', async ({ page }) => {
    await expect(page.locator('nav.sidebar h1')).toHaveText('Rhinolabs AI');
  });

  test('should display all navigation links', async ({ page }) => {
    const sidebar = page.locator('nav.sidebar');
    await expect(sidebar.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Skills' })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Profiles' })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'MCP' })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Output Style' })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Settings' })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Diagnostics' })).toBeVisible();
  });

  test('should highlight active link on dashboard', async ({ page }) => {
    const sidebar = page.locator('nav.sidebar');
    await expect(sidebar.getByRole('link', { name: 'Dashboard' })).toHaveClass(/active/);
  });
});

test.describe('Navigation - Route Changes', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to settings', async ({ page }) => {
    const sidebar = page.locator('nav.sidebar');
    await sidebar.getByRole('link', { name: 'Settings' }).click();

    await expect(page).toHaveURL(/settings/);
    await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
  });

  test('should navigate to output style', async ({ page }) => {
    const sidebar = page.locator('nav.sidebar');
    await sidebar.getByRole('link', { name: 'Output Style' }).click();

    await expect(page).toHaveURL(/output-style/);
    await expect(page.getByRole('heading', { name: /output style/i, level: 1 })).toBeVisible();
  });

  test('should navigate to MCP', async ({ page }) => {
    const sidebar = page.locator('nav.sidebar');
    await sidebar.getByRole('link', { name: 'MCP' }).click();

    await expect(page).toHaveURL(/mcp/);
    await expect(page.getByRole('heading', { name: 'MCP Servers', level: 1 })).toBeVisible();
  });

  test('should navigate to skills', async ({ page }) => {
    const sidebar = page.locator('nav.sidebar');
    await sidebar.getByRole('link', { name: 'Skills' }).click();

    await expect(page).toHaveURL(/skills/);
    await expect(page.getByRole('heading', { name: 'Skills', level: 1 })).toBeVisible();
  });

  test('should navigate to profiles', async ({ page }) => {
    const sidebar = page.locator('nav.sidebar');
    await sidebar.getByRole('link', { name: 'Profiles' }).click();

    await expect(page).toHaveURL(/profiles/);
    await expect(page.getByRole('heading', { name: 'Profiles', level: 1 })).toBeVisible();
  });

  test('should navigate to diagnostics', async ({ page }) => {
    const sidebar = page.locator('nav.sidebar');
    await sidebar.getByRole('link', { name: 'Diagnostics' }).click();

    await expect(page).toHaveURL(/diagnostics/);
    await expect(page.getByRole('heading', { name: 'Diagnostics', level: 1 })).toBeVisible();
  });

  test('should update active link on navigation', async ({ page }) => {
    const sidebar = page.locator('nav.sidebar');
    await sidebar.getByRole('link', { name: 'Skills' }).click();

    await expect(sidebar.getByRole('link', { name: 'Skills' })).toHaveClass(/active/);
    await expect(sidebar.getByRole('link', { name: 'Dashboard' })).not.toHaveClass(/active/);
  });
});

test.describe('Navigation - Direct URL Access', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
  });

  test('should load dashboard directly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible();
  });

  test('should load settings directly', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
  });

  test('should load skills directly', async ({ page }) => {
    await page.goto('/skills');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Skills', level: 1 })).toBeVisible();
  });

  test('should load profiles directly', async ({ page }) => {
    await page.goto('/profiles');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Profiles', level: 1 })).toBeVisible();
  });

  test('should load MCP directly', async ({ page }) => {
    await page.goto('/mcp');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'MCP Servers', level: 1 })).toBeVisible();
  });

  test('should handle 404 for unknown routes', async ({ page }) => {
    await page.goto('/unknown-route');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/not found/i)).toBeVisible();
  });
});

test.describe('Navigation - Mobile Responsive', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should show menu toggle button', async ({ page }) => {
    await expect(page.locator('.menu-toggle')).toBeVisible();
  });

  test('should toggle sidebar when menu button clicked', async ({ page }) => {
    const sidebar = page.locator('nav.sidebar');
    const menuToggle = page.locator('.menu-toggle');

    // Open sidebar
    await menuToggle.click();
    await expect(sidebar).toHaveClass(/open/);

    // Close sidebar
    await menuToggle.click();
    await expect(sidebar).not.toHaveClass(/open/);
  });

  test('should close sidebar after navigation', async ({ page }) => {
    const sidebar = page.locator('nav.sidebar');
    const menuToggle = page.locator('.menu-toggle');

    // Open sidebar
    await menuToggle.click();
    await expect(sidebar).toHaveClass(/open/);

    // Navigate
    await sidebar.getByRole('link', { name: 'Skills' }).click();

    // Sidebar should close
    await expect(sidebar).not.toHaveClass(/open/);
    await expect(page).toHaveURL(/skills/);
  });
});
