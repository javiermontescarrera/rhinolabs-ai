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

  test('should display dashboard heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible();
  });

  test('should display plugin info card', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Plugin' })).toBeVisible();
    await expect(page.getByText('rhinolabs-claude')).toBeVisible();
  });

  test('should display plugin version', async ({ page }) => {
    await expect(page.getByText('Version')).toBeVisible();
    await expect(page.getByText('1.0.0').first()).toBeVisible();
  });
});

test.describe('Dashboard - Configuration Summary', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display configuration section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Configuration' })).toBeVisible();
  });

  test('should display profiles count', async ({ page }) => {
    // Mock has 2 profiles (main, react-stack)
    const profilesBox = page.locator('a.summary-box').filter({ hasText: 'Profiles' });
    await expect(profilesBox).toBeVisible();
    await expect(profilesBox.locator('.value')).toHaveText('2');
  });

  test('should display total skills count', async ({ page }) => {
    // Mock has 4 skills - use label text to avoid matching "Enabled Skills"
    const skillsBox = page.locator('a.summary-box').filter({ has: page.locator('.label', { hasText: 'Skills' }).filter({ hasNotText: 'Enabled' }) });
    await expect(skillsBox.first()).toBeVisible();
    await expect(skillsBox.first().locator('.value')).toHaveText('4');
  });

  test('should display enabled skills count', async ({ page }) => {
    const enabledBox = page.locator('a.summary-box').filter({ hasText: 'Enabled Skills' });
    await expect(enabledBox).toBeVisible();
  });

  test('should navigate to profiles page when clicking profiles count', async ({ page }) => {
    const profilesLink = page.locator('a.summary-box').filter({ hasText: 'Profiles' });
    await profilesLink.click();
    await expect(page).toHaveURL(/profiles/);
  });

  test('should navigate to skills page when clicking skills count', async ({ page }) => {
    // Use label to find the Skills box (not "Enabled Skills")
    const skillsLink = page.locator('a.summary-box').filter({ has: page.locator('.label', { hasText: 'Skills' }).filter({ hasNotText: 'Enabled' }) }).first();
    await skillsLink.click();
    await expect(page).toHaveURL(/skills/);
  });
});

test.describe('Dashboard - Project Status', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display project status section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Project Status' })).toBeVisible();
  });

  test('should display GitHub repository status', async ({ page }) => {
    await expect(page.getByText('GitHub Repository')).toBeVisible();
  });

  test('should display Git repository status', async ({ page }) => {
    await expect(page.getByText('Git Repository')).toBeVisible();
  });
});

test.describe('Dashboard - Diagnostics', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display diagnostics section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Diagnostics' })).toBeVisible();
  });

  test('should display passed count', async ({ page }) => {
    const passedBox = page.locator('.summary-box.success').filter({ hasText: 'Passed' });
    await expect(passedBox).toBeVisible();
    await expect(passedBox.locator('.value')).toHaveText('6');
  });

  test('should display warnings count', async ({ page }) => {
    const warningsBox = page.locator('.summary-box.warning').filter({ hasText: 'Warnings' });
    await expect(warningsBox).toBeVisible();
    await expect(warningsBox.locator('.value')).toHaveText('0');
  });

  test('should display failed count', async ({ page }) => {
    const failedBox = page.locator('.summary-box.error').filter({ hasText: 'Failed' });
    await expect(failedBox).toBeVisible();
    await expect(failedBox.locator('.value')).toHaveText('0');
  });

  test('should show link to diagnostics when there are failed checks', async ({ page }) => {
    // Modify mock to return failed checks
    await page.addInitScript(() => {
      const originalInvoke = (window as any).__TAURI_INTERNALS__.invoke;
      (window as any).__TAURI_INTERNALS__.invoke = async (cmd: string, args?: unknown) => {
        if (cmd === 'run_diagnostics') {
          return {
            passed: 5,
            warnings: 0,
            failed: 4,
            checks: [
              { name: 'Check 1', status: 'Fail', message: 'Issue 1' },
              { name: 'Check 2', status: 'Fail', message: 'Issue 2' },
              { name: 'Check 3', status: 'Fail', message: 'Issue 3' },
              { name: 'Check 4', status: 'Fail', message: 'Issue 4' },
              { name: 'Check 5', status: 'Pass', message: 'OK' },
            ],
          };
        }
        return originalInvoke(cmd, args);
      };
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should show "View all X issues" link
    const issuesLink = page.getByRole('link', { name: /view all.*issues/i });
    await expect(issuesLink).toBeVisible();
    await issuesLink.click();
    await expect(page).toHaveURL(/diagnostics/);
  });
});
