'use client'

/**
 * MessageInput - Editorial Minimal Design
 *
 * Design Philosophy:
 * - Ultra-clean input area
 * - Subtle borders and backgrounds
 * - Smooth micro-interactions
 * - Refined button states
 * - Inline shortcut autocomplete (/comando)
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { Send, Loader2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { QuickRepliesPopover } from './QuickRepliesPopover'
import type { InboxQuickReply } from '@/types'

export interface MessageInputProps {
  onSend: (content: string) => void
  isSending: boolean
  disabled?: boolean
  placeholder?: string
  quickReplies: InboxQuickReply[]
  quickRepliesLoading?: boolean
  /** Callback to refresh quick replies after CRUD operations */
  onRefreshQuickReplies?: () => void
  /** Conversation ID for AI suggestions */
  conversationId?: string | null
  /** Whether to show AI suggest button */
  showAISuggest?: boolean
}

export function MessageInput({
  onSend,
  isSending,
  disabled,
  placeholder = 'Escreva uma mensagem...',
  quickReplies,
  quickRepliesLoading,
  onRefreshQuickReplies,
  conversationId,
  showAISuggest = false,
}: MessageInputProps) {
  const [value, setValue] = useState('')
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false)
  const [suggestionNotes, setSuggestionNotes] = useState<string | null>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [selectedShortcutIndex, setSelectedShortcutIndex] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const autocompleteRef = useRef<HTMLDivElement>(null)

  // Detect shortcut pattern: /word at start or after space
  const shortcutMatch = useMemo(() => {
    // Match /word at the end of the input (what user is currently typing)
    const match = value.match(/(^|\s)\/([a-z0-9]*)$/i)
    if (!match) return null
    return {
      prefix: match[1], // space or empty
      query: match[2].toLowerCase(), // text after /
      fullMatch: match[0],
      startIndex: value.length - match[0].length,
    }
  }, [value])

  // Filter quick replies by shortcut
  const shortcutSuggestions = useMemo(() => {
    if (!shortcutMatch) return []
    const { query } = shortcutMatch

    // Only show suggestions for quick replies that have shortcuts
    return quickReplies
      .filter((qr) => qr.shortcut && qr.shortcut.toLowerCase().startsWith(query))
      .slice(0, 5) // Limit to 5 suggestions
  }, [shortcutMatch, quickReplies])

  // Reset selection when suggestions change
  useEffect(() => {
    setSelectedShortcutIndex(0)
  }, [shortcutSuggestions.length])

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
    }
  }, [value])

  // Handle send
  const handleSend = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || isSending || disabled) return

    onSend(trimmed)
    setValue('')
    setSuggestionNotes(null)

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [value, isSending, disabled, onSend])

  // Insert quick reply content (from popover)
  const handleQuickReplySelect = useCallback((content: string) => {
    setValue((prev) => {
      if (prev.trim()) {
        return `${prev.trimEnd()} ${content}`
      }
      return content
    })
    setTimeout(() => textareaRef.current?.focus(), 0)
  }, [])

  // Insert shortcut content (from autocomplete)
  const handleShortcutSelect = useCallback((qr: InboxQuickReply) => {
    if (!shortcutMatch) return

    // Replace the /shortcut with the content
    const beforeShortcut = value.slice(0, shortcutMatch.startIndex)
    const newValue = beforeShortcut.trimEnd() + (beforeShortcut ? ' ' : '') + qr.content

    setValue(newValue)
    setTimeout(() => textareaRef.current?.focus(), 0)
  }, [value, shortcutMatch])

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Handle autocomplete navigation
      if (shortcutSuggestions.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setSelectedShortcutIndex((prev) =>
            prev < shortcutSuggestions.length - 1 ? prev + 1 : 0
          )
          return
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSelectedShortcutIndex((prev) =>
            prev > 0 ? prev - 1 : shortcutSuggestions.length - 1
          )
          return
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault()
          handleShortcutSelect(shortcutSuggestions[selectedShortcutIndex])
          return
        }
        if (e.key === 'Escape') {
          // Clear the shortcut by removing the /
          setValue((prev) => prev.slice(0, -1))
          return
        }
      }

      // Ctrl/Cmd + Enter to send
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend, shortcutSuggestions, selectedShortcutIndex, handleShortcutSelect]
  )

  // AI Suggest handler
  const handleAISuggest = useCallback(async () => {
    if (!conversationId || isLoadingSuggestion || disabled) return

    setIsLoadingSuggestion(true)
    setSuggestionNotes(null)

    try {
      const response = await fetch('/api/inbox/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao gerar sugestão')
      }

      const data = await response.json()
      setValue(data.suggestion)

      if (data.notes) {
        setSuggestionNotes(data.notes)
      }

      setTimeout(() => {
        textareaRef.current?.focus()
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.value.length
          textareaRef.current.selectionEnd = textareaRef.current.value.length
        }
      }, 0)
    } catch (error) {
      console.error('[AI Suggest] Error:', error)
    } finally {
      setIsLoadingSuggestion(false)
    }
  }, [conversationId, isLoadingSuggestion, disabled])

  // Clear suggestion notes when value is cleared
  useEffect(() => {
    if (suggestionNotes && value.trim() === '') {
      setSuggestionNotes(null)
    }
  }, [value, suggestionNotes])

  const canSend = value.trim().length > 0 && !isSending && !disabled
  const canSuggest = showAISuggest && conversationId && !isLoadingSuggestion && !disabled

  return (
    <div className={cn(
      'border-t transition-colors duration-150',
      isFocused ? 'border-zinc-700/80' : 'border-zinc-800/50',
      'bg-zinc-950'
    )}>
      {/* AI Suggestion notes - subtle inline banner */}
      {suggestionNotes && (
        <div className="px-3 py-2 bg-zinc-900/50 border-b border-zinc-800/50">
          <div className="flex items-start gap-2">
            <Sparkles className="h-3 w-3 text-zinc-500 mt-0.5 shrink-0" />
            <p className="text-[11px] text-zinc-500 leading-relaxed">{suggestionNotes}</p>
          </div>
        </div>
      )}

      <div className="flex items-end gap-2 p-3">
        {/* Quick replies */}
        <QuickRepliesPopover
          quickReplies={quickReplies}
          onSelect={handleQuickReplySelect}
          isLoading={quickRepliesLoading}
          onRefresh={onRefreshQuickReplies}
        />

        {/* AI Suggest button */}
        {showAISuggest && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleAISuggest}
                disabled={!canSuggest}
                className={cn(
                  'h-9 w-9 shrink-0 rounded-lg flex items-center justify-center',
                  'transition-all duration-150',
                  isLoadingSuggestion && 'animate-pulse',
                  canSuggest
                    ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                    : 'text-zinc-600 cursor-not-allowed'
                )}
              >
                {isLoadingSuggestion ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              Sugestão IA
            </TooltipContent>
          </Tooltip>
        )}

        {/* Input area */}
        <div className="flex-1 relative">
          {/* Shortcut autocomplete dropdown */}
          {shortcutSuggestions.length > 0 && (
            <div
              ref={autocompleteRef}
              className="absolute bottom-full left-0 right-0 mb-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden z-50"
            >
              <div className="py-1">
                {shortcutSuggestions.map((qr, index) => (
                  <button
                    key={qr.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault() // Prevent blur
                      handleShortcutSelect(qr)
                    }}
                    onMouseEnter={() => setSelectedShortcutIndex(index)}
                    className={cn(
                      'w-full px-3 py-2 text-left transition-colors',
                      index === selectedShortcutIndex
                        ? 'bg-zinc-800'
                        : 'hover:bg-zinc-800/50'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                        /{qr.shortcut}
                      </span>
                      <span className="text-sm font-medium text-zinc-200 truncate">
                        {qr.title}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1 pl-0">
                      {qr.content}
                    </p>
                  </button>
                ))}
              </div>
              <div className="px-3 py-1.5 border-t border-zinc-800 bg-zinc-900/50">
                <p className="text-[10px] text-zinc-600">
                  <span className="text-zinc-500">↑↓</span> navegar
                  <span className="mx-2 text-zinc-700">·</span>
                  <span className="text-zinc-500">↵</span> selecionar
                  <span className="mx-2 text-zinc-700">·</span>
                  <span className="text-zinc-500">esc</span> fechar
                </p>
              </div>
            </div>
          )}

          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled || isSending || isLoadingSuggestion}
            rows={1}
            className={cn(
              'min-h-[36px] max-h-[100px] resize-none py-2 px-3',
              'bg-zinc-900/50 border-zinc-800/30 rounded-lg',
              'text-sm text-zinc-200 placeholder:text-zinc-500',
              'focus:border-zinc-700 focus:ring-0 focus:bg-zinc-900',
              'transition-all duration-100',
              disabled && 'opacity-40 cursor-not-allowed'
            )}
          />
        </div>

        {/* Send button - monochrome when disabled, subtle when active */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleSend}
              disabled={!canSend}
              className={cn(
                'h-9 w-9 shrink-0 rounded-lg flex items-center justify-center',
                'transition-all duration-150',
                canSend
                  ? 'bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95'
                  : 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed'
              )}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {canSend ? 'Enviar · ⌘↵' : 'Digite uma mensagem'}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
