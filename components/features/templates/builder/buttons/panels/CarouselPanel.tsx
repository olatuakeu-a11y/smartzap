'use client'

import React from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Spec } from '../types'

interface CarouselPanelProps {
  spec: Spec
  update: (patch: Partial<Spec>) => void
  carouselErrors: string[]
}

export function CarouselPanel({ spec, update, carouselErrors }: CarouselPanelProps) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const val = e.target.value.trim()
      update({ carousel: val ? JSON.parse(val) : null })
    } catch {
      // nao travar digitando
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
      <div className="text-sm font-semibold text-white">Carousel</div>
      <div className="text-xs text-gray-400">
        Editor visual completo do Carousel vem depois. Por enquanto, voce pode colar o JSON.
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-300">JSON (carousel)</label>
        <Textarea
          value={spec.carousel ? JSON.stringify(spec.carousel, null, 2) : ''}
          onChange={handleChange}
          className="bg-zinc-950/40 border-white/10 text-white min-h-28 font-mono text-xs"
          placeholder="Cole aqui um JSON de carousel (opcional)"
        />
      </div>

      {carouselErrors.length > 0 && (
        <div className="text-xs text-amber-300 space-y-1">
          {carouselErrors.map((err) => (
            <div key={err}>{err}</div>
          ))}
        </div>
      )}
    </div>
  )
}
