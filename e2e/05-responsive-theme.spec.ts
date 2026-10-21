import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Theme Toggle and Responsive Layout', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'finance');
  });

  test('should toggle dark and light modes cleanly', async ({ page }) => {
    // Find theme toggle button in desktop sidebar
    const themeBtn = page.locator('aside[aria-label="Application sidebar"] button[title="Toggle Theme"]').or(
      page.locator('button[aria-label*="theme"]')
    ).first();
    await expect(themeBtn).toBeVisible();

    // Read initial html class
    const initialIsDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));

    // Click toggle
    await themeBtn.click();
    await page.waitForTimeout(300);

    // Verify class flipped
    const toggledIsDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(toggledIsDark).not.toBe(initialIsDark);

    // Click toggle again to restore
    await themeBtn.click();
    await page.waitForTimeout(300);
    const restoredIsDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(restoredIsDark).toBe(initialIsDark);
  });

  test('should open mobile navigation drawer on narrow viewport', async ({ page, isMobile }) => {
    // If desktop browser, resize viewport to mobile dimensions
    if (!isMobile) {
      await page.setViewportSize({ width: 375, height: 667 });
    }

    // Hamburger menu button should be visible on mobile header
    const hamburgerBtn = page.locator('header.md\\:hidden button[aria-label*="menu"]').or(
      page.locator('header button[aria-label*="menu"]')
    ).first();
    await expect(hamburgerBtn).toBeVisible();

    // Click hamburger to open drawer
    await hamburgerBtn.click();

    // Verify mobile drawer navigation links appear
    const mobileNav = page.locator('#mobile-navigation');
    await expect(mobileNav).toBeVisible();
    await expect(mobileNav.locator('button', { hasText: /Expenses/i })).toBeVisible();

    // Click link to navigate
    await mobileNav.locator('button', { hasText: /Expenses/i }).click();
    await expect(page.locator('#main-content h1')).toContainText(/Expenses/i);
  });
});
