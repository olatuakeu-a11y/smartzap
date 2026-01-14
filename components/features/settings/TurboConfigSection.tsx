'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Zap, Loader2, RefreshCw, ChevronUp, ChevronDown, Save } from 'lucide-react';
import { toast } from 'sonner';
import { performanceService } from '../../../services/performanceService';

// Tipos inline (definidos aqui pois não são exportados centralmente)
interface WhatsAppThrottleConfig {
  enabled: boolean;
  sendConcurrency?: number;
  batchSize?: number;
  startMps: number;
  maxMps: number;
  minMps: number;
  cooldownSec: number;
  minIncreaseGapSec: number;
  sendFloorDelayMs: number;
}

interface WhatsAppThrottleState {
  targetMps: number;
  cooldownUntil?: string | null;
  lastIncreaseAt?: string | null;
  lastDecreaseAt?: string | null;
  updatedAt?: string | null;
}

const TURBO_PRESETS = {
  leve: {
    label: 'Safe (Leve)',
    desc: 'Mais seguro: começa baixo e sobe devagar (prioriza estabilidade).',
    values: {
      sendConcurrency: 1,
      batchSize: 10,
      startMps: 10,
      maxMps: 30,
      minMps: 5,
      cooldownSec: 60,
      minIncreaseGapSec: 20,
      sendFloorDelayMs: 150,
    },
  },
  moderado: {
    label: 'Balanced (Moderado)',
    desc: 'Equilíbrio: boa velocidade com risco controlado de 130429.',
    values: {
      sendConcurrency: 2,
      batchSize: 25,
      startMps: 20,
      maxMps: 80,
      minMps: 5,
      cooldownSec: 30,
      minIncreaseGapSec: 12,
      sendFloorDelayMs: 50,
    },
  },
  agressivo: {
    label: 'Boost (Agressivo)',
    desc: 'Velocidade máxima: sobe rápido e busca teto alto (pode bater 130429).',
    values: {
      sendConcurrency: 4,
      batchSize: 80,
      startMps: 30,
      maxMps: 150,
      minMps: 5,
      cooldownSec: 20,
      minIncreaseGapSec: 8,
      sendFloorDelayMs: 0,
    },
  },
} as const;

type TurboPresetKey = keyof typeof TURBO_PRESETS;

export interface TurboConfigSectionProps {
  whatsappThrottle?: {
    ok: boolean;
    source?: 'db' | 'env';
    phoneNumberId?: string | null;
    config?: WhatsAppThrottleConfig;
    state?: WhatsAppThrottleState | null;
  } | null;
  whatsappThrottleLoading?: boolean;
  saveWhatsAppThrottle?: (data: Partial<WhatsAppThrottleConfig> & { resetState?: boolean }) => Promise<void>;
  isSaving?: boolean;
  settings: {
    phoneNumberId?: string | null;
  };
}

export function TurboConfigSection({
  whatsappThrottle,
  whatsappThrottleLoading,
  saveWhatsAppThrottle,
  isSaving,
  settings,
}: TurboConfigSectionProps) {
  const turboConfig = whatsappThrottle?.config;
  const turboState = whatsappThrottle?.state;

  const [isEditing, setIsEditing] = useState(false);
  const [turboDraft, setTurboDraft] = useState(() => ({
    enabled: turboConfig?.enabled ?? false,
    sendConcurrency: (turboConfig as any)?.sendConcurrency ?? 1,
    batchSize: (turboConfig as any)?.batchSize ?? 10,
    startMps: turboConfig?.startMps ?? 30,
    maxMps: turboConfig?.maxMps ?? 80,
    minMps: turboConfig?.minMps ?? 5,
    cooldownSec: turboConfig?.cooldownSec ?? 30,
    minIncreaseGapSec: turboConfig?.minIncreaseGapSec ?? 10,
    sendFloorDelayMs: turboConfig?.sendFloorDelayMs ?? 0,
  }));

  // Turbo planner ("quero X msgs em Y segundos")
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);
  const [plannerMessages, setPlannerMessages] = useState(500);
  const [plannerSeconds, setPlannerSeconds] = useState(60);
  const [plannerLatencyMs, setPlannerLatencyMs] = useState(200);
  const [plannerHeadroom, setPlannerHeadroom] = useState(1.2);
  const [plannerLatencyTouched, setPlannerLatencyTouched] = useState(false);
  const [plannerLoadingBaseline, setPlannerLoadingBaseline] = useState(false);
  const [plannerBaselineMetaMs, setPlannerBaselineMetaMs] = useState<number | null>(null);

  // Load baseline when planner opens (usa getSettingsPerformance para obter mediana de latência)
  useEffect(() => {
    if (!isPlannerOpen) return;
    if (plannerBaselineMetaMs != null) return;
    if (plannerLoadingBaseline) return;

    let cancelled = false;
    setPlannerLoadingBaseline(true);
    performanceService
      .getSettingsPerformance({ rangeDays: 7, limit: 50 })
      .then((perf) => {
        if (!cancelled && perf?.totals?.meta_avg_ms?.median != null) {
          setPlannerBaselineMetaMs(perf.totals.meta_avg_ms.median);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setPlannerLoadingBaseline(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isPlannerOpen, plannerBaselineMetaMs, plannerLoadingBaseline]);

  // Update planner latency from baseline (if user hasn't touched)
  useEffect(() => {
    if (!isPlannerOpen) return;
    if (plannerLatencyTouched) return;
    if (plannerBaselineMetaMs == null) return;
    setPlannerLatencyMs(Math.round(plannerBaselineMetaMs * 1.2));
  }, [isPlannerOpen, plannerBaselineMetaMs, plannerLatencyTouched]);

  // Turbo plan calculation
  const turboPlan = useMemo(() => {
    const msgs = Math.max(1, plannerMessages);
    const secs = Math.max(1, plannerSeconds);
    const desiredMps = msgs / secs;
    const latency = Math.max(50, plannerLatencyMs);
    const headroom = Math.max(1.0, plannerHeadroom);

    const concCeilingMps = latency > 0 ? 1000 / latency : null;
    const sendConcurrency =
      concCeilingMps != null && desiredMps > concCeilingMps
        ? Math.ceil(desiredMps / concCeilingMps)
        : 1;

    const safeMaxMps = Math.ceil(desiredMps * headroom);
    const startMps = Math.max(1, Math.round(safeMaxMps * 0.6));

    const warnings: string[] = [];
    if (typeof turboState?.targetMps === 'number' && turboState.targetMps < startMps) {
      warnings.push(
        `O target atual (${turboState.targetMps} mps) é menor que startMps (${startMps}). Se salvar, considere "Resetar aprendizado".`
      );
    }
    if (sendConcurrency > 1) {
      warnings.push(
        `Com latência ~${latency}ms, 1 thread só consegue ~${concCeilingMps?.toFixed(1)} mps. Sugerindo concorrência=${sendConcurrency}.`
      );
    }
    if (safeMaxMps > 100) {
      warnings.push(`Meta de ${msgs} msgs em ${secs}s é agressiva. Pode sofrer throttle do Meta.`);
    }

    const estimatedMpsInitial = sendConcurrency * ((concCeilingMps ?? desiredMps) * 0.8);
    const estimatedSeconds = msgs > 0 && estimatedMpsInitial > 0 ? msgs / estimatedMpsInitial : null;

    return {
      msgs,
      secs,
      desiredMps,
      recommended: {
        sendConcurrency,
        batchSize: Math.min(100, Math.max(10, sendConcurrency * 10)),
        startMps,
        maxMps: safeMaxMps,
      },
      estimate: {
        concCeilingMps,
        estimatedMpsInitial,
        estimatedSeconds,
      },
      warnings,
    };
  }, [plannerMessages, plannerSeconds, plannerLatencyMs, plannerHeadroom, turboState?.targetMps]);

  // Keep draft in sync when server data arrives
  useEffect(() => {
    if (!turboConfig) return;
    setTurboDraft({
      enabled: turboConfig.enabled,
      sendConcurrency: (turboConfig as any)?.sendConcurrency ?? 1,
      batchSize: (turboConfig as any)?.batchSize ?? 10,
      startMps: turboConfig.startMps,
      maxMps: turboConfig.maxMps,
      minMps: turboConfig.minMps,
      cooldownSec: turboConfig.cooldownSec,
      minIncreaseGapSec: turboConfig.minIncreaseGapSec,
      sendFloorDelayMs: turboConfig.sendFloorDelayMs,
    });
  }, [
    turboConfig?.enabled,
    (turboConfig as any)?.sendConcurrency,
    (turboConfig as any)?.batchSize,
    turboConfig?.startMps,
    turboConfig?.maxMps,
    turboConfig?.minMps,
    turboConfig?.cooldownSec,
    turboConfig?.minIncreaseGapSec,
    turboConfig?.sendFloorDelayMs,
  ]);

  const applyTurboPreset = (key: TurboPresetKey) => {
    const preset = TURBO_PRESETS[key];
    setTurboDraft((s) => ({
      ...s,
      ...preset.values,
    }));
    toast.message(`Preset aplicado: ${preset.label}`, {
      description: preset.desc,
    });
  };

  const handleSave = async () => {
    if (!saveWhatsAppThrottle) return;

    if (turboDraft.minMps > turboDraft.maxMps) {
      toast.error('minMps não pode ser maior que maxMps');
      return;
    }
    if (turboDraft.startMps < turboDraft.minMps || turboDraft.startMps > turboDraft.maxMps) {
      toast.error('startMps deve estar entre minMps e maxMps');
      return;
    }

    await saveWhatsAppThrottle({
      enabled: turboDraft.enabled,
      sendConcurrency: turboDraft.sendConcurrency,
      batchSize: (turboDraft as any).batchSize,
      startMps: turboDraft.startMps,
      maxMps: turboDraft.maxMps,
      minMps: turboDraft.minMps,
      cooldownSec: turboDraft.cooldownSec,
      minIncreaseGapSec: turboDraft.minIncreaseGapSec,
      sendFloorDelayMs: turboDraft.sendFloorDelayMs,
    });
    setIsEditing(false);
  };

  const handleReset = async () => {
    if (!saveWhatsAppThrottle) return;
    await saveWhatsAppThrottle({ resetState: true });
    toast.success('Aprendizado do modo turbo reiniciado (target voltou pro startMps)');
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (turboConfig) {
      setTurboDraft({
        enabled: turboConfig.enabled,
        sendConcurrency: (turboConfig as any)?.sendConcurrency ?? 1,
        batchSize: (turboConfig as any)?.batchSize ?? 10,
        startMps: turboConfig.startMps,
        maxMps: turboConfig.maxMps,
        minMps: turboConfig.minMps,
        cooldownSec: turboConfig.cooldownSec,
        minIncreaseGapSec: turboConfig.minIncreaseGapSec,
        sendFloorDelayMs: turboConfig.sendFloorDelayMs,
      });
    }
  };

  const applyPlannerSuggestion = () => {
    setIsEditing(true);
    setTurboDraft((s) => ({
      ...s,
      sendConcurrency: turboPlan.recommended.sendConcurrency,
      batchSize: turboPlan.recommended.batchSize,
      startMps: turboPlan.recommended.startMps,
      maxMps: turboPlan.recommended.maxMps,
    }));
    toast.success('Sugestão aplicada no formulário do Turbo. Agora é só Salvar.');
  };

  return (
    <div className="glass-panel rounded-2xl p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
            <span className="w-1 h-6 bg-primary-500 rounded-full"></span>
            <Zap size={18} className="text-primary-400" />
            Modo Turbo (Beta)
          </h3>
          <p className="text-sm text-gray-400">
            Ajuste automático de taxa baseado em feedback do Meta (ex.: erro <span className="font-mono">130429</span>). Ideal para campanhas grandes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/settings/performance"
            className="h-10 px-4 rounded-xl bg-white/5 text-white hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-sm font-medium"
            title="Abrir central de performance (baseline/histórico)"
          >
            Performance
          </Link>
          <Link
            href="/settings/meta-diagnostics"
            className="h-10 px-4 rounded-xl bg-white/5 text-white hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-sm font-medium"
            title="Abrir central de diagnóstico Meta (Graph API + infra + ações)"
          >
            Diagnóstico
          </Link>
          <button
            onClick={() => setIsEditing((v) => !v)}
            className="h-10 px-4 rounded-xl bg-white/5 text-white hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-sm font-medium"
          >
            {isEditing ? 'Fechar' : 'Configurar'}
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900/40 border border-white/10 rounded-xl p-4">
          <div className="text-xs text-gray-500">Status</div>
          {whatsappThrottleLoading ? (
            <div className="mt-2 text-sm text-gray-400 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" /> Carregando…
            </div>
          ) : (
            <div className="mt-2">
              <div className="text-sm text-white">
                {turboConfig?.enabled ? (
                  <span className="text-emerald-300 font-medium">Ativo</span>
                ) : (
                  <span className="text-gray-300 font-medium">Inativo</span>
                )}
                <span className="text-gray-500"> · </span>
                <span className="text-xs text-gray-400">fonte: {whatsappThrottle?.source || '—'}</span>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                Target atual: <span className="font-mono text-white">{typeof turboState?.targetMps === 'number' ? turboState.targetMps : '—'}</span> mps
              </div>
              {turboState?.cooldownUntil && (
                <div className="mt-1 text-xs text-amber-300">
                  Cooldown até: <span className="font-mono">{new Date(turboState.cooldownUntil).toLocaleString('pt-BR')}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-zinc-900/40 border border-white/10 rounded-xl p-4">
          <div className="text-xs text-gray-500">Phone Number ID</div>
          <div className="mt-2 text-sm text-white font-mono break-all">
            {whatsappThrottle?.phoneNumberId || settings.phoneNumberId || '—'}
          </div>
        </div>

        <div className="bg-zinc-900/40 border border-white/10 rounded-xl p-4">
          <div className="text-xs text-gray-500">Ações</div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              onClick={handleReset}
              disabled={!!isSaving}
              className="h-10 px-3 bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-lg transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
              title="Reseta o targetMps para startMps"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Resetar aprendizado
            </button>
          </div>
        </div>
      </div>

      {/* Planner: "quero X msgs em Y segundos" */}
      <div className="mt-4 bg-zinc-900/30 border border-white/10 rounded-2xl">
        <button
          type="button"
          onClick={() => setIsPlannerOpen((v) => !v)}
          className="w-full px-5 py-4 flex items-center justify-between gap-3"
        >
          <div className="text-left">
            <div className="text-sm font-medium text-white">Planejador de disparo</div>
            <div className="text-xs text-gray-400">Diga "quantas mensagens" e "em quanto tempo" e eu sugiro a config.</div>
          </div>
          <div className="text-gray-400">
            {isPlannerOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </button>

        {isPlannerOpen && (
          <div className="px-5 pb-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Mensagens</label>
                <input
                  type="number"
                  value={plannerMessages}
                  onChange={(e) => setPlannerMessages(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-white font-mono"
                  min={1}
                  max={100000}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Tempo alvo (seg)</label>
                <input
                  type="number"
                  value={plannerSeconds}
                  onChange={(e) => setPlannerSeconds(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-white font-mono"
                  min={1}
                  max={3600}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Latência estimada (ms)</label>
                <input
                  type="number"
                  value={plannerLatencyMs}
                  onChange={(e) => {
                    setPlannerLatencyTouched(true);
                    setPlannerLatencyMs(Number(e.target.value));
                  }}
                  className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-white font-mono"
                  min={50}
                  max={5000}
                />
                <div className="mt-1 text-[11px] text-gray-500">
                  {plannerLoadingBaseline
                    ? 'Buscando baseline…'
                    : plannerBaselineMetaMs != null
                      ? `baseline (mediana): ~${Math.round(plannerBaselineMetaMs)}ms`
                      : 'baseline indisponível (use um chute)'}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Margem (headroom)</label>
                <input
                  type="number"
                  value={plannerHeadroom}
                  onChange={(e) => setPlannerHeadroom(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-white font-mono"
                  min={1.0}
                  max={2.5}
                  step={0.05}
                />
                <div className="mt-1 text-[11px] text-gray-500">1.2 = folga padrão</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-zinc-900/40 border border-white/10 rounded-xl p-4">
                <div className="text-xs text-gray-500">Meta</div>
                <div className="mt-2 text-sm text-white">
                  {turboPlan.msgs} msgs em {turboPlan.secs}s
                </div>
                <div className="mt-1 text-xs text-gray-400">
                  Precisa de <span className="font-mono text-white">{turboPlan.desiredMps.toFixed(2)}</span> mps
                </div>
                <div className="mt-2 text-[11px] text-gray-500">
                  Regra prática: throughput ≈ concurrency / latência
                </div>
              </div>

              <div className="bg-zinc-900/40 border border-white/10 rounded-xl p-4">
                <div className="text-xs text-gray-500">Sugestão de config</div>
                <div className="mt-2 text-xs text-gray-300 space-y-1">
                  <div className="flex justify-between gap-3"><span className="text-gray-400">sendConcurrency</span><span className="font-mono text-white">{turboPlan.recommended.sendConcurrency}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-gray-400">batchSize</span><span className="font-mono text-white">{turboPlan.recommended.batchSize}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-gray-400">startMps</span><span className="font-mono text-white">{turboPlan.recommended.startMps}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-gray-400">maxMps</span><span className="font-mono text-white">{turboPlan.recommended.maxMps}</span></div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={applyPlannerSuggestion}
                    className="h-10 px-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    Aplicar no Turbo
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPlannerMessages(174);
                      setPlannerSeconds(10);
                      toast.message('Exemplo carregado: 174 msgs em 10s');
                    }}
                    className="h-10 px-3 bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-lg transition-colors text-sm text-white"
                  >
                    Exemplo 174/10s
                  </button>
                </div>
              </div>

              <div className="bg-zinc-900/40 border border-white/10 rounded-xl p-4">
                <div className="text-xs text-gray-500">Estimativa</div>
                <div className="mt-2 text-xs text-gray-300 space-y-1">
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-400">teto por concorrência</span>
                    <span className="font-mono text-white">{turboPlan.estimate.concCeilingMps != null ? turboPlan.estimate.concCeilingMps.toFixed(2) : '—'} mps</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-400">mps inicial (com startMps)</span>
                    <span className="font-mono text-white">{turboPlan.estimate.estimatedMpsInitial.toFixed(2)} mps</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-400">tempo estimado</span>
                    <span className="font-mono text-white">{turboPlan.estimate.estimatedSeconds != null ? `${Math.ceil(turboPlan.estimate.estimatedSeconds)}s` : '—'}</span>
                  </div>
                </div>

                {turboPlan.warnings.length > 0 && (
                  <div className="mt-3 text-[11px] text-amber-300 space-y-1">
                    {turboPlan.warnings.slice(0, 4).map((w, i) => (
                      <div key={i}>• {w}</div>
                    ))}
                  </div>
                )}

                <div className="mt-3 text-[11px] text-gray-500">
                  Nota: mesmo com config perfeita, o Meta pode aplicar limites e devolver <span className="font-mono">130429</span>. O Turbo existe pra achar o teto seguro.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {isEditing && (
        <div className="mt-6 p-5 bg-zinc-900/30 border border-white/10 rounded-2xl">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium text-white">Configurações</div>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={!!turboDraft.enabled}
                onChange={(e) => setTurboDraft((s) => ({ ...s, enabled: e.target.checked }))}
                className="accent-emerald-500"
              />
              Ativar modo turbo
            </label>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <div className="text-xs text-gray-400">Perfis rápidos</div>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(TURBO_PRESETS) as TurboPresetKey[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => applyTurboPreset(k)}
                  className="h-10 px-3 bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-lg transition-colors text-xs text-white"
                  title={TURBO_PRESETS[k].desc}
                >
                  {TURBO_PRESETS[k].label}
                </button>
              ))}
            </div>
            <div className="text-[11px] text-gray-500">
              Dica: se você aplicar um perfil que muda <span className="font-mono">startMps</span>, use "Resetar aprendizado" para o target atual acompanhar.
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">sendConcurrency</label>
              <input
                type="number"
                value={turboDraft.sendConcurrency}
                onChange={(e) => setTurboDraft((s) => ({ ...s, sendConcurrency: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-white font-mono"
                min={1}
                max={50}
              />
              <p className="text-[11px] text-gray-500 mt-1">Quantos envios em paralelo por batch (1 = sequencial).</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">batchSize</label>
              <input
                type="number"
                value={(turboDraft as any).batchSize}
                onChange={(e) => setTurboDraft((s) => ({ ...s, batchSize: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-white font-mono"
                min={1}
                max={200}
              />
              <p className="text-[11px] text-gray-500 mt-1">Quantos contatos por step do workflow (mais alto = menos steps). Dica: use batchSize ≥ sendConcurrency.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">startMps</label>
              <input
                type="number"
                value={turboDraft.startMps}
                onChange={(e) => setTurboDraft((s) => ({ ...s, startMps: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-white font-mono"
                min={1}
                max={1000}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">maxMps</label>
              <input
                type="number"
                value={turboDraft.maxMps}
                onChange={(e) => setTurboDraft((s) => ({ ...s, maxMps: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-white font-mono"
                min={1}
                max={1000}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">minMps</label>
              <input
                type="number"
                value={turboDraft.minMps}
                onChange={(e) => setTurboDraft((s) => ({ ...s, minMps: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-white font-mono"
                min={1}
                max={1000}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">cooldownSec</label>
              <input
                type="number"
                value={turboDraft.cooldownSec}
                onChange={(e) => setTurboDraft((s) => ({ ...s, cooldownSec: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-white font-mono"
                min={1}
                max={600}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">minIncreaseGapSec</label>
              <input
                type="number"
                value={turboDraft.minIncreaseGapSec}
                onChange={(e) => setTurboDraft((s) => ({ ...s, minIncreaseGapSec: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-white font-mono"
                min={1}
                max={600}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">sendFloorDelayMs</label>
              <input
                type="number"
                value={turboDraft.sendFloorDelayMs}
                onChange={(e) => setTurboDraft((s) => ({ ...s, sendFloorDelayMs: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-white font-mono"
                min={0}
                max={5000}
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <button
              onClick={handleCancel}
              className="h-10 px-4 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!!isSaving}
              className="h-10 px-5 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Salvar
            </button>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            Dica: se você alterar <span className="font-mono">startMps</span>, use "Resetar aprendizado" para o target atual acompanhar.
          </p>
        </div>
      )}
    </div>
  );
}
