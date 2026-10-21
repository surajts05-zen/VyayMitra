import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Finance Review, Reimbursements & ERP Integrations', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'finance');
  });

  test('should display Finance Review, GL accounts and mapping configuration', async ({ page }) => {
    await page.getByRole('button', { name: 'Finance Review' }).click();

    // Verify Finance content inside main
    const main = page.locator('#main-content');
    await expect(main).toContainText(/Finance|General Ledger|Mapping/i);
    await expect(main.locator('table').or(main.locator('text=Air Travel'))).toBeVisible();
  });

  test('should display Reimbursements queue and record payment modal', async ({ page }) => {
    await page.getByRole('button', { name: 'Reimbursements' }).click();

    // Verify Reimbursements page
    const main = page.locator('#main-content');
    await expect(main).toContainText(/Reimbursement|Payment/i);

    // Verify payout action or items
    const recordBtn = page.getByRole('button', { name: /Record Payment/i }).or(page.getByRole('button', { name: /Execute Payment/i })).first();
    if (await recordBtn.isVisible()) {
      await recordBtn.click();
      await expect(page.locator('text=Record Bank Transfer').or(page.locator('text=Payment Reference'))).toBeVisible();

      // Close modal
      const closeBtn = page.locator('button:has-text("Cancel")').or(page.locator('button[aria-label="Close"]')).first();
      await closeBtn.click();
    }
  });

  test('should display Accounting Integrations and provider sync status', async ({ page }) => {
    await page.getByRole('button', { name: 'Integrations' }).click();

    // Verify Integrations header in main
    const main = page.locator('#main-content');
    await expect(main).toContainText(/Integration|Accounting|ERP/i);

    // Verify Zoho Books card / connector
    await expect(main.locator('text=Zoho Books').first()).toBeVisible();
  });
});
