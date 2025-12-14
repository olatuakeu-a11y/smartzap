'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { FileText, RefreshCw, Plus, Trash2, Send, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { ManualDraftTemplate } from '@/hooks/useManualDrafts'

function categoryLabel(category: string): string {
  switch (category) {
    case 'MARKETING':
      return 'Marketing'
    case 'UTILITY':
      return 'Utilidade'
    case 'AUTHENTICATION':
      return 'Autenticação'
    default:
      return category
  }
}

export function ManualDraftsView({
  drafts,
  isLoading,
  isRefreshing,
  search,
  setSearch,
  onRefresh,
  onCreate,
  isCreating,
  onDelete,
  isDeleting,
  onUpdate,
  isUpdating,
  onSubmit,
  isSubmitting,
  normalizeName,
}: {
  drafts: ManualDraftTemplate[]
  isLoading: boolean
  isRefreshing: boolean
  search: string
  setSearch: (v: string) => void
  onRefresh: () => void
  onCreate: (input: { name: string; category: string; language: string; parameterFormat: 'positional' | 'named' }) => void
  isCreating: boolean
  onDelete: (id: string) => void
  isDeleting: boolean
  onUpdate: (id: string, patch: { spec: unknown }) => void
  isUpdating: boolean
  onSubmit: (id: string) => void
  isSubmitting: boolean
  normalizeName: (input: string) => string
}) {
  const router = useRouter()
  const [newName, setNewName] = React.useState('')
  const [newCategory, setNewCategory] = React.useState<'MARKETING' | 'UTILITY' | 'AUTHENTICATION'>('MARKETING')
  const [newLanguage, setNewLanguage] = React.useState<'pt_BR' | 'en_US' | 'es_ES'>('pt_BR')
  const [newParameterFormat, setNewParameterFormat] = React.useState<'positional' | 'named'>('positional')
  const [createOpen, setCreateOpen] = React.useState(false)


  const canSubmit = (draft: ManualDraftTemplate): boolean => {
    const spec = (draft.spec || {}) as any
    const bodyText = typeof spec?.body?.text === 'string' ? spec.body.text : (typeof spec?.content === 'string' ? spec.content : '')
    return bodyText.trim().length > 0
  }

  const handleCreate = () => {
    const normalized = normalizeName(newName)
    if (!normalized) return
    onCreate({
      name: newName,
      category: newCategory,
      language: newLanguage,
      parameterFormat: newParameterFormat,
    })
    setCreateOpen(false)
    setNewName('')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-200">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Rascunhos Manuais</h2>
            <p className="text-sm text-gray-400">Somente templates locais em status DRAFT.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="border-white/10 bg-zinc-900 hover:bg-white/5"
          >
            <RefreshCw className={cn('w-4 h-4', isRefreshing ? 'animate-spin' : '')} />
            Atualizar
          </Button>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button disabled={isCreating}>
                <Plus className="w-4 h-4" />
                Novo rascunho
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border border-white/10">
              <DialogHeader>
                <DialogTitle className="text-white">Criar rascunho manual</DialogTitle>
                <DialogDescription>
                  Configure como na Meta: categoria, idioma e formato de variáveis.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-300">Nome do template</label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="meu_template_01"
                    className="bg-zinc-900 border-white/10 text-white"
                  />
                  <p className="text-xs text-gray-500">
                    Normalizado: <span className="font-mono">{normalizeName(newName) || '-'}</span>
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-300">Categoria</label>
                  <Select value={newCategory} onValueChange={(v) => setNewCategory(v as any)}>
                    <SelectTrigger className="w-full bg-zinc-900 border-white/10 text-white">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MARKETING">Marketing</SelectItem>
                      <SelectItem value="UTILITY">Utilidade</SelectItem>
                      <SelectItem value="AUTHENTICATION">Autenticação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-300">Idioma</label>
                  <Select value={newLanguage} onValueChange={(v) => setNewLanguage(v as any)}>
                    <SelectTrigger className="w-full bg-zinc-900 border-white/10 text-white">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt_BR">Português (Brasil) — pt_BR</SelectItem>
                      <SelectItem value="en_US">English (US) — en_US</SelectItem>
                      <SelectItem value="es_ES">Español — es_ES</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-300">Formato de variáveis</label>
                  <Select value={newParameterFormat} onValueChange={(v) => setNewParameterFormat(v as any)}>
                    <SelectTrigger className="w-full bg-zinc-900 border-white/10 text-white">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="positional">Positional ({'{{1}}'}, {'{{2}}'})</SelectItem>
                      <SelectItem value="named">Named ({'{{first_name}}'})</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Dica: URL dinâmica em botões funciona melhor com <span className="font-mono">positional</span>.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)} className="border-white/10 bg-zinc-900 hover:bg-white/5">
                  Cancelar
                </Button>
                <Button onClick={handleCreate} disabled={!normalizeName(newName) || isCreating}>
                  {isCreating ? 'Criando...' : 'Criar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="glass-panel p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar rascunhos..."
          className="bg-zinc-900 border border-white/5 rounded-lg px-4 py-2.5 text-sm w-full sm:w-96 text-white placeholder-gray-600 outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50"
        />
        <div className="text-xs text-gray-400">{drafts.length} rascunho(s)</div>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 border-b border-white/5 text-gray-400 uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4 font-medium">Nome</th>
                <th className="px-6 py-4 font-medium">Categoria</th>
                <th className="px-6 py-4 font-medium">Idioma</th>
                <th className="px-6 py-4 font-medium">Atualizado</th>
                <th className="px-6 py-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-400">Carregando...</td>
                </tr>
              ) : drafts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">Nenhum rascunho ainda.</td>
                </tr>
              ) : (
                drafts.map((d) => (
                  <tr key={d.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{d.name}</div>
                      <div className="text-xs text-gray-500 font-mono">{d.id}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{categoryLabel(d.category)}</td>
                    <td className="px-6 py-4 text-gray-300 font-mono">{d.language}</td>
                    <td className="px-6 py-4 text-gray-400">{new Date(d.updatedAt).toLocaleString('pt-BR')}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/templates/drafts/${encodeURIComponent(d.id)}`)}
                          disabled={isUpdating}
                          className="border-white/10 bg-zinc-900 hover:bg-white/5"
                          title="Abrir editor completo (estilo Meta)"
                        >
                          <Pencil className="w-4 h-4" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onSubmit(d.id)}
                          disabled={isSubmitting || !canSubmit(d)}
                          className="border-white/10 bg-zinc-900 hover:bg-white/5"
                          title={canSubmit(d) ? 'Enviar para a Meta (criar template)' : 'Edite o BODY antes de enviar'}
                        >
                          <Send className="w-4 h-4" />
                          Enviar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onDelete(d.id)}
                          disabled={isDeleting}
                          title="Excluir rascunho"
                        >
                          <Trash2 className="w-4 h-4" />
                          Excluir
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        Dica: clique em <strong>Editar</strong> para abrir o builder completo (Header/Body/Footer/Botões/Preview) e depois envie para a Meta.
      </div>
    </div>
  )
}
