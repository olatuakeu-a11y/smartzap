'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import {
    Megaphone,
    Wrench,
    VenetianMask, // Ninja/Mask for Bypass
    CheckCircle2
} from 'lucide-react';

export type AIStrategy = 'marketing' | 'utility' | 'bypass';

interface StrategySelectorModalProps {
    isOpen: boolean;
    onSelect: (strategy: AIStrategy) => void;
    onClose?: () => void;
}

export function StrategySelectorModal({ isOpen, onSelect, onClose }: StrategySelectorModalProps) {
    const strategies = [
        {
            id: 'marketing' as const,
            title: 'Marketing (Vendas)',
            icon: Megaphone,
            color: 'text-amber-200 bg-amber-500/10 border-amber-500/20',
            description: 'Foco total em conversão. Usa gatilhos mentais, urgência e copy persuasiva.',
            features: ['Categoria: MARKETING', 'Alta Conversão', 'Permite Promoções'],
            warning: 'Custo mais alto por mensagem.'
        },
        {
            id: 'utility' as const,
            title: 'Utilidade (Padrão)',
            icon: Wrench,
            color: 'text-emerald-200 bg-emerald-500/10 border-emerald-500/20',
            description: 'Foco em avisos e notificações. Linguagem formal, seca e direta.',
            features: ['Categoria: UTILITY', 'Avisos Transacionais', 'Sem bloqueios'],
            warning: 'Proibido termos de venda.'
        },
        {
            id: 'bypass' as const,
            title: 'Marketing Camuflado',
            icon: VenetianMask,
            color: 'text-gray-300 bg-zinc-900/60 border-white/10',
            description: 'Tenta passar copy de vendas como Utilidade usando substituição de variáveis.',
            features: ['Categoria: UTILITY (Tentativa)', 'Custo Baixo', 'Anti-Spam AI'],
            warning: 'Pode ser rejeitado se abusar.'
        }
    ];

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-zinc-900/80 border border-white/10 text-white rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
                <DialogHeader>
                    <DialogTitle className="text-2xl text-center">Como você deseja criar seus templates?</DialogTitle>
                    <DialogDescription className="text-center text-gray-400">
                        Escolha a "personalidade" da IA para este projeto.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    {strategies.map((strategy) => (
                        <div
                            key={strategy.id}
                            onClick={() => {
                                console.log('[StrategySelectorModal] Clicked:', strategy.id);
                                onSelect(strategy.id);
                            }}
                            className={`
                                relative p-6 rounded-2xl border cursor-pointer transition-all hover:shadow-[0_12px_30px_rgba(0,0,0,0.35)]
                                ${strategy.color}
                            `}
                        >
                            <div className="flex flex-col items-center text-center gap-4">
                                <div className="p-4 rounded-full bg-zinc-950/40 border border-white/10 text-current">
                                    <strategy.icon className="w-8 h-8" />
                                </div>

                                <div>
                                    <h3 className="font-bold text-lg mb-2">{strategy.title}</h3>
                                    <p className="text-sm text-gray-300">{strategy.description}</p>
                                </div>

                                <ul className="text-sm text-left w-full space-y-2 mt-2 bg-zinc-950/40 p-3 rounded-lg border border-white/10">
                                    {strategy.features.map((feat, i) => (
                                        <li key={i} className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                                            {feat}
                                        </li>
                                    ))}
                                </ul>

                                {strategy.warning && (
                                    <p className="text-xs font-semibold mt-2 text-amber-200">
                                        {strategy.warning}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
