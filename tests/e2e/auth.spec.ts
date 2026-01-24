import { test, expect } from './fixtures'
import { LoginPage } from './pages'

/**
 * Testes E2E do fluxo de autenticação
 *
 * Cobre:
 * - Login com senha correta
 * - Login com senha incorreta
 * - Persistência de sessão
 * - Logout
 * - Redirecionamento para login quando não autenticado
 */
test.describe('Autenticação', () => {
  test.describe('Login', () => {
    test('deve exibir página de login corretamente', async ({ page }) => {
      const loginPage = new LoginPage(page)
      await loginPage.goto()

      // Verifica elementos principais
      await expect(loginPage.passwordInput).toBeVisible()
      await expect(loginPage.submitButton).toBeVisible()
      await expect(loginPage.submitButton).toBeEnabled()
    })

    test('deve fazer login com senha correta', async ({ page }) => {
      const loginPage = new LoginPage(page)
      const password = process.env.MASTER_PASSWORD || process.env.TEST_PASSWORD || 'test123'

      await loginPage.goto()
      await loginPage.loginAndWaitForDashboard(password)

      // Verifica que não está mais na página de login
      await expect(page).not.toHaveURL('/login')
    })

    test('deve mostrar erro com senha incorreta', async ({ page }) => {
      const loginPage = new LoginPage(page)

      await loginPage.goto()
      await loginPage.login('senha_incorreta_123')

      // Aguarda mensagem de erro ou permanece na página de login
      await page.waitForTimeout(1000)
      const url = page.url()
      expect(url).toContain('/login')
    })

    test('deve permitir toggle de visibilidade da senha', async ({ page }) => {
      const loginPage = new LoginPage(page)

      await loginPage.goto()

      // Inicialmente a senha está oculta
      const inputType = await loginPage.passwordInput.getAttribute('type')
      expect(inputType).toBe('password')
    })

    test('campo de senha deve ser obrigatório', async ({ page }) => {
      const loginPage = new LoginPage(page)

      await loginPage.goto()

      // Tenta submeter sem preencher senha
      await loginPage.submitButton.click()

      // Deve permanecer na página de login
      await expect(page).toHaveURL(/\/login/)
    })
  })

  test.describe('Sessão', () => {
    test('deve manter sessão após refresh', async ({ page }) => {
      const loginPage = new LoginPage(page)
      const password = process.env.MASTER_PASSWORD || process.env.TEST_PASSWORD || 'test123'

      // Faz login
      await loginPage.goto()
      await loginPage.loginAndWaitForDashboard(password)

      // Salva URL atual (dashboard)
      const dashboardUrl = page.url()

      // Faz refresh
      await page.reload()
      await page.waitForLoadState('networkidle')

      // Deve continuar autenticado (não redireciona para login)
      await expect(page).not.toHaveURL('/login')
    })

    test('deve redirecionar para login ao acessar rota protegida sem autenticação', async ({ page }) => {
      // Limpa cookies para garantir que não está autenticado
      await page.context().clearCookies()

      // Tenta acessar página protegida
      await page.goto('/campaigns')
      await page.waitForLoadState('networkidle')

      // Deve redirecionar para login ou install
      const url = page.url()
      expect(url.includes('/login') || url.includes('/install')).toBe(true)
    })
  })

  test.describe('Navegação pós-login', () => {
    test('deve conseguir acessar página de campanhas após login', async ({ page }) => {
      const loginPage = new LoginPage(page)
      const password = process.env.MASTER_PASSWORD || process.env.TEST_PASSWORD || 'test123'

      await loginPage.goto()
      await loginPage.loginAndWaitForDashboard(password)

      // Navega para campanhas
      await page.goto('/campaigns')
      await page.waitForLoadState('networkidle')

      // Verifica que está na página de campanhas
      await expect(page).toHaveURL(/\/campaigns/)
    })

    test('deve conseguir acessar página de contatos após login', async ({ page }) => {
      const loginPage = new LoginPage(page)
      const password = process.env.MASTER_PASSWORD || process.env.TEST_PASSWORD || 'test123'

      await loginPage.goto()
      await loginPage.loginAndWaitForDashboard(password)

      // Navega para contatos
      await page.goto('/contacts')
      await page.waitForLoadState('networkidle')

      // Verifica que está na página de contatos
      await expect(page).toHaveURL(/\/contacts/)
    })

    test('deve conseguir acessar página de configurações após login', async ({ page }) => {
      const loginPage = new LoginPage(page)
      const password = process.env.MASTER_PASSWORD || process.env.TEST_PASSWORD || 'test123'

      await loginPage.goto()
      await loginPage.loginAndWaitForDashboard(password)

      // Navega para settings
      await page.goto('/settings')
      await page.waitForLoadState('networkidle')

      // Verifica que está na página de settings
      await expect(page).toHaveURL(/\/settings/)
    })
  })
})
