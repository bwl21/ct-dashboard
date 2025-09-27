import { test, expect } from '@playwright/test'

test.describe('Login System', () => {
  test('should login successfully and show user data', async ({ page }) => {
    // Console-Logs abfangen
    const logs: string[] = []
    page.on('console', (msg) => {
      logs.push(`${msg.type()}: ${msg.text()}`)
    })

    // Errors abfangen
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(`ERROR: ${error.message}`)
    })

    await page.goto('/')

    // Warten bis Login-Prozess abgeschlossen (max 15 Sekunden)
    await page.waitForTimeout(15000)

    // Prüfe Login-Status anhand der Anzeige
    const userDisplay = await page.locator('.ct-navbar-text').textContent()
    console.log('User Display:', userDisplay)

    // Prüfe ob Module sichtbar sind
    const moduleCount = await page.locator('h3').count()
    console.log('Visible modules:', moduleCount)

    // Prüfe ob Permission Debugger Daten zeigt
    const hasPermissionDebugger = await page.locator('.permission-debugger').isVisible()
    if (hasPermissionDebugger) {
      const permissionItems = await page.locator('.permission-item').count()
      console.log('Permission items:', permissionItems)
    }

    // Ausgabe aller Console-Logs
    console.log('\n=== CONSOLE LOGS ===')
    logs.forEach((log) => console.log(log))

    if (errors.length > 0) {
      console.log('\n=== ERRORS ===')
      errors.forEach((error) => console.log(error))
    }

    // Assertions
    expect(userDisplay).not.toBe('')
    expect(userDisplay).not.toContain('Anonymous')
    expect(moduleCount).toBeGreaterThan(0)
  })
})
