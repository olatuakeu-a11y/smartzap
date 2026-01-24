import { Page, Locator, expect } from '@playwright/test'

/**
 * Page Object para a página de Login
 * Encapsula todos os seletores e ações relacionadas ao login
 */
export class LoginPage {
  readonly page: Page

  // Elementos da página
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly togglePasswordButton: Locator
  readonly errorMessage: Locator
  readonly localModeAlert: Locator

  constructor(page: Page) {
    this.page = page

    // Input de senha
    this.passwordInput = page.locator('input[type="password"]')

    // Botão de submit (busca por texto "Entrar")
    this.submitButton = page.getByRole('button', { name: /entrar/i })

    // Toggle de visibilidade da senha
    this.togglePasswordButton = page.locator('button[type="button"]').filter({ has: page.locator('svg') })

    // Mensagem de erro (aparece em casos de falha)
    this.errorMessage = page.locator('p').filter({ hasText: /erro|incorreta|inválid/i })

    // Alerta de modo local (aparece em localhost)
    this.localModeAlert = page.locator('text=Configuração local')
  }

  /**
   * Navega para a página de login
   */
  async goto(): Promise<void> {
    await this.page.goto('/login')
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Realiza login com a senha fornecida
   */
  async login(password: string): Promise<void> {
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }

  /**
   * Realiza login e aguarda redirecionamento para dashboard
   */
  async loginAndWaitForDashboard(password: string): Promise<void> {
    await this.login(password)
    // Aguarda sair da página de login (redirecionamento pode ir para / ou /campaigns)
    await expect(this.page).not.toHaveURL(/\/login/, { timeout: 10000 })
  }

  /**
   * Verifica se a página de login está visível
   */
  async isVisible(): Promise<boolean> {
    await this.page.waitForLoadState('domcontentloaded')
    return await this.passwordInput.isVisible()
  }

  /**
   * Obtém a mensagem de erro exibida
   */
  async getErrorMessage(): Promise<string | null> {
    try {
      await this.errorMessage.waitFor({ state: 'visible', timeout: 3000 })
      return await this.errorMessage.textContent()
    } catch {
      return null
    }
  }

  /**
   * Verifica se está em modo local (localhost)
   */
  async isLocalMode(): Promise<boolean> {
    try {
      await this.localModeAlert.waitFor({ state: 'visible', timeout: 2000 })
      return true
    } catch {
      return false
    }
  }

  /**
   * Alterna visibilidade da senha
   */
  async togglePasswordVisibility(): Promise<void> {
    await this.togglePasswordButton.first().click()
  }

  /**
   * Verifica se a senha está visível (input type="text")
   */
  async isPasswordVisible(): Promise<boolean> {
    const inputType = await this.page.locator('input[name="password"]').getAttribute('type')
    return inputType === 'text'
  }
}
