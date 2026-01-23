import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Instructions Page', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/instructions');
    await page.waitForLoadState('networkidle');
  });

  test('should display instructions page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /instructions/i })).toBeVisible();
  });

  test('should show CLAUDE.md content', async ({ page }) => {
    await expect(page.getByTestId('instructions-editor')).toBeVisible();
    await expect(page.getByText(/NEVER add Co-Authored-By/i)).toBeVisible();
  });

  test('should show last modified date', async ({ page }) => {
    await expect(page.getByTestId('last-modified')).toBeVisible();
    await expect(page.getByText(/2026/)).toBeVisible();
  });

  test('should have save button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /save/i })).toBeVisible();
  });
});

test.describe('Instructions - Edit Content', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/instructions');
    await page.waitForLoadState('networkidle');
  });

  test('should allow editing instructions', async ({ page }) => {
    const editor = page.getByTestId('instructions-editor');
    await editor.click();

    // Clear and type new content
    await editor.fill('# New Instructions\n\nThese are updated instructions.');

    await expect(editor).toContainText('New Instructions');
  });

  test('should save changes', async ({ page }) => {
    const editor = page.getByTestId('instructions-editor');
    await editor.fill('# Updated Instructions\n\nNew content here.');

    await page.getByRole('button', { name: /save/i }).click();

    // Should show success notification
    await expect(page.getByText(/saved successfully/i)).toBeVisible();
  });

  test('should update last modified after save', async ({ page }) => {
    const editor = page.getByTestId('instructions-editor');
    await editor.fill('# Modified Instructions');

    await page.getByRole('button', { name: /save/i }).click();

    // Last modified should update
    await expect(page.getByTestId('last-modified')).toContainText(/2026-01-23/);
  });

  test('should show unsaved changes indicator', async ({ page }) => {
    const editor = page.getByTestId('instructions-editor');
    await editor.fill('# Modified');

    await expect(page.getByTestId('unsaved-indicator')).toBeVisible();
  });

  test('should warn before leaving with unsaved changes', async ({ page }) => {
    const editor = page.getByTestId('instructions-editor');
    await editor.fill('# Modified content');

    // Try to navigate away
    page.on('dialog', async (dialog) => {
      expect(dialog.type()).toBe('beforeunload');
      await dialog.dismiss();
    });

    await page.getByRole('link', { name: /dashboard/i }).click();

    // Should show warning
    await expect(page.getByRole('alertdialog')).toBeVisible();
  });

  test('should discard changes when confirmed', async ({ page }) => {
    const editor = page.getByTestId('instructions-editor');
    await editor.fill('# Temporary changes');

    await page.getByRole('button', { name: /discard/i }).click();

    await expect(page.getByRole('alertdialog')).toBeVisible();
    await page.getByRole('button', { name: /confirm/i }).click();

    // Should revert to original content
    await expect(editor).toContainText('NEVER add Co-Authored-By');
  });
});

test.describe('Instructions - Preview', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/instructions');
    await page.waitForLoadState('networkidle');
  });

  test('should have preview toggle', async ({ page }) => {
    await expect(page.getByRole('button', { name: /preview/i })).toBeVisible();
  });

  test('should show markdown preview when toggled', async ({ page }) => {
    await page.getByRole('button', { name: /preview/i }).click();

    await expect(page.getByTestId('instructions-preview')).toBeVisible();
    await expect(page.getByRole('heading', { name: /instructions/i, level: 1 })).toBeVisible();
  });

  test('should toggle back to editor', async ({ page }) => {
    await page.getByRole('button', { name: /preview/i }).click();
    await page.getByRole('button', { name: /edit/i }).click();

    await expect(page.getByTestId('instructions-editor')).toBeVisible();
  });
});

test.describe('Instructions - Validation', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/instructions');
    await page.waitForLoadState('networkidle');
  });

  test('should prevent saving empty content', async ({ page }) => {
    const editor = page.getByTestId('instructions-editor');
    await editor.fill('');

    await page.getByRole('button', { name: /save/i }).click();

    await expect(page.getByText(/content cannot be empty/i)).toBeVisible();
  });

  test('should show character count', async ({ page }) => {
    await expect(page.getByTestId('char-count')).toBeVisible();
  });
});
