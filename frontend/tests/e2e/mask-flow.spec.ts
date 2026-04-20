import { test, expect } from '@playwright/test';

/**
 * E2E happy-path for the mask → unmask round-trip.
 *
 * Prerequisite: frontend must be running at http://localhost:5173 with the
 * Vite dev proxy pointing /api → the FastAPI backend at :8000. Alternatively
 * run against the deployed URL by setting PLAYWRIGHT_BASE_URL.
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';

test.describe('MaskLM mask/unmask flow', () => {
  test('detects PII, masks with tokens, unmasks back to original', async ({ page }) => {
    await page.goto(BASE_URL);

    // If login page is shown, the test is running against a build with Supabase
    // auth enabled. Skip — this E2E covers the unauthenticated-dev flow only.
    const loginVisible = await page.getByText(/sign in/i).isVisible().catch(() => false);
    test.skip(loginVisible, 'Login required — run against local dev build without auth');

    const sampleText = 'Alice Chen works at Acme Corp. Email: alice@acme.com';

    await page.getByPlaceholder(/paste sensitive text/i).fill(sampleText);
    await page.getByRole('button', { name: /^mask$/i }).click();

    // Wait for masked output to contain a token placeholder
    await expect(page.getByText(/\[NAME_\d+\]/)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/\[EMPLOYER_\d+\]/)).toBeVisible();
    await expect(page.getByText(/\[EMAIL_\d+\]/)).toBeVisible();

    // Copy the masked text (simulated — we read from the DOM instead)
    const maskedBlock = page.locator('[data-testid="mask-result"]').first();
    const maskedText = (await maskedBlock.textContent())?.trim() ?? '';
    expect(maskedText).toMatch(/\[NAME_\d+\]/);
    expect(maskedText).not.toContain('Alice Chen');
    expect(maskedText).not.toContain('alice@acme.com');
    expect(maskedText).not.toContain('Acme Corp');

    // Unmask round-trip: paste the masked text (as if it came back from an LLM)
    // into the right panel and verify we recover the original.
    await page.getByPlaceholder(/paste the llm/i).fill(maskedText);
    await page.getByRole('button', { name: /^unmask$/i }).click();

    await expect(page.getByText('Alice Chen')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('alice@acme.com')).toBeVisible();
    await expect(page.getByText('Acme Corp')).toBeVisible();
  });
});
