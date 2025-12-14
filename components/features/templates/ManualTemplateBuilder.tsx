'use client'

import React from 'react'
import { z } from 'zod'
import { toast } from 'sonner'
import { CreateTemplateSchema } from '@/lib/whatsapp/validators/template.schema'
import { Button } from '@/components/ui/button'
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

type Spec = any

type HeaderFormat = 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'LOCATION'

type ButtonType =
  | 'QUICK_REPLY'
  | 'URL'
  | 'PHONE_NUMBER'
  | 'COPY_CODE'
  | 'OTP'
  | 'FLOW'
  | 'CATALOG'
  | 'MPM'
  | 'VOICE_CALL'

function ensureBaseSpec(input: unknown): Spec {
  const s = (input && typeof input === 'object') ? { ...(input as any) } : {}
  if (!s.name) s.name = 'novo_template'
  if (!s.language) s.language = 'pt_BR'
  if (!s.category) s.category = 'MARKETING'
  if (!s.parameter_format) s.parameter_format = 'positional'

  // body/content
  if (!s.body && typeof s.content === 'string') s.body = { text: s.content }
  if (!s.body) s.body = { text: '' }

  if (s.header === undefined) s.header = null
  if (s.footer === undefined) s.footer = null
  if (s.buttons === undefined) s.buttons = []
  if (s.carousel === undefined) s.carousel = null
  if (s.limited_time_offer === undefined) s.limited_time_offer = null

  return s
}

function variableCount(text: string): number {
  const matches = text.match(/\{\{[^}]+\}\}/g) || []
  const unique = new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))
  return unique.size
}

function defaultBodyExamples(text: string): string[][] | undefined {
  const n = variableCount(text)
  if (n <= 0) return undefined
  const row = Array.from({ length: n }, (_, i) => `Exemplo ${i + 1}`)
  return [row]
}

function Preview({ spec }: { spec: Spec }) {
  const header = spec.header
  const bodyText = spec.body?.text || ''
  const footerText = spec.footer?.text || ''
  const buttons: any[] = Array.isArray(spec.buttons) ? spec.buttons : []

  const headerLabel = (() => {
    if (!header) return null
    if (header.format === 'TEXT') return header.text || ''
    if (header.format === 'LOCATION') return 'LOCALIZAÇÃO'
    return `MÍDIA (${header.format})`
  })()

  return (
    <div className="glass-panel rounded-xl p-4">
      <div className="text-xs text-gray-400 mb-3">Prévia</div>
      <div className="rounded-xl border border-white/10 bg-zinc-950 p-4 space-y-3">
        {headerLabel ? (
          <div className="text-sm text-gray-200 font-medium">
            {headerLabel}
          </div>
        ) : null}

        <div className="text-sm text-white whitespace-pre-wrap">
          {bodyText || <span className="text-gray-500">(Sem texto no BODY)</span>}
        </div>

        {footerText ? (
          <div className="text-xs text-gray-400 whitespace-pre-wrap">{footerText}</div>
        ) : null}

        {buttons.length > 0 ? (
          <div className="pt-2 border-t border-white/10 space-y-2">
            {buttons.map((b, idx) => (
              <div key={idx} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-200">
                {b.text || (b.type === 'COPY_CODE' ? 'Copiar código' : b.type)}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function validateSpec(spec: Spec): { ok: boolean; message?: string } {
  const res = CreateTemplateSchema.safeParse(spec)
  if (res.success) return { ok: true }
  const first = res.error.issues[0]
  return { ok: false, message: first ? `${first.path.join('.')}: ${first.message}` : 'Spec inválido' }
}

export function ManualTemplateBuilder({
  id,
  initialSpec,
  onSpecChange,
  onSave,
  isSaving,
}: {
  id: string
  initialSpec: unknown
  onSpecChange: (spec: unknown) => void
  onSave: (spec: unknown) => void
  isSaving: boolean
}) {
  const [spec, setSpec] = React.useState<Spec>(() => ensureBaseSpec(initialSpec))

  React.useEffect(() => {
    setSpec(ensureBaseSpec(initialSpec))
  }, [initialSpec])

  const update = (patch: Partial<Spec>) => {
    setSpec((prev: any) => {
      const next = { ...prev, ...patch }
      onSpecChange(next)
      return next
    })
  }

  const updateHeader = (patch: any) => {
    setSpec((prev: any) => {
      const next = { ...prev, header: patch }
      onSpecChange(next)
      return next
    })
  }

  const updateFooter = (patch: any) => {
    setSpec((prev: any) => {
      const next = { ...prev, footer: patch }
      onSpecChange(next)
      return next
    })
  }

  const updateButtons = (buttons: any[]) => {
    setSpec((prev: any) => {
      const next = { ...prev, buttons }
      onSpecChange(next)
      return next
    })
  }

  const onClickValidate = () => {
    const v = validateSpec(spec)
    if (v.ok) toast.success('Validação OK (schema)')
    else toast.error(v.message || 'Spec inválido')
  }

  const onClickSave = () => {
    const v = validateSpec(spec)
    if (!v.ok) {
      toast.error(v.message || 'Spec inválido')
      return
    }
    onSave(spec)
  }

  const header: any = spec.header
  const buttons: any[] = Array.isArray(spec.buttons) ? spec.buttons : []

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="space-y-6">
        <div className="glass-panel rounded-xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-white">Configuração</div>
              <div className="text-xs text-gray-400">ID: <span className="font-mono">{id}</span></div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClickValidate} className="border-white/10 bg-zinc-900 hover:bg-white/5">Validar</Button>
              <Button onClick={onClickSave} disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar'}</Button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-300">Nome</label>
              <Input
                value={spec.name || ''}
                onChange={(e) => update({ name: e.target.value })}
                className="bg-zinc-900 border-white/10 text-white"
              />
              <p className="text-xs text-gray-500">Apenas <span className="font-mono">a-z 0-9 _</span></p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-300">Categoria</label>
              <Select value={spec.category} onValueChange={(v) => update({ category: v })}>
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
              <Select value={spec.language} onValueChange={(v) => update({ language: v })}>
                <SelectTrigger className="w-full bg-zinc-900 border-white/10 text-white">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt_BR">pt_BR</SelectItem>
                  <SelectItem value="en_US">en_US</SelectItem>
                  <SelectItem value="es_ES">es_ES</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-300">parameter_format</label>
              <Select value={spec.parameter_format || 'positional'} onValueChange={(v) => update({ parameter_format: v })}>
                <SelectTrigger className="w-full bg-zinc-900 border-white/10 text-white">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="positional">Positional ({'{{1}}'})</SelectItem>
                  <SelectItem value="named">Named ({'{{first_name}}'})</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-5 space-y-4">
          <div className="text-sm font-semibold text-white">Header</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-300">Formato</label>
              <Select
                value={header?.format || 'TEXT'}
                onValueChange={(v) => {
                  const format = v as HeaderFormat
                  if (format === 'TEXT') updateHeader({ format: 'TEXT', text: '', example: null })
                  else if (format === 'LOCATION') updateHeader({ format: 'LOCATION' })
                  else updateHeader({ format, example: { header_handle: [''] } })
                }}
              >
                <SelectTrigger className="w-full bg-zinc-900 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TEXT">TEXT</SelectItem>
                  <SelectItem value="IMAGE">IMAGE</SelectItem>
                  <SelectItem value="VIDEO">VIDEO</SelectItem>
                  <SelectItem value="DOCUMENT">DOCUMENT</SelectItem>
                  <SelectItem value="LOCATION">LOCATION</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-300">Ativar</label>
              <Select
                value={spec.header ? 'yes' : 'no'}
                onValueChange={(v) => {
                  if (v === 'no') update({ header: null })
                  else updateHeader({ format: 'TEXT', text: '', example: null })
                }}
              >
                <SelectTrigger className="w-full bg-zinc-900 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Sim</SelectItem>
                  <SelectItem value="no">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {spec.header && header?.format === 'TEXT' ? (
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-300">Texto</label>
              <Input
                value={header.text || ''}
                onChange={(e) => updateHeader({ ...header, text: e.target.value })}
                className="bg-zinc-900 border-white/10 text-white"
                placeholder="Ex.: Confirmação"
              />
            </div>
          ) : null}

          {spec.header && header && header.format && header.format !== 'TEXT' && header.format !== 'LOCATION' ? (
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-300">header_handle (mídia)</label>
              <Input
                value={header?.example?.header_handle?.[0] || ''}
                onChange={(e) => updateHeader({ ...header, example: { ...(header.example || {}), header_handle: [e.target.value] } })}
                className="bg-zinc-900 border-white/10 text-white"
                placeholder="Cole o handle da mídia aqui (upload resumable será automatizado)"
              />
              <p className="text-xs text-gray-500">
                Por enquanto, você pode colar o <span className="font-mono">header_handle</span>. Vou automatizar o upload em seguida.
              </p>
            </div>
          ) : null}
        </div>

        <div className="glass-panel rounded-xl p-5 space-y-4">
          <div className="text-sm font-semibold text-white">Body</div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-300">Texto</label>
            <Textarea
              value={spec.body?.text || ''}
              onChange={(e) => {
                const text = e.target.value
                const example = defaultBodyExamples(text)
                update({ body: { ...(spec.body || {}), text, example: example ? { body_text: example } : undefined } })
              }}
              className="bg-zinc-900 border-white/10 text-white min-h-32"
              placeholder="Digite o texto do BODY (obrigatório)"
            />
            <div className="text-xs text-gray-500">
              Variáveis detectadas: <span className="font-mono">{variableCount(spec.body?.text || '')}</span>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-5 space-y-4">
          <div className="text-sm font-semibold text-white">Footer</div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="border-white/10 bg-zinc-900 hover:bg-white/5"
              onClick={() => updateFooter(spec.footer ? null : { text: '' })}
            >
              {spec.footer ? 'Remover footer' : 'Adicionar footer'}
            </Button>
          </div>
          {spec.footer ? (
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-300">Texto</label>
              <Input
                value={spec.footer?.text || ''}
                onChange={(e) => updateFooter({ ...(spec.footer || {}), text: e.target.value })}
                className="bg-zinc-900 border-white/10 text-white"
              />
            </div>
          ) : null}
        </div>

        <div className="glass-panel rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm font-semibold text-white">Buttons</div>
            <Button
              variant="outline"
              className="border-white/10 bg-zinc-900 hover:bg-white/5"
              onClick={() => updateButtons([...buttons, { type: 'QUICK_REPLY', text: '' }])}
            >
              Adicionar botão
            </Button>
          </div>

          {buttons.length === 0 ? (
            <div className="text-sm text-gray-500">Nenhum botão</div>
          ) : (
            <div className="space-y-3">
              {buttons.map((b, idx) => (
                <div key={idx} className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-gray-200">Botão {idx + 1}</div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updateButtons(buttons.filter((_, i) => i !== idx))}
                    >
                      Remover
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-300">Tipo</label>
                      <Select
                        value={b.type}
                        onValueChange={(v) => {
                          const t = v as ButtonType
                          const next = [...buttons]
                          next[idx] = { type: t }
                          if (t === 'QUICK_REPLY' || t === 'URL' || t === 'PHONE_NUMBER' || t === 'FLOW' || t === 'CATALOG' || t === 'MPM' || t === 'VOICE_CALL') {
                            next[idx].text = ''
                          }
                          if (t === 'URL') next[idx].url = 'https://'
                          if (t === 'PHONE_NUMBER') next[idx].phone_number = ''
                          if (t === 'COPY_CODE') next[idx].example = 'CODE123'
                          if (t === 'OTP') next[idx].otp_type = 'COPY_CODE'
                          if (t === 'FLOW') next[idx].flow_id = ''
                          updateButtons(next)
                        }}
                      >
                        <SelectTrigger className="w-full bg-zinc-900 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="QUICK_REPLY">QUICK_REPLY</SelectItem>
                          <SelectItem value="URL">URL</SelectItem>
                          <SelectItem value="PHONE_NUMBER">PHONE_NUMBER</SelectItem>
                          <SelectItem value="COPY_CODE">COPY_CODE</SelectItem>
                          <SelectItem value="OTP">OTP</SelectItem>
                          <SelectItem value="FLOW">FLOW</SelectItem>
                          <SelectItem value="CATALOG">CATALOG</SelectItem>
                          <SelectItem value="MPM">MPM</SelectItem>
                          <SelectItem value="VOICE_CALL">VOICE_CALL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {b.type !== 'COPY_CODE' && b.type !== 'OTP' ? (
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-300">Texto</label>
                        <Input
                          value={b.text || ''}
                          onChange={(e) => {
                            const next = [...buttons]
                            next[idx] = { ...b, text: e.target.value }
                            updateButtons(next)
                          }}
                          className="bg-zinc-900 border-white/10 text-white"
                        />
                      </div>
                    ) : null}
                  </div>

                  {b.type === 'URL' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-300">URL</label>
                        <Input
                          value={b.url || ''}
                          onChange={(e) => {
                            const next = [...buttons]
                            next[idx] = { ...b, url: e.target.value }
                            updateButtons(next)
                          }}
                          className="bg-zinc-900 border-white/10 text-white"
                          placeholder="https://site.com/{{1}}"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-300">Exemplo (para URL dinâmica)</label>
                        <Input
                          value={(Array.isArray(b.example) ? b.example[0] : b.example) || ''}
                          onChange={(e) => {
                            const next = [...buttons]
                            next[idx] = { ...b, example: [e.target.value] }
                            updateButtons(next)
                          }}
                          className="bg-zinc-900 border-white/10 text-white"
                          placeholder="ex: 123"
                        />
                      </div>
                    </div>
                  ) : null}

                  {b.type === 'PHONE_NUMBER' ? (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-300">Telefone</label>
                      <Input
                        value={b.phone_number || ''}
                        onChange={(e) => {
                          const next = [...buttons]
                          next[idx] = { ...b, phone_number: e.target.value }
                          updateButtons(next)
                        }}
                        className="bg-zinc-900 border-white/10 text-white"
                        placeholder="5511999999999"
                      />
                    </div>
                  ) : null}

                  {b.type === 'COPY_CODE' ? (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-300">Exemplo</label>
                      <Input
                        value={(Array.isArray(b.example) ? b.example[0] : b.example) || ''}
                        onChange={(e) => {
                          const next = [...buttons]
                          next[idx] = { ...b, example: e.target.value }
                          updateButtons(next)
                        }}
                        className="bg-zinc-900 border-white/10 text-white"
                        placeholder="CUPOM10"
                      />
                    </div>
                  ) : null}

                  {b.type === 'OTP' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-300">otp_type</label>
                        <Select
                          value={b.otp_type || 'COPY_CODE'}
                          onValueChange={(v) => {
                            const next = [...buttons]
                            next[idx] = { ...b, otp_type: v }
                            updateButtons(next)
                          }}
                        >
                          <SelectTrigger className="w-full bg-zinc-900 border-white/10 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="COPY_CODE">COPY_CODE</SelectItem>
                            <SelectItem value="ONE_TAP">ONE_TAP</SelectItem>
                            <SelectItem value="ZERO_TAP">ZERO_TAP</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-300">Texto (opcional)</label>
                        <Input
                          value={b.text || ''}
                          onChange={(e) => {
                            const next = [...buttons]
                            next[idx] = { ...b, text: e.target.value }
                            updateButtons(next)
                          }}
                          className="bg-zinc-900 border-white/10 text-white"
                          placeholder="Copiar código"
                        />
                      </div>
                    </div>
                  ) : null}

                  {b.type === 'FLOW' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-300">flow_id</label>
                        <Input
                          value={b.flow_id || ''}
                          onChange={(e) => {
                            const next = [...buttons]
                            next[idx] = { ...b, flow_id: e.target.value }
                            updateButtons(next)
                          }}
                          className="bg-zinc-900 border-white/10 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-300">flow_action (opcional)</label>
                        <Select
                          value={b.flow_action || 'navigate'}
                          onValueChange={(v) => {
                            const next = [...buttons]
                            next[idx] = { ...b, flow_action: v }
                            updateButtons(next)
                          }}
                        >
                          <SelectTrigger className="w-full bg-zinc-900 border-white/10 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="navigate">navigate</SelectItem>
                            <SelectItem value="data_exchange">data_exchange</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ) : null}

                  <div className="text-xs text-gray-500">
                    Regras: URL máx 2, PHONE_NUMBER máx 1, COPY_CODE máx 1; QUICK_REPLY devem ficar juntos.
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={cn('glass-panel rounded-xl p-5 space-y-4', spec.category !== 'MARKETING' ? 'opacity-70' : '')}>
          <div className="text-sm font-semibold text-white">Limited Time Offer (Marketing)</div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="border-white/10 bg-zinc-900 hover:bg-white/5"
              onClick={() => update({ limited_time_offer: spec.limited_time_offer ? null : { text: '', has_expiration: true } })}
              disabled={spec.category !== 'MARKETING'}
            >
              {spec.limited_time_offer ? 'Remover' : 'Adicionar'}
            </Button>
          </div>
          {spec.limited_time_offer ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">Texto (máx 16)</label>
                <Input
                  value={spec.limited_time_offer.text || ''}
                  onChange={(e) => update({ limited_time_offer: { ...(spec.limited_time_offer || {}), text: e.target.value } })}
                  className="bg-zinc-900 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">has_expiration</label>
                <Select
                  value={String(!!spec.limited_time_offer.has_expiration)}
                  onValueChange={(v) => update({ limited_time_offer: { ...(spec.limited_time_offer || {}), has_expiration: v === 'true' } })}
                >
                  <SelectTrigger className="w-full bg-zinc-900 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">true</SelectItem>
                    <SelectItem value="false">false</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}
        </div>

        <div className={cn('glass-panel rounded-xl p-5 space-y-4', spec.category !== 'AUTHENTICATION' ? 'opacity-70' : '')}>
          <div className="text-sm font-semibold text-white">Autenticação (Auth)</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-300">message_send_ttl_seconds</label>
              <Input
                value={spec.message_send_ttl_seconds ?? ''}
                onChange={(e) => update({ message_send_ttl_seconds: e.target.value ? Number(e.target.value) : undefined })}
                className="bg-zinc-900 border-white/10 text-white"
                placeholder="ex: 300"
                disabled={spec.category !== 'AUTHENTICATION'}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-300">add_security_recommendation</label>
              <Select
                value={String(!!spec.add_security_recommendation)}
                onValueChange={(v) => update({ add_security_recommendation: v === 'true' })}
                disabled={spec.category !== 'AUTHENTICATION'}
              >
                <SelectTrigger className="w-full bg-zinc-900 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">true</SelectItem>
                  <SelectItem value="false">false</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-300">code_expiration_minutes</label>
              <Input
                value={spec.code_expiration_minutes ?? ''}
                onChange={(e) => update({ code_expiration_minutes: e.target.value ? Number(e.target.value) : undefined })}
                className="bg-zinc-900 border-white/10 text-white"
                placeholder="ex: 10"
                disabled={spec.category !== 'AUTHENTICATION'}
              />
            </div>
          </div>
        </div>

        {/* CAROUSEL (suporte inicial via JSON) */}
        <div className="glass-panel rounded-xl p-5 space-y-3">
          <div className="text-sm font-semibold text-white">Carousel</div>
          <div className="text-xs text-gray-500">
            Suporte completo ao Carousel exige editor de cards (2-10) + mídia (header_handle). Por enquanto, habilitei como edição avançada.
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-300">JSON (carousel)</label>
            <Textarea
              value={spec.carousel ? JSON.stringify(spec.carousel, null, 2) : ''}
              onChange={(e) => {
                try {
                  const val = e.target.value.trim()
                  update({ carousel: val ? JSON.parse(val) : null })
                } catch {
                  // não travar digitando
                }
              }}
              className="bg-zinc-900 border-white/10 text-white min-h-28 font-mono text-xs"
              placeholder="Cole aqui um JSON de carousel (opcional)"
            />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <Preview spec={spec} />

        <div className="glass-panel rounded-xl p-4">
          <div className="text-xs text-gray-400 mb-2">Spec (debug)</div>
          <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap break-words">
            {JSON.stringify(spec, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
