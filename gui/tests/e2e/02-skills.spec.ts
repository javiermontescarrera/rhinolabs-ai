import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Skills Management', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/skills');
    await page.waitForLoadState('networkidle');
  });

  test('should display skills page with heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /skills/i })).toBeVisible();
  });

  test('should list all skills', async ({ page }) => {
    await expect(page.getByText('rhinolabs-standards')).toBeVisible();
    await expect(page.getByText('react-patterns')).toBeVisible();
    await expect(page.getByText('typescript-best-practices')).toBeVisible();
    await expect(page.getByText('playwright')).toBeVisible();
  });

  test('should display skill categories', async ({ page }) => {
    await expect(page.getByText(/corporate/i)).toBeVisible();
    await expect(page.getByText(/frontend/i)).toBeVisible();
    await expect(page.getByText(/testing/i)).toBeVisible();
  });

  test('should show add skill button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /add skill/i })).toBeVisible();
  });

  test('should filter skills by category', async ({ page }) => {
    await page.getByRole('button', { name: /frontend/i }).click();

    await expect(page.getByText('react-patterns')).toBeVisible();
    await expect(page.getByText('typescript-best-practices')).toBeVisible();
    await expect(page.getByText('rhinolabs-standards')).not.toBeVisible();
  });

  test('should search skills by name', async ({ page }) => {
    await page.getByPlaceholder(/search/i).fill('react');

    await expect(page.getByText('react-patterns')).toBeVisible();
    await expect(page.getByText('typescript-best-practices')).not.toBeVisible();
  });
});

test.describe('Skills - View Skill', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/skills');
    await page.waitForLoadState('networkidle');
  });

  test('should open skill detail when clicking on skill', async ({ page }) => {
    await page.getByText('react-patterns').click();

    await expect(page.getByRole('heading', { name: /react-patterns/i })).toBeVisible();
    await expect(page.getByText(/react component composition/i)).toBeVisible();
  });

  test('should display skill content in detail view', async ({ page }) => {
    await page.getByText('react-patterns').click();

    await expect(page.getByTestId('skill-content')).toBeVisible();
  });

  test('should show back button in detail view', async ({ page }) => {
    await page.getByText('react-patterns').click();

    await expect(page.getByRole('button', { name: /back/i })).toBeVisible();

    await page.getByRole('button', { name: /back/i }).click();
    await expect(page.getByRole('heading', { name: /skills/i })).toBeVisible();
  });
});

test.describe('Skills - Toggle Enable/Disable', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/skills');
    await page.waitForLoadState('networkidle');
  });

  test('should show toggle switch for each skill', async ({ page }) => {
    const toggles = page.getByRole('switch');
    await expect(toggles).toHaveCount(4); // 4 skills in mock
  });

  test('should disable skill when toggle is clicked', async ({ page }) => {
    const skillRow = page.locator('[data-testid="skill-row-react-patterns"]');
    const toggle = skillRow.getByRole('switch');

    await expect(toggle).toBeChecked();
    await toggle.click();
    await expect(toggle).not.toBeChecked();
  });

  test('should show disabled indicator after disabling', async ({ page }) => {
    const skillRow = page.locator('[data-testid="skill-row-react-patterns"]');
    const toggle = skillRow.getByRole('switch');

    await toggle.click();
    await expect(skillRow).toHaveClass(/disabled/);
  });
});

test.describe('Skills - Create New Skill', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/skills');
    await page.waitForLoadState('networkidle');
  });

  test('should open create skill modal', async ({ page }) => {
    await page.getByRole('button', { name: /add skill/i }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: /create skill/i })).toBeVisible();
  });

  test('should show required fields in create modal', async ({ page }) => {
    await page.getByRole('button', { name: /add skill/i }).click();

    await expect(page.getByLabel(/id/i)).toBeVisible();
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/description/i)).toBeVisible();
    await expect(page.getByLabel(/category/i)).toBeVisible();
    await expect(page.getByLabel(/content/i)).toBeVisible();
  });

  test('should create new skill with valid data', async ({ page }) => {
    await page.getByRole('button', { name: /add skill/i }).click();

    await page.getByLabel(/id/i).fill('my-custom-skill');
    await page.getByLabel(/name/i).fill('My Custom Skill');
    await page.getByLabel(/description/i).fill('A custom skill for testing');
    await page.getByLabel(/category/i).selectOption('custom');
    await page.getByLabel(/content/i).fill('# My Custom Skill\n\nThis is the content.');

    await page.getByRole('button', { name: /create/i }).click();

    // Modal should close
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // New skill should appear in list
    await expect(page.getByText('My Custom Skill')).toBeVisible();
  });

  test('should show validation error for empty required fields', async ({ page }) => {
    await page.getByRole('button', { name: /add skill/i }).click();
    await page.getByRole('button', { name: /create/i }).click();

    await expect(page.getByText(/id is required/i)).toBeVisible();
  });

  test('should show error for duplicate skill id', async ({ page }) => {
    await page.getByRole('button', { name: /add skill/i }).click();

    await page.getByLabel(/id/i).fill('react-patterns'); // Already exists
    await page.getByLabel(/name/i).fill('Duplicate');
    await page.getByLabel(/description/i).fill('Test');
    await page.getByLabel(/category/i).selectOption('custom');
    await page.getByLabel(/content/i).fill('Content');

    await page.getByRole('button', { name: /create/i }).click();

    await expect(page.getByText(/already exists/i)).toBeVisible();
  });

  test('should cancel skill creation', async ({ page }) => {
    await page.getByRole('button', { name: /add skill/i }).click();
    await page.getByLabel(/id/i).fill('test-skill');

    await page.getByRole('button', { name: /cancel/i }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByText('test-skill')).not.toBeVisible();
  });
});

test.describe('Skills - Edit Skill', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/skills');
    await page.waitForLoadState('networkidle');
  });

  test('should show edit button for each skill', async ({ page }) => {
    const skillRow = page.locator('[data-testid="skill-row-react-patterns"]');
    await expect(skillRow.getByRole('button', { name: /edit/i })).toBeVisible();
  });

  test('should open edit modal with pre-filled data', async ({ page }) => {
    const skillRow = page.locator('[data-testid="skill-row-react-patterns"]');
    await skillRow.getByRole('button', { name: /edit/i }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByLabel(/name/i)).toHaveValue('react-patterns');
  });

  test('should update skill after editing', async ({ page }) => {
    const skillRow = page.locator('[data-testid="skill-row-react-patterns"]');
    await skillRow.getByRole('button', { name: /edit/i }).click();

    await page.getByLabel(/description/i).fill('Updated description');
    await page.getByRole('button', { name: /save/i }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByText('Updated description')).toBeVisible();
  });
});

test.describe('Skills - Delete Skill', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/skills');
    await page.waitForLoadState('networkidle');
  });

  test('should not show delete button for built-in skills', async ({ page }) => {
    const skillRow = page.locator('[data-testid="skill-row-react-patterns"]');
    await expect(skillRow.getByRole('button', { name: /delete/i })).not.toBeVisible();
  });

  test('should show delete button only for custom skills', async ({ page }) => {
    // First create a custom skill
    await page.getByRole('button', { name: /add skill/i }).click();
    await page.getByLabel(/id/i).fill('deletable-skill');
    await page.getByLabel(/name/i).fill('Deletable Skill');
    await page.getByLabel(/description/i).fill('This can be deleted');
    await page.getByLabel(/category/i).selectOption('custom');
    await page.getByLabel(/content/i).fill('Content');
    await page.getByRole('button', { name: /create/i }).click();

    // Now check delete button is visible
    const skillRow = page.locator('[data-testid="skill-row-deletable-skill"]');
    await expect(skillRow.getByRole('button', { name: /delete/i })).toBeVisible();
  });

  test('should show confirmation dialog before deleting', async ({ page }) => {
    // Create custom skill first
    await page.getByRole('button', { name: /add skill/i }).click();
    await page.getByLabel(/id/i).fill('to-delete');
    await page.getByLabel(/name/i).fill('To Delete');
    await page.getByLabel(/description/i).fill('Will be deleted');
    await page.getByLabel(/category/i).selectOption('custom');
    await page.getByLabel(/content/i).fill('Content');
    await page.getByRole('button', { name: /create/i }).click();

    // Click delete
    const skillRow = page.locator('[data-testid="skill-row-to-delete"]');
    await skillRow.getByRole('button', { name: /delete/i }).click();

    await expect(page.getByRole('alertdialog')).toBeVisible();
    await expect(page.getByText(/are you sure/i)).toBeVisible();
  });

  test('should delete skill after confirmation', async ({ page }) => {
    // Create custom skill
    await page.getByRole('button', { name: /add skill/i }).click();
    await page.getByLabel(/id/i).fill('will-delete');
    await page.getByLabel(/name/i).fill('Will Delete');
    await page.getByLabel(/description/i).fill('Bye');
    await page.getByLabel(/category/i).selectOption('custom');
    await page.getByLabel(/content/i).fill('Content');
    await page.getByRole('button', { name: /create/i }).click();

    // Delete it
    const skillRow = page.locator('[data-testid="skill-row-will-delete"]');
    await skillRow.getByRole('button', { name: /delete/i }).click();
    await page.getByRole('button', { name: /confirm/i }).click();

    // Should be gone
    await expect(page.getByText('Will Delete')).not.toBeVisible();
  });

  test('should cancel deletion', async ({ page }) => {
    // Create custom skill
    await page.getByRole('button', { name: /add skill/i }).click();
    await page.getByLabel(/id/i).fill('keep-me');
    await page.getByLabel(/name/i).fill('Keep Me');
    await page.getByLabel(/description/i).fill('Do not delete');
    await page.getByLabel(/category/i).selectOption('custom');
    await page.getByLabel(/content/i).fill('Content');
    await page.getByRole('button', { name: /create/i }).click();

    // Try to delete but cancel
    const skillRow = page.locator('[data-testid="skill-row-keep-me"]');
    await skillRow.getByRole('button', { name: /delete/i }).click();
    await page.getByRole('button', { name: /cancel/i }).click();

    // Should still be there
    await expect(page.getByText('Keep Me')).toBeVisible();
  });
});
