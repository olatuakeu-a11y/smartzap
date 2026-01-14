'use client';

import React from 'react';
import { X, Sparkles, Loader2, Check, Save } from 'lucide-react';

export interface AiGeneratorModalProps {
  isOpen: boolean;
  prompt: string;
  setPrompt: (prompt: string) => void;
  result: string;
  isGenerating: boolean;
  onGenerate: () => void;
  templateName: string;
  setTemplateName: (name: string) => void;
  onSave: () => void;
  isSaving: boolean;
  onClose: () => void;
}

export const AiGeneratorModal: React.FC<AiGeneratorModalProps> = ({
  isOpen,
  prompt,
  setPrompt,
  result,
  isGenerating,
  onGenerate,
  templateName,
  setTemplateName,
  onSave,
  isSaving,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900/80 border border-white/10 rounded-2xl w-full max-w-2xl p-0 shadow-[0_30px_80px_rgba(0,0,0,0.55)] animate-in zoom-in duration-200 flex flex-col max-h-[90vh] overflow-hidden relative">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 bg-zinc-950/40 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
              <Sparkles size={20} className="text-emerald-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Smart Copywriter</h2>
              <p className="text-xs text-gray-500">Powered by Gemini 2.5 Flash</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* Input Section */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                O que voce quer comunicar?
              </label>
              <textarea
                className="w-full h-32 bg-zinc-950/40 border border-white/10 rounded-xl p-4 text-white placeholder:text-gray-600 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 outline-none resize-none transition-all"
                placeholder="Ex: Crie uma oferta de Black Friday para loja de roupas, urgente e com emoji."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <div className="flex justify-end mt-3">
                <button
                  onClick={onGenerate}
                  disabled={isGenerating || !prompt}
                  className="flex items-center gap-2 px-6 py-2 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Pensando...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} className="text-emerald-600" /> Gerar Texto
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Result Section */}
            {result && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-2 mb-2">
                  <Check size={16} className="text-emerald-400" />
                  <span className="text-sm font-bold text-white">Resultado Gerado</span>
                </div>
                <div className="bg-zinc-950/40 border border-white/10 rounded-xl p-4 relative group">
                  <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                    {result}
                  </p>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-200 px-2 py-1 rounded border border-emerald-500/20">
                      IA
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/10">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nome do Template
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      className="flex-1 bg-zinc-950/40 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-emerald-500/40"
                      placeholder="Ex: Oferta Black Friday 2024"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                    />
                    <button
                      onClick={onSave}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-6 py-2 bg-emerald-500 text-black font-semibold rounded-lg hover:bg-emerald-400 transition-colors disabled:opacity-50"
                    >
                      {isSaving ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Save size={18} />
                      )}{' '}
                      Salvar Template
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
