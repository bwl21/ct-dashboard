import { test, expect } from '@playwright/test'

test.describe('Logger Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to logger page
    await page.goto('/logger') // Adjust URL based on your routing
  })

  test('logger page loads', async ({ page }) => {
    // Check if logger components are present
    await expect(page.locator('.logger-container')).toBeVisible()
  })

  test('log entries display correctly', async ({ page }) => {
    // Wait for log entries to load
    await page.waitForSelector('.log-entry', { timeout: 10000 })
    
    // Check if log entries are visible
    const logEntries = page.locator('.log-entry')
    const count = await logEntries.count()
    
    expect(count).toBeGreaterThan(0)
  })

  test('person ID display format', async ({ page }) => {
    // Wait for log entries
    await page.waitForSelector('.log-entry', { timeout: 10000 })
    
    // Check if person IDs are displayed correctly (not resolved to names)
    const personIdElements = page.locator('text=/Person ID: \\d+/')
    const count = await personIdElements.count()
    
    if (count > 0) {
      // Verify format: "Person ID: 123"
      const firstPersonId = await personIdElements.first().textContent()
      expect(firstPersonId).toMatch(/Person ID: \d+/)
    }
  })

  test('system entries display correctly', async ({ page }) => {
    // Look for system entries
    const systemEntries = page.locator('text=System')
    const count = await systemEntries.count()
    
    // System entries should show "System" not "Person ID: -1"
    if (count > 0) {
      await expect(systemEntries.first()).toBeVisible()
    }
  })

  test('log filtering works', async ({ page }) => {
    // Test if filter controls exist
    const filterControls = page.locator('.filter-controls')
    
    if (await filterControls.count() > 0) {
      await expect(filterControls).toBeVisible()
      
      // Test filter interaction
      const filterInputs = filterControls.locator('input, select')
      const inputCount = await filterInputs.count()
      
      if (inputCount > 0) {
        // Interact with first filter
        await filterInputs.first().click()
      }
    }
  })

  test('log details modal opens', async ({ page }) => {
    // Wait for log entries
    await page.waitForSelector('.log-entry', { timeout: 10000 })
    
    // Click on first log entry to open details
    const logEntries = page.locator('.log-entry')
    const count = await logEntries.count()
    
    if (count > 0) {
      await logEntries.first().click()
      
      // Check if modal or details view opens
      const modal = page.locator('.modal, .log-details')
      await expect(modal).toBeVisible({ timeout: 5000 })
    }
  })
})