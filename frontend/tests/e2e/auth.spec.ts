import { test, expect } from '@playwright/test'

const LOGIN_URL = '/login'
const EMAIL = 'admin@siata.co'
const PASSWORD = 'admin1234'

async function loginAs(page: import('@playwright/test').Page) {
  await page.goto(LOGIN_URL)
  await page.fill("input[placeholder='usuario@siata.co']", EMAIL)
  await page.fill("input[placeholder='••••••••']", PASSWORD)
  await page.click("button[type='submit']")
  await page.waitForURL('**/dashboard', { timeout: 15_000 })
}

test('login exitoso redirige al dashboard', async ({ page }) => {
  await loginAs(page)
  expect(page.url()).toContain('/dashboard')
  await expect(page.locator('text=TOTAL ENVÍOS')).toBeVisible({ timeout: 10_000 })
})

test('login con credenciales incorrectas permanece en /login', async ({ page }) => {
  await page.goto(LOGIN_URL)
  await page.fill("input[placeholder='usuario@siata.co']", 'malo@test.co')
  await page.fill("input[placeholder='••••••••']", 'wrongpass')
  await page.click("button[type='submit']")
  await expect(page.locator("button[type='submit']")).toHaveText('Ingresar', { timeout: 15_000 })
  expect(page.url()).toContain('/login')
})

test('acceso directo a /dashboard sin token redirige a /login', async ({ page }) => {
  await page.goto('/dashboard')
  await page.waitForURL('**/login', { timeout: 10_000 })
  expect(page.url()).toContain('/login')
})

test('logout limpia sesion y redirige a /login', async ({ page }) => {
  await loginAs(page)
  await page.click("button:has-text('Salir')")
  await page.waitForURL('**/login', { timeout: 10_000 })
  expect(page.url()).toContain('/login')
})
