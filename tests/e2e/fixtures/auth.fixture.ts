import { test as base, expect, Page } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'

// Carrega .env.local nos workers usando process.cwd() (raiz do projeto)
const envPath = path.join(process.cwd(), '.env.local')
dotenv.config({ path: envPath, override: true })

// Debug: verifica o que foi carregado
console.log('🔑 MASTER_PASSWORD:', process.env.MASTER_PASSWORD ? `${process.env.MASTER_PASSWORD.length} chars` : 'NOT SET')

/**
 * Fixture de autenticação para testes E2E
 * Fornece uma página já autenticada para testes que precisam de login
 */

export type AuthFixtures = {
  authenticatedPage: Page
  loginAsUser: () => Promise<void>
}

/**
 * Realiza login na aplicação
 * @param page - Página do Playwright
 * @param password - Senha do MASTER_PASSWORD
 */
async function performLogin(page: Page, password: string): Promise<void> {
  await page.goto('/login')

  // Aguarda a página carregar
  await page.waitForLoadState('networkidle')

  // Preenche a senha
  const passwordInput = page.locator('input[type="password"]')
  await passwordInput.fill(password)

  // Clica no botão de login
  const submitButton = page.getByRole('button', { name: /entrar/i })
  await submitButton.click()

  // Aguarda redirecionamento para dashboard
  await expect(page).toHaveURL(/^\/$|\/campaigns|\/dashboard/, { timeout: 10000 })
}

/**
 * Verifica se está autenticado tentando acessar uma rota protegida
 */
async function isAuthenticated(page: Page): Promise<boolean> {
  const response = await page.goto('/')
  const url = page.url()
  return !url.includes('/login') && !url.includes('/install')
}

export const test = base.extend<AuthFixtures>({
  /**
   * Página já autenticada - útil para testes que precisam de login
   */
  authenticatedPage: async ({ page }, use) => {
    const password = process.env.MASTER_PASSWORD || process.env.TEST_PASSWORD || 'test123'

    // Realiza login
    await performLogin(page, password)

    // Disponibiliza a página autenticada para o teste
    await use(page)
  },

  /**
   * Função para fazer login manualmente durante o teste
   */
  loginAsUser: async ({ page }, use) => {
    const loginFn = async () => {
      const password = process.env.MASTER_PASSWORD || process.env.TEST_PASSWORD || 'test123'
      await performLogin(page, password)
    }

    await use(loginFn)
  },
})

export { expect }
