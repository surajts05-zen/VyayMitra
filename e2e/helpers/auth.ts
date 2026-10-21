import { Page, expect } from '@playwright/test';

export async function loginAs(page: Page, role: 'finance' | 'admin' | 'owner' | 'employee' = 'finance') {
  await page.goto('/');

  const mainContent = page.locator('#main-content');
  const loginSubmitBtn = page.getByRole('button', { name: 'Sign In with Local Credentials' });

  // Wait for either the authenticated app shell or the login form to be visible
  await expect(mainContent.or(loginSubmitBtn)).toBeVisible({ timeout: 12000 });

  if (await loginSubmitBtn.isVisible()) {
    if (role === 'finance') {
      const pill = page.locator('button', { hasText: 'Finance Operator' });
      if (await pill.isVisible()) await pill.click();
    } else if (role === 'admin') {
      const pill = page.locator('button', { hasText: 'Platform Super Admin' });
      if (await pill.isVisible()) await pill.click();
    } else if (role === 'owner') {
      const pill = page.locator('button', { hasText: 'Company Owner' });
      if (await pill.isVisible()) await pill.click();
    } else if (role === 'employee') {
      const pill = page.locator('button', { hasText: 'Employee Claimer' });
      if (await pill.isVisible()) await pill.click();
    }

    await loginSubmitBtn.click();
  }

  // Ensure AppShell is fully mounted
  await expect(mainContent).toBeVisible({ timeout: 12000 });
}
