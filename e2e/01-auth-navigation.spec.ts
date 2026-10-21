import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Authentication and Core Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page and allow login with demo persona', async ({ page }) => {
    // 1. Verify Login Page elements or session
    await expect(page).toHaveTitle(/VyayMitra/i);
    const loginSubmitBtn = page.getByRole('button', { name: 'Sign In with Local Credentials' });
    const mainContent = page.locator('#main-content');

    await expect(mainContent.or(loginSubmitBtn)).toBeVisible({ timeout: 12000 });

    if (await loginSubmitBtn.isVisible()) {
      // Click quick-fill persona pill for Finance Operator
      const financePill = page.locator('button', { hasText: 'Finance Operator' });
      if (await financePill.isVisible()) {
        await financePill.click();
      }

      await loginSubmitBtn.click();
    }

    // Verify successful redirection into the AppShell
    await expect(mainContent).toBeVisible({ timeout: 12000 });
    await expect(page.locator('text=Dashboard Overview').first()).toBeVisible();
  });

  test('should navigate across core workspace modules', async ({ page }) => {
    await loginAs(page, 'finance');

    // Navigate to Expenses
    await page.getByRole('button', { name: 'My Expenses' }).click();
    await expect(page.locator('#main-content h1')).toContainText(/Expenses/i);

    // Navigate to Reports
    await page.getByRole('button', { name: 'My Reports' }).click();
    await expect(page.locator('#main-content h1')).toContainText(/Reports/i);

    // Navigate to Approvals
    await page.getByRole('button', { name: 'Approvals' }).click();
    await expect(page.locator('#main-content')).toContainText(/Approval/i);

    // Navigate to Finance
    await page.getByRole('button', { name: 'Finance Review' }).click();
    await expect(page.locator('#main-content')).toContainText(/Finance Review|General Ledger/i);

    // Navigate to Reimbursements
    await page.getByRole('button', { name: 'Reimbursements' }).click();
    await expect(page.locator('#main-content')).toContainText(/Reimbursement/i);

    // Navigate to User Guide
    await page.getByRole('button', { name: 'User Guide' }).click();
    await expect(page.locator('#main-content')).toContainText(/User Guide/i);
  });

  test('should switch review personas using floating switcher', async ({ page }) => {
    await loginAs(page, 'finance');

    // Find the floating role switcher at bottom right
    const switcherBtn = page.locator('button', { hasText: /Role:/i });
    await expect(switcherBtn).toBeVisible();
    await switcherBtn.click();

    // Select Employee persona (Rahul Sharma)
    const employeePersonaBtn = page.locator('button', { hasText: /Rahul Sharma/i });
    await expect(employeePersonaBtn).toBeVisible();
    await employeePersonaBtn.click();

    // Verify role switcher text updated to Employee
    await expect(page.locator('button', { hasText: /Role:/i })).toContainText(/Employee/i);
  });
});
