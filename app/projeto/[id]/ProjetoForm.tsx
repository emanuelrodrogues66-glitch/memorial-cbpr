'use client';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { buscarCnae, calcular, getCnae } from '@/lib/calculos';
import type { CnaeRow } from '@/lib/types';
import {
  DATA_SAIDAS,
  DIVS_AGRUPADAS,
  COMPONENTE_LABEL,
  novoPavimento,
  novoAmbiente,
  novaSaidaReal,
  type Pavimento,
  type Ambiente,
  type SaidaReal,
  type ComponenteSaida,
  type DimPavimento
} from '@/lib/saidas-npt011';

const ETAPAS = [
  '1. Dados da obra',
  '2. Classificação (CNAE)',
  '3. Características físicas',
  '4. População e saídas',
  '5. Brigada',
  '6. Medidas e responsável'
];

export default function ProjetoForm({ projeto, profile }: { projeto: any; profile: any }) {
  const supabase = createClient();
  const [etapa, setEtapa] = useState(0);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState<string | null>(null);
  const [dados, setDados] = useState<any>(() => ({
    nome_obra: projeto.nome_obra ?? '',
    proprietario: projeto.dados?.proprietario ?? '',
    cpf_cnpj: projeto.dados?.cpf_cnpj ?? '',
    endereco: projeto.dados?.endereco ?? '',
    cidade: projeto.dados?.cidade ?? '',
    uf: projeto.dados?.uf ?? 'PR',
    cep: projeto.dados?.cep ?? '',
    telefone: projeto.dados?.telefone ?? profile?.telefone ?? '',
    email_contato: projeto.dados?.email_contato ?? profile?.email ?? '',
    cnae: projeto.dados?.cnae ?? '',
    grupo: projeto.dados?.grupo ?? '',
    ocupacao: projeto.dados?.ocupacao ?? '',
    divisao: projeto.dados?.divisao ?? '',
    descricao_atividade: projeto.dados?.descricao_atividade ?? '',
    carga_incendio_mj_m2: projeto.dados?.carga_incendio_mj_m2 ?? 0,
    area_total_m2: projeto.dados?.area_total_m2 ?? 0,
    area_construida_m2: projeto.dados?.area_construida_m2 ?? 0,
    altura_edificacao_m: projeto.dados?.altura_edificacao_m ?? 0,
    numero_pavimentos: projeto.dados?.numero_pavimentos ?? 1,
    populacao_calculada: projeto.dados?.populacao_calculada ?? 0,
    saidas_pavimentos: projeto.dados?.saidas_pavimentos ?? [],
    medidas_protecao: projeto.dados?.medidas_protecao ?? [],
    responsavel_tecnico: projeto.dados?.responsavel_tecnico ?? profile?.full_name ?? '',
    crea_resp: projeto.dados?.crea_resp ?? profile?.crea ?? '',
    observacoes: projeto.dados?.observacoes ?? ''
  }));

  // Recalcula derivados
  const calculados = useMemo(() => calcular(dados), [dados]);
  const total = { ...dados, ...calculados };

  function up(k: string, v: any) {
    setDados((d: any) => ({ ...d, [k]: v }));
  }

  async function salvar() {
    setSalvando(true);
    const merged = { ...dados, ...calculados };
    const { error } = await supabase
      .from('memorial_projetos')
      .update({
        nome_obra: merged.nome_obra || 'Sem nome',
        dados: merged,
        status: etapa === ETAPAS.length - 1 ? 'concluido' : 'rascunho'
      })
      .eq('id', projeto.id);
    setSalvando(false);
    if (error) {
      setSalvo(`Erro: ${error.message}`);
    } else {
      setSalvo('Salvo ' + new Date().toLocaleTimeString('pt-BR'));
      setTimeout(() => setSalvo(null), 2500);
    }
  }

  // Salva ao trocar de etapa
  useEffect(() => {
    const t = setTimeout(salvar, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etapa]);

  return (
    <section className="max-w-5xl mx-auto px-6 py-8">
      <Stepper etapa={etapa} onChange={setEtapa} />

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 card">
          {etapa === 0 && <Etapa1 dados={dados} up={up} />}
          {etapa === 1 && <Etapa2 dados={dados} up={up} calc={calculados} />}
          {etapa === 2 && <Etapa3 dados={dados} up={up} calc={calculados} />}
          {etapa === 3 && <Etapa4 dados={dados} up={up} calc={calculados} />}
          {etapa === 4 && <Etapa5 dados={dados} up={up} calc={calculados} />}
          {etapa === 5 && <Etapa6 dados={dados} up={up} calc={calculados} />}

          <div className="mt-8 flex items-center justify-between">
            <button
              className="btn-secondary"
              disabled={etapa === 0}
              onClick={() => setEtapa((e) => Math.max(0, e - 1))}
            >
              ← Anterior
            </button>
            <div className="flex items-center gap-3">
              <button onClick={salvar} className="btn-secondary">
                {salvando ? 'Salvando…' : 'Salvar'}
              </button>
              {etapa < ETAPAS.length - 1 ? (
                <button className="btn-primary" onClick={() => setEtapa((e) => e + 1)}>
                  Próxima →
                </button>
              ) : (
                <a href={`/projeto/${projeto.id}/gerar`} className="btn-primary">
                  Gerar documentos →
                </a>
              )}
            </div>
          </div>
          {salvo && <div className="mt-3 text-sm text-success">{salvo}</div>}
        </div>

        <ResumoLateral total={total} />
      </div>
    </section>
  );
}

function Stepper({ etapa, onChange }: { etapa: number; onChange: (i: number) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {ETAPAS.map((label, i) => {
        const ativo = i === etapa;
        const concluido = i < etapa;
        return (
          <button
            key={label}
            onClick={() => onChange(i)}
            className={[
              'px-3 py-2 rounded-md text-xs font-medium border transition',
              ativo ? 'bg-primary text-white border-primary' : '',
              !ativo && concluido ? 'bg-primary/10 text-primary border-primary/30' : '',
              !ativo && !concluido ? 'bg-white text-muted border-border hover:text-ink' : ''
            ].join(' ')}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="field-group">
      <label className="label">{label}</label>
      {children}
      {hint && <div className="text-xs text-muted mt-1">{hint}</div>}
    </div>
  );
}

function Etapa1({ dados, up }: any) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Dados da obra</h2>
      <p className="text-sm text-muted">Identifique a edificação e o proprietário.</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Nome da obra"><input className="input" value={dados.nome_obra} onChange={e => up('nome_obra', e.target.value)} /></Field>
        <Field label="Proprietário / Razão Social"><input className="input" value={dados.proprietario} onChange={e => up('proprietario', e.target.value)} /></Field>
        <Field label="CPF / CNPJ"><input className="input" value={dados.cpf_cnpj} onChange={e => up('cpf_cnpj', e.target.value)} /></Field>
        <Field label="Telefone"><input className="input" value={dados.telefone} onChange={e => up('telefone', e.target.value)} /></Field>
        <Field label="E-mail de contato"><input type="email" className="input" value={dados.email_contato} onChange={e => up('email_contato', e.target.value)} /></Field>
        <Field label="Endereço"><input className="input" value={dados.endereco} onChange={e => up('endereco', e.target.value)} /></Field>
        <Field label="Cidade"><input className="input" value={dados.cidade} onChange={e => up('cidade', e.target.value)} /></Field>
        <Field label="UF"><input className="input" value={dados.uf} onChange={e => up('uf', e.target.value.toUpperCase().slice(0, 2))} /></Field>
        <Field label="CEP"><input className="input" value={dados.cep} onChange={e => up('cep', e.target.value)} /></Field>
      </div>
    </div>
  );
}

function Etapa2({ dados, up, calc }: any) {
  const [busca, setBusca] = useState('');
  const [resultados, setResultados] = useState<CnaeRow[]>([]);
  useEffect(() => {
    const t = setTimeout(() => setResultados(buscarCnae(busca, 30)), 200);
    return () => clearTimeout(t);
  }, [busca]);

  function escolher(r: CnaeRow) {
    up('cnae', r.cnae);
    up('grupo', r.grupo);
    up('ocupacao', r.ocupacao);
    up('divisao', r.divisao);
    up('descricao_atividade', r.descricao);
    up('carga_incendio_mj_m2', r.carga_incendio_mj_m2 ?? 0);
    setBusca(''); setResultados([]);
  }

  const atual = dados.cnae ? getCnae(dados.cnae) : undefined;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Classificação por CNAE</h2>
      <p className="text-sm text-muted">Pesquise pelo código CNAE, descrição da atividade ou divisão (ex.: I-1, B-2).</p>

      <Field label="Buscar atividade">
        <input className="input" placeholder="Ex.: indústria de móveis, hotel, escola, 4711-3..." value={busca} onChange={e => setBusca(e.target.value)} />
      </Field>
      {resultados.length > 0 && (
        <div className="border border-border rounded-md max-h-72 overflow-auto bg-white">
          {resultados.map(r => (
            <button key={r.cnae + r.descricao} type="button" onClick={() => escolher(r)} className="w-full text-left px-3 py-2 hover:bg-surface border-b border-border last:border-0">
              <div className="text-xs text-primary font-mono">{r.cnae} • {r.divisao}</div>
              <div className="text-sm">{r.descricao}</div>
              <div className="text-xs text-muted">{r.ocupacao} • Carga {r.carga_incendio_mj_m2 ?? '—'} MJ/m²</div>
            </button>
          ))}
        </div>
      )}

      {atual && (
        <div className="rounded-md bg-surface border border-border p-4 text-sm">
          <div className="font-semibold text-ink">{atual.descricao}</div>
          <div className="grid sm:grid-cols-4 gap-2 mt-3 text-xs">
            <Info label="CNAE" value={atual.cnae} />
            <Info label="Grupo" value={atual.grupo} />
            <Info label="Divisão" value={atual.divisao} />
            <Info label="Ocupação" value={atual.ocupacao} />
            <Info label="Carga MJ/m²" value={String(atual.carga_incendio_mj_m2 ?? '—')} />
            <Info label="Risco" value={calc.risco_incendio} />
          </div>
        </div>
      )}
    </div>
  );
}

function Etapa3({ dados, up, calc }: any) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Características físicas</h2>
      <p className="text-sm text-muted">Áreas e altura conforme NPT 005 / Tabela 1.</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Área total do terreno (m²)"><input type="number" min="0" step="0.01" className="input" value={dados.area_total_m2} onChange={e => up('area_total_m2', Number(e.target.value))} /></Field>
        <Field label="Área construída (m²)"><input type="number" min="0" step="0.01" className="input" value={dados.area_construida_m2} onChange={e => up('area_construida_m2', Number(e.target.value))} /></Field>
        <Field label="Altura da edificação (m)" hint="Distância do piso de descarga ao piso do último pavimento habitável."><input type="number" min="0" step="0.01" className="input" value={dados.altura_edificacao_m} onChange={e => up('altura_edificacao_m', Number(e.target.value))} /></Field>
        <Field label="Número de pavimentos"><input type="number" min="1" className="input" value={dados.numero_pavimentos} onChange={e => up('numero_pavimentos', Number(e.target.value))} /></Field>
      </div>
      <div className="rounded-md bg-surface border border-border p-4 text-sm grid sm:grid-cols-3 gap-3">
        <Info label="Tipo (NPT 005)" value={calc.tipo_edificacao} />
        <Info label="Classe (NPT 008)" value={calc.classe_npt008} />
        <Info label="TRRF (min)" value={calc.trrf_minutos != null ? String(calc.trrf_minutos) : 'sem regra'} />
      </div>
    </div>
  );
}

function Etapa4({ dados, up, calc }: any) {
  const pavs: Pavimento[] = Array.isArray(dados.saidas_pavimentos)
    ? dados.saidas_pavimentos
    : [];
  const dims: DimPavimento[] = calc.saidas_dimensionamento || [];

  function setPavs(next: Pavimento[]) {
    up('saidas_pavimentos', next);
  }

  function addPav() {
    const id = (pavs.reduce((m, p) => Math.max(m, p.id), 0) || 0) + 1;
    setPavs([...pavs, novoPavimento(id)]);
  }

  function removePav(id: number) {
    setPavs(pavs.filter((p) => p.id !== id));
  }

  function patchPav(id: number, patch: Partial<Pavimento>) {
    setPavs(pavs.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function toggleModo(pid: number, mode: ComponenteSaida) {
    const p = pavs.find((x) => x.id === pid);
    if (!p) return;
    patchPav(pid, {
      componentes_ativos: { ...p.componentes_ativos, [mode]: !p.componentes_ativos[mode] }
    });
  }

  function addAmb(pid: number) {
    const p = pavs.find((x) => x.id === pid);
    if (!p) return;
    const id = (p.ambientes.reduce((m, a) => Math.max(m, a.id), 0) || 0) + 1;
    patchPav(pid, { ambientes: [...p.ambientes, novoAmbiente(id)] });
  }

  function removeAmb(pid: number, aid: number) {
    const p = pavs.find((x) => x.id === pid);
    if (!p || p.ambientes.length <= 1) return;
    patchPav(pid, { ambientes: p.ambientes.filter((a) => a.id !== aid) });
  }

  function patchAmb(pid: number, aid: number, patch: Partial<Ambiente>) {
    const p = pavs.find((x) => x.id === pid);
    if (!p) return;
    patchPav(pid, {
      ambientes: p.ambientes.map((a) => (a.id === aid ? { ...a, ...patch } : a))
    });
  }

  function addSaida(pid: number, tipo: ComponenteSaida) {
    const p = pavs.find((x) => x.id === pid);
    if (!p) return;
    const id = (p.saidas_reais.reduce((m, s) => Math.max(m, s.id), 0) || 0) + 1;
    patchPav(pid, { saidas_reais: [...p.saidas_reais, novaSaidaReal(id, tipo)] });
  }

  function removeSaida(pid: number, sid: number) {
    const p = pavs.find((x) => x.id === pid);
    if (!p) return;
    patchPav(pid, { saidas_reais: p.saidas_reais.filter((s) => s.id !== sid) });
  }

  function patchSaida(pid: number, sid: number, patch: Partial<SaidaReal>) {
    const p = pavs.find((x) => x.id === pid);
    if (!p) return;
    patchPav(pid, {
      saidas_reais: p.saidas_reais.map((s) => (s.id === sid ? { ...s, ...patch } : s))
    });
  }

  // Pré-popular o primeiro pavimento com a divisão e área da etapa 2/3
  useEffect(() => {
    if (pavs.length === 0 && calc.divisao && DATA_SAIDAS[calc.divisao]) {
      const pav = novoPavimento(1, 'Pavimento térreo');
      pav.ambientes[0] = {
        id: 1,
        nome: 'Ambiente principal',
        div: calc.divisao,
        area: Number(dados.area_construida_m2) || 0,
        excluir: 0
      };
      setPavs([pav]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calc.divisao]);

  const populacaoTotal = dims.reduce((s, d) => s + d.populacao_total, 0);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">Memorial de saídas (NPT 011)</h2>
        <p className="text-sm text-muted mt-1">
          Dimensione as saídas por pavimento e bloco. Para cada pavimento, informe os ambientes
          (com divisão CSCIP e área útil) e os componentes a calcular (porta, escada, acesso).
          Em seguida informe as portas/escadas reais para validar se atendem às unidades de passagem.
        </p>
      </div>

      {pavs.length === 0 && (
        <div className="rounded-md border border-dashed border-border bg-surface p-4 text-sm text-muted">
          Nenhum pavimento ainda. Clique em "Novo pavimento / bloco" para começar.
        </div>
      )}

      {pavs.map((p) => {
        const dim = dims.find((d) => d.pavimento_id === p.id);
        return (
          <PavimentoCard
            key={p.id}
            pav={p}
            dim={dim}
            onLabel={(label) => patchPav(p.id, { label })}
            onRemove={() => removePav(p.id)}
            onToggleModo={(m) => toggleModo(p.id, m)}
            onAddAmb={() => addAmb(p.id)}
            onRemoveAmb={(aid) => removeAmb(p.id, aid)}
            onPatchAmb={(aid, patch) => patchAmb(p.id, aid, patch)}
            onAddSaida={(t) => addSaida(p.id, t)}
            onRemoveSaida={(sid) => removeSaida(p.id, sid)}
            onPatchSaida={(sid, patch) => patchSaida(p.id, sid, patch)}
          />
        );
      })}

      <div className="flex gap-2">
        <button className="btn-primary" onClick={addPav}>
          + Novo pavimento / bloco
        </button>
      </div>

      {pavs.length >= 2 && (
        <div className="rounded-md border border-border bg-surface p-4">
          <div className="font-semibold text-ink mb-2">Resumo geral</div>
          <dl className="text-sm space-y-1">
            {dims.map((d) => (
              <div key={d.pavimento_id} className="flex justify-between">
                <dt className="text-muted">{d.label}</dt>
                <dd className="font-medium">{d.populacao_total} pessoas</dd>
              </div>
            ))}
            <div className="flex justify-between border-t border-border pt-2 mt-2">
              <dt className="text-muted">População total (todos os pavimentos)</dt>
              <dd className="font-bold text-ink">{populacaoTotal} pessoas</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}

function DivSelect({
  value,
  onChange
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">—</option>
      {DIVS_AGRUPADAS.map(([g, items]) => (
        <optgroup key={g} label={g}>
          {items.map((d) => {
            const info = DATA_SAIDAS[d];
            return (
              <option key={d} value={d}>
                {d} — {info.pop}
              </option>
            );
          })}
        </optgroup>
      ))}
    </select>
  );
}

function PavimentoCard({
  pav,
  dim,
  onLabel,
  onRemove,
  onToggleModo,
  onAddAmb,
  onRemoveAmb,
  onPatchAmb,
  onAddSaida,
  onRemoveSaida,
  onPatchSaida
}: {
  pav: Pavimento;
  dim?: DimPavimento;
  onLabel: (v: string) => void;
  onRemove: () => void;
  onToggleModo: (m: ComponenteSaida) => void;
  onAddAmb: () => void;
  onRemoveAmb: (aid: number) => void;
  onPatchAmb: (aid: number, patch: Partial<Ambiente>) => void;
  onAddSaida: (t: ComponenteSaida) => void;
  onRemoveSaida: (sid: number) => void;
  onPatchSaida: (sid: number, patch: Partial<SaidaReal>) => void;
}) {
  const modos: ComponenteSaida[] = ['porta', 'escada', 'acesso'];

  return (
    <div className="rounded-md border border-border bg-white p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <input
          className="input font-semibold text-lg"
          style={{ maxWidth: 280 }}
          value={pav.label}
          onChange={(e) => onLabel(e.target.value)}
        />
        <button className="btn-secondary text-error" onClick={onRemove}>
          Remover pavimento
        </button>
      </div>

      <div>
        <div className="text-xs uppercase tracking-wide text-muted mb-1">
          Componentes a dimensionar
        </div>
        <div className="flex flex-wrap gap-2">
          {modos.map((m) => {
            const active = pav.componentes_ativos[m];
            return (
              <button
                key={m}
                onClick={() => onToggleModo(m)}
                className={
                  active
                    ? 'px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-white border border-primary'
                    : 'px-3 py-1.5 rounded-md text-xs font-medium bg-white text-muted border border-border hover:text-ink'
                }
              >
                {COMPONENTE_LABEL[m]}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-wide text-muted mb-2">Ambientes</div>
        <div className="space-y-2">
          {pav.ambientes.map((a) => (
            <div
              key={a.id}
              className="grid sm:grid-cols-12 gap-2 items-end border-b border-border pb-2"
            >
              <div className="sm:col-span-3">
                <label className="label">Ambiente</label>
                <input
                  className="input"
                  placeholder="ex.: Templo, Sala 1"
                  value={a.nome}
                  onChange={(e) => onPatchAmb(a.id, { nome: e.target.value })}
                />
              </div>
              <div className="sm:col-span-4">
                <label className="label">Divisão</label>
                <DivSelect
                  value={a.div}
                  onChange={(v) => onPatchAmb(a.id, { div: v })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Área útil (m²)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input"
                  value={a.area || ''}
                  onChange={(e) => onPatchAmb(a.id, { area: Number(e.target.value) })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Excluir (m²)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input"
                  value={a.excluir || ''}
                  onChange={(e) => onPatchAmb(a.id, { excluir: Number(e.target.value) })}
                />
              </div>
              <div className="sm:col-span-1 flex justify-end">
                {pav.ambientes.length > 1 && (
                  <button
                    className="btn-secondary text-error"
                    onClick={() => onRemoveAmb(a.id)}
                    aria-label="Remover ambiente"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <button onClick={onAddAmb} className="btn-secondary text-xs mt-2">
          + Adicionar ambiente
        </button>
      </div>

      {dim && dim.dimensionamento.length > 0 && (
        <div className="rounded-md bg-surface border border-border p-3">
          <div className="grid sm:grid-cols-3 gap-3 mb-3">
            <Metric label="Ambientes" value={String(dim.por_ambiente.length)} />
            <Metric label="População total" value={`${dim.populacao_total} pess.`} />
            <Metric label="Componentes" value={String(dim.dimensionamento.length)} />
          </div>
          <div className="text-xs uppercase tracking-wide text-muted mb-2">
            Dimensionamento por componente
          </div>
          {dim.dimensionamento.map((d) => (
            <div key={d.mode} className="mb-3">
              <div className="text-sm font-semibold text-ink">{d.label}</div>
              <table className="w-full text-xs mt-1">
                <thead className="text-muted">
                  <tr>
                    <th className="text-left py-1">Ambiente</th>
                    <th className="text-right">Pop.</th>
                    <th className="text-right">C</th>
                    <th className="text-right">N (UP)</th>
                    <th className="text-right">UP final</th>
                    <th className="text-right">Largura</th>
                  </tr>
                </thead>
                <tbody>
                  {d.por_ambiente.map((row, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="py-1">
                        {row.ambiente}{' '}
                        <span className="text-muted">({row.divisao})</span>
                      </td>
                      <td className="text-right">{row.populacao}</td>
                      <td className="text-right">{row.c}</td>
                      <td className="text-right">{row.up_bruto}</td>
                      <td className="text-right">{row.up_final}</td>
                      <td className="text-right">
                        {row.largura_m.toFixed(2)} m
                        {row.ajustado_min && (
                          <span className="ml-1 text-[10px] text-warning">(mín)</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-border font-semibold">
                    <td className="py-1">
                      Total agrupado{' '}
                      <span className="text-muted font-normal">
                        (C mais restritivo = {d.c_critico})
                      </span>
                    </td>
                    <td className="text-right">{dim.populacao_total}</td>
                    <td className="text-right">{d.c_critico}</td>
                    <td></td>
                    <td className="text-right">{d.total_up}</td>
                    <td className="text-right">{d.total_largura_m.toFixed(2)} m</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}
          <p className="text-[11px] text-muted mt-1">
            UP = 0,55 m | Largura mínima: porta 0,80 m (1 UP), escada/acesso 1,20 m (2 UP) | Total
            agrupado usa C mais restritivo (item 5.3.2.2 NPT 011).
          </p>
        </div>
      )}

      {dim && dim.dimensionamento.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs uppercase tracking-wide text-muted">
              Saídas existentes (verificação)
            </div>
            <div className="flex gap-1">
              {modos
                .filter((m) => pav.componentes_ativos[m])
                .map((m) => (
                  <button
                    key={m}
                    className="btn-secondary text-xs"
                    onClick={() => onAddSaida(m)}
                  >
                    + {COMPONENTE_LABEL[m]}
                  </button>
                ))}
            </div>
          </div>

          {pav.saidas_reais.length === 0 ? (
            <div className="text-xs text-muted italic">
              Adicione as portas/escadas/acessos existentes para validar se atendem.
            </div>
          ) : (
            <div className="space-y-1">
              {pav.saidas_reais.map((s) => (
                <div
                  key={s.id}
                  className="grid sm:grid-cols-12 gap-2 items-end border-b border-border pb-2"
                >
                  <div className="sm:col-span-3">
                    <label className="label">Tipo</label>
                    <select
                      className="input"
                      value={s.tipo}
                      onChange={(e) =>
                        onPatchSaida(s.id, { tipo: e.target.value as ComponenteSaida })
                      }
                    >
                      {modos.map((m) => (
                        <option key={m} value={m}>
                          {COMPONENTE_LABEL[m]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-4">
                    <label className="label">Identificação</label>
                    <input
                      className="input"
                      placeholder="ex.: Porta P1"
                      value={s.identificacao}
                      onChange={(e) =>
                        onPatchSaida(s.id, { identificacao: e.target.value })
                      }
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Largura (m)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="input"
                      value={s.largura_m || ''}
                      onChange={(e) =>
                        onPatchSaida(s.id, { largura_m: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Qtd</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      className="input"
                      value={s.quantidade || ''}
                      onChange={(e) =>
                        onPatchSaida(s.id, { quantidade: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      className="btn-secondary text-error"
                      onClick={() => onRemoveSaida(s.id)}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {dim.verificacao.length > 0 && (
            <div className="mt-3 space-y-1">
              {dim.verificacao.map((v) => (
                <div
                  key={v.tipo}
                  className={
                    'rounded-md border px-3 py-2 text-sm flex flex-wrap items-center gap-2 ' +
                    (v.atende
                      ? 'border-success/40 bg-success/5'
                      : 'border-error/40 bg-error/5')
                  }
                >
                  <span
                    className={
                      'text-[11px] font-bold px-2 py-0.5 rounded-full ' +
                      (v.atende
                        ? 'bg-success text-white'
                        : 'bg-error text-white')
                    }
                  >
                    {v.atende ? 'ATENDE' : 'NÃO ATENDE'}
                  </span>
                  <span className="font-semibold">{v.label}</span>
                  <span className="text-muted">
                    Exigido: {v.up_exigido} UP / {v.largura_exigida_m.toFixed(2)} m
                  </span>
                  <span className="text-muted">→</span>
                  <span>
                    Real: {v.up_real} UP / {v.largura_real_m.toFixed(2)} m ({v.quantidade_elementos} un)
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-md border border-border px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-muted">{label}</div>
      <div className="text-lg font-semibold text-ink">{value}</div>
    </div>
  );
}

function Etapa5({ calc }: any) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Brigada de incêndio (NPT 017)</h2>
      <p className="text-sm text-muted">Cálculo conforme nível de risco e população.</p>
      <div className="rounded-md bg-surface border border-border p-4 text-sm grid sm:grid-cols-2 gap-3">
        <Info label="Brigadistas" value={String(calc.brigadistas_necessarios)} />
        <Info label="Justificativa" value={calc.brigadistas_descricao} />
      </div>
    </div>
  );
}

function Etapa6({ dados, up, calc }: any) {
  const medidasCSCIP: { nome: string; status: 'EXIGIDO' | 'CONDICIONAL'; observacao?: string }[] =
    calc.medidas_cscip || [];
  const simplificada: boolean = !!calc.cscip_simplificada;

  // Lista de nomes que são EXIGIDOS (sempre marcados, não desmarcáveis)
  const nomesExigidos = medidasCSCIP
    .filter((m) => m.status === 'EXIGIDO')
    .map((m) => m.nome);
  const nomesCondicionais = medidasCSCIP
    .filter((m) => m.status === 'CONDICIONAL')
    .map((m) => m.nome);

  // Carrega/inicializa: garante que TODOS os Exigidos estejam marcados.
  // Condicionais só se o usuário já marcou anteriormente.
  useEffect(() => {
    const atuais = new Set<string>(dados.medidas_protecao || []);
    let mudou = false;
    for (const nome of nomesExigidos) {
      if (!atuais.has(nome)) {
        atuais.add(nome);
        mudou = true;
      }
    }
    if (mudou) up('medidas_protecao', Array.from(atuais));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(nomesExigidos)]);

  function toggleCondicional(nome: string) {
    const set = new Set<string>(dados.medidas_protecao || []);
    set.has(nome) ? set.delete(nome) : set.add(nome);
    up('medidas_protecao', Array.from(set));
  }

  const escolhidas = new Set<string>(dados.medidas_protecao || []);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">Medidas de segurança contra incêndio</h2>
        <p className="text-sm text-muted mt-1">
          Verificador CSCIP/PR baseado em divisão, área e altura. Medidas marcadas como
          {' '}<strong>Exigido</strong> vão automáticas para o memorial. As
          {' '}<strong>Condicionais</strong> dependem de análise caso a caso — marque as que se aplicam.
        </p>
      </div>

      {medidasCSCIP.length === 0 ? (
        <div className="rounded-md bg-surface border border-border p-4 text-sm text-muted">
          Selecione um CNAE e informe área e altura nas etapas anteriores para ver as medidas.
        </div>
      ) : (
        <div className="rounded-md border border-border bg-white">
          {simplificada && (
            <div className="px-4 py-2 text-xs bg-[#EAF3DE] text-[#3B6D11] border-b border-border">
              Enquadramento em tabela simplificada (Tabela 5 do CSCIP/PR).
            </div>
          )}
          <ul className="divide-y divide-border">
            {medidasCSCIP.map((m) => {
              const exigido = m.status === 'EXIGIDO';
              const marcada = escolhidas.has(m.nome) || exigido;
              return (
                <li key={m.nome} className="px-4 py-3 flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={marcada}
                    disabled={exigido}
                    onChange={() => toggleCondicional(m.nome)}
                    aria-label={m.nome}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-ink font-medium">{m.nome}</span>
                      {exigido ? (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#FCEBEB] text-[#A32D2D]">
                          Exigido
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#FAEEDA] text-[#854F0B]">
                          Condicional
                        </span>
                      )}
                    </div>
                    {m.observacao && (
                      <div className="text-xs text-muted mt-1">{m.observacao}</div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="px-4 py-2 text-xs text-muted border-t border-border">
            {nomesExigidos.length} exigida(s) • {nomesCondicionais.length} condicional(is)
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Responsável técnico"><input className="input" value={dados.responsavel_tecnico} onChange={e => up('responsavel_tecnico', e.target.value)} /></Field>
        <Field label="CREA / CAU"><input className="input" value={dados.crea_resp} onChange={e => up('crea_resp', e.target.value)} /></Field>
        <Field label="Observações"><textarea className="input min-h-[100px]" value={dados.observacoes} onChange={e => up('observacoes', e.target.value)} /></Field>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className="font-semibold text-ink mt-0.5">{value || '—'}</div>
    </div>
  );
}

function ResumoLateral({ total }: { total: any }) {
  return (
    <aside className="card h-fit sticky top-6">
      <h3 className="font-semibold text-ink">Resumo</h3>
      <dl className="mt-3 text-sm space-y-2">
        <Row label="Obra" v={total.nome_obra} />
        <Row label="CNAE" v={total.cnae} />
        <Row label="Divisão" v={total.divisao} />
        <Row label="Risco" v={total.risco_incendio} />
        <Row label="Tipo" v={total.tipo_edificacao} />
        <Row label="Área constr." v={total.area_construida_m2 ? `${total.area_construida_m2} m²` : ''} />
        <Row label="Altura" v={total.altura_edificacao_m ? `${total.altura_edificacao_m} m` : ''} />
        <Row label="TRRF" v={total.trrf_minutos != null ? `${total.trrf_minutos} min` : ''} />
        <Row label="População" v={total.populacao_calculada ? String(total.populacao_calculada) : ''} />
        <Row label="Brigadistas" v={total.brigadistas_necessarios ? String(total.brigadistas_necessarios) : ''} />
      </dl>
    </aside>
  );
}

function Row({ label, v }: { label: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium text-right truncate">{v || '—'}</dd>
    </div>
  );
}
