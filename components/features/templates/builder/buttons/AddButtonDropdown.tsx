'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Plus, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ButtonType } from './types'

interface AddButtonDropdownProps {
  addButton: (type: ButtonType) => void
  canAddButtonType: (type: ButtonType) => { ok: boolean; reason?: string }
}

interface DropdownItemConfig {
  type: ButtonType
  label: string
  shortcut?: string
}

const MAIN_ITEMS: DropdownItemConfig[] = [
  { type: 'QUICK_REPLY', label: 'Resposta rapida', shortcut: 'ate 10' },
  { type: 'URL', label: 'Visitar site', shortcut: 'max 2' },
  { type: 'PHONE_NUMBER', label: 'Ligar', shortcut: 'max 1' },
  { type: 'COPY_CODE', label: 'Copiar codigo', shortcut: 'max 1' },
]

const ADVANCED_ITEMS: DropdownItemConfig[] = [
  { type: 'FLOW', label: 'MiniApp' },
  { type: 'OTP', label: 'OTP' },
  { type: 'CATALOG', label: 'Catalogo' },
  { type: 'MPM', label: 'MPM' },
  { type: 'VOICE_CALL', label: 'Chamada de voz' },
  { type: 'ORDER_DETAILS', label: 'Detalhes do pedido' },
  { type: 'SPM', label: 'SPM' },
  { type: 'SEND_LOCATION', label: 'Enviar localizacao' },
  { type: 'REMINDER', label: 'Lembrete' },
  { type: 'POSTBACK', label: 'Postback' },
  { type: 'EXTENSION', label: 'Extensao' },
]

export function AddButtonDropdown({ addButton, canAddButtonType }: AddButtonDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="border-white/10 bg-zinc-950/40 hover:bg-white/5"
        >
          <Plus className="w-4 h-4" />
          Adicionar botao
          <ChevronDown className="w-4 h-4 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10 text-white min-w-60">
        <DropdownMenuLabel className="text-xs text-gray-500 uppercase tracking-wider">
          Acoes
        </DropdownMenuLabel>
        
        {MAIN_ITEMS.map((item) => (
          <DropdownMenuItem
            key={item.type}
            onClick={() => addButton(item.type)}
            disabled={!canAddButtonType(item.type).ok}
            className="cursor-pointer hover:bg-white/5 focus:bg-white/5"
          >
            {item.label}
            {item.shortcut && <DropdownMenuShortcut>{item.shortcut}</DropdownMenuShortcut>}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator className="bg-white/10" />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="cursor-pointer hover:bg-white/5 focus:bg-white/5">
            Avancado
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="bg-zinc-900 border-white/10 text-white min-w-56">
            {ADVANCED_ITEMS.map((item) => (
              <DropdownMenuItem
                key={item.type}
                onClick={() => addButton(item.type)}
                disabled={!canAddButtonType(item.type).ok}
                className="cursor-pointer hover:bg-white/5 focus:bg-white/5"
              >
                {item.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
