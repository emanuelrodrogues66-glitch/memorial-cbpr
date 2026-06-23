'use client';
import { useState, useEffect, useCallback } from 'react';
import { SECOES_MEMORIAL, SECOES_TODAS, type SecaoMemorial } from '@/lib/secoes-memorial';

export default function GerarClient({ dados }: { dados: any }) {
  const storageKey = `secoes-memorial-${dados.id}`;

  const [secoes, setSecoes] = useState<SecaoMemorial[]>(() => {
    if (typeof window === 'undefined') return SECOES_TODAS;
    try {
      const salvo = localStorage.getItem(storageKey);
      if (salvo) return JSON.parse(salvo) as SecaoMemorial[];
    } catch {}
    return SECOES_TODAS;
  });

  const [gerandoDocx, setGerandoDocx] = useState(false);
  const [gerandoPdf, setGerandoPdf]   = useState(false);
  const [gerandoXlsx, setGerandoXlsx] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(secoes)); } catch {}
  }, [secoes, storageKey]);

  const toggleSecao = (key: SecaoMemorial) => {
    setSecoes((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    );
  };

  const nomeArquivo = (dados.nome_obra || 'memorial')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const baixar = useCallback(
    async (formato: 'docx' | 'pdf' | 'xlsx') => {
      setErro(null);
      if (formato === 'docx') setGerandoDocx(true);
      if (formato === 'pdf')  setGerandoPdf(true);
      if (formato === 'xlsx') setGerandoXlsx(true);
      try {
        let blob: Blob;
        if (formato === 'docx') {
          const { gerarDocxBlob } = await import('@/lib/gerar-docx');
          blob = await gerarDocxBlob(dados, secoes);
        } else if (formato === 'pdf') {
          const { gerarPdfBlob } = await import('@/lib/gerar-pdf');
          blob = await gerarPdfBlob(dados, secoes);
        } else {
          const { gerarXlsxBlob } = await import('@/lib/gerar-xlsx');
          blob = await gerarXlsxBlob(dados, secoes);
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${nomeArquivo}.${formato}`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (e: any) {
        setErro(`Erro ao gerar ${formato.toUpperCase()}: ${e?.message ?? String(e)}`);
      } finally {
        if (formato === 'docx') setGerandoDocx(false);
        if (formato === 'pdf')  setGerandoPdf(false);
        if (formato === 'xlsx') setGerandoXlsx(false);
      }
    },
    [dados, secoes, nomeArquivo]
  );

  const todasSelecionadas = secoes.length === SECOES_TODAS.length;

  return (
    <div className="mt-8 space-y-8">
      {/* Seleção de seções */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-ink">Seções do memorial</h2>
          <button
            className="text-xs text-accent hover:underline"
            onClick={() => setSecoes(todasSelecionadas ? [] : [...SECOES_TODAS])}
          >
            {todasSelecionadas ? 'Desmarcar todas' : 'Selecionar todas'}
          </button>
        </div>
        <div className="grid gap-2">
          {SECOES_MEMORIAL.map((s) => {
            const ativa = secoes.includes(s.key);
            return (
              <label
                key={s.key}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                  ${ativa ? 'border-accent bg-accent/5' : 'border-border bg-white hover:bg-surface'}`}
              >
                <input
                  type="checkbox"
                  className="mt-0.5 accent-accent"
                  checked={ativa}
                  onChange={() => toggleSecao(s.key)}
                />
                <div>
                  <div className="text-sm font-medium text-ink">{s.label}</div>
                  <div className="text-xs text-muted">{s.descricao}</div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Erro */}
      {erro && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-4">
          {erro}
        </div>
      )}

      {/* Botões de exportação */}
      <div className="grid gap-3 sm:grid-cols-3">
        <BotaoExportar
          label="Baixar DOCX"
          descricao="Word — editável"
          icone="📄"
          carregando={gerandoDocx}
          desabilitado={secoes.length === 0 || gerandoDocx || gerandoPdf || gerandoXlsx}
          onClick={() => baixar('docx')}
        />
        <BotaoExportar
          label="Baixar PDF"
          descricao="Para visualização / impressão"
          icone="🖨️"
          carregando={gerandoPdf}
          desabilitado={secoes.length === 0 || gerandoDocx || gerandoPdf || gerandoXlsx}
          onClick={() => baixar('pdf')}
        />
        <BotaoExportar
          label="Baixar XLSX"
          descricao="Planilha de dados"
          icone="📊"
          carregando={gerandoXlsx}
          desabilitado={secoes.length === 0 || gerandoDocx || gerandoPdf || gerandoXlsx}
          onClick={() => baixar('xlsx')}
        />
      </div>

      {secoes.length === 0 && (
        <p className="text-sm text-muted text-center">
          Selecione ao menos uma seção para habilitar a exportação.
        </p>
      )}
    </div>
  );
}

function BotaoExportar({
  label, descricao, icone, carregando, desabilitado, onClick
}: {
  label: string;
  descricao: string;
  icone: string;
  carregando: boolean;
  desabilitado: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={desabilitado}
      className={`flex flex-col items-center gap-1 p-4 rounded-lg border font-medium text-sm transition-colors
        ${desabilitado
          ? 'border-border bg-surface text-muted cursor-not-allowed'
          : 'border-accent bg-accent text-white hover:bg-accent/90 cursor-pointer'}`}
    >
      <span className="text-2xl">{carregando ? '⏳' : icone}</span>
      <span>{carregando ? 'Gerando...' : label}</span>
      <span className={`text-xs ${desabilitado ? 'text-muted' : 'text-white/80'}`}>{descricao}</span>
    </button>
  );
}
