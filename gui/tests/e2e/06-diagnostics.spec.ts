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
    await expect(page.getByRole('heading', { name: /diagnostics/i })).toBeVisible();
  });

  test('should show run diagnostics button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /run diagnostics/i })).toBeVisible();
  });

  test('should display summary section', async ({ page }) => {
    await expect(page.getByTestId('diagnostics-summary')).toBeVisible();
  });
});

test.describe('Diagnostics - Run Checks', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/diagnostics');
    await page.waitForLoadState('networkidle');
  });

  test('should run diagnostics when button clicked', async ({ page }) => {
    await page.getByRole('button', { name: /run diagnostics/i }).click();

    // Should show loading state
    await expect(page.getByText(/running/i)).toBeVisible();

    // Should complete and show results
    await expect(page.getByTestId('check-results')).toBeVisible();
  });

  test('should display all check results', async ({ page }) => {
    await page.getByRole('button', { name: /run diagnostics/i }).click();

    await expect(page.getByText('Claude Code Installation')).toBeVisible();
    await expect(page.getByText('Plugin Installation')).toBeVisible();
    await expect(page.getByText('Node.js')).toBeVisible();
    await expect(page.getByText('Git')).toBeVisible();
    await expect(page.getByText('MCP Configuration')).toBeVisible();
    await expect(page.getByText('Updates')).toBeVisible();
  });

  test('should show check status icons', async ({ page }) => {
    await page.getByRole('button', { name: /run diagnostics/i }).click();

    // All checks should pass in mock
    const passIcons = page.getByTestId('status-pass');
    await expect(passIcons).toHaveCount(6);
  });

  test('should show check messages', async ({ page }) => {
    await page.getByRole('button', { name: /run diagnostics/i }).click();

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
    await page.getByRole('button', { name: /run diagnostics/i }).click();

    await expect(page.getByTestId('passed-count')).toContainText('6');
  });

  test('should show failed count', async ({ page }) => {
    await page.getByRole('button', { name: /run diagnostics/i }).click();

    await expect(page.getByTestId('failed-count')).toContainText('0');
  });

  test('should show warnings count', async ({ page }) => {
    await page.getByRole('button', { name: /run diagnostics/i }).click();

    await expect(page.getByTestId('warnings-count')).toContainText('0');
  });

  test('should show overall status as healthy when all pass', async ({ page }) => {
    await page.getByRole('button', { name: /run diagnostics/i }).click();

    await expect(page.getByTestId('overall-status')).toContainText(/healthy/i);
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
      `{ name: 'Node.js', status: 'Warning', message: 'Node.js not found' }`
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

  test('should show failed checks with error styling', async ({ page }) => {
    await page.getByRole('button', { name: /run diagnostics/i }).click();

    const failedCheck = page.locator('[data-testid="check-result"]').filter({ hasText: 'Claude Code Installation' });
    await expect(failedCheck.getByTestId('status-fail')).toBeVisible();
  });

  test('should show warning checks with warning styling', async ({ page }) => {
    await page.getByRole('button', { name: /run diagnostics/i }).click();

    const warningCheck = page.locator('[data-testid="check-result"]').filter({ hasText: 'Node.js' });
    await expect(warningCheck.getByTestId('status-warning')).toBeVisible();
  });

  test('should show overall status as issues found', async ({ page }) => {
    await page.getByRole('button', { name: /run diagnostics/i }).click();

    await expect(page.getByTestId('overall-status')).toContainText(/issues found/i);
  });

  test('should show action suggestions for failed checks', async ({ page }) => {
    await page.getByRole('button', { name: /run diagnostics/i }).click();

    const failedCheck = page.locator('[data-testid="check-result"]').filter({ hasText: 'Claude Code Installation' });
    await expect(failedCheck.getByText(/not found/i)).toBeVisible();
  });
});
