import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Diagnostics Page', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/diagnostics');
    await page.waitForLoadState('networkidle');
  });

  test('should display diagnostics page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /diagnostics/i, level: 1 })).toBeVisible();
  });

  test('should show run diagnostics button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /run diagnostics/i })).toBeVisible();
  });

  test('should display summary section with passed/warnings/failed', async ({ page }) => {
    await expect(page.locator('.summary-grid')).toBeVisible();
    // Use .label class to avoid matching headings and other text
    await expect(page.locator('.summary-box .label').filter({ hasText: 'Passed' })).toBeVisible();
    await expect(page.locator('.summary-box .label').filter({ hasText: 'Warnings' })).toBeVisible();
    await expect(page.locator('.summary-box .label').filter({ hasText: 'Failed' })).toBeVisible();
  });
});

test.describe('Diagnostics - Run Checks', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/diagnostics');
    await page.waitForLoadState('networkidle');
  });

  test('should show running state when button clicked', async ({ page }) => {
    // The diagnostics run automatically on load, but we can click to run again
    await page.getByRole('button', { name: /run diagnostics/i }).click();
    // Button should show "Running..." while in progress
    await expect(page.getByRole('button', { name: /running/i })).toBeVisible();
  });

  test('should display all check results', async ({ page }) => {
    // Results should be visible after auto-run on page load
    await expect(page.getByRole('heading', { name: 'Check Results' })).toBeVisible();
    // Use heading role to avoid matching the message text
    await expect(page.getByRole('heading', { name: 'Claude Code Installation', level: 4 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Plugin Installation', level: 4 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Node.js', level: 4 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Git', level: 4 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'MCP Configuration', level: 4 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Updates', level: 4 })).toBeVisible();
  });

  test('should show check status badges', async ({ page }) => {
    // All checks pass in mock, so all should have success status
    const passBadges = page.locator('.status-badge.success');
    await expect(passBadges).toHaveCount(6);
  });

  test('should show check messages', async ({ page }) => {
    await expect(page.getByText('Claude Code is installed')).toBeVisible();
    await expect(page.getByText('Plugin v1.0.0 installed')).toBeVisible();
  });
});

test.describe('Diagnostics - Summary', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/diagnostics');
    await page.waitForLoadState('networkidle');
  });

  test('should show passed count', async ({ page }) => {
    const passedBox = page.locator('.summary-box.success');
    await expect(passedBox.locator('.value')).toHaveText('6');
  });

  test('should show failed count', async ({ page }) => {
    const failedBox = page.locator('.summary-box.error');
    await expect(failedBox.locator('.value')).toHaveText('0');
  });

  test('should show warnings count', async ({ page }) => {
    const warningsBox = page.locator('.summary-box.warning');
    await expect(warningsBox.locator('.value')).toHaveText('0');
  });

  test('should show overall status as all passed when no failures', async ({ page }) => {
    await expect(page.getByText('All checks passed!')).toBeVisible();
  });
});

test.describe('Diagnostics - With Failures', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    // Modify mock to simulate failures
    const modifiedMock = mockContent.replace(
      `{ name: 'Claude Code Installation', status: 'Pass', message: 'Claude Code is installed' }`,
      `{ name: 'Claude Code Installation', status: 'Fail', message: 'Claude Code not found' }`
    ).replace(
      `{ name: 'Node.js', status: 'Pass', message: 'Node.js detected' }`,
      `{ name: 'Node.js', status: 'Warning', message: 'Node.js version outdated' }`
    ).replace(
      'passed: 6',
      'passed: 4'
    ).replace(
      'failed: 0',
      'failed: 1'
    ).replace(
      'warnings: 0',
      'warnings: 1'
    );
    await page.addInitScript(modifiedMock);
    await page.goto('/diagnostics');
    await page.waitForLoadState('networkidle');
  });

  test('should show failed checks section', async ({ page }) => {
    // Failed section should appear with red heading
    await expect(page.getByRole('heading', { name: 'Failed' })).toBeVisible();
    await expect(page.getByText('Claude Code Installation')).toBeVisible();
  });

  test('should show warning checks section', async ({ page }) => {
    // Warnings section should appear
    await expect(page.getByRole('heading', { name: 'Warnings' })).toBeVisible();
    // Use heading role to avoid matching the message text
    await expect(page.getByRole('heading', { name: 'Node.js', level: 4 })).toBeVisible();
  });

  test('should show overall status with failure count', async ({ page }) => {
    await expect(page.getByText(/1 check failed/i)).toBeVisible();
  });

  test('should show error message for failed checks', async ({ page }) => {
    await expect(page.getByText('Claude Code not found')).toBeVisible();
  });

  test('should show warning message for warning checks', async ({ page }) => {
    await expect(page.getByText('Node.js version outdated')).toBeVisible();
  });
});
