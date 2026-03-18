import { test, expect } from '@playwright/test';

/* ===== AI Creation Scroll Animation Tests ===== */

test.describe('AI Creation scroll animation', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('diagnostic dump — reveals root cause', async ({ page }) => {
    await page.goto('/');
    // Wait for GSAP init
    await page.waitForTimeout(1500);

    const diagnostics = await page.evaluate(() => {
      const section = document.querySelector('#lp-how-it-works');
      const stage = document.querySelector('.lp-stage');
      const steps = document.querySelectorAll('.lp-stage-step');

      const stageStyles = stage ? window.getComputedStyle(stage) : null;
      const stepData = Array.from(steps).map((s, i) => {
        const cs = window.getComputedStyle(s);
        return {
          index: i,
          className: s.className,
          position: cs.position,
          visibility: cs.visibility,
          opacity: cs.opacity,
          inset: `${cs.top} ${cs.right} ${cs.bottom} ${cs.left}`,
          // Check for GSAP inline styles
          inlineStyle: (s as HTMLElement).style.cssText,
        };
      });

      // Check ScrollTrigger
      let triggerCount = 0;
      try {
        // @ts-expect-error - GSAP global
        triggerCount = window.ScrollTrigger?.getAll?.()?.length ?? -1;
      } catch { triggerCount = -1; }

      return {
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        dataGsap: section?.getAttribute('data-gsap'),
        stageHeight: stageStyles?.height,
        stagePosition: stageStyles?.position,
        stageOverflow: stageStyles?.overflow,
        stepCount: steps.length,
        steps: stepData,
        triggerCount,
      };
    });

    console.log('=== AI Creation Diagnostics ===');
    console.log(JSON.stringify(diagnostics, null, 2));

    // Basic assertions
    expect(diagnostics.dataGsap).toBe('initialized');
    expect(diagnostics.stepCount).toBe(4);
    expect(diagnostics.reducedMotion).toBe(false);
  });

  test('initial state — only step 1 visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);

    // Stage should not be auto-expanded
    const stageHeight = await page.locator('.lp-stage').evaluate(
      (el) => parseFloat(window.getComputedStyle(el).height)
    );
    expect(stageHeight).toBeLessThanOrEqual(600);

    // Step 1 (prompt) should be visible
    const promptVis = await page.locator('.lp-stage-prompt').evaluate(
      (el) => window.getComputedStyle(el).visibility
    );
    expect(promptVis).toBe('visible');

    // Steps 2-4 should be hidden
    for (const cls of ['.lp-stage-generate', '.lp-stage-adapt', '.lp-stage-schedule']) {
      const vis = await page.locator(cls).evaluate(
        (el) => window.getComputedStyle(el).visibility
      );
      expect(vis).toBe('hidden');
    }
  });

  test('scroll transition — step 2 appears after scrolling', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);

    // Get section position and pin length
    const scrollTarget = await page.evaluate(() => {
      const section = document.querySelector('#lp-how-it-works');
      if (!section) return 0;
      const rect = section.getBoundingClientRect();
      const scrollY = window.scrollY;
      // Scroll to ~35% through the pinned section (past step 1 at 25%)
      return scrollY + rect.top + window.innerHeight * 1.4;
    });

    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), scrollTarget);
    await page.waitForTimeout(800);

    // Step 2 should now be visible with opacity
    const step2 = await page.locator('.lp-stage-generate').evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return { visibility: cs.visibility, opacity: parseFloat(cs.opacity) };
    });
    expect(step2.visibility).toBe('visible');
    expect(step2.opacity).toBeGreaterThan(0.5);

    // Step 1 should be faded or hidden
    const step1 = await page.locator('.lp-stage-prompt').evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return { opacity: parseFloat(cs.opacity) };
    });
    expect(step1.opacity).toBeLessThan(0.3);
  });
});

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
