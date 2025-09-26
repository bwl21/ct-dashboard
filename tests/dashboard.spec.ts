import { test, expect } from '@playwright/test'

test.describe('ChurchTools Dashboard', () => {
  test('@smoke @basic dashboard loads correctly', async ({ page }) => {
    await page.goto('/')

    // Check if the header is present
    await expect(page.locator('h1')).toContainText('ChurchTools Dashboard')

    // Check if version is displayed
    await expect(page.locator('text=v1.0.4')).toBeVisible()

    // Check if description is present
    await expect(page.locator('text=Zentrale Übersicht für ChurchTools Module')).toBeVisible()
  })

  test('@smoke @navigation navigation works', async ({ page }) => {
    await page.goto('/')

    // Wait for the page to load
    await page.waitForLoadState('networkidle')

    // Check if dashboard modules are visible
    await expect(page.locator('h3', { hasText: 'Automatische Gruppen' })).toBeVisible()
    await expect(page.locator('h3', { hasText: 'Auslaufende Terminserien' })).toBeVisible()
    await expect(page.locator('h3', { hasText: 'Tags' })).toBeVisible()
    await expect(page.locator('h3', { hasText: 'Logger System' })).toBeVisible()
  })

  test('@responsive @mobile responsive design works', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Check if layout adapts to mobile
    await expect(page.locator('h1')).toContainText('ChurchTools Dashboard')
    await expect(page.locator('h3', { hasText: 'Automatische Gruppen' })).toBeVisible()
  })
})

test.describe('Dashboard Cards', () => {
  test('@smoke @interaction cards are interactive', async ({ page }) => {
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

  test('@layout @issue7 header buttons maintain consistent position during loading states', async ({
    page,
  }, testInfo) => {
    await page.goto('/')

    // Wait for initial load
    await page.waitForSelector('.ct-card', { timeout: 10000 })

    // Get the first card for testing
    const firstCard = page.locator('.ct-card').first()
    await expect(firstCard).toBeVisible()

    // Find the header action button (circular arrow icon)
    const headerButton = firstCard.locator('.ct-card-header .ct-card-actions button')
    await expect(headerButton).toBeVisible()

    // Take screenshot before loading (only for desktop browsers)
    const isDesktop = !testInfo.project.name.includes('Mobile')
    if (isDesktop) {
      await page.screenshot({ path: 'test-results/before-loading.png', fullPage: true })
    }

    // Measure initial button position
    const initialButtonBox = await headerButton.boundingBox()
    expect(initialButtonBox).not.toBeNull()

    // Trigger refresh to test loading state
    const refreshButton = firstCard.locator('button', { hasText: 'Aktualisieren' })
    await refreshButton.click()

    // Wait a moment for loading state to appear
    await page.waitForTimeout(100)

    // Check that loading text appears in footer
    await expect(firstCard.locator('.last-update')).toContainText('Lade Daten')

    // Take screenshot during loading (only for desktop browsers)
    if (isDesktop) {
      await page.screenshot({ path: 'test-results/during-loading.png', fullPage: true })
    }

    // Measure button position during loading
    const loadingButtonBox = await headerButton.boundingBox()
    expect(loadingButtonBox).not.toBeNull()

    // Button should maintain the same horizontal position (within 5px tolerance)
    expect(Math.abs(loadingButtonBox!.x - initialButtonBox!.x)).toBeLessThan(5)

    // Button should maintain the same vertical position (within 5px tolerance)
    expect(Math.abs(loadingButtonBox!.y - initialButtonBox!.y)).toBeLessThan(5)

    // Wait for loading to complete
    await page.waitForFunction(
      () => !document.querySelector('.last-update')?.textContent?.includes('Lade Daten'),
      { timeout: 10000 }
    )

    // Measure final button position after loading
    const finalButtonBox = await headerButton.boundingBox()
    expect(finalButtonBox).not.toBeNull()

    // Button should return to original position (within 5px tolerance)
    expect(Math.abs(finalButtonBox!.x - initialButtonBox!.x)).toBeLessThan(5)
    expect(Math.abs(finalButtonBox!.y - initialButtonBox!.y)).toBeLessThan(5)
  })

  test('@layout @alignment header buttons stay right-aligned in all card states', async ({
    page,
  }) => {
    await page.goto('/')

    // Wait for cards to load
    await page.waitForSelector('.ct-card', { timeout: 10000 })

    // Test all visible cards
    const cards = page.locator('.ct-card')
    const cardCount = await cards.count()

    for (let i = 0; i < cardCount; i++) {
      const card = cards.nth(i)
      const cardBox = await card.boundingBox()
      const headerButton = card.locator('.ct-card-header .ct-card-actions button')

      if (await headerButton.isVisible()) {
        const buttonBox = await headerButton.boundingBox()

        // Button should be positioned near the right edge of the card
        // Allow for padding/margin (typically 16-24px from right edge)
        const distanceFromRight = cardBox!.x + cardBox!.width - (buttonBox!.x + buttonBox!.width)
        expect(distanceFromRight).toBeLessThan(30) // Should be close to right edge
        expect(distanceFromRight).toBeGreaterThan(10) // But not touching the edge
      }
    }
  })
})

test.describe.skip('Error Handling', () => {
  test.skip('handles network errors gracefully', async ({ page }) => {
    // Block all network requests to simulate offline
    await page.route('**/*', (route) => route.abort())

    await page.goto('/')

    // Should still show basic layout
    await expect(page.locator('body')).toBeVisible()
  })
})
