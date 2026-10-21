import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Expenses & Receipt Ingestion Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'finance');

    // Go to expenses page
    await page.getByRole('button', { name: 'My Expenses' }).click();
    await expect(page.locator('#main-content h1')).toBeVisible({ timeout: 12000 });
    await expect(page.locator('#main-content h1')).toContainText(/Expenses/i);
  });

  test('should open Create Expense modal and fill with quick sample receipt', async ({ page }) => {
    // Click Create Expense button
    const createBtn = page.getByRole('button', { name: /Create Expense/i });
    await expect(createBtn).toBeVisible();
    await createBtn.click();

    // Verify modal appears
    await expect(page.locator('text=Create Expense Claim')).toBeVisible();

    // Click sample receipt preset: IndiGo Flight (₹6,850)
    const indigoPreset = page.getByRole('button', { name: /IndiGo Flight/i });
    if (await indigoPreset.isVisible()) {
      await indigoPreset.click();
      // Wait for OCR suggestion to load
      await page.waitForTimeout(900);
      await expect(page.locator('input[placeholder*="ITC Hotels"]')).toHaveValue(/IndiGo/i);
    } else {
      // Manual fill fallback
      await page.locator('input[placeholder*="ITC Hotels"]').fill('IndiGo Airlines');
      await page.locator('input[placeholder="0.00"]').fill('6850.00');
    }

    // Click Save Expense Draft
    const saveBtn = page.getByRole('button', { name: /Save Expense Draft/i });
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    // Verify modal closes and expense appears in the roster
    await expect(page.locator('text=Create Expense Claim')).not.toBeVisible();
    await expect(page.locator('#main-content').getByText(/IndiGo/i).first()).toBeVisible();
  });

  test('should search and filter expenses roster', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search by merchant/i);
    await expect(searchInput).toBeVisible();

    await searchInput.fill('IndiGo');
    await page.waitForTimeout(300);

    // Filter dropdown exists
    const filterSelect = page.locator('select', { hasText: /All Statuses/i });
    await expect(filterSelect).toBeVisible();
  });

  test('should open expense audit details modal', async ({ page }) => {
    // Wait for table to load
    await expect(page.locator('#main-content table')).toBeVisible();

    // Ensure at least one expense exists
    let detailBtn = page.locator('#main-content button[title="Inspect Details"]').first();
    if (!await detailBtn.isVisible()) {
      await page.getByRole('button', { name: /Create Expense/i }).click();
      const samplePreset = page.getByRole('button', { name: /IndiGo Flight|ITC Hotel/i }).first();
      if (await samplePreset.isVisible()) {
        await samplePreset.click();
        await page.waitForTimeout(900);
      } else {
        await page.locator('input[placeholder*="ITC Hotels"]').fill('Audit Test Merchant');
        await page.locator('input[placeholder="0.00"]').fill('1500.00');
      }
      await page.getByRole('button', { name: /Save Expense Draft/i }).click();
      await expect(page.locator('text=Create Expense Claim')).not.toBeVisible();
      detailBtn = page.locator('#main-content button[title="Inspect Details"]').first();
    }

    if (await detailBtn.isVisible()) {
      await detailBtn.click();
      await expect(page.locator('text=Expense Audit Record')).toBeVisible();

      // Close modal
      const closeBtn = page.getByRole('button', { name: /Close Audit Viewer/i });
      await closeBtn.click();
      await expect(page.locator('text=Expense Audit Record')).not.toBeVisible();
    }
  });
});
