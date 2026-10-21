import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Reports Assembly & Multi-Stage Approval Engine', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'finance');
  });

  test('should assemble a new claim report via 2-step wizard', async ({ page }) => {
    // Navigate to Reports
    await page.getByRole('button', { name: 'My Reports' }).click();
    await expect(page.locator('#main-content h1')).toBeVisible({ timeout: 12000 });
    await expect(page.locator('#main-content h1')).toContainText(/Reports/i);

    // Click Assemble New Claim Report button
    const assembleBtn = page.getByRole('button', { name: /Assemble New Claim Report/i });
    await expect(assembleBtn).toBeVisible();
    await assembleBtn.click();

    // Wizard Step 1: Context & Purpose
    await expect(page.locator('text=Claim Assembly Wizard')).toBeVisible();
    const titleInput = page.getByPlaceholder(/Hyderabad Q4 Bio-Summit/i);
    await titleInput.fill('Annual Bio-Tech Scientific Summit Delegation');

    const purposeInput = page.getByPlaceholder(/commercial justification/i);
    await purposeInput.fill('Keynote presentations and equipment sourcing for Bangalore laboratory.');

    // Click Next: Select Expenses
    const nextBtn = page.getByRole('button', { name: /Next: Select Expenses/i });
    await expect(nextBtn).toBeEnabled();
    await nextBtn.click();

    // Wizard Step 2: Select Expenses
    await expect(page.locator('text=Select Expenses & Policy Pre-Check')).toBeVisible();

    const selectAllBtn = page.getByRole('button', { name: /Select All Items/i });
    if (await selectAllBtn.isVisible()) {
      await selectAllBtn.click();
    } else {
      const firstRow = page.locator('div[class*="cursor-pointer"]', { hasText: /Taj Gateway|IndiGo|Merck/i }).first();
      if (await firstRow.isVisible()) {
        await firstRow.click();
      }
    }

    // Submit for Approval
    const submitBtn = page.getByRole('button', { name: /Submit for Approval/i });
    await expect(submitBtn).toBeEnabled({ timeout: 8000 });
    await submitBtn.click();

    // Verify confirmation notification and modal closes
    await expect(page.locator('text=submitted successfully')).toBeVisible();
    await expect(page.locator('text=Claim Assembly Wizard')).not.toBeVisible();
  });

  test('should inspect report audit flow and sequential approval timeline', async ({ page }) => {
    await page.getByRole('button', { name: 'My Reports' }).click();
    await expect(page.locator('#main-content h1')).toBeVisible({ timeout: 12000 });
    await expect(page.locator('#main-content h1')).toContainText(/Reports/i);

    // Click Audit Flow on first report
    const auditFlowBtn = page.getByRole('button', { name: /Audit Flow/i }).first();
    if (await auditFlowBtn.isVisible()) {
      await auditFlowBtn.click();
      await expect(page.locator('text=Sequential Multi-Stage Approval Flow')).toBeVisible();

      // Close modal
      const closeBtn = page.getByRole('button', { name: /Close View/i });
      await closeBtn.click();
      await expect(page.locator('text=Sequential Multi-Stage Approval Flow')).not.toBeVisible();
    }
  });

  test('should inspect Approvals queue and decision controls', async ({ page }) => {
    // Navigate to Approvals
    await page.getByRole('button', { name: 'Approvals' }).click();
    await expect(page.locator('#main-content')).toBeVisible({ timeout: 12000 });
    await expect(page.locator('#main-content')).toContainText(/Approval/i);

    // Verify approval items exist or empty state
    await expect(page.locator('#main-content')).toContainText(/Pending Decisions|Approval Inbox is All Caught Up/i);
  });
});
