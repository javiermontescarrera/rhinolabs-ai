import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Output Style Page', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/output-style');
    await page.waitForLoadState('networkidle');
  });

  test('should display output style page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /output style/i })).toBeVisible();
  });

  test('should show current active style', async ({ page }) => {
    await expect(page.getByText(/active:/i)).toBeVisible();
    await expect(page.getByText('Rhinolabs')).toBeVisible();
  });

  test('should list available styles', async ({ page }) => {
    await expect(page.getByTestId('style-rhinolabs')).toBeVisible();
  });

  test('should show add style button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /add style/i })).toBeVisible();
  });
});

test.describe('Output Style - View Style', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/output-style');
    await page.waitForLoadState('networkidle');
  });

  test('should show style details when clicked', async ({ page }) => {
    await page.getByTestId('style-rhinolabs').click();

    await expect(page.getByText(/professional, helpful, and direct/i)).toBeVisible();
  });

  test('should display style content preview', async ({ page }) => {
    await page.getByTestId('style-rhinolabs').click();

    await expect(page.getByTestId('style-content-preview')).toBeVisible();
    await expect(page.getByText(/be helpful first/i)).toBeVisible();
  });

  test('should show keep coding instructions toggle state', async ({ page }) => {
    await page.getByTestId('style-rhinolabs').click();

    await expect(page.getByText(/keep coding instructions/i)).toBeVisible();
    await expect(page.getByTestId('keep-coding-instructions')).toBeChecked();
  });
});

test.describe('Output Style - Create Style', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/output-style');
    await page.waitForLoadState('networkidle');
  });

  test('should open create style modal', async ({ page }) => {
    await page.getByRole('button', { name: /add style/i }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: /create output style/i })).toBeVisible();
  });

  test('should show all required fields', async ({ page }) => {
    await page.getByRole('button', { name: /add style/i }).click();

    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/description/i)).toBeVisible();
    await expect(page.getByLabel(/keep coding instructions/i)).toBeVisible();
    await expect(page.getByLabel(/content/i)).toBeVisible();
  });

  test('should create new style', async ({ page }) => {
    await page.getByRole('button', { name: /add style/i }).click();

    await page.getByLabel(/name/i).fill('Custom Style');
    await page.getByLabel(/description/i).fill('My custom output style');
    await page.getByLabel(/content/i).fill('# Custom Style\n\nBe concise and direct.');

    await page.getByRole('button', { name: /create/i }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByText('Custom Style')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.getByRole('button', { name: /add style/i }).click();
    await page.getByRole('button', { name: /create/i }).click();

    await expect(page.getByText(/name is required/i)).toBeVisible();
  });
});

test.describe('Output Style - Edit Style', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/output-style');
    await page.waitForLoadState('networkidle');
  });

  test('should show edit button for each style', async ({ page }) => {
    const styleCard = page.getByTestId('style-rhinolabs');
    await expect(styleCard.getByRole('button', { name: /edit/i })).toBeVisible();
  });

  test('should open edit modal with pre-filled data', async ({ page }) => {
    const styleCard = page.getByTestId('style-rhinolabs');
    await styleCard.getByRole('button', { name: /edit/i }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByLabel(/name/i)).toHaveValue('Rhinolabs');
  });

  test('should update style after editing', async ({ page }) => {
    const styleCard = page.getByTestId('style-rhinolabs');
    await styleCard.getByRole('button', { name: /edit/i }).click();

    await page.getByLabel(/description/i).fill('Updated description for Rhinolabs style');
    await page.getByRole('button', { name: /save/i }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByText('Updated description for Rhinolabs style')).toBeVisible();
  });
});

test.describe('Output Style - Set Active', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/output-style');
    await page.waitForLoadState('networkidle');
  });

  test('should show set active button for non-active styles', async ({ page }) => {
    // First create a new style
    await page.getByRole('button', { name: /add style/i }).click();
    await page.getByLabel(/name/i).fill('Another Style');
    await page.getByLabel(/description/i).fill('Description');
    await page.getByLabel(/content/i).fill('Content');
    await page.getByRole('button', { name: /create/i }).click();

    const newStyleCard = page.getByTestId('style-another-style');
    await expect(newStyleCard.getByRole('button', { name: /set active/i })).toBeVisible();
  });

  test('should change active style', async ({ page }) => {
    // Create new style
    await page.getByRole('button', { name: /add style/i }).click();
    await page.getByLabel(/name/i).fill('New Active');
    await page.getByLabel(/description/i).fill('Will be active');
    await page.getByLabel(/content/i).fill('Content');
    await page.getByRole('button', { name: /create/i }).click();

    // Set as active
    const newStyleCard = page.getByTestId('style-new-active');
    await newStyleCard.getByRole('button', { name: /set active/i }).click();

    // Verify it's now active
    await expect(page.getByText(/active:/i).locator('..').getByText('New Active')).toBeVisible();
  });
});

test.describe('Output Style - Delete Style', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/output-style');
    await page.waitForLoadState('networkidle');
  });

  test('should show delete button for styles', async ({ page }) => {
    const styleCard = page.getByTestId('style-rhinolabs');
    await expect(styleCard.getByRole('button', { name: /delete/i })).toBeVisible();
  });

  test('should show confirmation before deleting', async ({ page }) => {
    const styleCard = page.getByTestId('style-rhinolabs');
    await styleCard.getByRole('button', { name: /delete/i }).click();

    await expect(page.getByRole('alertdialog')).toBeVisible();
    await expect(page.getByText(/are you sure/i)).toBeVisible();
  });

  test('should delete style after confirmation', async ({ page }) => {
    // Create a style to delete
    await page.getByRole('button', { name: /add style/i }).click();
    await page.getByLabel(/name/i).fill('To Delete');
    await page.getByLabel(/description/i).fill('Will be deleted');
    await page.getByLabel(/content/i).fill('Content');
    await page.getByRole('button', { name: /create/i }).click();

    // Delete it
    const styleCard = page.getByTestId('style-to-delete');
    await styleCard.getByRole('button', { name: /delete/i }).click();
    await page.getByRole('button', { name: /confirm/i }).click();

    await expect(page.getByTestId('style-to-delete')).not.toBeVisible();
  });
});
