'use client';

import React from 'react';
import type { PricingBreakdown } from './types';
import type { Template } from '@/types';

interface SummaryCardsProps {
  pricing: PricingBreakdown;
  recipientCount: number;
  selectedTemplate?: Template;
}

export function SummaryCards({
  pricing,
  recipientCount,
  selectedTemplate,
}: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="p-5 bg-zinc-900/50 border border-white/5 rounded-xl">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
          Custo Total
        </p>
        <p className="text-2xl font-bold text-white">{pricing.totalBRLFormatted}</p>
        {selectedTemplate && (
          <p className="text-xs text-gray-500 mt-1">
            {pricing.pricePerMessageBRLFormatted} × {recipientCount} msgs
          </p>
        )}
      </div>
      <div className="p-5 bg-zinc-900/50 border border-white/5 rounded-xl">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
          Total Destinatários
        </p>
        <p className="text-2xl font-bold text-white">{recipientCount}</p>
      </div>
    </div>
  );
}
