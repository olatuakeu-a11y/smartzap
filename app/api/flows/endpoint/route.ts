/**
 * WhatsApp Flow Endpoint
 *
 * Endpoint para data_exchange em WhatsApp Flows.
 * Recebe requests criptografadas da Meta e responde com dados dinamicos.
 *
 * POST /api/flows/endpoint
 *
 * Handlers:
 * - ping: health check
 * - INIT: primeira tela do flow
 * - data_exchange: interacao do usuario
 * - BACK: usuario voltou para tela anterior
 */

import { NextRequest, NextResponse } from 'next/server'
import { settingsDb } from '@/lib/supabase-db'
import {
  decryptRequest,
  encryptResponse,
  createErrorResponse,
  type FlowDataExchangeRequest,
} from '@/lib/whatsapp/flow-endpoint-crypto'
import { handleFlowAction } from '@/lib/whatsapp/flow-endpoint-handlers'

const PRIVATE_KEY_SETTING = 'whatsapp_flow_private_key'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('[flow-endpoint] 📥 POST received at', new Date().toISOString())

    // Valida campos obrigatorios
    const { encrypted_flow_data, encrypted_aes_key, initial_vector } = body
    if (!encrypted_flow_data || !encrypted_aes_key || !initial_vector) {
      console.error('[flow-endpoint] ❌ Campos obrigatorios ausentes')
      return NextResponse.json({ error: 'Campos obrigatorios ausentes' }, { status: 400 })
    }

    // Busca a chave privada
    const privateKey = await settingsDb.get(PRIVATE_KEY_SETTING)
    if (!privateKey) {
      console.error('[flow-endpoint] ❌ Chave privada nao configurada')
      return NextResponse.json({ error: 'Endpoint nao configurado' }, { status: 500 })
    }

    // Descriptografa a request
    let decrypted
    try {
      decrypted = decryptRequest(
        { encrypted_flow_data, encrypted_aes_key, initial_vector },
        privateKey
      )
    } catch (error) {
      console.error('[flow-endpoint] ❌ Erro ao descriptografar:', error)
      return NextResponse.json({ error: 'Falha na descriptografia' }, { status: 421 })
    }

    const flowRequest = decrypted.decryptedBody as unknown as FlowDataExchangeRequest
    console.log('[flow-endpoint] 🔓 Decrypted - Action:', flowRequest.action, 'Screen:', flowRequest.screen, 'Data:', JSON.stringify(flowRequest.data || {}))
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/1294d6ce-76f2-430d-96ab-3ae4d7527327',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H1',location:'app/api/flows/endpoint/route.ts:62',message:'flow endpoint decrypted request',data:{action:flowRequest.action,screen:flowRequest.screen ?? null,hasFlowToken:Boolean(flowRequest.flow_token),dataKeys:Array.isArray(flowRequest.data)?null:Object.keys(flowRequest.data || {})},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    // Health check - DEVE ser criptografado como todas as outras respostas
    // Ref: https://developers.facebook.com/docs/whatsapp/flows/guides/implementingyourflowendpoint#health_check_request
    if (flowRequest.action === 'ping') {
      console.log('[flow-endpoint] 🏓 PING received at', new Date().toISOString())
      const pingResponse = { data: { status: 'active' } }
      const encryptedPingResponse = encryptResponse(
        pingResponse,
        decrypted.aesKeyBuffer,
        decrypted.initialVectorBuffer
      )
      console.log('[flow-endpoint] 🔐 PING response encrypted, length:', encryptedPingResponse.length, 'isBase64:', !encryptedPingResponse.startsWith('{'))
      return new NextResponse(encryptedPingResponse, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      })
    }

    // Processa a acao do flow
    let response
    try {
      response = await handleFlowAction(flowRequest)
      console.log('[flow-endpoint] ✅ Handler response:', JSON.stringify(response).substring(0, 500))
    } catch (error) {
      console.error('[flow-endpoint] ❌ Erro no handler:', error)
      response = createErrorResponse(
        error instanceof Error ? error.message : 'Erro interno'
      )
    }

    // Criptografa a response
    const encryptedResponse = encryptResponse(
      response,
      decrypted.aesKeyBuffer,
      decrypted.initialVectorBuffer
    )
    console.log('[flow-endpoint] 🔐 Response encrypted, length:', encryptedResponse.length)

    return new NextResponse(encryptedResponse, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  } catch (error) {
    console.error('[flow-endpoint] Erro geral:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    )
  }
}

/**
 * GET - Health check simples (sem criptografia)
 */
export async function GET() {
  const privateKey = await settingsDb.get(PRIVATE_KEY_SETTING)
  const configured = !!privateKey

  return NextResponse.json({
    status: configured ? 'ready' : 'not_configured',
    message: configured
      ? 'Flow endpoint configurado e pronto'
      : 'Chave privada nao configurada. Configure em /settings/flows',
  })
}
