'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { FixedValueDialogSlot } from './types';

interface FixedValueDialogProps {
  open: boolean;
  slot: FixedValueDialogSlot | null;
  title: string;
  value: string;
  onClose: () => void;
  onValueChange: (value: string) => void;
  onApply: (slot: FixedValueDialogSlot, value: string) => void;
}

export function FixedValueDialog({
  open,
  slot,
  title,
  value,
  onClose,
  onValueChange,
  onApply,
}: FixedValueDialogProps) {
  const handleApply = () => {
    const trimmedValue = value.trim();
    if (!trimmedValue || !slot) return;
    onApply(slot, trimmedValue);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApply();
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md bg-zinc-950 border border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">
            {title || 'Valor fixo (teste)'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Use isso só para testes rápidos. Esse valor vai apenas nesta campanha
            (não altera o contato).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-400">
            Digite o valor
          </label>
          <Input
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            placeholder="Ex: Empresa Teste"
            className="bg-zinc-900 border-white/10 text-white placeholder:text-gray-600"
            autoFocus
            onKeyDown={handleKeyDown}
          />
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="bg-zinc-800 text-white hover:bg-zinc-700"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            className="bg-white text-black hover:bg-gray-200 font-bold"
            disabled={!value.trim() || !slot}
          >
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
