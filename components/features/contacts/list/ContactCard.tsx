'use client'

import React from 'react'
import { Edit2, Trash2, Tag, Check, User } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { StatusBadge } from '@/components/ui/status-badge'
import { Button } from '@/components/ui/button'
import { Contact, ContactStatus } from './types'
import { calculateRelativeTime, getContactInitials } from './utils'

// =============================================================================
// CONTACT CARD
// =============================================================================

interface ContactCardProps {
  contact: Contact
  isSelected: boolean
  showSuppressionDetails: boolean
  onToggleSelect: (id: string) => void
  onEdit: (contact: Contact) => void
  onDelete: (id: string) => void
}

export const ContactCard = React.memo(
  function ContactCard({
    contact,
    isSelected,
    showSuppressionDetails,
    onToggleSelect,
    onEdit,
    onDelete
  }: ContactCardProps) {
    const displayName = contact.name || contact.phone

    return (
      <div
        className={`p-4 border rounded-xl transition-colors ${
          isSelected
            ? 'border-primary-500/40 bg-primary-500/5'
            : 'border-white/10 bg-zinc-900/60 hover:bg-white/5'
        }`}
      >
        {/* Header: Checkbox, Avatar, Name, Status */}
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleSelect(contact.id)
            }}
            className={`mt-0.5 w-5 h-5 shrink-0 rounded border flex items-center justify-center transition-colors ${
              isSelected
                ? 'bg-primary-500 border-primary-500'
                : 'border-white/20 hover:border-white/40'
            }`}
            aria-label={isSelected ? 'Desmarcar' : 'Selecionar'}
          >
            {isSelected && <Check className="w-3 h-3 text-white" />}
          </button>

          {/* Avatar */}
          <div
            className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 border border-white/10 text-white flex items-center justify-center font-bold text-xs"
            aria-hidden="true"
          >
            {getContactInitials(displayName)}
          </div>

          {/* Name + Phone */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-white truncate">{displayName}</p>
            <p className="text-xs text-gray-500 font-mono">{contact.phone}</p>
          </div>

          {/* Status */}
          <div className="shrink-0">
            <StatusBadge
              status={
                contact.status === ContactStatus.OPT_IN
                  ? 'success'
                  : contact.status === ContactStatus.OPT_OUT
                    ? 'error'
                    : 'default'
              }
              size="sm"
            >
              {contact.status === ContactStatus.OPT_IN
                ? 'OPT_IN'
                : contact.status === ContactStatus.OPT_OUT
                  ? 'OPT_OUT'
                  : 'DESCONHECIDO'}
            </StatusBadge>
          </div>
        </div>

        {/* Tags */}
        {contact.tags.length > 0 && (
          <div className="mt-3 flex gap-1.5 flex-wrap">
            {contact.tags.map((tag, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium bg-zinc-800 text-gray-300 border border-white/5"
              >
                <Tag size={10} className="mr-1 opacity-50" /> {tag}
              </span>
            ))}
          </div>
        )}

        {/* Suppression details (optional) */}
        {showSuppressionDetails && contact.suppressionReason && (
          <div className="mt-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-xs text-red-300">{contact.suppressionReason}</p>
            {contact.suppressionSource && (
              <p className="text-[10px] text-red-400/60 mt-0.5">
                Fonte: {contact.suppressionSource}
              </p>
            )}
          </div>
        )}

        {/* Footer: Dates + Actions */}
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            <span>
              Criado: {contact.createdAt ? new Date(contact.createdAt).toLocaleDateString('pt-BR') : '-'}
            </span>
            <span className="mx-2">•</span>
            <span>
              {contact.updatedAt
                ? calculateRelativeTime(contact.updatedAt)
                : contact.createdAt
                  ? calculateRelativeTime(contact.createdAt)
                  : '-'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(contact)
                  }}
                  aria-label="Editar contato"
                >
                  <Edit2 size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Editar</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost-destructive"
                  size="icon-sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(contact.id)
                  }}
                  aria-label="Excluir contato"
                >
                  <Trash2 size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Excluir</p></TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    )
  },
  // Custom comparison
  (prev, next) => (
    prev.contact.id === next.contact.id &&
    prev.contact.updatedAt === next.contact.updatedAt &&
    prev.contact.status === next.contact.status &&
    prev.isSelected === next.isSelected &&
    prev.showSuppressionDetails === next.showSuppressionDetails
  )
)

// =============================================================================
// CONTACT CARD LIST
// =============================================================================

interface ContactCardListProps {
  contacts: Contact[]
  isLoading: boolean
  showSuppressionDetails: boolean
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onEditContact: (contact: Contact) => void
  onDeleteClick: (id: string) => void
}

export const ContactCardList: React.FC<ContactCardListProps> = ({
  contacts,
  isLoading,
  showSuppressionDetails,
  selectedIds,
  onToggleSelect,
  onEditContact,
  onDeleteClick
}) => {
  if (isLoading) {
    return (
      <div className="py-12 text-center text-gray-500">
        Carregando contatos...
      </div>
    )
  }

  if (contacts.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-3">
          <User size={24} className="text-gray-500" />
        </div>
        <p className="text-gray-400 font-medium">Nenhum contato encontrado</p>
        <p className="text-gray-600 text-sm mt-1">
          Tente ajustar os filtros ou importe novos contatos.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {contacts.map((contact) => (
        <ContactCard
          key={contact.id}
          contact={contact}
          isSelected={selectedIds.has(contact.id)}
          showSuppressionDetails={showSuppressionDetails}
          onToggleSelect={onToggleSelect}
          onEdit={onEditContact}
          onDelete={onDeleteClick}
        />
      ))}
    </div>
  )
}
