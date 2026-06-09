// components/RevitConexaoCard.tsx
//
// Card que mostra ao usuario como conectar o plugin Revit a este projeto.
// Exibe o ID do projeto e o token (com botoes copiar).

'use client';

import { useState } from 'react';

type Props = {
  projetoId: string;
  revitToken: string | null | undefined;
};

export default function RevitConexaoCard({ projetoId, revitToken }: Props) {
  const [aberto, setAberto] = useState(false);
  const [copiou, setCopiou] = useState<'id' | 'token' | null>(null);

  const copiar = async (valor: string, qual: 'id' | 'token') => {
    try {
      await navigator.clipboard.writeText(valor);
      setCopiou(qual);
      setTimeout(() => setCopiou(null), 1500);
    } catch {
      /* ignora */
    }
  };

  if (!revitToken) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 mb-4 text-sm text-amber-900">
        Token Revit ainda nao gerado para este projeto. Salve o projeto uma vez para gerar.
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-surface mb-4">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-surface/70"
      >
        <div className="flex items-center gap-2">
          <svg
            width="18" height="18" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2"
            className="text-muted"
          >
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" />
          </svg>
          <span className="text-sm font-medium">
            Conectar plugin Revit a este projeto
          </span>
        </div>
        <span className="text-xs text-muted">{aberto ? 'Ocultar' : 'Mostrar'}</span>
      </button>

      {aberto && (
        <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
          <p className="text-xs text-muted">
            No Revit, abra Complementos &gt; Comandos externos &gt; Enviar para Memorial CBPR.
            Na primeira execucao cole os dois valores abaixo. O plugin lembra para as proximas vezes.
          </p>

          <div className="space-y-2">
            <Campo
              rotulo="ID do projeto"
              valor={projetoId}
              copiou={copiou === 'id'}
              onCopiar={() => copiar(projetoId, 'id')}
            />
            <Campo
              rotulo="Token Revit"
              valor={revitToken}
              copiou={copiou === 'token'}
              onCopiar={() => copiar(revitToken, 'token')}
              mono
            />
          </div>

          <div className="text-xs text-muted leading-relaxed">
            O token e exclusivo deste projeto. Nao compartilhe publicamente.
            Quem tiver o token pode gravar saidas neste projeto.
          </div>
        </div>
      )}
    </div>
  );
}

function Campo({
  rotulo,
  valor,
  copiou,
  onCopiar,
  mono
}: {
  rotulo: string;
  valor: string;
  copiou: boolean;
  onCopiar: () => void;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-muted w-24 shrink-0">{rotulo}</label>
      <input
        readOnly
        value={valor}
        className={`flex-1 input ${mono ? 'font-mono text-xs' : 'text-xs'}`}
        onFocus={(e) => e.currentTarget.select()}
      />
      <button
        type="button"
        onClick={onCopiar}
        className="text-xs px-2 py-1 rounded border border-border hover:bg-surface shrink-0"
      >
        {copiou ? 'Copiado' : 'Copiar'}
      </button>
    </div>
  );
}
