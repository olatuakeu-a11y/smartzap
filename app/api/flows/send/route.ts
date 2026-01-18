import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

import { getWhatsAppCredentials } from '@/lib/whatsapp-credentials'
import { supabase } from '@/lib/supabase'
import { normalizePhoneNumber } from '@/lib/phone-formatter'
import { buildFlowMessage } from '@/lib/whatsapp/flows'
import { fetchWithTimeout, safeJson } from '@/lib/server-http'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const toRaw = String(body?.to || '')
    const flowId = String(body?.flowId || '')
    const flowToken = String(body?.flowToken || '')
    const requestedAction =
      body?.action === 'data_exchange' ? 'data_exchange' : body?.action === 'navigate' ? 'navigate' : null
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/1294d6ce-76f2-430d-96ab-3ae4d7527327',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H1',location:'app/api/flows/send/route.ts:18',message:'flow send request received',data:{hasTo:Boolean(toRaw.trim()),flowIdLength:flowId.length,flowTokenLength:flowToken.length,action:body?.action ?? 'navigate',flowMessageVersion:body?.flowMessageVersion ?? '3',hasActionPayload:typeof body?.actionPayload === 'object' && body.actionPayload !== null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion agent log

    const to = normalizePhoneNumber(toRaw)

    if (!to || !flowId || !flowToken) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios: to, flowId, flowToken' },
        { status: 400 }
      )
    }

    const credentials = await getWhatsAppCredentials()
    if (!credentials?.accessToken || !credentials?.phoneNumberId) {
      return NextResponse.json(
        { error: 'Credenciais do WhatsApp não configuradas' },
        { status: 400 }
      )
    }

    let resolvedAction: 'navigate' | 'data_exchange' = requestedAction || 'navigate'
    let resolvedActionPayload =
      body?.actionPayload && typeof body.actionPayload === 'object' ? body.actionPayload : undefined
    let flowFirstScreenId: string | null = null
    let isDynamicFlow = false

    if (!requestedAction && flowId) {
      try {
        const { data, error } = await supabase
          .from('flows')
          .select('flow_json')
          .eq('meta_flow_id', flowId)
          .limit(1)
        if (!error) {
          const row = Array.isArray(data) ? data[0] : (data as any)
          const flowJson = row?.flow_json
          const json = typeof flowJson === 'string' ? JSON.parse(flowJson) : flowJson
          if (json && typeof json === 'object') {
            const screens = Array.isArray((json as any).screens) ? (json as any).screens : []
            flowFirstScreenId = typeof screens?.[0]?.id === 'string' ? screens[0].id : null
            isDynamicFlow = Boolean((json as any).data_api_version || (json as any).routing_model)
            if (!isDynamicFlow) {
              for (const s of screens) {
                const layout = s?.layout
                const children = Array.isArray(layout?.children) ? layout.children : []
                const stack = [...children]
                while (stack.length) {
                  const node = stack.pop()
                  const action = node?.['on-click-action']
                  if (action?.name === 'data_exchange') {
                    isDynamicFlow = true
                    break
                  }
                  const nested = Array.isArray(node?.children) ? node.children : []
                  if (nested.length) stack.push(...nested)
                }
                if (isDynamicFlow) break
              }
            }
          }
        }
      } catch {}
    }

    if (!requestedAction && isDynamicFlow) {
      resolvedAction = 'data_exchange'
      if (!resolvedActionPayload && flowFirstScreenId) {
        resolvedActionPayload = { screen: flowFirstScreenId, data: {} }
      }
    }

    if (resolvedAction === 'data_exchange') {
      resolvedActionPayload = undefined
    }

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/1294d6ce-76f2-430d-96ab-3ae4d7527327',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H6',location:'app/api/flows/send/route.ts:44',message:'flow action resolved',data:{requestedAction:requestedAction ?? 'none',resolvedAction,isDynamicFlow,hasActionPayload:Boolean(resolvedActionPayload),firstScreenId:flowFirstScreenId ?? null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/1294d6ce-76f2-430d-96ab-3ae4d7527327',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H7',location:'app/api/flows/send/route.ts:52',message:'flow action payload shape',data:{action:resolvedAction,hasPayload:Boolean(resolvedActionPayload),payloadScreen:(resolvedActionPayload as any)?.screen ?? null,payloadDataKeys:Object.keys((resolvedActionPayload as any)?.data || {})},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    const payload = buildFlowMessage({
      to,
      body: String(body?.body || 'Vamos começar?'),
      flowId,
      flowToken,
      ctaText: body?.ctaText ? String(body.ctaText) : 'Abrir',
      action: resolvedAction,
      actionPayload: resolvedActionPayload,
      footer: body?.footer ? String(body.footer) : undefined,
      flowMessageVersion: body?.flowMessageVersion ? String(body.flowMessageVersion) : '3',
    })
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/1294d6ce-76f2-430d-96ab-3ae4d7527327',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H2',location:'app/api/flows/send/route.ts:48',message:'flow payload built',data:{flowIdPresent:Boolean(flowId),flowTokenPresent:Boolean(flowToken),flowAction:payload.interactive.action.parameters.flow_action,hasActionPayload:Boolean(payload.interactive.action.parameters.flow_action_payload),hasFooter:Boolean(payload.interactive.footer),flowMessageVersion:payload.interactive.action.parameters.flow_message_version},timestamp:Date.now()})}).catch(()=>{});
    // #endregion agent log

    const response = await fetchWithTimeout(
      `https://graph.facebook.com/v24.0/${credentials.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        timeoutMs: 8000,
      }
    )

    const data = await safeJson<any>(response)
    if (!response.ok) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/1294d6ce-76f2-430d-96ab-3ae4d7527327',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H8',location:'app/api/flows/send/route.ts:70',message:'flow send error details',data:{status:response.status,errorCode:(data as any)?.error?.code ?? null,errorSubcode:(data as any)?.error?.error_subcode ?? null,errorType:(data as any)?.error?.type ?? null,errorMessage:(data as any)?.error?.message ?? null,errorDetails:(data as any)?.error?.error_data?.details ?? null},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
    }
    try {
      const msgId = Array.isArray((data as any)?.messages) ? String((data as any).messages?.[0]?.id || '') : ''
      if (msgId) {
        try {
          const { error } = await supabase.from('flow_submissions').upsert(
            {
              message_id: msgId,
              from_phone: to,
              flow_id: flowId,
              flow_token: flowToken,
              response_json_raw: JSON.stringify({ flow_id: flowId, flow_token: flowToken }),
              message_timestamp: new Date().toISOString(),
            },
            { onConflict: 'message_id' },
          )
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/1294d6ce-76f2-430d-96ab-3ae4d7527327',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H13',location:'app/api/flows/send/route.ts:afterGraph',message:'flow_submissions seeded',data:{ok:!error,hasMessageId:!!msgId,flowIdLength:flowId.length,flowTokenLength:flowToken.length,errorMessage:error?.message ?? null,errorCode:(error as any)?.code ?? null},timestamp:Date.now()})}).catch(()=>{});
          // #endregion
        } catch {}
      }
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/1294d6ce-76f2-430d-96ab-3ae4d7527327',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'flow-send',hypothesisId:'S1',location:'app/api/flows/send/route.ts:afterGraph',message:'meta message id received',data:{ok:response.ok,status:response.status,hasMessageId:!!msgId,messageIdSuffix:msgId?msgId.slice(-6):null},timestamp:Date.now()})}).catch(()=>{});
      // #endregion agent log
    } catch {}
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/1294d6ce-76f2-430d-96ab-3ae4d7527327',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H3',location:'app/api/flows/send/route.ts:69',message:'flow send response',data:{ok:response.ok,status:response.status,hasError:!response.ok,metaErrorCode:((data as any)?.error?.code ?? null),metaErrorSubcode:((data as any)?.error?.error_subcode ?? null)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion agent log

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Falha ao enviar Flow', details: data },
        { status: response.status }
      )
    }

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    console.error('Failed to send flow:', error)
    return NextResponse.json({ error: 'Falha ao enviar Flow' }, { status: 500 })
  }
}
