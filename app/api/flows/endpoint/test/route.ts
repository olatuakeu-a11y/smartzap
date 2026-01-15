import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { settingsDb } from '@/lib/supabase-db'

const ENDPOINT_URL_SETTING = 'whatsapp_flow_endpoint_url'
const PUBLIC_KEY_SETTING = 'whatsapp_flow_public_key'

function buildEndpointUrl(): string | null {
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}/api/flows/endpoint`
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/api/flows/endpoint`
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return `${process.env.NEXT_PUBLIC_APP_URL}/api/flows/endpoint`
  }
  return null
}

export async function GET() {
  const envEndpointUrl = buildEndpointUrl()
  const storedEndpointUrl = await settingsDb.get(ENDPOINT_URL_SETTING)
  const endpointUrl = envEndpointUrl || storedEndpointUrl || null
  const publicKey = await settingsDb.get(PUBLIC_KEY_SETTING)

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/1294d6ce-76f2-430d-96ab-3ae4d7527327',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'endpoint-health',hypothesisId:'H5',location:'app/api/flows/endpoint/test/route.ts:23',message:'endpoint test start',data:{hasPublicKey:Boolean(publicKey),endpointUrl},timestamp:Date.now()})}).catch(()=>{});
  // #endregion agent log

  if (!endpointUrl) {
    return NextResponse.json({ ok: false, error: 'Endpoint URL nao configurado' }, { status: 400 })
  }
  if (!publicKey) {
    return NextResponse.json({ ok: false, error: 'Chave publica nao configurada' }, { status: 400 })
  }

  const aesKey = crypto.randomBytes(16)
  const iv = crypto.randomBytes(16)
  const payload = JSON.stringify({ version: '3.0', action: 'ping' })
  const cipher = crypto.createCipheriv('aes-128-gcm', aesKey, iv)
  const encrypted = Buffer.concat([cipher.update(payload, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  const encryptedFlowData = Buffer.concat([encrypted, authTag]).toString('base64')
  const encryptedAesKey = crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    aesKey
  ).toString('base64')
  const initialVector = iv.toString('base64')

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/1294d6ce-76f2-430d-96ab-3ae4d7527327',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'endpoint-health',hypothesisId:'H6',location:'app/api/flows/endpoint/test/route.ts:50',message:'encrypted ping payload ready',data:{encryptedFlowDataLength:encryptedFlowData.length,encryptedAesKeyLength:encryptedAesKey.length,initialVectorLength:initialVector.length},timestamp:Date.now()})}).catch(()=>{});
  // #endregion agent log

  const res = await fetch(endpointUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      encrypted_flow_data: encryptedFlowData,
      encrypted_aes_key: encryptedAesKey,
      initial_vector: initialVector,
    }),
  })

  const text = await res.text()
  let decryptedOk = false
  try {
    const responseBuffer = Buffer.from(text, 'base64')
    const responseAuthTag = responseBuffer.subarray(-16)
    const responseCiphertext = responseBuffer.subarray(0, -16)
    const flippedIv = Buffer.alloc(iv.length)
    for (let i = 0; i < iv.length; i++) flippedIv[i] = iv[i] ^ 0xff
    const decipher = crypto.createDecipheriv('aes-128-gcm', aesKey, flippedIv)
    decipher.setAuthTag(responseAuthTag)
    decipher.update(responseCiphertext)
    decipher.final()
    decryptedOk = true
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/1294d6ce-76f2-430d-96ab-3ae4d7527327',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'endpoint-health',hypothesisId:'H9',location:'app/api/flows/endpoint/test/route.ts:74',message:'endpoint response decrypt failed',data:{errorName:error instanceof Error ? error.name : 'unknown',errorMessage:error instanceof Error ? error.message : 'unknown'},timestamp:Date.now()})}).catch(()=>{});
    // #endregion agent log
  }

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/1294d6ce-76f2-430d-96ab-3ae4d7527327',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'endpoint-health',hypothesisId:'H7',location:'app/api/flows/endpoint/test/route.ts:82',message:'endpoint test response',data:{status:res.status,ok:res.ok,bodyLength:text.length,decryptedOk},timestamp:Date.now()})}).catch(()=>{});
  // #endregion agent log

  return NextResponse.json({
    ok: res.ok,
    status: res.status,
    bodyLength: text.length,
    endpointUrl,
  })
}
