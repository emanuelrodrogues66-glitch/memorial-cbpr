'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import DuplicarProjetoButton from './DuplicarProjetoButton';
import ExcluirProjetoButton from './ExcluirProjetoButton';

type Projeto = {
  id: string;
  nome_obra: string;
  status: string;
  updated_at: string;
  uf: string | null;
  projetista: string | null;
};

export default function DashboardClient({ projetos }: { projetos: Projeto[] }) {
  const [busca, setBusca] = useState('');
  const [filtroUF, setFiltroUF] = useState('');
  const [filtroProjetista, setFiltroProjetista] = useState('');

  // Listas únicas para os selects
  const ufs = useMemo(() => {
    const set = new Set(projetos.map((p) => p.uf).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [projetos]);

  const projetistas = useMemo(() => {
    const set = new Set(projetos.map((p) => p.projetista).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [projetos]);

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase().trim();
    return projetos.filter((p) => {
      if (filtroUF && p.uf !== filtroUF) return false;
      if (filtroProjetista && p.projetista !== filtroProjetista) return false;
      if (q && !p.nome_obra?.toLowerCase().includes(q) && !p.projetista?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [projetos, busca, filtroUF, filtroProjetista]);

  const temFiltro = busca || filtroUF || filtroProjetista;

  return (
    <div className="space-y-4">
      {/* Barra de busca e filtros */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Pesquisar projeto ou projetista..."
          className="input flex-1 min-w-[220px]"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <select
          className="input w-auto"
          value={filtroUF}
          onChange={(e) => setFiltroUF(e.target.value)}
        >
          <option value="">Todos os estados</option>
          {ufs.map((uf) => (
            <option key={uf} value={uf}>{uf}</option>
          ))}
        </select>
        <select
          className="input w-auto"
          value={filtroProjetista}
          onChange={(e) => setFiltroProjetista(e.target.value)}
        >
          <option value="">Todos os projetistas</option>
          {projetistas.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        {temFiltro && (
          <button
            className="text-sm text-muted hover:text-ink px-2"
            onClick={() => { setBusca(''); setFiltroUF(''); setFiltroProjetista(''); }}
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Contador */}
      <p className="text-xs text-muted">
        {filtrados.length} projeto{filtrados.length !== 1 ? 's' : ''}
        {temFiltro ? ' encontrado' + (filtrados.length !== 1 ? 's' : '') : ''}
      </p>

      {/* Lista */}
      <div className="grid gap-3">
        {filtrados.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-muted">Nenhum projeto encontrado para os filtros selecionados.</p>
          </div>
        )}
        {filtrados.map((p) => (
          <div
            key={p.id}
            className="card flex items-center justify-between hover:border-primary transition"
          >
            <Link href={`/projeto/${p.id}`} className="flex-1 min-w-0">
              <div className="font-semibold text-ink truncate">{p.nome_obra || 'Projeto sem nome'}</div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {p.projetista && (
                  <span className="text-xs text-muted">{p.projetista}</span>
                )}
                {p.uf && (
                  <span className="text-xs bg-surface border border-border rounded px-2 py-0.5">{p.uf}</span>
                )}
                <span className="text-xs text-muted">
                  Atualizado em {new Date(p.updated_at).toLocaleString('pt-BR')}
                </span>
              </div>
            </Link>
            <div className="flex items-center gap-3 ml-3">
              <span className="text-xs uppercase tracking-wide font-medium text-primary border border-primary/30 rounded-full px-3 py-1">
                {p.status}
              </span>
              <DuplicarProjetoButton projetoId={p.id} nomeAtual={p.nome_obra || ''} />
              <ExcluirProjetoButton projetoId={p.id} nomeAtual={p.nome_obra || ''} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
