'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { flowJsonToFormSpec } from '@/lib/flow-form'
import { FLOW_TEMPLATES } from '@/lib/flow-templates'
import { TemplateImportDialogProps } from './types'

export function TemplateImportDialog({
  open,
  onOpenChange,
  flowName,
  onImported,
  onActionComplete,
}: TemplateImportDialogProps) {
  const [selectedKey, setSelectedKey] = useState<string>('')

  // Set default template when opening
  useEffect(() => {
    if (open && !selectedKey && FLOW_TEMPLATES.length > 0) {
      setSelectedKey(FLOW_TEMPLATES[0].key)
    }
  }, [open, selectedKey])

  const handleImport = () => {
    const tpl = FLOW_TEMPLATES.find((t) => t.key === selectedKey)
    if (!tpl) return

    const nextForm = flowJsonToFormSpec(tpl.flowJson, flowName || 'MiniApp')
    onImported(nextForm)
    onOpenChange(false)
    toast.success('Modelo importado. Revise e salve quando estiver pronto.')
    onActionComplete?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar modelo pronto</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Isso substitui o formulário atual. Você pode editar depois.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-[360px] overflow-auto pr-1">
          {FLOW_TEMPLATES.map((tpl) => (
            <label
              key={tpl.key}
              className={`flex items-start gap-3 rounded-xl border px-4 py-3 cursor-pointer transition ${
                selectedKey === tpl.key
                  ? 'border-emerald-400/40 bg-emerald-500/10'
                  : 'border-white/10 bg-zinc-900/60 hover:bg-white/5'
              }`}
            >
              <input
                type="radio"
                name="flow_template"
                className="mt-1 h-4 w-4 accent-emerald-400"
                checked={selectedKey === tpl.key}
                onChange={() => setSelectedKey(tpl.key)}
              />
              <div>
                <div className="text-sm font-semibold text-white">{tpl.name}</div>
                <div className="text-xs text-gray-400">{tpl.description}</div>
              </div>
            </label>
          ))}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="border-white/10 bg-zinc-900 hover:bg-white/5"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="button" disabled={!selectedKey} onClick={handleImport}>
            Usar modelo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
