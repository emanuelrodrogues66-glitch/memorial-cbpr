'use client';
import { useState } from 'react';
import { saveAs } from 'file-saver';

function slug(s: string) {
  return (s || 'memorial')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase().replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export default function GerarClient({ dados }: { dados: any }) {
  const [busy, setBusy] = useState<string | null>(null);
  const base = slug(dados.nome_obra);

  async function gerarPdf() {
    setBusy('pdf');
    try {
      const { gerarPdfBlob } = await import('@/lib/gerar-pdf');
      const blob = await gerarPdfBlob(dados);
      saveAs(blob, `${base}-memorial.pdf`);
    } finally { setBusy(null); }
  }
  async function gerarDocx() {
    setBusy('docx');
    try {
      const { gerarDocxBlob } = await import('@/lib/gerar-docx');
      const blob = await gerarDocxBlob(dados);
      saveAs(blob, `${base}-memorial.docx`);
    } finally { setBusy(null); }
  }
  async function gerarXlsx() {
    setBusy('xlsx');
    try {
      const { gerarXlsxBlob } = await import('@/lib/gerar-xlsx');
      const blob = await gerarXlsxBlob(dados);
      saveAs(blob, `${base}-memorial.xlsx`);
    } finally { setBusy(null); }
  }
  async function gerarTodos() {
    await gerarPdf();
    await gerarDocx();
    await gerarXlsx();
  }

  return (
    <div className="mt-8 grid sm:grid-cols-3 gap-4">
      <Card title="PDF" desc="Documento finalizado, ideal para protocolo." action={gerarPdf} busy={busy === 'pdf'} />
      <Card title="Word (DOCX)" desc="Editável para ajustes finais." action={gerarDocx} busy={busy === 'docx'} />
      <Card title="Excel (XLSX)" desc="Tabela de dados para auditoria." action={gerarXlsx} busy={busy === 'xlsx'} />

      <div className="sm:col-span-3 flex justify-end">
        <button onClick={gerarTodos} disabled={!!busy} className="btn-primary">
          {busy ? 'Gerando…' : 'Gerar todos os formatos'}
        </button>
      </div>

      <Resumo dados={dados} />
    </div>
  );
}

function Card({ title, desc, action, busy }: any) {
  return (
    <div className="card flex flex-col gap-3">
      <div>
        <div className="font-semibold text-ink">{title}</div>
        <div className="text-sm text-muted mt-1">{desc}</div>
      </div>
      <button onClick={action} disabled={busy} className="btn-primary">
        {busy ? 'Gerando…' : 'Baixar'}
      </button>
    </div>
  );
}

function Resumo({ dados }: { dados: any }) {
  return (
    <div className="sm:col-span-3 card">
      <h3 className="font-semibold text-ink">Pré-visualização do conteúdo</h3>
      <dl className="mt-4 grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
        <Row k="Obra" v={dados.nome_obra} />
        <Row k="Proprietário" v={dados.proprietario} />
        <Row k="CNAE" v={dados.cnae} />
        <Row k="Atividade" v={dados.descricao_atividade} />
        <Row k="Divisão" v={dados.divisao} />
        <Row k="Risco" v={dados.risco_incendio} />
        <Row k="Área construída" v={dados.area_construida_m2 ? `${dados.area_construida_m2} m²` : '—'} />
        <Row k="Altura" v={dados.altura_edificacao_m ? `${dados.altura_edificacao_m} m` : '—'} />
        <Row k="Tipo (NPT 005)" v={dados.tipo_edificacao} />
        <Row k="Classe (NPT 008)" v={dados.classe_npt008} />
        <Row k="TRRF" v={dados.trrf_minutos != null ? `${dados.trrf_minutos} min` : '—'} />
        <Row k="População" v={dados.populacao_calculada} />
        <Row k="Brigadistas" v={dados.brigadistas_necessarios} />
        <Row k="Resp. técnico" v={dados.responsavel_tecnico} />
        <Row k="CREA/CAU" v={dados.crea_resp} />
      </dl>
      <div className="mt-4 text-sm">
        <div className="text-muted">Medidas de proteção</div>
        <ul className="list-disc pl-5 mt-1">
          {(dados.medidas_protecao ?? []).map((m: string, i: number) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: any }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-1">
      <dt className="text-muted">{k}</dt>
      <dd className="font-medium text-right">{v == null || v === '' ? '—' : String(v)}</dd>
    </div>
  );
}
