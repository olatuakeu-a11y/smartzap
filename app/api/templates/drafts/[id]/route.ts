import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'

const PatchDraftSchema = z
  .object({
    name: z
      .string()
      .min(1)
      .max(512)
      .regex(/^[a-z0-9_]+$/, 'Nome: apenas letras minúsculas, números e underscore')
      .optional(),
    language: z.string().optional(),
    category: z.enum(['UTILITY', 'MARKETING', 'AUTHENTICATION']).optional(),
    parameterFormat: z.enum(['positional', 'named']).optional(),
    spec: z.unknown().optional(),
  })
  .strict()

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  try {
    const { data, error } = await supabase
      .from('templates')
      .select('id,name,language,category,status,updated_at,created_at,parameter_format,components')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'Rascunho não encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      id: data.id,
      name: data.name,
      language: data.language || 'pt_BR',
      category: data.category || 'UTILITY',
      status: data.status || 'DRAFT',
      updatedAt: data.updated_at || data.created_at || new Date().toISOString(),
      parameterFormat: (data as any).parameter_format || undefined,
      spec: data.components,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  try {
    const json = await req.json()
    const patch = PatchDraftSchema.parse(json)
    const now = new Date().toISOString()

    const update: Record<string, unknown> = { updated_at: now }
    if (patch.name) update.name = patch.name
    if (patch.language) update.language = patch.language
    if (patch.category) update.category = patch.category
    if (patch.parameterFormat) (update as any).parameter_format = patch.parameterFormat
    if (patch.spec !== undefined) update.components = patch.spec

    // Tentativa 1 (schema novo)
    const attempt1 = await supabase
      .from('templates')
      .update(update as any)
      .eq('id', id)
      .select('id,name,language,category,status,updated_at,created_at,parameter_format,components')
      .single()

    if (attempt1.error) {
      const msg = String(attempt1.error.message || '')
      const missingColumn = msg.includes('column') && msg.includes('parameter_format')
      if (!missingColumn) {
        return NextResponse.json({ error: attempt1.error.message }, { status: 500 })
      }

      // Fallback para schema antigo
      const { parameter_format, ...legacyUpdate } = update as any
      const attempt2 = await supabase
        .from('templates')
        .update(legacyUpdate)
        .eq('id', id)
        .select('id,name,language,category,status,updated_at,created_at,components')
        .single()

      if (attempt2.error) {
        return NextResponse.json({ error: attempt2.error.message }, { status: 500 })
      }

      return NextResponse.json({
        id: attempt2.data.id,
        name: attempt2.data.name,
        language: attempt2.data.language || 'pt_BR',
        category: attempt2.data.category || 'UTILITY',
        status: attempt2.data.status || 'DRAFT',
        updatedAt: attempt2.data.updated_at || attempt2.data.created_at || now,
        spec: attempt2.data.components,
      })
    }

    return NextResponse.json({
      id: attempt1.data.id,
      name: attempt1.data.name,
      language: attempt1.data.language || 'pt_BR',
      category: attempt1.data.category || 'UTILITY',
      status: attempt1.data.status || 'DRAFT',
      updatedAt: attempt1.data.updated_at || attempt1.data.created_at || now,
      parameterFormat: (attempt1.data as any).parameter_format || undefined,
      spec: attempt1.data.components,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  try {
    const { error } = await supabase.from('templates').delete().eq('id', id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}
