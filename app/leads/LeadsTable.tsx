'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

type Lead = {
  id: string;
  created_at: string;
  nome: string;
  contato: string;
  telefone?: string | null;
  email?: string | null;
  cnpj: string | null;
  razao_social?: string | null;
  cnae: string | null;
  cnae_descricao: string | null;
  divisao: string;
  area_m2: number;
  altura_m: number;
  cidade: string | null;
  ano_construcao?: number | null;
  populacao?: number | null;
  medidas: any[];
  simplificada: boolean;
  status: string;
  modalidade?: string | null;
  tipo_edificacao?: string | null;
  justificativas?: string[] | null;
};

const ROTULO_MOD: Record<string, string> = {
  DISPENSA: 'Dispensada',
  MEMORIAL_SIMPLIFICADO: 'Memorial Simplificado',
  PTPID: 'PTPID',
  PTPID_IOT: 'PTPID-IOT',
  ANALISE_NPT002: 'Análise NPT 002'
};

const COR_MOD: Record<string, string> = {
  DISPENSA: 'bg-success/10 text-success',
  MEMORIAL_SIMPLIFICADO: 'bg-primary/10 text-primary',
  PTPID: 'bg-danger/10 text-danger',
  PTPID_IOT: 'bg-warning/10 text-warning',
  ANALISE_NPT002: 'bg-warning/10 text-warning'
};

export default function LeadsTable({ leads }: { leads: Lead[] }) {
  const [filtro, setFiltro] = useState('');
  const [cidade, setCidade] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('');
  const [selecionado, setSelecionado] = useState<Lead | null>(null);

  const cidades = useMemo(
    () => Array.from(new Set(leads.map((l) => l.cidade).filter(Boolean))).sort() as string[],
    [leads]
  );

  const filtrados = useMemo(() => {
    return leads.filter((l) => {
      if (filtro) {
        const t = filtro.toLowerCase();
        if (
          !l.nome.toLowerCase().includes(t) &&
          !l.contato.toLowerCase().includes(t) &&
          !(l.cnpj || '').includes(t) &&
          !l.divisao.toLowerCase().includes(t)
        ) {
          return false;
        }
      }
      if (cidade && l.cidade !== cidade) return false;
      if (statusFiltro && l.status !== statusFiltro) return false;
      return true;
    });
  }, [leads, filtro, cidade, statusFiltro]);

  return (
    <>
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Buscar por nome, contato, CNPJ ou divisão..."
          className="input flex-1"
        />
        <select value={cidade} onChange={(e) => setCidade(e.target.value)} className="input w-48">
          <option value="">Todas cidades</option>
          {cidades.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)} className="input w-40">
          <option value="">Todos status</option>
          <option value="novo">Novo</option>
          <option value="contatado">Contatado</option>
          <option value="convertido">Convertido</option>
          <option value="descartado">Descartado</option>
        </select>
      </div>

      {filtrados.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-muted">Nenhum lead encontrado.</p>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-bg border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted">Data</th>
                <th className="text-left px-4 py-3 font-medium text-muted">Cliente</th>
                <th className="text-left px-4 py-3 font-medium text-muted">Contato</th>
                <th className="text-left px-4 py-3 font-medium text-muted">Divisão</th>
                <th className="text-left px-4 py-3 font-medium text-muted">Modalidade</th>
                <th className="text-left px-4 py-3 font-medium text-muted">Área</th>
                <th className="text-left px-4 py-3 font-medium text-muted">Cidade</th>
                <th className="text-left px-4 py-3 font-medium text-muted">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtrados.map((l) => (
                <tr key={l.id} className="border-b border-border last:border-0 hover:bg-bg">
                  <td className="px-4 py-3 text-muted whitespace-nowrap">
                    {new Date(l.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 font-medium text-ink">{l.nome}</td>
                  <td className="px-4 py-3 text-muted">{l.contato}</td>
                  <td className="px-4 py-3"><Badge>{l.divisao}</Badge></td>
                  <td className="px-4 py-3">
                    {l.modalidade ? (
                      <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded ${COR_MOD[l.modalidade] || 'bg-muted/10 text-muted'}`}>
                        {ROTULO_MOD[l.modalidade] || l.modalidade}
                      </span>
                    ) : <span className="text-muted text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-muted">{l.area_m2} m²</td>
                  <td className="px-4 py-3 text-muted">{l.cidade || '—'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={l.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelecionado(l)}
                      className="text-primary hover:underline text-sm"
                    >
                      Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selecionado && (
        <LeadDetalhe lead={selecionado} onFechar={() => setSelecionado(null)} />
      )}
    </>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5 rounded">
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    novo: 'bg-primary/10 text-primary',
    contatado: 'bg-warning/10 text-warning',
    convertido: 'bg-success/10 text-success',
    descartado: 'bg-muted/10 text-muted'
  };
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${map[status] || map.novo}`}>
      {status}
    </span>
  );
}

function LeadDetalhe({ lead, onFechar }: { lead: Lead; onFechar: () => void }) {
  const exigidas = (lead.medidas || []).filter((m: any) => m.status === 'EXIGIDO');
  const condicionais = (lead.medidas || []).filter((m: any) => m.status === 'CONDICIONAL');

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onFechar}>
      <div
        className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-ink">{lead.nome}</h2>
          <button onClick={onFechar} className="text-muted hover:text-ink text-2xl leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-5">
          {lead.modalidade && (
            <div className={`p-4 rounded-lg ${COR_MOD[lead.modalidade] || 'bg-muted/10 text-muted'}`}>
              <div className="text-xs uppercase font-semibold opacity-70">Modalidade exigida</div>
              <div className="text-xl font-bold mt-1">{ROTULO_MOD[lead.modalidade] || lead.modalidade}</div>
              {lead.tipo_edificacao && <div className="text-xs mt-1 opacity-70">Tipo: {lead.tipo_edificacao}</div>}
              {lead.justificativas && lead.justificativas.length > 0 && (
                <ul className="text-sm mt-2 space-y-1">
                  {lead.justificativas.map((j, i) => <li key={i}>• {j}</li>)}
                </ul>
              )}
            </div>
          )}

          <Bloco titulo="Cliente">
            <Info label="Nome" value={lead.nome} />
            {lead.telefone && <Info label="Telefone" value={lead.telefone} />}
            {lead.email && <Info label="Email" value={lead.email} />}
            {!lead.telefone && !lead.email && <Info label="Contato" value={lead.contato} />}
            {lead.cnpj && <Info label="CNPJ" value={lead.cnpj} />}
            {lead.razao_social && <Info label="Empresa" value={lead.razao_social} />}
            <Info label="Data" value={new Date(lead.created_at).toLocaleString('pt-BR')} />
          </Bloco>

          <Bloco titulo="Edificação">
            {lead.cnae && <Info label="CNAE" value={`${lead.cnae} — ${lead.cnae_descricao || ''}`} />}
            <Info label="Divisão" value={lead.divisao} />
            <Info label="Área" value={`${lead.area_m2} m²`} />
            <Info label="Altura" value={`${lead.altura_m} m`} />
            {lead.cidade && <Info label="Cidade" value={lead.cidade} />}
            <Info label="Regime" value={lead.simplificada ? 'Simplificada' : 'Não simplificada'} />
          </Bloco>

          <Bloco titulo={`Exigências (${exigidas.length} exigidas, ${condicionais.length} condicionais)`}>
            {exigidas.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-danger uppercase mb-1">Exigidas</div>
                {exigidas.map((m: any) => (
                  <div key={m.nome} className="text-sm py-1 border-b border-border/50 last:border-0">
                    <span className="font-medium">{m.nome}</span>
                    {m.observacao && <span className="text-muted ml-1">— {m.observacao}</span>}
                  </div>
                ))}
              </div>
            )}
            {condicionais.length > 0 && (
              <div className="mt-3">
                <div className="text-xs font-semibold text-warning uppercase mb-1">Condicionais</div>
                {condicionais.map((m: any) => (
                  <div key={m.nome} className="text-sm py-1 border-b border-border/50 last:border-0">
                    <span className="font-medium">{m.nome}</span>
                    {m.observacao && <span className="text-muted ml-1">— {m.observacao}</span>}
                  </div>
                ))}
              </div>
            )}
          </Bloco>

          <div className="flex gap-3 pt-2 border-t border-border">
            <Link
              href={`/api/leads/${lead.id}/pdf`}
              target="_blank"
              className="btn-secondary"
            >
              Ver PDF
            </Link>
            <a
              href={`https://wa.me/55${((lead.telefone || lead.contato).match(/\d+/g) || []).join('').replace(/^55/, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary ml-auto"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-ink mb-2">{titulo}</h3>
      <div className="bg-bg border border-border rounded-lg p-4">{children}</div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex text-sm py-0.5">
      <div className="w-24 text-muted">{label}</div>
      <div className="flex-1 text-ink">{value}</div>
    </div>
  );
}
