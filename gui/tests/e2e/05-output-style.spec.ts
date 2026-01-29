import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to navigate to Output Style tab in Main Profile
async function navigateToOutputStyle(page: import('@playwright/test').Page) {
  const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
  await page.addInitScript(mockContent);
  await page.goto('/profiles');
  await page.waitForLoadState('networkidle');

  // Click Edit on Main Profile
  const mainProfile = page.locator('.list-item').filter({ hasText: 'Main Profile' });
  await mainProfile.getByRole('button', { name: /edit/i }).click();

  // Click Output Style tab
  await page.getByRole('button', { name: /output style/i }).click();
}

test.describe('Output Style Tab (Main Profile)', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToOutputStyle(page);
  });

  test('should show Output Style tab only for main profile', async ({ page }) => {
    await expect(page.getByRole('button', { name: /output style/i })).toBeVisible();
  });

  test('should display style name', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /rhinolabs/i, level: 3 })).toBeVisible();
  });

  test('should display style description', async ({ page }) => {
    await expect(page.getByText(/professional, helpful, and direct/i)).toBeVisible();
  });

  test('should show Edit button', async ({ page }) => {
    const card = page.locator('.card').first();
    await expect(card.getByRole('button', { name: /edit/i })).toBeVisible();
  });

  test('should display keepCodingInstructions setting', async ({ page }) => {
    await expect(page.getByText(/keep coding instructions/i)).toBeVisible();
  });

  test('should display style content with syntax highlighting', async ({ page }) => {
    const codeBlock = page.locator('pre').first();
    await expect(codeBlock).toBeVisible();
  });

  test('should show Quick Reference section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /quick reference/i })).toBeVisible();
  });
});

test.describe('Output Style - Edit in IDE', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToOutputStyle(page);
  });

  test('should open output style in IDE when Edit is clicked', async ({ page }) => {
    const logs: string[] = [];
    page.on('console', (msg) => {
      if (msg.text().includes('TauriMock')) {
        logs.push(msg.text());
      }
    });

    const card = page.locator('.card').first();
    await card.getByRole('button', { name: /edit/i }).click();

    await expect(page.getByText(/opened in/i)).toBeVisible();
    expect(logs.some((log) => log.includes('open_output_style_in_ide'))).toBe(true);
  });
});

test.describe('Output Style - Not Available for Other Profiles', () => {
  test('should not show Output Style tab for project profiles', async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/profiles');
    await page.waitForLoadState('networkidle');

    // Click Edit on React 19 Stack (project profile)
    const projectProfile = page.locator('.list-item').filter({ hasText: 'React 19 Stack' });
    await projectProfile.getByRole('button', { name: /edit/i }).click();

    // Output Style tab should NOT be visible
    await expect(page.getByRole('button', { name: /^output style$/i })).not.toBeVisible();
  });
});
