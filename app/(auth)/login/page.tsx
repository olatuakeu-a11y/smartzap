'use client'

/**
 * Login Page
 * 
 * Simple password login for single-tenant DaaS
 */

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lock, Eye, EyeOff, LogIn } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'

  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [isLocalhost, setIsLocalhost] = useState(false)
  const [isConfigured, setIsConfigured] = useState(true)

  useEffect(() => {
    try {
      const host = window.location.hostname
      setIsLocalhost(host === 'localhost' || host === '127.0.0.1' || host === '::1')
    } catch {
      setIsLocalhost(false)
    }

    // Get company name from auth status
    console.log('🔍 [LOGIN] Fetching auth status...')
    fetch('/api/auth/status')
      .then(res => {
        console.log('🔍 [LOGIN] Auth status response:', res.status)
        return res.json()
      })
      .then(async (data) => {
        console.log('🔍 [LOGIN] Auth data:', JSON.stringify(data, null, 2))
        if (!data.isConfigured) {
          setIsConfigured(false)

          // Em localhost, não forçamos o fluxo da Vercel. Mostramos instrução para configurar .env.local.
          if (isLocalhost) {
            console.log('🔍 [LOGIN] Not configured in localhost — showing local setup hint')
            setError('Configuração local incompleta: defina MASTER_PASSWORD no .env.local e reinicie o servidor (npm run dev).')
            return
          }

          console.log('🔍 [LOGIN] Not configured, redirecting to /setup/start')
          router.push('/setup/start')
        } else if (!data.isSetup) {
          // UX: Em modo local (ou quando o setup foi feito via env vars), podemos ter
          // infra ok mas empresa ainda não gravada na tabela settings.
          // Antes de mandar o usuário de volta pro wizard, tentamos finalizar o setup
          // uma única vez:
          // 1) Preferência: usar os dados persistidos do wizard (localStorage) e chamar
          //    /api/setup/complete-setup (não depende de SETUP_COMPANY_* em env).
          // 2) Fallback: /api/setup/init-company (usa SETUP_COMPANY_* em env, idempotente).
          try {
            const attemptKey = 'smartzap_attempted_init_company'
            const attempted = typeof window !== 'undefined' ? sessionStorage.getItem(attemptKey) : '1'

            if (!attempted) {
              sessionStorage.setItem(attemptKey, '1')

              // (1) Tentar completar setup via dados do wizard no localStorage
              try {
                const raw = localStorage.getItem('smartzap_setup_data')
                if (raw) {
                  const parsed = JSON.parse(raw) as any
                  const companyName = typeof parsed?.companyName === 'string' ? parsed.companyName : ''
                  const companyAdmin = typeof parsed?.companyAdmin === 'string' ? parsed.companyAdmin : ''
                  const email = typeof parsed?.email === 'string' ? parsed.email : ''
                  const phone = typeof parsed?.phone === 'string' ? parsed.phone : ''

                  // Só tenta se os campos mínimos existem (evita bater na API à toa)
                  if (companyName && companyAdmin && email && phone) {
                    console.log('🔍 [LOGIN] Attempting complete-setup using wizard localStorage data...')
                    const completeRes = await fetch('/api/setup/complete-setup', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ companyName, companyAdmin, email, phone })
                    })

                    const completeJson = await completeRes.json().catch(() => null)
                    if (completeRes.ok && completeJson?.success) {
                      console.log('🔍 [LOGIN] complete-setup success; refetching auth status...')
                      // Limpa o estado do wizard para não ficar tentando pra sempre
                      localStorage.removeItem('smartzap_setup_data')
                      localStorage.removeItem('smartzap_setup_step')

                      const statusRes2 = await fetch('/api/auth/status')
                      const data2 = await statusRes2.json()
                      console.log('🔍 [LOGIN] Auth data after complete-setup:', JSON.stringify(data2, null, 2))

                      if (data2?.isAuthenticated) {
                        router.push('/')
                        return
                      }

                      // Setup ok, mas ainda não autenticado? permanece na tela.
                      if (data2?.company) setCompanyName(data2.company.name)
                      return
                    } else {
                      console.log('🔍 [LOGIN] complete-setup did not succeed:', completeJson)
                    }
                  }
                }
              } catch (err) {
                console.warn('🔍 [LOGIN] complete-setup attempt error:', err)
              }

              // (2) Fallback: tentar init-company via env (idempotente)
              const initRes = await fetch('/api/setup/init-company', { method: 'GET' })
              const initJson = await initRes.json().catch(() => null)
              const initOk = !!(initJson && (initJson as any).success)

              if (initOk) {
                console.log('🔍 [LOGIN] init-company success; refetching auth status...')
                const statusRes2 = await fetch('/api/auth/status')
                const data2 = await statusRes2.json()
                console.log('🔍 [LOGIN] Auth data after init-company:', JSON.stringify(data2, null, 2))

                if (data2?.isSetup && data2?.isAuthenticated) {
                  router.push('/')
                  return
                }

                if (data2?.isSetup) {
                  // Setup ok, mas ainda não autenticado. Fica no login normalmente.
                  if (data2.company) setCompanyName(data2.company.name)
                  return
                }
              } else {
                console.log('🔍 [LOGIN] init-company skipped/failed:', initJson)
              }
            }
          } catch (err) {
            console.warn('🔍 [LOGIN] init-company attempt error:', err)
          }

          console.log('🔍 [LOGIN] Not setup, redirecting to /setup/wizard?resume=true')
          router.push('/setup/wizard?resume=true')
        } else if (data.isAuthenticated) {
          console.log('🔍 [LOGIN] Already authenticated, redirecting to /')
          router.push('/')
        } else if (data.company) {
          console.log('🔍 [LOGIN] Company found:', data.company.name)
          setCompanyName(data.company.name)
        }
      })
      .catch((err) => {
        console.error('🔍 [LOGIN] Auth status error:', err)
      })
  }, [router, isLocalhost])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!password) {
      setError('Digite sua senha')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer login')
      }

      // Redirect to original destination or dashboard
      router.push(redirectTo)
      router.refresh()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-emerald-500 to-emerald-600 mb-4">
          <span className="text-3xl font-bold text-white">S</span>
        </div>
        <h1 className="text-2xl font-bold text-white">
          {companyName || 'SmartZap'}
        </h1>
        <p className="text-zinc-400 mt-1">Entre para continuar</p>
      </div>

      {/* Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        {!isConfigured && isLocalhost && (
          <div className="mb-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
            <p className="text-sm text-emerald-200 font-medium">Modo local</p>
            <p className="text-xs text-zinc-300/80 mt-1">
              Para destravar o login no localhost, defina <code className="bg-zinc-800 px-1.5 py-0.5 rounded">MASTER_PASSWORD</code> no <code className="bg-zinc-800 px-1.5 py-0.5 rounded">.env.local</code> e reinicie o dev server.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              name="password"
              autoComplete="current-password"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-11 pr-11 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {error && (
            <p className="mt-4 text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading || (!isConfigured && isLocalhost)}
            className="w-full mt-6 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Entrar
                <LogIn className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <p className="text-center text-zinc-600 text-sm mt-6">
        SmartZap © {new Date().getFullYear()}
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      }>
        <LoginForm />
      </Suspense>
    </div>
  )
}
