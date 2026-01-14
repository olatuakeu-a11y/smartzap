'use client';

import React from 'react';
import { ExternalLink } from 'lucide-react';

export function WizardStepChecklist() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="text-sm font-semibold text-white">Checklist de 60s</div>
      <div className="mt-1 text-xs text-gray-400">
        Em 3 passos voce libera o Google Calendar.
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {[
          { title: 'Ative a API', desc: 'Habilite Google Calendar API.' },
          { title: 'Crie OAuth', desc: 'Cliente web com redirect.' },
          { title: 'Cole as URLs', desc: 'Redirect + Webhook.' },
        ].map((item) => (
          <div key={item.title} className="rounded-xl border border-white/10 bg-black/30 p-3">
            <div className="text-xs font-semibold text-white">{item.title}</div>
            <div className="mt-1 text-[11px] text-gray-400">{item.desc}</div>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <a
          href="https://console.cloud.google.com/apis/credentials"
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-500/90 px-4 text-xs font-semibold text-white hover:bg-emerald-500"
        >
          <ExternalLink size={14} />
          Abrir Console
        </a>
      </div>
    </div>
  );
}
