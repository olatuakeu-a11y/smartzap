import {
  Activity,
  Beaker,
  Bot,
  Clock,
  Coins,
  Database,
  ExternalLink,
  FileText,
  FormInput,
  KeyRound,
  MessageSquareText,
  Play,
  ShieldCheck,
  Sliders,
  Sparkles,
  ToggleRight,
  Wand2,
  Zap,
} from 'lucide-react'
import { Page, PageActions, PageDescription, PageHeader, PageTitle } from '@/components/ui/page'

type PromptItem = {
  id: string
  title: string
  description: string
  path: string
  variables: string[]
  rows?: number
  value: string
  Icon: typeof FileText
}

const PROMPTS: PromptItem[] = [
  {
    id: 'template-short',
    title: 'Mensagem curta (WhatsApp)',
    description: 'Usado para gerar textos rápidos de campanha.',
    path: '/api/ai/generate-template',
    variables: ['{{prompt}}', '{{1}}'],
    rows: 7,
    value: `Crie uma mensagem de WhatsApp curta, profissional e persuasiva baseada neste pedido: "{{prompt}}".
Regras:
1. Use a variável {{1}} para o nome do cliente.
2. Use emojis com moderação.
3. Seja direto (max 300 caracteres).
4. Retorne APENAS o texto da mensagem, sem explicações.`,
    Icon: MessageSquareText,
  },
  {
    id: 'utility-templates',
    title: 'Templates UTILITY (geração)',
    description: 'Gera templates aprováveis pela Meta usando variáveis.',
    path: '/api/ai/generate-utility-templates',
    variables: ['{{prompt}}', '{{quantity}}', '{{language}}', '{{primaryUrl}}'],
    rows: 9,
    value: `Você é especialista em templates WhatsApp Business API categoria UTILITY.
Objetivo: gerar {{quantity}} templates aprováveis pela Meta.
Regras principais:
- Use variáveis {{1}}, {{2}}, {{3}} para datas, horários, quantidades e termos promocionais.
- Evite linguagem de urgência, escassez ou promoção hardcoded.
- Não inicie nem termine frases com variável.
Idioma: {{language}}.
Pedido do usuário: "{{prompt}}".
URL obrigatória (se houver): {{primaryUrl}}.
Formato: JSON array com name, content, header, footer e buttons.`,
    Icon: Wand2,
  },
  {
    id: 'ai-judge',
    title: 'AI Judge (classificação)',
    description: 'Analisa se o template é UTILITY ou MARKETING e sugere correções.',
    path: '/lib/ai/services/ai-judge.ts',
    variables: ['{{header}}', '{{body}}'],
    rows: 8,
    value: `Você é um juiz especializado em aprovação de templates WhatsApp Business API.
Analise o header e body e retorne JSON com:
- approved (true/false)
- predictedCategory ("UTILITY" | "MARKETING")
- confidence (0..1)
- issues (lista de palavras problemáticas)
- fixedBody / fixedHeader (com variáveis substituindo termos proibidos).`,
    Icon: ShieldCheck,
  },
  {
    id: 'flow-form',
    title: 'MiniApp Form (JSON)',
    description: 'Gera o formulário para MiniApps (WhatsApp Flow) em JSON estrito.',
    path: '/api/ai/generate-flow-form',
    variables: ['{{prompt}}', '{{titleHint}}', '{{maxQuestions}}'],
    rows: 9,
    value: `Você é especialista em criar MiniApps (WhatsApp Flows) no formato de formulário.
Gere entre 3 e {{maxQuestions}} campos, com tipos adequados.
Retorne APENAS JSON válido (strict JSON, sem markdown).
Título e intro em pt-BR.
Se houver, use o título sugerido: "{{titleHint}}".
Pedido do usuário: "{{prompt}}".`,
    Icon: FormInput,
  },
  {
    id: 'template-agent',
    title: 'Template Agent (sistema)',
    description: 'Prompt base usado pelo agente de templates com estratégias.',
    path: '/lib/ai/services/template-agent.ts',
    variables: ['{{strategy}}', '{{examples}}', '{{rules}}'],
    rows: 7,
    value: `Use o prompt do agente para guiar a geração por estratégia (utility/marketing/bypass).
Inclua exemplos oficiais, palavras proibidas e o tom aprovado.
Saída em JSON com name, body e buttons conforme a estratégia.`,
    Icon: FileText,
  },
]

function StatusPill({
  label,
  tone,
}: {
  label: string
  tone: 'emerald' | 'amber' | 'zinc'
}) {
  const toneClass =
    tone === 'emerald'
      ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10'
      : tone === 'amber'
        ? 'text-amber-300 border-amber-500/30 bg-amber-500/10'
        : 'text-zinc-300 border-white/10 bg-white/5'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${toneClass}`}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {label}
    </span>
  )
}

function MockSwitch({ on }: { on?: boolean }) {
  return (
    <span
      className={`relative inline-flex h-6 w-11 items-center rounded-full border transition ${
        on ? 'border-emerald-500/40 bg-emerald-500/20' : 'border-white/10 bg-white/5'
      }`}
      aria-hidden="true"
    >
      <span
        className={`inline-block size-4 rounded-full transition ${
          on ? 'translate-x-6 bg-emerald-300' : 'translate-x-1 bg-white/50'
        }`}
      />
    </span>
  )
}

function Metric({
  label,
  value,
  helper,
}: {
  label: string
  value: string
  helper?: string
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4">
      <div className="text-xs text-gray-400">{label}</div>
      <div className="mt-2 text-lg font-semibold text-white">{value}</div>
      {helper ? <div className="mt-1 text-xs text-gray-500">{helper}</div> : null}
    </div>
  )
}

function PromptCard({ item }: { item: PromptItem }) {
  const Icon = item.Icon
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-white">
            <Icon className="size-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">{item.title}</div>
            <div className="mt-1 text-xs text-gray-400">{item.description}</div>
            <div className="mt-2 inline-flex rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs text-gray-400">
              {item.path}
            </div>
          </div>
        </div>
        <button
          type="button"
          className="h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-medium text-white transition hover:bg-white/10"
        >
          Testar prompt
        </button>
      </div>

      <div className="mt-4">
        <textarea
          className="min-h-[160px] w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-gray-200 outline-none transition focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/10"
          rows={item.rows ?? 6}
          defaultValue={item.value}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-400">
        <span className="font-medium text-gray-300">Variáveis:</span>
        {item.variables.map((v) => (
          <span
            key={v}
            className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5"
          >
            {v}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function AICenterPage() {
  return (
    <Page>
      <PageHeader>
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-emerald-300/70">
            <Sparkles className="size-4" />
            Central de IA
          </div>
          <PageTitle>Central de IA</PageTitle>
          <PageDescription>
            Provedores, rotas, governança e prompts em uma única tela.
          </PageDescription>
        </div>
        <PageActions>
          <button
            type="button"
            className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Restaurar padrão
          </button>
          <button
            type="button"
            className="h-10 rounded-xl bg-white px-4 text-sm font-semibold text-zinc-900 transition hover:bg-gray-100"
          >
            Salvar tudo
          </button>
        </PageActions>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-400">Status Geral</div>
            <StatusPill label="Ativo" tone="emerald" />
          </div>
          <div className="mt-4 flex items-center gap-3 text-white">
            <Bot className="size-6 text-emerald-300" />
            <div>
              <div className="text-base font-semibold">Gemini 2.5 Flash</div>
              <div className="text-xs text-gray-400">Provedor principal</div>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-400">Custo estimado</div>
            <Coins className="size-4 text-amber-300" />
          </div>
          <div className="mt-4 text-2xl font-semibold text-white">R$ 312,40</div>
          <div className="text-xs text-gray-400">Últimos 30 dias</div>
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-400">Latência P50</div>
            <Clock className="size-4 text-sky-300" />
          </div>
          <div className="mt-4 text-2xl font-semibold text-white">740 ms</div>
          <div className="text-xs text-gray-400">Fluxos e templates</div>
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-400">Governança</div>
            <ShieldCheck className="size-4 text-emerald-300" />
          </div>
          <div className="mt-4 text-2xl font-semibold text-white">OK</div>
          <div className="text-xs text-gray-400">Logs + PII mascarada</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <section className="glass-panel rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-white">Provedores e modelos</h3>
                <p className="text-sm text-gray-400">
                  Defina o provedor padrão, fallback automático e parâmetros globais.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-300">
                <ToggleRight className="size-4" />
                Auto-fallback ativo
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {[
                { name: 'Google Gemini', model: 'gemini-2.5-flash', active: true },
                { name: 'OpenAI GPT', model: 'gpt-5.1', active: false },
                { name: 'Anthropic Claude', model: 'claude-sonnet-4-5', active: false },
              ].map((item) => (
                <div
                  key={item.name}
                  className={`rounded-xl border p-4 transition ${
                    item.active
                      ? 'border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                      : 'border-white/10 bg-zinc-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-white">{item.name}</div>
                    {item.active ? (
                      <StatusPill label="Padrão" tone="emerald" />
                    ) : (
                      <StatusPill label="Disponível" tone="zinc" />
                    )}
                  </div>
                  <div className="mt-2 text-xs text-gray-400">Modelo: {item.model}</div>
                  <button
                    type="button"
                    className="mt-4 w-full rounded-lg border border-white/10 bg-white/5 py-2 text-xs font-medium text-white transition hover:bg-white/10"
                  >
                    Selecionar como padrão
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-zinc-900/70 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <Sliders className="size-4 text-emerald-300" />
                  Modelo principal
                </div>
                <div className="mt-3 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-gray-300">
                  gemini-2.5-flash
                </div>
                <div className="mt-3 text-xs text-gray-500">Temperatura: 0.7 · Max tokens: 1400</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-zinc-900/70 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <Zap className="size-4 text-amber-300" />
                  Fallback inteligente
                </div>
                <div className="mt-3 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-gray-300">
                  gpt-5.1-mini
                </div>
                <div className="mt-3 text-xs text-gray-500">Aciona após 2 erros ou 1200 ms</div>
              </div>
            </div>
          </section>

          <section className="glass-panel rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-white">Chaves e origem</h3>
                <p className="text-sm text-gray-400">
                  Controle onde as chaves ficam salvas e quem pode editá-las.
                </p>
              </div>
              <button
                type="button"
                className="h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-medium text-white transition hover:bg-white/10"
              >
                Gerenciar permissões
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {[
                { label: 'Gemini API Key', preview: 'AIza…D8kT', source: 'Banco (Supabase)', active: true },
                { label: 'OpenAI API Key', preview: 'sk-…pW3c', source: 'Env var', active: false },
                { label: 'Anthropic API Key', preview: 'sk-ant-…4mP', source: '—', active: false },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-white/10 bg-zinc-900/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium text-white">{item.label}</div>
                      <div className="mt-1 text-xs text-gray-400">
                        {item.preview} · {item.source}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.active ? <StatusPill label="Em uso" tone="emerald" /> : <StatusPill label="Inativa" tone="amber" />}
                      <button
                        type="button"
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white transition hover:bg-white/10"
                      >
                        Atualizar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-panel rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-white">Rotas com IA no app</h3>
                <p className="text-sm text-gray-400">
                  Controle quais experiências estão liberadas para produção.
                </p>
              </div>
              <StatusPill label="4 rotas ativas" tone="emerald" />
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {[
                { title: 'Templates rápidos', detail: '/api/ai/generate-template', on: true },
                { title: 'Templates utility + Judge', detail: '/api/ai/generate-utility-templates', on: true },
                { title: 'MiniApp Form Builder', detail: '/api/ai/generate-flow-form', on: true },
                { title: 'Workflow Builder', detail: '/api/builder/ai/generate', on: false },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-white/10 bg-zinc-900/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-white">{item.title}</div>
                      <div className="text-xs text-gray-500">{item.detail}</div>
                    </div>
                    <MockSwitch on={item.on} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-panel rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-white">Governança e segurança</h3>
                <p className="text-sm text-gray-400">
                  Políticas de privacidade, logging, limites e compliance.
                </p>
              </div>
              <ShieldCheck className="size-5 text-emerald-300" />
            </div>

            <div className="mt-5 space-y-4">
              {[
                { title: 'Mascarar PII automaticamente', helper: 'Remove telefones, nomes e IDs antes do prompt.', on: true },
                { title: 'Logs completos de prompts', helper: 'Retenção de 14 dias com expurgo automático.', on: true },
                { title: 'Modo seguro para templates', helper: 'Bloqueia termos proibidos na Meta.', on: true },
                { title: 'Limites de custo por workspace', helper: 'Dispara alertas ao atingir 80% do orçamento.', on: false },
              ].map((item) => (
                <div key={item.title} className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-zinc-900/60 p-4">
                  <div>
                    <div className="text-sm font-medium text-white">{item.title}</div>
                    <div className="text-xs text-gray-500">{item.helper}</div>
                  </div>
                  <MockSwitch on={item.on} />
                </div>
              ))}
            </div>
          </section>

          <section className="glass-panel rounded-2xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Wand2 className="size-4 text-emerald-300" />
                  Prompts do sistema
                </div>
                <p className="text-sm text-gray-400">
                  Ajuste o texto dos prompts para cada fluxo de IA sem sair desta tela.
                </p>
              </div>
              <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                5 prompts configuráveis
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {PROMPTS.map((item) => (
                <PromptCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="glass-panel rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Playground rápido</h3>
                <p className="text-sm text-gray-400">Teste prompts com o modelo ativo.</p>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white transition hover:bg-white/10"
              >
                <Play className="size-3" />
                Executar
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-white/10 bg-black/50 p-3 text-xs text-gray-400">
                Prompt: Crie um template de confirmação de inscrição para evento com tom neutro.
              </div>
              <div className="rounded-xl border border-white/10 bg-zinc-900/70 p-3 text-xs text-gray-300">
                {`Saída: “Olá {{1}}, sua inscrição para {{2}} foi confirmada. O evento começa em {{3}} às {{4}}. Acesse {{5}} para detalhes.”`}
              </div>
            </div>
          </section>

          <section className="glass-panel rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Observabilidade</h3>
                <p className="text-sm text-gray-400">Indicadores dos últimos 7 dias.</p>
              </div>
              <button
                type="button"
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white transition hover:bg-white/10"
              >
                Ver painel completo
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              <Metric label="Chamadas totais" value="18.420" helper="+12% vs. semana anterior" />
              <Metric label="Custo médio por geração" value="R$ 0,021" helper="Meta: R$ 0,03" />
              <Metric label="Erros por 1k requests" value="2,1" helper="Auto-retry habilitado" />
            </div>
          </section>

          <section className="glass-panel rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Laboratório</h3>
                <p className="text-sm text-gray-400">
                  Experimentos com prompts, A/B de modelos e ajustes finos.
                </p>
              </div>
              <Beaker className="size-5 text-sky-300" />
            </div>

            <div className="mt-4 space-y-3">
              {[
                { title: 'A/B templates utility', status: 'Rodando · 58% vitória B' },
                { title: 'Prompt anti-rejeição Meta', status: 'Aprovado para rollout' },
                { title: 'Modelo rápido para flows', status: 'Em rascunho' },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-white/10 bg-zinc-900/60 p-4">
                  <div className="text-sm font-medium text-white">{item.title}</div>
                  <div className="mt-1 text-xs text-gray-500">{item.status}</div>
                </div>
              ))}
              <button
                type="button"
                className="w-full rounded-xl border border-dashed border-white/20 bg-white/5 py-3 text-xs font-medium text-white transition hover:bg-white/10"
              >
                Criar experimento
              </button>
            </div>
          </section>

          <section className="glass-panel rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Integrações avançadas</h3>
                <p className="text-sm text-gray-400">AI Gateway, logs e exportações.</p>
              </div>
              <ExternalLink className="size-4 text-gray-400" />
            </div>

            <div className="mt-4 space-y-3">
              {[
                { title: 'AI Gateway Vercel', detail: 'Chave gerenciada ativa', on: true, icon: Database },
                { title: 'Exportar logs para BigQuery', detail: 'Pipeline noturno', on: false, icon: Activity },
                { title: 'Webhooks de auditoria', detail: 'Slack + SIEM', on: true, icon: KeyRound },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.title} className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-900/60 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-white">
                        <Icon className="size-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{item.title}</div>
                        <div className="text-xs text-gray-500">{item.detail}</div>
                      </div>
                    </div>
                    <MockSwitch on={item.on} />
                  </div>
                )
              })}
            </div>
          </section>
        </div>
      </div>
    </Page>
  )
}
