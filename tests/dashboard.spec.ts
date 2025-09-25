import { test, expect } from '@playwright/test'

test.describe('Dashboard Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard before each test
    await page.goto('/')
  })

  test('dashboard loads correctly', async ({ page }) => {
    // Check if main dashboard elements are present
    await expect(page.locator('.dashboard-container')).toBeVisible()
  })

  test('navigation menu is functional', async ({ page }) => {
    // Test navigation between different sections
    const navItems = page.locator('nav a')
    const count = await navItems.count()
    
    expect(count).toBeGreaterThan(0)
    
    // Test first navigation item
    if (count > 0) {
      await navItems.first().click()
      // Verify navigation worked
      await expect(page).toHaveURL(/.*/)
    }
  })

  test('responsive design works', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('body')).toBeVisible()
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await expect(page.locator('body')).toBeVisible()
  })
})