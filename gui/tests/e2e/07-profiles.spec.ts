import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Profiles Management - List View', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/profiles');
    await page.waitForLoadState('networkidle');
  });

  test('should display profiles page with heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Profiles', level: 1 })).toBeVisible();
  });

  test('should display page description', async ({ page }) => {
    await expect(page.getByText(/organize skills into reusable profiles/i)).toBeVisible();
  });

  test('should show create profile button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /create profile/i })).toBeVisible();
  });

  test('should list all profiles with Main Profile first', async ({ page }) => {
    await expect(page.getByText('Main Profile').first()).toBeVisible();
    await expect(page.getByText('React 19 Stack').first()).toBeVisible();
  });

  test('should display profile type badges', async ({ page }) => {
    await expect(page.locator('.badge').filter({ hasText: /^project$/i }).first()).toBeVisible();
    await expect(page.locator('.badge').filter({ hasText: /^user$/i }).first()).toBeVisible();
  });

  test('should display default badge for default user profile', async ({ page }) => {
    await expect(page.getByText('Default').first()).toBeVisible();
  });

  test('should display how profiles work info', async ({ page }) => {
    await expect(page.getByText('How Profiles Work').first()).toBeVisible();
    await expect(page.getByText(/user profiles/i).first()).toBeVisible();
    await expect(page.getByText(/project profiles/i).first()).toBeVisible();
  });

  test('should display CLI usage example', async ({ page }) => {
    await expect(page.getByText(/rhinolabs profile install/i)).toBeVisible();
  });

  test('should not show delete button for Main Profile', async ({ page }) => {
    const mainProfileRow = page.locator('.list-item').filter({ hasText: 'Main Profile' });
    await expect(mainProfileRow).toBeVisible();
    await expect(mainProfileRow.getByRole('button', { name: /delete/i })).not.toBeVisible();
  });
});

test.describe('Profiles - Create Profile', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/profiles');
    await page.waitForLoadState('networkidle');
  });

  test('should open create profile form with tabs', async ({ page }) => {
    await page.getByRole('button', { name: /create profile/i }).click();

    await expect(page.getByRole('heading', { name: 'Create Profile' })).toBeVisible();
    // Should show Basic Info and Skills tabs (not Instructions - that's only in edit mode)
    await expect(page.getByRole('button', { name: /basic info/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /skills/i })).toBeVisible();
    // Instructions tab should NOT be visible in create mode
    await expect(page.getByRole('button', { name: /instructions/i })).not.toBeVisible();
  });

  test('should display create and cancel buttons in header', async ({ page }) => {
    await page.getByRole('button', { name: /create profile/i }).click();

    // Buttons should be in the header
    await expect(page.getByRole('button', { name: /^create$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible();
  });

  test('should show basic info form fields', async ({ page }) => {
    await page.getByRole('button', { name: /create profile/i }).click();

    await expect(page.getByPlaceholder('react-stack')).toBeVisible();
    await expect(page.getByPlaceholder('React 19 Stack')).toBeVisible();
    await expect(page.getByPlaceholder(/skills for/i)).toBeVisible();
  });

  test('should allow assigning skills during creation', async ({ page }) => {
    await page.getByRole('button', { name: /create profile/i }).click();

    // Switch to Skills tab
    await page.getByRole('button', { name: /skills/i }).click();

    // Should see skills checkboxes
    await expect(page.getByRole('checkbox')).toHaveCount(4); // 4 skills in mock
  });

  test('should create new profile with skills', async ({ page }) => {
    await page.getByRole('button', { name: /create profile/i }).click();

    // Fill basic info
    await page.getByPlaceholder('react-stack').fill('test-profile');
    await page.getByPlaceholder('React 19 Stack').fill('Test Profile');
    await page.getByPlaceholder(/skills for/i).fill('A test profile description');

    // Switch to Skills tab and select skills
    await page.getByRole('button', { name: /skills/i }).click();
    const reactCheckbox = page.locator('label', { hasText: 'react-patterns' }).getByRole('checkbox');
    await reactCheckbox.click();

    // Click Create button
    await page.getByRole('button', { name: /^create$/i }).click();

    // Should show success and return to list - use exact match to avoid matching description
    await expect(page.getByText('Test Profile', { exact: true })).toBeVisible();
  });

  test('should cancel profile creation', async ({ page }) => {
    await page.getByRole('button', { name: /create profile/i }).click();
    await page.getByRole('button', { name: /cancel/i }).click();

    // Should return to list view
    await expect(page.getByPlaceholder('react-stack')).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'Profiles', level: 1 })).toBeVisible();
  });
});

test.describe('Profiles - Edit Profile', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/profiles');
    await page.waitForLoadState('networkidle');
  });

  test('should open edit form for profile', async ({ page }) => {
    const profileRow = page.locator('.list-item').filter({ hasText: 'React 19 Stack' });
    await profileRow.getByRole('button', { name: /edit/i }).click();

    await expect(page.getByRole('heading', { name: /edit: react 19 stack/i })).toBeVisible();
  });

  test('should display all tabs in edit mode', async ({ page }) => {
    const profileRow = page.locator('.list-item').filter({ hasText: 'React 19 Stack' });
    await profileRow.getByRole('button', { name: /edit/i }).click();

    // Edit mode should show Basic Info, Skills, AND Instructions tabs
    await expect(page.getByRole('button', { name: /basic info/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /skills/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /instructions/i })).toBeVisible();
  });

  test('should display save and close buttons in header', async ({ page }) => {
    const profileRow = page.locator('.list-item').filter({ hasText: 'React 19 Stack' });
    await profileRow.getByRole('button', { name: /edit/i }).click();

    await expect(page.getByRole('button', { name: /^save$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /close/i })).toBeVisible();
  });

  test('should show profile data in basic info tab', async ({ page }) => {
    const profileRow = page.locator('.list-item').filter({ hasText: 'React 19 Stack' });
    await profileRow.getByRole('button', { name: /edit/i }).click();

    await expect(page.getByPlaceholder('React 19 Stack')).toHaveValue('React 19 Stack');
    // ID field should be disabled
    await expect(page.getByPlaceholder('react-stack')).toBeDisabled();
  });

  test('should update profile', async ({ page }) => {
    const profileRow = page.locator('.list-item').filter({ hasText: 'React 19 Stack' });
    await profileRow.getByRole('button', { name: /edit/i }).click();

    // Clear and fill the name field
    const nameInput = page.getByPlaceholder('React 19 Stack');
    await nameInput.clear();
    await nameInput.fill('Updated React Stack');
    await page.getByRole('button', { name: /^save$/i }).click();

    // Should show success and update in list
    await expect(page.getByText(/profile updated/i)).toBeVisible();
  });

  test('should close edit mode', async ({ page }) => {
    const profileRow = page.locator('.list-item').filter({ hasText: 'React 19 Stack' });
    await profileRow.getByRole('button', { name: /edit/i }).click();
    await page.getByRole('button', { name: /close/i }).click();

    // Should return to list view
    await expect(page.getByRole('heading', { name: 'Profiles', level: 1 })).toBeVisible();
  });
});

test.describe('Profiles - Skill Assignment (Edit Mode)', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/profiles');
    await page.waitForLoadState('networkidle');

    // Open edit mode for React 19 Stack
    const profileRow = page.locator('.list-item').filter({ hasText: 'React 19 Stack' });
    await profileRow.getByRole('button', { name: /edit/i }).click();
    // Go to Skills tab
    await page.getByRole('button', { name: /skills/i }).click();
  });

  test('should display skill checkboxes in skills tab', async ({ page }) => {
    await expect(page.getByRole('checkbox')).toHaveCount(4); // 4 skills in mock
  });

  test('should show pre-selected skills for profile', async ({ page }) => {
    // react-patterns and typescript-best-practices should be checked
    const reactCheckbox = page.locator('label', { hasText: 'react-patterns' }).getByRole('checkbox');
    const tsCheckbox = page.locator('label', { hasText: 'typescript-best-practices' }).getByRole('checkbox');

    await expect(reactCheckbox).toBeChecked();
    await expect(tsCheckbox).toBeChecked();
  });

  test('should toggle skill assignment', async ({ page }) => {
    const playwrightCheckbox = page.locator('label', { hasText: 'playwright' }).getByRole('checkbox');

    await expect(playwrightCheckbox).not.toBeChecked();
    await playwrightCheckbox.click();
    await expect(playwrightCheckbox).toBeChecked();
  });

  test('should show Save Skills button in edit mode', async ({ page }) => {
    await expect(page.getByRole('button', { name: /save skills/i })).toBeVisible();
  });

  test('should save skill assignment', async ({ page }) => {
    const playwrightCheckbox = page.locator('label', { hasText: 'playwright' }).getByRole('checkbox');
    await playwrightCheckbox.click();

    await page.getByRole('button', { name: /save skills/i }).click();

    // Should show success toast
    await expect(page.getByText(/skills saved/i)).toBeVisible();
  });

  test('should show category filter buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: /all/i })).toBeVisible();
  });

  test('should update skill count in tab', async ({ page }) => {
    // Initial count should reflect assigned skills
    const skillsTab = page.getByRole('button', { name: /skills \(/i });
    await expect(skillsTab).toBeVisible();
  });
});

test.describe('Profiles - Instructions (Edit Mode)', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/profiles');
    await page.waitForLoadState('networkidle');

    // Open edit mode for React 19 Stack
    const profileRow = page.locator('.list-item').filter({ hasText: 'React 19 Stack' });
    await profileRow.getByRole('button', { name: /edit/i }).click();
    // Go to Instructions tab
    await page.getByRole('button', { name: /instructions/i }).click();
  });

  test('should display instructions tab content', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /profile instructions/i })).toBeVisible();
  });

  test('should show Edit in IDE and Refresh buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: /edit in ide/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /refresh/i })).toBeVisible();
  });

  test('should display instructions info notice', async ({ page }) => {
    await expect(page.getByText(/CLAUDE\.md/i)).toBeVisible();
  });

  test('should open instructions in IDE when clicked', async ({ page }) => {
    const logs: string[] = [];
    page.on('console', (msg) => {
      if (msg.text().includes('TauriMock')) {
        logs.push(msg.text());
      }
    });

    await page.getByRole('button', { name: /edit in ide/i }).click();

    // Should show success toast
    await expect(page.getByText(/opened in/i)).toBeVisible();
  });
});

test.describe('Profiles - Delete Profile', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/profiles');
    await page.waitForLoadState('networkidle');
  });

  test('should delete project profile with confirmation', async ({ page }) => {
    const profileRow = page.locator('.list-item').filter({ hasText: 'React 19 Stack' });

    page.on('dialog', dialog => dialog.accept());
    await profileRow.getByRole('button', { name: /delete/i }).click();

    await expect(page.getByText('React 19 Stack')).not.toBeVisible();
  });

  test('should cancel profile deletion', async ({ page }) => {
    const profileRow = page.locator('.list-item').filter({ hasText: 'React 19 Stack' });

    page.on('dialog', dialog => dialog.dismiss());
    await profileRow.getByRole('button', { name: /delete/i }).click();

    await expect(page.getByText('React 19 Stack')).toBeVisible();
  });
});

test.describe('Profiles - Set Default', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/profiles');
    await page.waitForLoadState('networkidle');
  });

  test('should show Set Default button only for user profiles without default', async ({ page }) => {
    // Main Profile is already default, so no Set Default button
    const mainProfileRow = page.locator('.list-item').filter({ hasText: 'Main Profile' });
    await expect(mainProfileRow.getByRole('button', { name: /set default/i })).not.toBeVisible();

    // React Stack is project type, so no Set Default button
    const reactProfileRow = page.locator('.list-item').filter({ hasText: 'React 19 Stack' });
    await expect(reactProfileRow.getByRole('button', { name: /set default/i })).not.toBeVisible();
  });
});

test.describe('Profiles - Navigation', () => {
  test.beforeEach(async ({ page }) => {
    const mockContent = fs.readFileSync(path.resolve(__dirname, 'mocks/tauri-mock.js'), 'utf-8');
    await page.addInitScript(mockContent);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to profiles page from sidebar', async ({ page }) => {
    const sidebar = page.locator('nav.sidebar');
    await sidebar.getByRole('link', { name: 'Profiles' }).click();
    await expect(page).toHaveURL(/profiles/);
    await expect(page.getByRole('heading', { name: 'Profiles', level: 1 })).toBeVisible();
  });
});
