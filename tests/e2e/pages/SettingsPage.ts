import { Page, Locator, expect } from '@playwright/test'
import type { TestCredentials } from '../fixtures'

/**
 * Page Object para a página de Configurações
 * Atualizado baseado na UI real do SmartZap
 *
 * A página tem dois estados:
 * 1. Conectado (Sistema Online) - mostra status e botões Editar/Desconectar
 * 2. Desconectado ou Editando - mostra formulário de credenciais
 */
export class SettingsPage {
  readonly page: Page

  // Título da página
  readonly pageTitle: Locator
  readonly pageDescription: Locator

  // Status Card (quando conectado)
  readonly statusCard: Locator
  readonly statusTitle: Locator
  readonly editButton: Locator
  readonly disconnectButton: Locator
  readonly limitsInfo: Locator
  readonly qualityBadge: Locator

  // Formulário de credenciais (quando desconectado ou editando)
  readonly credentialsForm: Locator
  readonly phoneNumberIdInput: Locator
  readonly wabaIdInput: Locator
  readonly accessTokenInput: Locator
  readonly metaAppIdInput: Locator

  // Botões de ação do formulário
  readonly testConnectionButton: Locator
  readonly saveConfigButton: Locator
  readonly cancelEditButton: Locator

  // Seções adicionais
  readonly webhooksSection: Locator
  readonly testContactSection: Locator

  // Feedback
  readonly successToast: Locator
  readonly errorToast: Locator

  // Loading
  readonly loadingSpinner: Locator

  constructor(page: Page) {
    this.page = page

    // Título
    this.pageTitle = page.getByRole('heading', { name: 'Configurações' })
    this.pageDescription = page.locator('text=Gerencie sua conexão com a WhatsApp Business API')

    // Status Card
    this.statusCard = page.locator('text=Sistema Online').or(page.locator('text=Desconectado'))
    this.statusTitle = page.locator('h3, h4').filter({ hasText: /Sistema Online|Desconectado/ })
    // Botão específico do card de WhatsApp (há outro "Editar" no Google Calendar)
    this.editButton = page.getByRole('button', { name: 'Editar configurações' })
    this.disconnectButton = page.getByRole('button', { name: 'Desconectar' })
      .or(page.locator('[aria-label="Desconectar conta do WhatsApp"]'))
    this.limitsInfo = page.locator('text=Limite:')
    this.qualityBadge = page.locator('text=Qualidade:')

    // Formulário de credenciais - placeholders exatos
    this.credentialsForm = page.locator('text=Configuracao da API').or(page.locator('form'))
    this.phoneNumberIdInput = page.getByPlaceholder('ex: 298347293847')
    this.wabaIdInput = page.getByPlaceholder('ex: 987234987234')
    this.accessTokenInput = page.getByPlaceholder('EAAG........')
    this.metaAppIdInput = page.getByPlaceholder('ex: 123456789012345')

    // Botões do formulário
    this.testConnectionButton = page.getByRole('button', { name: /Testar Conexao|Testando/i })
    this.saveConfigButton = page.getByRole('button', { name: /Salvar Config|Salvando/i })
    this.cancelEditButton = page.getByRole('button', { name: 'Cancelar' })
      .or(page.locator('[aria-label*="Cancelar edição"]'))

    // Seções
    this.webhooksSection = page.locator('text=Webhooks')
    this.testContactSection = page.locator('text=Contato de Teste')

    // Toasts (Sonner)
    this.successToast = page.locator('[data-sonner-toast]').filter({ hasText: /sucesso|salvo|conectado/i })
    this.errorToast = page.locator('[data-sonner-toast]').filter({ hasText: /erro|falha|error/i })

    // Loading
    this.loadingSpinner = page.locator('.animate-spin')
  }

  /**
   * Navega para a página de configurações
   */
  async goto(): Promise<void> {
    await this.page.goto('/settings')
    await this.waitForLoad()
  }

  /**
   * Aguarda a página carregar completamente
   */
  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle')

    // Aguarda apenas o título da página (sempre presente)
    await expect(this.pageTitle).toBeVisible({ timeout: 15000 })
  }

  /**
   * Verifica se o sistema está conectado
   */
  async isConnected(): Promise<boolean> {
    try {
      await this.page.locator('text=Sistema Online').waitFor({ state: 'visible', timeout: 3000 })
      return true
    } catch {
      return false
    }
  }

  /**
   * Verifica se o formulário de credenciais está visível
   */
  async isFormVisible(): Promise<boolean> {
    try {
      await this.phoneNumberIdInput.waitFor({ state: 'visible', timeout: 3000 })
      return true
    } catch {
      return false
    }
  }

  /**
   * Clica em Editar para mostrar o formulário (quando conectado)
   */
  async clickEdit(): Promise<void> {
    await this.editButton.click()
    // Aguarda o formulário aparecer
    await expect(this.phoneNumberIdInput).toBeVisible({ timeout: 5000 })
  }

  /**
   * Cancela a edição
   */
  async cancelEdit(): Promise<void> {
    await this.cancelEditButton.click()
    // Aguarda voltar ao estado de visualização
    await expect(this.editButton).toBeVisible({ timeout: 5000 })
  }

  /**
   * Preenche as credenciais do WhatsApp
   */
  async fillCredentials(credentials: TestCredentials): Promise<void> {
    // Se está conectado, precisa clicar em Editar primeiro
    const isConnected = await this.isConnected()
    if (isConnected) {
      const isFormVisible = await this.isFormVisible()
      if (!isFormVisible) {
        await this.clickEdit()
      }
    }

    // Preenche Phone Number ID
    await this.phoneNumberIdInput.clear()
    await this.phoneNumberIdInput.fill(credentials.phoneNumberId)

    // Preenche WABA ID
    await this.wabaIdInput.clear()
    await this.wabaIdInput.fill(credentials.wabaId)

    // Preenche Access Token
    await this.accessTokenInput.clear()
    await this.accessTokenInput.fill(credentials.accessToken)

    // Preenche Meta App ID se fornecido
    if (credentials.metaAppId) {
      await this.metaAppIdInput.clear()
      await this.metaAppIdInput.fill(credentials.metaAppId)
    }
  }

  /**
   * Salva as configurações
   */
  async save(): Promise<void> {
    await this.saveConfigButton.click()
  }

  /**
   * Salva e aguarda feedback
   */
  async saveAndWait(): Promise<void> {
    await this.save()
    // Aguarda algum feedback (toast ou mudança de estado)
    await this.page.waitForTimeout(2000)
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Testa a conexão com a API do WhatsApp
   */
  async testConnection(): Promise<void> {
    await this.testConnectionButton.click()
    // Aguarda o teste completar
    await this.page.waitForTimeout(3000)
  }

  /**
   * Desconecta da API do WhatsApp
   */
  async disconnect(): Promise<void> {
    await this.disconnectButton.click()
    // Pode haver confirmação
    const confirmButton = this.page.getByRole('button', { name: /confirmar|sim/i })
    try {
      await confirmButton.click({ timeout: 2000 })
    } catch {
      // Se não há confirmação, continua
    }
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Verifica se a página está visível
   */
  async isVisible(): Promise<boolean> {
    const url = this.page.url()
    return url.includes('/settings')
  }

  /**
   * Obtém o status de conexão visível
   */
  async getConnectionStatus(): Promise<'online' | 'offline' | 'unknown'> {
    try {
      const onlineVisible = await this.page.locator('text=Sistema Online').isVisible()
      if (onlineVisible) return 'online'

      const offlineVisible = await this.page.locator('text=Desconectado').isVisible()
      if (offlineVisible) return 'offline'

      return 'unknown'
    } catch {
      return 'unknown'
    }
  }
}
