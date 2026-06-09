// components/RevitImportBanner.tsx
//
// Exibe um banner informativo na aba "Saídas de emergência" quando os
// pavimentos foram importados do Revit, com botão para limpar e digitar
// manualmente.

'use client';

import { useState } from 'react';

type Props = {
  pavimentos: any[];            // saidas_pavimentos atual
  onLimpar: () => void;         // callback para resetar para entrada manual
};

export default function RevitImportBanner({ pavimentos, onLimpar }: Props) {
  const [confirmando, setConfirmando] = useState(false);

  if (!pavimentos || pavimentos.length === 0) return null;

  const totalAmbientes = pavimentos.reduce(
    (s: number, p: any) => s + (p.ambientes?.length ?? 0),
    0
  );

  return (
    <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 flex items-start justify-between gap-4 mb-4">
      <div className="flex items-start gap-3">
        {/* Ícone Revit */}
        <svg
          className="mt-0.5 shrink-0 text-blue-500"
          width="18" height="18" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2"
        >
          <rect x="2" y="3" width="20" height="14" rx="2"/>
          <path d="M8 21h8M12 17v4"/>
        </svg>

        <div>
          <p className="text-sm font-medium text-blue-900">
            Ambientes importados do Revit
          </p>
          <p className="text-xs text-blue-700 mt-0.5">
            {pavimentos.length} pavimento(s) · {totalAmbientes} ambiente(s) —
            as áreas foram preenchidas automaticamente pelo plugin.
            Confira as divisões CSCIP e complete as saídas reais antes de gerar o memorial.
          </p>
        </div>
      </div>

      <div className="shrink-0">
        {!confirmando ? (
          <button
            type="button"
            onClick={() => setConfirmando(true)}
            className="text-xs text-blue-600 hover:underline"
          >
            Limpar e digitar manualmente
          </button>
        ) : (
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-blue-800">Confirmar limpeza?</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { onLimpar(); setConfirmando(false); }}
                className="text-xs text-red-600 hover:underline"
              >
                Sim, limpar
              </button>
              <button
                type="button"
                onClick={() => setConfirmando(false)}
                className="text-xs text-blue-600 hover:underline"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
