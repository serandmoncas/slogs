import { test, expect } from '@playwright/test'

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.fill("input[placeholder='usuario@siata.co']", 'admin@siata.co')
  await page.fill("input[placeholder='••••••••']", 'admin1234')
  await page.click("button[type='submit']")
  await page.waitForURL('**/dashboard', { timeout: 15_000 })
}

test('panel resumen muestra 5% OFF al ingresar cantidad 11 en terrestre', async ({ page }) => {
  await login(page)
  await page.goto('/terrestres/nuevo')

  // El panel calcula el descuento solo con cantidad + precio — no requiere selects
  await page.locator('input[type="number"]').first().fill('11')
  await page.locator('input[type="number"]').nth(1).fill('100000')

  await expect(page.locator('text=-5% OFF')).toBeVisible({ timeout: 5_000 })
})

test('panel resumen muestra precio correcto sin descuento cuando cantidad <= 10', async ({ page }) => {
  await login(page)
  await page.goto('/terrestres/nuevo')

  await page.locator('input[type="number"]').first().fill('5')
  await page.locator('input[type="number"]').nth(1).fill('200000')

  // Sin descuento — el total debe ser 200.000 y descuento 0%
  await expect(page.locator('text=0%')).toBeVisible({ timeout: 5_000 })
})

test('validación de placa inválida no envía el formulario', async ({ page }) => {
  await login(page)
  await page.goto('/terrestres/nuevo')
  await page.fill('input[maxlength="10"]', 'TESTE00002')
  await page.fill("input[placeholder='ABC123']", 'invalida')
  await page.click("button[type='submit']")
  // Permanece en la misma página
  await expect(page).toHaveURL(/terrestres\/nuevo/)
})

test('panel marítimo muestra 3% OFF al ingresar cantidad 11', async ({ page }) => {
  await login(page)
  await page.goto('/maritimos/nuevo')

  await page.locator('input[type="number"]').first().fill('11')
  await page.locator('input[type="number"]').nth(1).fill('500000')

  await expect(page.locator('text=-3% OFF')).toBeVisible({ timeout: 5_000 })
})
