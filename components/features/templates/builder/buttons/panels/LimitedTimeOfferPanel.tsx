'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spec } from '../types'

interface LimitedTimeOfferPanelProps {
  spec: Spec
  header: any
  update: (patch: Partial<Spec>) => void
  limitedTimeOfferTextMissing: boolean
  limitedTimeOfferTextTooLong: boolean
  limitedTimeOfferCategoryInvalid: boolean
}

export function LimitedTimeOfferPanel({
  spec,
  header,
  update,
  limitedTimeOfferTextMissing,
  limitedTimeOfferTextTooLong,
  limitedTimeOfferCategoryInvalid,
}: LimitedTimeOfferPanelProps) {
  const handleToggle = () => {
    if (spec.limited_time_offer) {
      update({ limited_time_offer: null })
      return
    }

    const next: Partial<Spec> = { limited_time_offer: { text: '', has_expiration: true } }
    if (spec.footer) next.footer = null
    if (header?.format && !['IMAGE', 'VIDEO'].includes(String(header.format))) {
      next.header = null
    }

    update(next)
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    update({
      limited_time_offer: {
        ...(spec.limited_time_offer || {}),
        text: e.target.value,
      },
    })
  }

  const handleExpirationChange = (v: string) => {
    update({
      limited_time_offer: {
        ...(spec.limited_time_offer || {}),
        has_expiration: v === 'true',
      },
    })
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
      <div className="text-sm font-semibold text-white">Limited Time Offer</div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="border-white/10 bg-zinc-950/40 hover:bg-white/5"
          onClick={handleToggle}
        >
          {spec.limited_time_offer ? 'Remover' : 'Adicionar'}
        </Button>
      </div>

      {spec.limited_time_offer && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-300">Texto (max 16)</label>
              <Input
                value={spec.limited_time_offer.text || ''}
                onChange={handleTextChange}
                className="bg-zinc-950/40 border-white/10 text-white"
                maxLength={16}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-300">has_expiration</label>
              <Select
                value={String(!!spec.limited_time_offer.has_expiration)}
                onValueChange={handleExpirationChange}
              >
                <SelectTrigger className="w-full bg-zinc-950/40 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">true</SelectItem>
                  <SelectItem value="false">false</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="text-xs text-gray-500">
            Regras: body max 600, cabecalho so imagem/video, sem rodape, COPY_CODE max 15.
          </div>

          {limitedTimeOfferTextTooLong && (
            <div className="text-xs text-amber-300">Texto do LTO deve ter ate 16 caracteres.</div>
          )}
          {limitedTimeOfferTextMissing && (
            <div className="text-xs text-amber-300">Texto do LTO e obrigatorio.</div>
          )}
          {limitedTimeOfferCategoryInvalid && (
            <div className="text-xs text-amber-300">Limited Time Offer so e permitido em Marketing.</div>
          )}
        </>
      )}
    </div>
  )
}
