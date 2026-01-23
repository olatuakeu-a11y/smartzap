/**
 * Inbox AI Workflow Endpoint
 *
 * Endpoint Upstash Workflow para processamento durável de IA no inbox.
 * Usa serve() que gerencia automaticamente:
 * - Verificação de assinatura QStash
 * - Retry em caso de falha
 * - Persistência de estado entre steps
 *
 * Disparo: via Client.trigger() no inbox-webhook.ts
 *
 * IMPORTANTE: maxDuration é necessário porque:
 * - Cada invocação do workflow re-executa a função
 * - O SDK replays steps anteriores, mas código normal ainda executa
 * - Se a função timeout ANTES de chegar ao próximo step, workflow trava
 */

import { serve } from '@upstash/workflow/nextjs'
import { processInboxAIWorkflow } from '@/lib/inbox/inbox-ai-workflow'

// Permite até 60 segundos para cada invocação do workflow (requer Vercel Pro)
export const maxDuration = 60

// URL base para callbacks do workflow - prioriza env var configurada manualmente
const getWorkflowUrl = () => {
  const url = process.env.UPSTASH_WORKFLOW_URL
    || process.env.NEXT_PUBLIC_APP_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)

  if (url) {
    return `${url}/api/inbox/ai-workflow`
  }
  return undefined // deixa o SDK detectar automaticamente
}

export const { POST } = serve(processInboxAIWorkflow, {
  // Retry com backoff exponencial
  retries: 3,
  // URL explícita para callbacks (resolve problemas de detecção automática)
  url: getWorkflowUrl(),
})
