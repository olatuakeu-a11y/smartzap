import { Page, Locator, expect } from '@playwright/test'
import type { TestContact } from '../fixtures'

/**
 * Page Object para a página de Contatos
 * Atualizado baseado na UI real do SmartZap
 */
export class ContactsPage {
  readonly page: Page

  // Header e ações principais
  readonly pageTitle: Locator
  readonly newContactButton: Locator
  readonly importButton: Locator
  readonly customFieldsButton: Locator
  readonly deleteSelectedButton: Locator

  // Busca e filtros
  readonly searchInput: Locator
  readonly statusFilter: Locator
  readonly tagFilter: Locator
  readonly filterToggle: Locator
  readonly clearFiltersButton: Locator

  // Tabela/Lista
  readonly contactTable: Locator
  readonly contactRows: Locator
  readonly selectAllCheckbox: Locator
  readonly resultsInfo: Locator

  // Paginação
  readonly nextPageButton: Locator
  readonly previousPageButton: Locator

  // Modal de novo contato
  readonly contactModal: Locator
  readonly modalTitle: Locator
  readonly nameInput: Locator
  readonly phoneInput: Locator
  readonly emailInput: Locator
  readonly tagsInput: Locator
  readonly statusSelect: Locator
  readonly saveContactButton: Locator
  readonly saveChangesButton: Locator
  readonly cancelButton: Locator
  readonly closeModalButton: Locator

  // Loading state
  readonly loadingSpinner: Locator

  constructor(page: Page) {
    this.page = page

    // Header - textos exatos da UI
    this.pageTitle = page.getByRole('heading', { name: 'Contatos' })
    this.newContactButton = page.getByRole('button', { name: 'Novo Contato' })
    this.importButton = page.getByRole('button', { name: /importar/i })
      .or(page.locator('[aria-label="Importar contatos via arquivo CSV"]'))
    this.customFieldsButton = page.getByRole('button', { name: 'Campos personalizados' })
    this.deleteSelectedButton = page.locator('[aria-label*="Excluir"]').filter({ hasText: /excluir|delete/i })
      .or(page.getByRole('button', { name: /excluir.*selecionado/i }))

    // Busca e filtros - placeholders exatos
    this.searchInput = page.getByPlaceholder('Buscar por nome ou telefone...')
      .or(page.locator('[aria-label="Buscar contatos por nome ou telefone"]'))
    this.statusFilter = page.locator('[aria-label="Filtrar contatos por status"]')
    this.tagFilter = page.locator('[aria-label="Filtrar contatos por tag"]')
    this.filterToggle = page.locator('[aria-label*="filtros avançados"]')
    this.clearFiltersButton = page.getByRole('button', { name: 'Limpar filtros' })

    // Tabela
    this.contactTable = page.locator('[aria-label="Lista de contatos"]')
      .or(page.locator('table'))
    this.contactRows = page.locator('tbody tr')
    this.selectAllCheckbox = page.locator('#select-all')
      .or(page.locator('[aria-label="Selecionar todos os contatos"]'))
    this.resultsInfo = page.locator('text=Mostrando')

    // Paginação
    this.nextPageButton = page.getByRole('button', { name: /próxim|next/i })
    this.previousPageButton = page.getByRole('button', { name: /anterior|prev/i })

    // Modal/Formulário de contato (não usa role="dialog", é um formulário inline)
    this.contactModal = page.getByRole('heading', { name: 'Novo Contato', level: 2 })
      .or(page.getByRole('heading', { name: 'Editar Contato', level: 2 }))
    this.modalTitle = this.contactModal
    this.nameInput = page.getByPlaceholder('Ex: João Silva')
    this.phoneInput = page.getByPlaceholder('+55 11 99999-9999')
    this.emailInput = page.getByPlaceholder('email@exemplo.com')
    this.tagsInput = page.getByPlaceholder('VIP, Lead, Cliente')
    this.statusSelect = page.locator('[role="dialog"]').getByLabel('Status')
    this.saveContactButton = page.getByRole('button', { name: 'Salvar Contato' })
    this.saveChangesButton = page.getByRole('button', { name: 'Salvar Alterações' })
    this.cancelButton = page.getByRole('button', { name: 'Cancelar' })
    this.closeModalButton = page.locator('[aria-label*="Fechar formulário"]')
      .or(page.locator('[role="dialog"] button').filter({ has: page.locator('svg') }).first())

    // Loading
    this.loadingSpinner = page.locator('.animate-spin, [role="status"]')
  }

  /**
   * Navega para a página de contatos
   */
  async goto(): Promise<void> {
    await this.page.goto('/contacts')
    await this.waitForLoad()
  }

  /**
   * Aguarda a página carregar completamente
   */
  async waitForLoad(): Promise<void> {
    // Aguarda o título ou o campo de busca aparecer
    await this.page.waitForLoadState('networkidle')

    // Aguarda o spinner de loading desaparecer (se existir)
    try {
      await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 })
    } catch {
      // Se não tinha spinner, continua
    }

    // Aguarda apenas o título da página (sempre presente)
    await expect(this.pageTitle).toBeVisible({ timeout: 15000 })
  }

  /**
   * Abre o modal de novo contato
   */
  async openNewContactModal(): Promise<void> {
    await this.newContactButton.click()
    // Aguarda o heading "Novo Contato" e o campo de telefone ficarem visíveis
    await expect(this.page.getByRole('heading', { name: 'Novo Contato', level: 2 })).toBeVisible({ timeout: 5000 })
    await expect(this.phoneInput).toBeVisible({ timeout: 5000 })
  }

  /**
   * Cria um novo contato
   */
  async createContact(contact: TestContact): Promise<void> {
    await this.openNewContactModal()

    // Preenche nome (opcional)
    if (contact.name) {
      await this.nameInput.fill(contact.name)
    }

    // Preenche telefone (obrigatório)
    await this.phoneInput.fill(contact.phone)

    // Preenche email (opcional)
    if (contact.email) {
      await this.emailInput.fill(contact.email)
    }

    // Preenche tags (opcional)
    if (contact.tags && contact.tags.length > 0) {
      await this.tagsInput.fill(contact.tags.join(', '))
    }

    // Salva
    await this.saveContactButton.click()

    // Aguarda o modal fechar
    await this.contactModal.waitFor({ state: 'hidden', timeout: 10000 })

    // Aguarda a lista atualizar
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Busca um contato pelo nome ou telefone
   */
  async searchContact(query: string): Promise<void> {
    await this.searchInput.fill(query)
    // Aguarda debounce da busca (500ms) + network
    await this.page.waitForTimeout(600)
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Limpa a busca
   */
  async clearSearch(): Promise<void> {
    await this.searchInput.clear()
    await this.page.waitForTimeout(600)
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Verifica se um contato existe na lista
   */
  async contactExists(nameOrPhone: string): Promise<boolean> {
    await this.page.waitForLoadState('networkidle')
    const row = this.page.locator('tbody tr').filter({ hasText: nameOrPhone })
    const count = await row.count()
    return count > 0
  }

  /**
   * Obtém o número de contatos exibidos
   */
  async getContactCount(): Promise<number> {
    await this.page.waitForLoadState('networkidle')

    // Tenta obter do texto "Mostrando X de Y"
    try {
      const resultsText = await this.resultsInfo.textContent()
      const match = resultsText?.match(/Mostrando (\d+)/)
      if (match) {
        return parseInt(match[1], 10)
      }
    } catch {
      // Se não encontrar o texto, conta as linhas
    }

    return await this.contactRows.count()
  }

  /**
   * Clica no botão de editar de um contato específico
   */
  async editContact(nameOrPhone: string): Promise<void> {
    const row = this.page.locator('tbody tr').filter({ hasText: nameOrPhone })
    // O botão de editar é o primeiro na coluna de ações
    const editButton = row.locator('button').first()
    await editButton.click()
    await this.contactModal.waitFor({ state: 'visible', timeout: 5000 })
  }

  /**
   * Atualiza um contato existente
   */
  async updateContact(originalName: string, newData: Partial<TestContact>): Promise<void> {
    await this.editContact(originalName)

    if (newData.name) {
      await this.nameInput.clear()
      await this.nameInput.fill(newData.name)
    }

    if (newData.phone) {
      await this.phoneInput.clear()
      await this.phoneInput.fill(newData.phone)
    }

    if (newData.email) {
      await this.emailInput.clear()
      await this.emailInput.fill(newData.email)
    }

    await this.saveChangesButton.click()
    await this.contactModal.waitFor({ state: 'hidden', timeout: 10000 })
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Exclui um contato
   */
  async deleteContact(nameOrPhone: string): Promise<void> {
    const row = this.page.locator('tbody tr').filter({ hasText: nameOrPhone })
    // O botão de delete é o segundo (ou último) na coluna de ações
    const deleteButton = row.locator('button').last()
    await deleteButton.click()

    // Confirma exclusão no modal/dialog
    const confirmButton = this.page.getByRole('button', { name: /excluir|confirmar|sim/i })
    await confirmButton.click()

    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Seleciona todos os contatos da página
   */
  async selectAllContacts(): Promise<void> {
    await this.selectAllCheckbox.check()
  }

  /**
   * Filtra contatos por status
   */
  async filterByStatus(status: 'Todos Status' | 'Opt-in' | 'Opt-out' | 'Desconhecido' | 'Suprimidos'): Promise<void> {
    await this.statusFilter.click()
    await this.page.getByRole('option', { name: status }).click()
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Verifica se a página está visível
   */
  async isVisible(): Promise<boolean> {
    const url = this.page.url()
    return url.includes('/contacts')
  }
}
