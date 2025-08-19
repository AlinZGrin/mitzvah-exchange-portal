const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3000';

test.describe('Mitzvah Request Creation Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(`${BASE_URL}/auth/login`);
    await page.fill('input[name="email"]', 'admin@mitzvahexchange.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should create a mitzvah request successfully and maintain login session', async ({ page }) => {
    // Navigate to create request page
    await page.click('text=POST a Mitzvah');
    await expect(page).toHaveURL(/create/);
    
    // Fill out the form
    await page.fill('input[name="title"]', 'Integration Test Request');
    await page.fill('textarea[name="description"]', 'This is a test request created by integration tests');
    
    // Select category (click on one of the category cards)
    await page.click('[data-category="ERRANDS"], .category-card:has-text("Errands")');
    
    // Fill location
    await page.fill('input[name="locationDisplay"]', 'Test City, Test State');
    
    // Select urgency
    await page.click('text=Normal');
    
    // Submit the form
    await page.click('button[type="submit"]:has-text("Post Mitzvah Request")');
    
    // Should redirect to dashboard without logging out
    await expect(page).toHaveURL(/dashboard/);
    
    // Verify we're still logged in by checking for dashboard content
    await expect(page.locator('text=Dashboard')).toBeVisible();
    
    // Should see success message or the new request
    await expect(page.locator('text=Integration Test Request')).toBeVisible({ timeout: 10000 });
  });

  test('should validate required fields', async ({ page }) => {
    await page.click('text=POST a Mitzvah');
    await expect(page).toHaveURL(/create/);
    
    // Try to submit without filling required fields
    await page.click('button[type="submit"]:has-text("Post Mitzvah Request")');
    
    // Should show validation errors or prevent submission
    const titleInput = page.locator('input[name="title"]');
    const isInvalid = await titleInput.evaluate(el => !el.validity.valid);
    expect(isInvalid).toBe(true);
  });

  test('should handle different categories correctly', async ({ page }) => {
    await page.click('text=POST a Mitzvah');
    
    // Test each category
    const categories = ['VISITS', 'TRANSPORTATION', 'ERRANDS', 'TUTORING', 'MEALS', 'HOUSEHOLD', 'TECHNOLOGY', 'OTHER'];
    
    for (const category of categories) {
      // Fill basic info
      await page.fill('input[name="title"]', `Test ${category} Request`);
      await page.fill('textarea[name="description"]', `Test description for ${category}`);
      await page.fill('input[name="locationDisplay"]', 'Test Location');
      
      // Select category - try multiple selectors
      const categorySelectors = [
        `[data-category="${category}"]`,
        `.category-card:has-text("${category}")`,
        `input[value="${category}"]`
      ];
      
      let categorySelected = false;
      for (const selector of categorySelectors) {
        try {
          await page.click(selector, { timeout: 2000 });
          categorySelected = true;
          break;
        } catch (e) {
          console.log(`Selector ${selector} not found for ${category}`);
        }
      }
      
      if (categorySelected) {
        // Submit
        await page.click('button[type="submit"]:has-text("Post Mitzvah Request")');
        
        // Should redirect successfully
        await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
        
        // Go back to create page for next iteration
        if (categories.indexOf(category) < categories.length - 1) {
          await page.click('text=POST a Mitzvah');
        }
      }
    }
  });
});
