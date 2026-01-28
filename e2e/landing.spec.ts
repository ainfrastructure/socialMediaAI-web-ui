import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should load and show main elements', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Check page title
    await expect(page).toHaveTitle(/SocialChef/i);
    
    // Check main heading exists
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('should have login button', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Login is a button, not a link
    const loginBtn = page.getByRole('button', { name: 'Login' });
    await expect(loginBtn).toBeVisible();
  });

  test('should have Get Started button', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Check CTA button
    const ctaBtn = page.getByRole('button', { name: 'Get Started' }).first();
    await expect(ctaBtn).toBeVisible();
  });

  test('should have navigation items', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Check nav buttons
    await expect(page.getByRole('button', { name: 'How it works' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Pricing' }).first()).toBeVisible();
  });

  test('should have footer links', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Check footer links
    await expect(page.getByRole('link', { name: 'Privacy Policy' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Terms of Service' })).toBeVisible();
  });
});
