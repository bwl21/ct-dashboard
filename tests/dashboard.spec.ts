import { test, expect } from '@playwright/test'

test.describe('ChurchTools Dashboard', () => {
  test('dashboard loads correctly', async ({ page }) => {
    await page.goto('/')

    // Check if the header is present
    await expect(page.locator('h1')).toContainText('ChurchTools Dashboard')

    // Check if version is displayed
    await expect(page.locator('text=v1.0.4')).toBeVisible()

    // Check if description is present
    await expect(page.locator('text=Zentrale Übersicht für ChurchTools Module')).toBeVisible()
  })

  test('navigation works', async ({ page }) => {
    await page.goto('/')

    // Wait for the page to load
    await page.waitForLoadState('networkidle')

    // Check if dashboard modules are visible
    await expect(page.locator('h3', { hasText: 'Automatische Gruppen' })).toBeVisible()
    await expect(page.locator('h3', { hasText: 'Auslaufende Terminserien' })).toBeVisible()
    await expect(page.locator('h3', { hasText: 'Tags' })).toBeVisible()
    await expect(page.locator('h3', { hasText: 'Logger System' })).toBeVisible()
  })

  test('responsive design works', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Check if layout adapts to mobile
    await expect(page.locator('h1')).toContainText('ChurchTools Dashboard')
    await expect(page.locator('h3', { hasText: 'Automatische Gruppen' })).toBeVisible()
  })
})

test.describe('Dashboard Cards', () => {
  test('cards are interactive', async ({ page }) => {
    await page.goto('/')

    // Wait for modules to load
    await page.waitForSelector('h3', { timeout: 10000 })

    // Check if module cards have proper structure and are clickable
    const automaticGroupsCard = page
      .locator('h3', { hasText: 'Automatische Gruppen' })
      .locator('..')
    await expect(automaticGroupsCard).toBeVisible()

    // Check if refresh buttons are present
    await expect(page.locator('button', { hasText: 'Aktualisieren' }).first()).toBeVisible()
    await expect(page.locator('button', { hasText: 'Details' }).first()).toBeVisible()
  })
})

test.describe('Error Handling', () => {
  test('handles network errors gracefully', async ({ page }) => {
    // Block all network requests to simulate offline
    await page.route('**/*', (route) => route.abort())

    await page.goto('/')

    // Should still show basic layout
    await expect(page.locator('body')).toBeVisible()
  })
})
