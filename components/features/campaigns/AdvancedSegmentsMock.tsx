import type { CustomFieldDefinition } from '@/types'

type AdvancedSegmentsMockProps = {
  customFields?: CustomFieldDefinition[]
}

export function AdvancedSegmentsMock({ customFields = [] }: AdvancedSegmentsMockProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950/40 p-5">
      <div className="text-xs uppercase tracking-widest text-gray-500">Ajustes finos</div>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-gray-500">Ultima interacao</label>
          <div className="flex flex-wrap gap-2">
            {['Abriu', 'Respondeu', 'Clicou'].map((label) => (
              <button
                key={label}
                className="rounded-full border border-white/10 bg-zinc-950/40 px-3 py-1 text-xs text-gray-300"
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {['7 dias', '30 dias', '90 dias'].map((label) => (
              <button
                key={label}
                className="rounded-full border border-white/10 bg-zinc-950/40 px-3 py-1 text-xs text-gray-300"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-gray-500">Janela de inatividade</label>
          <div className="flex flex-wrap gap-2">
            {['7 dias', '30 dias', '90 dias'].map((label) => (
              <button
                key={label}
                className="rounded-full border border-white/10 bg-zinc-950/40 px-3 py-1 text-xs text-gray-300"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-gray-500">Origem do contato</label>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Formulario', count: 88 },
              { label: 'Importacao', count: 109 },
              { label: 'API', count: 24 },
            ].map((chip) => (
              <button
                key={chip.label}
                className="rounded-full border border-white/10 bg-zinc-950/40 px-3 py-1 text-xs text-gray-300"
              >
                <span>{chip.label}</span>
                <sup className="ml-1 text-[8px] leading-none text-amber-300">{chip.count}</sup>
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-gray-500">Campos personalizados</label>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <select className="rounded-xl border border-white/10 bg-zinc-950/40 px-3 py-2 text-xs text-white">
              <option value="">Selecionar campo</option>
              {customFields.map((field) => (
                <option key={field.key} value={field.key}>
                  {field.label || field.key}
                </option>
              ))}
            </select>
            <select className="rounded-xl border border-white/10 bg-zinc-950/40 px-3 py-2 text-xs text-white">
              <option>Tem valor</option>
              <option>Igual a</option>
              <option>Contem</option>
            </select>
            <input
              className="rounded-xl border border-white/10 bg-zinc-950/40 px-3 py-2 text-xs text-white placeholder:text-gray-600"
              placeholder="Valor"
            />
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-400">
        <span className="uppercase tracking-widest text-gray-500">Excluir</span>
        {['Opt-out', 'Suprimidos', 'Duplicados'].map((label) => (
          <button
            key={label}
            className="rounded-full border border-white/10 bg-zinc-950/40 px-3 py-1 text-xs text-gray-300"
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-xs text-gray-500">Ajustes aplicados ao modo de combinacao atual.</p>
        <div className="flex items-center gap-2">
          <button className="rounded-full border border-white/10 px-3 py-2 text-xs text-gray-300">
            Limpar tudo
          </button>
          <button className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200">
            Aplicar
          </button>
        </div>
      </div>
    </div>
  )
}
