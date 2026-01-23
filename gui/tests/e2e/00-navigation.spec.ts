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
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('should show app title in sidebar', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /rhinolabs/i })).toBeVisible();
  });

  test('should display all navigation links', async ({ page }) => {
    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /settings/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /output style/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /mcp/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /skills/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /instructions/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /diagnostics/i })).toBeVisible();
  });

  test('should highlight active link', async ({ page }) => {
    const dashboardLink = page.getByRole('link', { name: /dashboard/i });
    await expect(dashboardLink).toHaveClass(/active/);
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
    await page.getByRole('link', { name: /settings/i }).click();

    await expect(page).toHaveURL(/settings/);
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
  });

  test('should navigate to output style', async ({ page }) => {
    await page.getByRole('link', { name: /output style/i }).click();

    await expect(page).toHaveURL(/output-style/);
    await expect(page.getByRole('heading', { name: /output style/i })).toBeVisible();
  });

  test('should navigate to MCP', async ({ page }) => {
    await page.getByRole('link', { name: /mcp/i }).click();

    await expect(page).toHaveURL(/mcp/);
    await expect(page.getByRole('heading', { name: /mcp/i })).toBeVisible();
  });

  test('should navigate to skills', async ({ page }) => {
    await page.getByRole('link', { name: /skills/i }).click();

    await expect(page).toHaveURL(/skills/);
    await expect(page.getByRole('heading', { name: /skills/i })).toBeVisible();
  });

  test('should navigate to instructions', async ({ page }) => {
    await page.getByRole('link', { name: /instructions/i }).click();

    await expect(page).toHaveURL(/instructions/);
    await expect(page.getByRole('heading', { name: /instructions/i })).toBeVisible();
  });

  test('should navigate to diagnostics', async ({ page }) => {
    await page.getByRole('link', { name: /diagnostics/i }).click();

    await expect(page).toHaveURL(/diagnostics/);
    await expect(page.getByRole('heading', { name: /diagnostics/i })).toBeVisible();
  });

  test('should update active link on navigation', async ({ page }) => {
    await page.getByRole('link', { name: /skills/i }).click();

    const skillsLink = page.getByRole('link', { name: /skills/i });
    const dashboardLink = page.getByRole('link', { name: /dashboard/i });

    await expect(skillsLink).toHaveClass(/active/);
    await expect(dashboardLink).not.toHaveClass(/active/);
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

    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('should load settings directly', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
  });

  test('should load skills directly', async ({ page }) => {
    await page.goto('/skills');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /skills/i })).toBeVisible();
  });

  test('should load MCP directly', async ({ page }) => {
    await page.goto('/mcp');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /mcp/i })).toBeVisible();
  });

  test('should handle 404 for unknown routes', async ({ page }) => {
    await page.goto('/unknown-route');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/not found/i)).toBeVisible();
  });
});

test.describe('Navigation - Responsive', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
  });

  test('should show sidebar on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('should collapse sidebar on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Sidebar should be hidden by default on mobile
    await expect(page.getByRole('navigation')).not.toBeVisible();

    // Should have hamburger menu
    await expect(page.getByRole('button', { name: /menu/i })).toBeVisible();
  });

  test('should toggle sidebar on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /menu/i }).click();
    await expect(page.getByRole('navigation')).toBeVisible();

    await page.getByRole('button', { name: /close/i }).click();
    await expect(page.getByRole('navigation')).not.toBeVisible();
  });
});
