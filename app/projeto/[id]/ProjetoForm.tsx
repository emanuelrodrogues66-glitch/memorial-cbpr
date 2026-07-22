'use client';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { buscarCnae, calcular, getCnae } from '@/lib/calculos';
import RevitImportBanner from '@/components/RevitImportBanner';
import RevitConexaoCard from '@/components/RevitConexaoCard';
import type { CnaeRow, CnaeSelecionado } from '@/lib/types';
import {
  DATA_SAIDAS,
  DIVS_AGRUPADAS,
  COMPONENTE_LABEL,
  novoPavimento,
  novoAmbiente,
  novaSaidaReal,
  isGrupoF,
  type Pavimento,
  type Ambiente,
  type SaidaReal,
  type ComponenteSaida,
  type DimPavimento
} from '@/lib/saidas-npt011';
import { novoItemCargaIncendio, type ItemCargaIncendio } from '@/lib/carga-incendio';
import { nptOuIn, itemNorma, siglaProjeto, type UF } from '@/lib/cbmsc';

const ETAPAS = [
  '1. Dados da obra',
  '2. Classificação (CNAE)',
  '3. Características físicas',
  '4. População e saídas',
  '5. Carga de incêndio',
  '6. Brigada',
  '7. Medidas e responsável',
  '8. Dados complementares'
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
    cnaes: projeto.dados?.cnaes ?? [],
    grupo: projeto.dados?.grupo ?? '',
    ocupacao: projeto.dados?.ocupacao ?? '',
    divisao: projeto.dados?.divisao ?? '',
    descricao_atividade: projeto.dados?.descricao_atividade ?? '',
    inscricao_imobiliaria: projeto.dados?.inscricao_imobiliaria ?? '',
    carga_incendio_mj_m2: projeto.dados?.carga_incendio_mj_m2 ?? 0,
    area_total_m2: projeto.dados?.area_total_m2 ?? 0,
    area_construida_m2: projeto.dados?.area_construida_m2 ?? 0,
    altura_edificacao_m: projeto.dados?.altura_edificacao_m ?? 0,
    numero_pavimentos: projeto.dados?.numero_pavimentos ?? 1,
    populacao_calculada: projeto.dados?.populacao_calculada ?? 0,
    saidas_pavimentos: projeto.dados?.saidas_pavimentos ?? [],
    carga_incendio_itens: projeto.dados?.carga_incendio_itens ?? [],
    medidas_protecao: projeto.dados?.medidas_protecao ?? [],
    responsavel_tecnico: projeto.dados?.responsavel_tecnico ?? profile?.full_name ?? '',
    crea_resp: projeto.dados?.crea_resp ?? profile?.crea ?? '',
    observacoes: projeto.dados?.observacoes ?? '',
    oficio_local: projeto.dados?.oficio_local ?? projeto.dados?.cidade ?? '',
    oficio_data: projeto.dados?.oficio_data ?? new Date().toISOString().slice(0, 10),
    memorial_construcao: projeto.dados?.memorial_construcao ?? {},
    info_operacional: projeto.dados?.info_operacional ?? {},
    acesso_viaturas: projeto.dados?.acesso_viaturas ?? {},
    termo_saidas: projeto.dados?.termo_saidas ?? {},
    nib: projeto.dados?.nib ?? '',
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

  // Salva automaticamente 1,5s após qualquer alteração nos dados
  useEffect(() => {
    const t = setTimeout(salvar, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dados]);

  return (
    <section className="max-w-5xl mx-auto px-6 py-8">
      <Stepper etapa={etapa} onChange={setEtapa} />

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 card">
          {etapa === 0 && <Etapa1 dados={dados} up={up} />}
          {etapa === 1 && <Etapa2 dados={dados} up={up} calc={calculados} />}
          {etapa === 2 && <Etapa3 dados={dados} up={up} calc={calculados} />}
          {etapa === 3 && (
            <Etapa4
              dados={dados}
              up={up}
              calc={calculados}
              projetoId={projeto.id}
              revitToken={projeto.revit_token}
            />
          )}
          {etapa === 4 && <EtapaCargaIncendio dados={dados} up={up} calc={calculados} />}
          {etapa === 5 && <Etapa5 dados={dados} up={up} calc={calculados} />}
          {etapa === 6 && <Etapa6 dados={dados} up={up} calc={calculados} />}
          {etapa === 7 && <EtapaComplementar dados={dados} up={up} calc={calculados} />}

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
  const [buscandoCnpj, setBuscandoCnpj] = useState(false);
  const [erroCnpj, setErroCnpj] = useState<string | null>(null);
  const [okCnpj, setOkCnpj] = useState<string | null>(null);

  const buscarCnpj = async () => {
    setErroCnpj(null);
    setOkCnpj(null);
    const limpo = (dados.cpf_cnpj || '').replace(/\D/g, '');
    if (limpo.length !== 14) {
      setErroCnpj('Informe um CNPJ com 14 dígitos');
      return;
    }
    setBuscandoCnpj(true);
    try {
      const res = await fetch(`/api/cnpj/${limpo}`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'CNPJ não encontrado');
      }
      const j = await res.json();
      // Só substitui campos vazios (preserva edição manual do usuário)
      if (j.razao_social && !dados.proprietario) up('proprietario', j.razao_social);
      if (j.endereco && !dados.endereco) up('endereco', j.endereco);
      if (j.cidade && !dados.cidade) up('cidade', j.cidade);
      if (j.uf && !dados.uf) up('uf', j.uf);
      if (j.cep && !dados.cep) up('cep', j.cep);
      if (j.telefone && !dados.telefone) up('telefone', j.telefone);
      if (j.email && !dados.email_contato) up('email_contato', j.email);
      const camposPreenchidos = [j.razao_social, j.endereco, j.cidade].filter(Boolean).length;
      setOkCnpj(`Dados carregados (${camposPreenchidos} campos). Edite à vontade.`);
    } catch (err) {
      setErroCnpj(err instanceof Error ? err.message : 'Erro ao buscar CNPJ');
    } finally {
      setBuscandoCnpj(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Dados da obra</h2>
      <p className="text-sm text-muted">Identifique a edificação e o proprietário. Os campos buscados pelo CNPJ podem ser substituídos manualmente.</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Nome da obra"><input className="input" value={dados.nome_obra} onChange={e => up('nome_obra', e.target.value)} /></Field>
        <Field label="Proprietário / Razão Social"><input className="input" value={dados.proprietario} onChange={e => up('proprietario', e.target.value)} /></Field>
        <Field label="CPF / CNPJ">
          <div className="flex gap-2">
            <input className="input flex-1" value={dados.cpf_cnpj} onChange={e => up('cpf_cnpj', e.target.value)} placeholder="00.000.000/0000-00" />
            <button type="button" onClick={buscarCnpj} disabled={buscandoCnpj} className="btn-secondary whitespace-nowrap disabled:opacity-50">
              {buscandoCnpj ? 'Buscando...' : 'Buscar dados'}
            </button>
          </div>
          {erroCnpj && <p className="text-xs text-danger mt-1">{erroCnpj}</p>}
          {okCnpj && <p className="text-xs text-success mt-1">{okCnpj}</p>}
        </Field>
        <Field label="Inscrição Imobiliária"><input className="input" value={dados.inscricao_imobiliaria} onChange={e => up('inscricao_imobiliaria', e.target.value)} /></Field>
        <Field label="NIB (Nº do processo no Bombeiro)"><input className="input" placeholder="ex.: 12345/2024" value={dados.nib || ''} onChange={e => up('nib', e.target.value)} /></Field>
        <Field label="Telefone (opcional)"><input className="input" value={dados.telefone} onChange={e => up('telefone', e.target.value)} /></Field>
        <Field label="E-mail de contato (opcional)"><input type="email" className="input" value={dados.email_contato} onChange={e => up('email_contato', e.target.value)} /></Field>
        <Field label="Endereço"><input className="input" value={dados.endereco} onChange={e => up('endereco', e.target.value)} /></Field>
        <Field label="Cidade"><input className="input" value={dados.cidade} onChange={e => up('cidade', e.target.value)} /></Field>
        <Field label="UF (Norma aplicável)">
          <select className="input" value={dados.uf || 'PR'} onChange={e => up('uf', e.target.value)}>
            <option value="PR">PR - CBMPR (NPT)</option>
            <option value="SC">SC - CBMSC (IN)</option>
          </select>
        </Field>
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

  // Lista de CNAEs/ocupações selecionados (suporte a edificação mista)
  const cnaesSel: CnaeSelecionado[] = Array.isArray(dados.cnaes) ? dados.cnaes : [];

  function sincronizarLegado(lista: CnaeSelecionado[]) {
    // Mantém os campos legados (dados.cnae, grupo, ocupacao, divisao…)
    // sincronizados com o primeiro CNAE selecionado para compatibilidade.
    const primeiro = lista[0];
    if (primeiro) {
      up('cnae', primeiro.cnae);
      up('grupo', primeiro.grupo);
      up('ocupacao', primeiro.ocupacao);
      up('divisao', primeiro.divisao);
      up('descricao_atividade', primeiro.descricao);
      up('carga_incendio_mj_m2', primeiro.carga_incendio_mj_m2 ?? 0);
    } else {
      up('cnae', '');
      up('grupo', '');
      up('ocupacao', '');
      up('divisao', '');
      up('descricao_atividade', '');
      up('carga_incendio_mj_m2', 0);
    }
  }

  function adicionar(r: CnaeRow) {
    // Evita duplicar
    if (cnaesSel.some((c) => c.cnae === r.cnae && c.divisao === r.divisao)) {
      setBusca('');
      setResultados([]);
      return;
    }
    const novo: CnaeSelecionado = {
      id: `${r.cnae}-${r.divisao}-${Date.now()}`,
      cnae: r.cnae,
      grupo: r.grupo,
      ocupacao: r.ocupacao,
      divisao: r.divisao,
      descricao: r.descricao,
      carga_incendio_mj_m2: r.carga_incendio_mj_m2 ?? 0
    };
    const novaLista = [...cnaesSel, novo];
    up('cnaes', novaLista);
    sincronizarLegado(novaLista);
    setBusca('');
    setResultados([]);
  }

  function remover(id: string) {
    const novaLista = cnaesSel.filter((c) => c.id !== id);
    up('cnaes', novaLista);
    sincronizarLegado(novaLista);
  }

  // Inicializa cnaes[] a partir dos campos legados se o usuário tem CNAE antigo mas não tem lista
  useEffect(() => {
    if (cnaesSel.length === 0 && dados.cnae && dados.divisao) {
      const lista: CnaeSelecionado[] = [{
        id: `${dados.cnae}-${dados.divisao}-legacy`,
        cnae: dados.cnae,
        grupo: dados.grupo || '',
        ocupacao: dados.ocupacao || '',
        divisao: dados.divisao,
        descricao: dados.descricao_atividade || '',
        carga_incendio_mj_m2: Number(dados.carga_incendio_mj_m2) || 0
      }];
      up('cnaes', lista);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Classificação por CNAE</h2>
      <p className="text-sm text-muted">
        Pesquise pelo código CNAE, descrição da atividade ou divisão (ex.: I-1, B-2).
        Para <strong>edificação mista</strong>, adicione mais de uma ocupação.
      </p>

      <Field label="Buscar atividade / Adicionar ocupação">
        <input className="input" placeholder="Ex.: indústria de móveis, hotel, escola, 4711-3..." value={busca} onChange={e => setBusca(e.target.value)} />
      </Field>
      {resultados.length > 0 && (
        <div className="border border-border rounded-md max-h-72 overflow-auto bg-white">
          {resultados.map(r => (
            <button key={r.cnae + r.descricao} type="button" onClick={() => adicionar(r)} className="w-full text-left px-3 py-2 hover:bg-surface border-b border-border last:border-0">
              <div className="text-xs text-primary font-mono">{r.cnae} • {r.divisao}</div>
              <div className="text-sm">{r.descricao}</div>
              <div className="text-xs text-muted">{r.ocupacao} • Carga {r.carga_incendio_mj_m2 ?? '—'} MJ/m²</div>
            </button>
          ))}
        </div>
      )}

      {cnaesSel.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-semibold text-ink">
            Ocupações selecionadas ({cnaesSel.length})
            {cnaesSel.length > 1 && (
              <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-[#FFF2CC] text-[#854F0B]">
                Edificação mista
              </span>
            )}
          </div>
          {cnaesSel.map((c, idx) => (
            <div key={c.id} className="flex items-start gap-2 border border-border rounded-md bg-white p-3">
              <div className="flex-1">
                <div className="text-xs text-primary font-mono">{c.cnae} • {c.divisao}{idx === 0 && cnaesSel.length > 1 ? ' • principal' : ''}</div>
                <div className="text-sm font-medium">{c.descricao}</div>
                <div className="text-xs text-muted">{c.ocupacao} • Carga {c.carga_incendio_mj_m2 ?? '—'} MJ/m²</div>
              </div>
              <button type="button" onClick={() => remover(c.id)} className="text-error text-sm px-2" aria-label="Remover ocupação">✕</button>
            </div>
          ))}
          {cnaesSel.length > 1 && calc.ocupacao_resumo && (
            <div className="rounded-md bg-surface border border-border p-3 text-sm">
              <div className="text-xs uppercase tracking-wide text-muted">Resumo da ocupação</div>
              <div className="font-semibold text-ink mt-0.5">{calc.ocupacao_resumo}</div>
            </div>
          )}
        </div>
      )}

      {cnaesSel.length === 1 && (
        <div className="rounded-md bg-surface border border-border p-4 text-sm">
          <div className="grid sm:grid-cols-3 gap-2 text-xs">
            <Info label="Risco" value={calc.risco_incendio} />
            <Info label="Carga MJ/m²" value={String(cnaesSel[0].carga_incendio_mj_m2 ?? '—')} />
            <Info label="Grupo" value={cnaesSel[0].grupo} />
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
      <p className="text-sm text-muted">{`Áreas e altura conforme ${nptOuIn((dados.uf || 'PR') as UF, '005')} / Tabela 1.`}</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Área total do terreno (m²)"><input type="number" min="0" step="0.01" className="input" value={dados.area_total_m2} onChange={e => up('area_total_m2', Number(e.target.value))} /></Field>
        <Field label="Área construída (m²)"><input type="number" min="0" step="0.01" className="input" value={dados.area_construida_m2} onChange={e => up('area_construida_m2', Number(e.target.value))} /></Field>
        <Field label="Altura da edificação (m)" hint="Distância do piso de descarga ao piso do último pavimento habitável."><input type="number" min="0" step="0.01" className="input" value={dados.altura_edificacao_m} onChange={e => up('altura_edificacao_m', Number(e.target.value))} /></Field>
        <Field label="Número de pavimentos"><input type="number" min="1" className="input" value={dados.numero_pavimentos} onChange={e => up('numero_pavimentos', Number(e.target.value))} /></Field>
      </div>
      <div className="rounded-md bg-surface border border-border p-4 text-sm grid sm:grid-cols-3 gap-3">
        <Info label={`Tipo (${nptOuIn((dados.uf || 'PR') as UF, '005')})`} value={calc.tipo_edificacao} />
        <Info label={`Classe (${nptOuIn((dados.uf || 'PR') as UF, '008')})`} value={calc.classe_npt008} />
        <Info label="TRRF (min)" value={calc.trrf_minutos != null ? String(calc.trrf_minutos) : 'sem regra'} />
      </div>
    </div>
  );
}

function Etapa4({ dados, up, calc, projetoId, revitToken }: any) {
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
        <h2 className="text-xl font-bold">{`Memorial de saídas (${nptOuIn((dados.uf || 'PR') as UF, '011')})`}</h2>
        <p className="text-sm text-muted mt-1">
          Dimensione as saídas por pavimento e bloco. Para cada pavimento, informe os ambientes
          (com divisão CSCIP e área útil) e os componentes a calcular (porta, escada, acesso).
          Em seguida informe as portas/escadas reais para validar se atendem às unidades de passagem.
        </p>
      </div>

      <div className="rounded-md border border-border bg-surface p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(dados.leiaute_apresentado)}
            onChange={(e) => up('leiaute_apresentado', e.target.checked)}
            className="mt-1 h-4 w-4"
          />
          <div className="text-sm">
            <div className="font-semibold text-ink">Leiaute (layout) apresentado em projeto</div>
            <div className="text-muted mt-0.5">
              Marque quando o projeto apresenta o leiaute de mobiliário/ocupação. Mantém o
              caminhamento integral da Tabela 2 (Anexo B {nptOuIn((dados.uf || 'PR') as UF, '011')}). Desmarcado aplica a redução
              de 30% prevista para projetos sem leiaute (Nota B / Tabela 2A).
            </div>
          </div>
        </label>
      </div>

      {pavs.length === 0 && (
        <div className="rounded-md border border-dashed border-border bg-surface p-4 text-sm text-muted">
          Nenhum pavimento ainda. Clique em "Novo pavimento / bloco" para começar.
        </div>
      )}

      <RevitConexaoCard projetoId={projetoId} revitToken={revitToken} />

      <RevitImportBanner
        pavimentos={pavs}
        onLimpar={() => up('saidas_pavimentos', [])}
      />

      {pavs.map((p) => {
        const dim = dims.find((d) => d.pavimento_id === p.id);
        return (
          <PavimentoCard
            key={p.id}
            pav={p}
            dim={dim}
            uf={(dados.uf || 'PR') as UF}
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
  uf,
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
  uf: UF;
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
              {['A-1', 'A-2', 'A-3'].includes(a.div) ? (
                <div className="sm:col-span-2">
                  <label className="label">Nº de dormitórios</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="input"
                    placeholder="ex.: 10"
                    value={a.dormitorios || ''}
                    onChange={(e) => onPatchAmb(a.id, { dormitorios: Number(e.target.value) })}
                  />
                  <p className="text-xs text-muted mt-1">2 pessoas/dormitório — NPT 011</p>
                </div>
              ) : isGrupoF(a.div) ? (
                <div className="sm:col-span-2 space-y-2">
                  <label className="label">Cálculo de população</label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name={`leiaute-${a.id}`}
                        checked={!a.uso_leiaute}
                        onChange={() => onPatchAmb(a.id, { uso_leiaute: false, assentos: 0 })}
                      />
                      Por área
                    </label>
                    <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name={`leiaute-${a.id}`}
                        checked={!!a.uso_leiaute}
                        onChange={() => onPatchAmb(a.id, { uso_leiaute: true })}
                      />
                      Por leiaute (assentos)
                    </label>
                  </div>
                  {a.uso_leiaute ? (
                    <>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="input"
                        placeholder="Nº de cadeiras/assentos"
                        value={a.assentos || ''}
                        onChange={(e) => onPatchAmb(a.id, { assentos: Number(e.target.value) })}
                      />
                      <p className="text-xs text-muted">População = nº de assentos — NPT 011</p>
                    </>
                  ) : (
                    <>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="input"
                        placeholder="Área a excluir (m²)"
                        value={a.excluir || ''}
                        onChange={(e) => onPatchAmb(a.id, { excluir: Number(e.target.value) })}
                      />
                      <p className="text-xs text-muted">Excluir área (m²)</p>
                    </>
                  )}
                </div>
              ) : (
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
              )}
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
            agrupado usa C mais restritivo ({itemNorma(uf, '011', '5.3.2.2')}).
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

          {dim.verificacao_consolidada && (
            <div
              className={
                'mt-3 rounded-md border-2 px-3 py-2 ' +
                (dim.verificacao_consolidada.atende
                  ? 'border-success/60 bg-success/10'
                  : 'border-error/60 bg-error/10')
              }
            >
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span
                  className={
                    'text-[11px] font-bold px-2 py-0.5 rounded-full ' +
                    (dim.verificacao_consolidada.atende
                      ? 'bg-success text-white'
                      : 'bg-error text-white')
                  }
                >
                  {dim.verificacao_consolidada.atende ? 'ATENDE' : 'NÃO ATENDE'}
                </span>
                <span className="font-semibold">Bloco de saída (consolidado)</span>
                <span className="text-muted">
                  Exigido: {dim.verificacao_consolidada.up_exigido} UP
                </span>
                <span className="text-muted">→</span>
                <span className="font-medium">
                  Real (soma): {dim.verificacao_consolidada.up_real_total} UP
                </span>
              </div>
              <div className="mt-1 text-xs text-muted">
                {dim.verificacao_consolidada.componentes
                  .map((c) => `${c.label}: ${c.up} UP (${c.quantidade} un)`)
                  .join(' • ')}
              </div>
            </div>
          )}

          {dim.verificacao.length > 0 && (
            <div className="mt-3 space-y-1">
              <div className="text-[11px] uppercase tracking-wide text-muted">
                Verificação detalhada por tipo
              </div>
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

function Etapa5({ dados, calc }: any) {
  const popFixa = Number(dados.info_operacional?.populacao_fixa) || 0;
  const popFlut = Number(dados.info_operacional?.populacao_flutuante) || 0;
  const popTotal = popFixa + popFlut;
  const grupo = String(dados.grupo || '').toUpperCase().trim();
  const isGrupoF = grupo.startsWith('F');
  const popAjustada = Number(calc.brigada_populacao_ajustada) || popTotal;
  const brigadistas = Number(calc.brigadistas_necessarios) || Math.max(1, Math.ceil(popAjustada / 200));

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{`Brigada de incêndio (${nptOuIn((dados.uf || 'PR') as UF, '017')})`}</h2>
      <p className="text-sm text-muted">
        Cálculo conforme {itemNorma((dados.uf || 'PR') as UF, '017', '6.2')}: 1 brigadista para cada 200 pessoas,
        arredondado para o inteiro imediatamente superior. Para edificações do
        Grupo F (locais de reunião de público) aplica-se acréscimo de 30% sobre a população.
      </p>

      {popTotal === 0 && (
        <div className="rounded-md bg-[#FFF2CC] border border-[#E2C77E] p-3 text-sm text-[#854F0B]">
          Informe a população fixa e flutuante na etapa 8 (Dados complementares → Informações operacionais)
          para o cálculo da brigada.
        </div>
      )}

      <div className="rounded-md bg-surface border border-border p-4 text-sm grid sm:grid-cols-3 gap-3">
        <Info label="População fixa" value={String(popFixa)} />
        <Info label="População flutuante" value={String(popFlut)} />
        <Info label="População total" value={String(popTotal)} />
        <Info label="Grupo" value={dados.grupo || '—'} />
        <Info label="Acréscimo Grupo F (+30%)" value={isGrupoF ? 'Sim' : 'Não'} />
        <Info label="População ajustada" value={String(popAjustada)} />
      </div>

      <div className="card">
        <h3 className="font-semibold text-ink">Memória de cálculo</h3>
        <p className="text-sm mt-2 whitespace-pre-line">
          {calc.brigadistas_descricao || `População ajustada (${popAjustada}) ÷ 200 = ${(popAjustada / 200).toFixed(2)} → arredondado para cima = ${brigadistas} brigadista(s).`}
        </p>
      </div>

      <div className="rounded-md bg-primary text-white p-4 text-center">
        <div className="text-xs uppercase tracking-wide opacity-80">Resultado</div>
        <div className="text-2xl font-bold mt-1">{brigadistas} brigadista(s)</div>
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

// =============================================================================
// Etapa 5: Memorial de cálculo da carga de incêndio (média ponderada)
// =============================================================================
function CnaeBuscaLinha({ onSelecionar }: { onSelecionar: (r: CnaeRow) => void }) {
  const [busca, setBusca] = useState('');
  const [resultados, setResultados] = useState<CnaeRow[]>([]);
  const [aberto, setAberto] = useState(false);
  useEffect(() => {
    if (!aberto) return;
    const t = setTimeout(() => setResultados(buscarCnae(busca, 15)), 200);
    return () => clearTimeout(t);
  }, [busca, aberto]);
  return (
    <div className="relative">
      <input
        className="input text-xs"
        placeholder="🔍 CNAE ou atividade"
        value={busca}
        onFocus={() => setAberto(true)}
        onBlur={() => setTimeout(() => setAberto(false), 200)}
        onChange={(e) => { setBusca(e.target.value); setAberto(true); }}
      />
      {aberto && resultados.length > 0 && (
        <div className="absolute z-20 left-0 right-0 top-full mt-1 max-h-56 overflow-auto bg-white border border-border rounded-md shadow-lg">
          {resultados.map((r) => (
            <button
              key={r.cnae + r.descricao}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); onSelecionar(r); setBusca(''); setAberto(false); }}
              className="w-full text-left px-2 py-1 hover:bg-surface border-b border-border last:border-0"
            >
              <div className="text-[10px] text-primary font-mono">{r.cnae} • {r.divisao}</div>
              <div className="text-xs truncate">{r.descricao}</div>
              <div className="text-[10px] text-muted">Carga {r.carga_incendio_mj_m2 ?? '—'} MJ/m²</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EtapaCargaIncendio({ dados, up, calc }: any) {
  const itens: ItemCargaIncendio[] = Array.isArray(dados.carga_incendio_itens)
    ? dados.carga_incendio_itens
    : [];
  const memCi = calc.carga_incendio_memorial ?? {
    area_total: 0,
    ci_total_mj: 0,
    media_ponderada_mj_m2: 0
  };

  function setItens(novos: ItemCargaIncendio[]) {
    up('carga_incendio_itens', novos);
  }
  function adicionar() {
    setItens([...itens, novoItemCargaIncendio({ pavimento_setor: 'TÉRREO' })]);
  }
  function remover(id: string) {
    setItens(itens.filter((i) => i.id !== id));
  }
  function atualizar(id: string, campo: keyof ItemCargaIncendio, valor: any) {
    setItens(itens.map((i) => (i.id === id ? { ...i, [campo]: valor } : i)));
  }
  function preencherDoCnae() {
    if (itens.length > 0) return;
    const cnaesSel: CnaeSelecionado[] = Array.isArray(dados.cnaes) ? dados.cnaes : [];
    // Se há múltiplas ocupações (mista), gera uma linha para cada
    if (cnaesSel.length > 0) {
      const novos = cnaesSel.map((c) =>
        novoItemCargaIncendio({
          pavimento_setor: 'TÉRREO',
          ocupacao_descricao: `${c.descricao} (${c.divisao})`.trim(),
          divisao: c.divisao,
          ci_mj_m2: Number(c.carga_incendio_mj_m2) || 0,
          area_m2: cnaesSel.length === 1 ? Number(dados.area_construida_m2) || 0 : 0
        })
      );
      setItens(novos);
      return;
    }
    if (!dados.divisao) return;
    setItens([
      novoItemCargaIncendio({
        pavimento_setor: 'TÉRREO',
        ocupacao_descricao: `${dados.descricao_atividade ?? ''} (${dados.divisao ?? ''})`.trim(),
        divisao: dados.divisao,
        ci_mj_m2: Number(dados.carga_incendio_mj_m2) || 0,
        area_m2: Number(dados.area_construida_m2) || 0
      })
    ]);
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Memorial de cálculo de carga de incêndio</h2>
        <p className="text-sm text-muted mt-1">
          Média ponderada por área de cada setor ({(dados.uf || 'PR') === 'SC' ? 'IN 03 do CBMSC' : 'NPT 014 / Anexo A do CSCIP'}). Quando
          preenchido, este memorial substitui o valor pontual da classificação por CNAE.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-secondary text-xs" onClick={adicionar}>
          + Adicionar setor
        </button>
        {itens.length === 0 && (
          <button type="button" className="btn-secondary text-xs" onClick={preencherDoCnae}>
            Iniciar com base no CNAE selecionado
          </button>
        )}
      </div>

      {itens.length === 0 ? (
        <div className="rounded-md bg-surface border border-border p-4 text-sm text-muted">
          Nenhum setor cadastrado. Use o CNAE como ponto de partida ou adicione manualmente.
        </div>
      ) : (
        <div className="border border-border rounded-md overflow-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#FFF2CC] text-ink">
              <tr>
                <th className="p-2 text-left">Pavto / Setor</th>
                <th className="p-2 text-left">Ocupação</th>
                <th className="p-2 text-left">Divisão</th>
                <th className="p-2 text-right">C.I (MJ/m²)</th>
                <th className="p-2 text-right">Área (m²)</th>
                <th className="p-2 text-right">C.I total</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {itens.map((it) => {
                const total = (Number(it.ci_mj_m2) || 0) * (Number(it.area_m2) || 0);
                return (
                  <tr key={it.id} className="border-t border-border">
                    <td className="p-1">
                      <input
                        className="input text-xs"
                        value={it.pavimento_setor}
                        onChange={(e) => atualizar(it.id, 'pavimento_setor', e.target.value)}
                      />
                    </td>
                    <td className="p-1">
                      <div className="space-y-1">
                        <input
                          className="input text-xs"
                          value={it.ocupacao_descricao}
                          onChange={(e) => atualizar(it.id, 'ocupacao_descricao', e.target.value)}
                          placeholder="Ex.: INDÚSTRIA (I-2)"
                        />
                        <CnaeBuscaLinha
                          onSelecionar={(r) => {
                            setItens(itens.map((i) =>
                              i.id === it.id
                                ? {
                                    ...i,
                                    ocupacao_descricao: `${r.descricao} (${r.divisao})`,
                                    divisao: r.divisao,
                                    ci_mj_m2: r.carga_incendio_mj_m2 ?? 0
                                  }
                                : i
                            ));
                          }}
                        />
                      </div>
                    </td>
                    <td className="p-1">
                      <input
                        className="input text-xs"
                        value={it.divisao}
                        onChange={(e) => atualizar(it.id, 'divisao', e.target.value)}
                        placeholder="I-2"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="number"
                        step="any"
                        className="input text-xs text-right"
                        value={it.ci_mj_m2}
                        onChange={(e) => atualizar(it.id, 'ci_mj_m2', Number(e.target.value))}
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="number"
                        step="any"
                        className="input text-xs text-right"
                        value={it.area_m2}
                        onChange={(e) => atualizar(it.id, 'area_m2', Number(e.target.value))}
                      />
                    </td>
                    <td className="p-2 text-right tabular-nums">{total.toFixed(2)}</td>
                    <td className="p-1 text-center">
                      <button
                        type="button"
                        onClick={() => remover(it.id)}
                        className="text-error text-xs px-2"
                        aria-label="Remover"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-surface">
              <tr className="border-t-2 border-ink font-semibold">
                <td className="p-2" colSpan={3}>ÁREA TOTAL</td>
                <td className="p-2 text-right">—</td>
                <td className="p-2 text-right tabular-nums">{memCi.area_total.toFixed(2)}</td>
                <td className="p-2 text-right tabular-nums">{memCi.ci_total_mj.toFixed(0)}</td>
                <td></td>
              </tr>
              <tr className="font-bold bg-[#D5E3D0]">
                <td className="p-2" colSpan={3}>MÉDIA PONDERADA (C.I MJ/m²)</td>
                <td className="p-2 text-right" colSpan={3}>
                  <span className="tabular-nums text-base">
                    {memCi.media_ponderada_mj_m2.toFixed(2)} MJ/m²
                  </span>
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <div className="rounded-md bg-surface border border-border p-4 text-sm grid sm:grid-cols-3 gap-3">
        <Info label="Carga de incêndio" value={`${(calc.carga_incendio_mj_m2 ?? 0).toFixed(2)} MJ/m²`} />
        <Info label="Risco predominante" value={calc.risco_incendio} />
        <Info label="Área considerada" value={`${memCi.area_total.toFixed(2)} m²`} />
      </div>
    </div>
  );
}

// =============================================================================
// Etapa 8: Dados complementares (memorial construção, ofício, inf. operacional, acesso, termo)
// =============================================================================
function EtapaComplementar({ dados, up }: any) {
  const mc = dados.memorial_construcao || {};
  const io = dados.info_operacional || {};
  const av = dados.acesso_viaturas || {};
  const ts = dados.termo_saidas || {};
  const sis = io.sistemas_instalados || {};
  const risc = io.riscos_especiais || {};

  function upMc(k: string, v: any) {
    up('memorial_construcao', { ...mc, [k]: v });
  }
  function upIo(k: string, v: any) {
    up('info_operacional', { ...io, [k]: v });
  }
  function upSis(k: string, v: any) {
    up('info_operacional', { ...io, sistemas_instalados: { ...sis, [k]: v } });
  }
  function upRisc(k: string, v: any) {
    up('info_operacional', { ...io, riscos_especiais: { ...risc, [k]: v } });
  }
  function upAv(k: string, v: any) {
    up('acesso_viaturas', { ...av, [k]: v });
  }
  function upTs(k: string, v: any) {
    up('termo_saidas', { ...ts, [k]: v });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Dados complementares</h2>
        <p className="text-sm text-muted mt-1">
          Estas informações compõem o ofício de apresentação, o memorial básico
          de construção, a planilha de informações operacionais, o memorial de
          acesso a viaturas e o termo de saídas de emergência. Campos em branco
          serão preenchidos com texto padrão.
        </p>
      </div>

      {/* Ofício */}
      <div className="card">
        <h3 className="font-semibold text-ink">Ofício de apresentação</h3>
        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          <Field label="Local">
            <input className="input" value={dados.oficio_local || ''} onChange={(e) => up('oficio_local', e.target.value)} />
          </Field>
          <Field label="Data">
            <input type="date" className="input" value={dados.oficio_data || ''} onChange={(e) => up('oficio_data', e.target.value)} />
          </Field>
          <Field label="Inscrição Imobiliária" hint="Aparece no ofício de apresentação">
            <input className="input" value={dados.inscricao_imobiliaria || ''} onChange={(e) => up('inscricao_imobiliaria', e.target.value)} />
          </Field>
        </div>
      </div>

      {/* Memorial básico de construção */}
      <div className="card">
        <h3 className="font-semibold text-ink">Memorial básico de construção</h3>
        <div className="grid gap-3 mt-3">
          <Field label="1. Estruturas" hint="Padrão: concreto armado conforme NBR/ABNT, TRRF atendido.">
            <textarea className="input" rows={2} value={mc.estruturas || ''} onChange={(e) => upMc('estruturas', e.target.value)} />
          </Field>
          <Field label="2. Alvenarias" hint="Padrão: bloco cerâmico/concreto conforme normas.">
            <textarea className="input" rows={2} value={mc.alvenarias || ''} onChange={(e) => upMc('alvenarias', e.target.value)} />
          </Field>
          <Field label="3. Compartimentações">
            <textarea className="input" rows={2} value={mc.compartimentacoes || ''} onChange={(e) => upMc('compartimentacoes', e.target.value)} />
          </Field>
          <Field label="4. Compartimentos">
            <textarea className="input" rows={2} value={mc.compartimentos || ''} onChange={(e) => upMc('compartimentos', e.target.value)} />
          </Field>
          <Field label="5. Instalações">
            <textarea className="input" rows={2} value={mc.instalacoes || ''} onChange={(e) => upMc('instalacoes', e.target.value)} />
          </Field>
          <Field label="6. Vidros">
            <textarea className="input" rows={2} value={mc.vidros || ''} onChange={(e) => upMc('vidros', e.target.value)} />
          </Field>
          <Field label="7. Medidas de segurança contra incêndio (texto livre)">
            <textarea className="input" rows={3} value={mc.medidas_seguranca || ''} onChange={(e) => upMc('medidas_seguranca', e.target.value)} />
          </Field>
        </div>
      </div>

      {/* Informações operacionais */}
      <div className="card">
        <h3 className="font-semibold text-ink">Planilha de informações operacionais</h3>
        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          <Field label="Tipo de estrutura">
            <textarea className="input" rows={2} value={io.tipo_estrutura || ''} onChange={(e) => upIo('tipo_estrutura', e.target.value)} />
          </Field>
          <Field label="Acabamento das paredes">
            <textarea className="input" rows={2} value={io.acabamento_paredes || ''} onChange={(e) => upIo('acabamento_paredes', e.target.value)} />
          </Field>
          <Field label="Acabamento dos pisos">
            <input className="input" value={io.acabamento_pisos || ''} onChange={(e) => upIo('acabamento_pisos', e.target.value)} />
          </Field>
          <Field label="Material da cobertura">
            <input className="input" value={io.cobertura || ''} onChange={(e) => upIo('cobertura', e.target.value)} />
          </Field>
          <Field label="População fixa">
            <input className="input" value={io.populacao_fixa || ''} onChange={(e) => upIo('populacao_fixa', e.target.value)} />
          </Field>
          <Field label="População flutuante">
            <input className="input" value={io.populacao_flutuante || ''} onChange={(e) => upIo('populacao_flutuante', e.target.value)} />
          </Field>
          <Field label="Ponto de encontro">
            <input className="input" value={io.ponto_encontro || ''} onChange={(e) => upIo('ponto_encontro', e.target.value)} />
          </Field>
          <Field label="Características de funcionamento">
            <input className="input" value={io.caracteristicas_funcionamento || ''} onChange={(e) => upIo('caracteristicas_funcionamento', e.target.value)} />
          </Field>
          <Field label="Horário de funcionamento">
            <input className="input" value={io.horario_funcionamento || ''} onChange={(e) => upIo('horario_funcionamento', e.target.value)} />
          </Field>
          <Field label="Vias de acesso">
            <input className="input" value={io.vias_acesso || ''} onChange={(e) => upIo('vias_acesso', e.target.value)} />
          </Field>
          <Field label="Nº de brigadistas por turno">
            <input className="input" value={io.numero_brigadistas || ''} onChange={(e) => upIo('numero_brigadistas', e.target.value)} />
          </Field>
          <Field label="Brigadista profissional">
            <input className="input" value={io.brigadista_profissional || ''} onChange={(e) => upIo('brigadista_profissional', e.target.value)} />
          </Field>
          <Field label="Encarregado da segurança">
            <input className="input" value={io.encarregado_seguranca || ''} onChange={(e) => upIo('encarregado_seguranca', e.target.value)} />
          </Field>
          <Field label="Telefone de emergência">
            <input className="input" value={io.telefone_emergencia || ''} onChange={(e) => upIo('telefone_emergencia', e.target.value)} />
          </Field>
          <Field label="Posto de bombeiros mais próximo">
            <input className="input" value={io.posto_bombeiros || ''} onChange={(e) => upIo('posto_bombeiros', e.target.value)} />
          </Field>
          <Field label="Outras informações úteis">
            <input className="input" value={io.outras_informacoes || ''} onChange={(e) => upIo('outras_informacoes', e.target.value)} />
          </Field>
        </div>

        <div className="mt-4">
          <h4 className="text-sm font-semibold">Sistemas instalados (Sim / Não)</h4>
          <div className="grid sm:grid-cols-3 gap-2 mt-2 text-sm">
            {[
              'Hidrantes', 'Chuveiros automáticos', 'Gás carbônico (CO2)', 'Gases especiais',
              'Sistema de detecção', 'Grupo moto gerador', 'Escada pressurizada',
              'Espuma mecânica', 'Sistema de resfriamento', 'Reserva de líquido gerador de espuma',
              'Bombas de recalque'
            ].map((nome) => (
              <label key={nome} className="flex items-center justify-between gap-2 border border-border rounded px-2 py-1">
                <span className="text-xs">{nome}</span>
                <select
                  className="text-xs border border-border rounded px-1"
                  value={sis[nome] || ''}
                  onChange={(e) => upSis(nome, e.target.value)}
                >
                  <option value="">—</option>
                  <option value="SIM">SIM</option>
                  <option value="NÃO">NÃO</option>
                </select>
              </label>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mt-4">
          <Field label="Reservatório – consumo (m³)">
            <input className="input" value={io.reserva_consumo || ''} onChange={(e) => upIo('reserva_consumo', e.target.value)} />
          </Field>
          <Field label="Reservatório – RTI (m³)">
            <input className="input" value={io.reserva_rti || ''} onChange={(e) => upIo('reserva_rti', e.target.value)} />
          </Field>
          <Field label="Reservatório – total (m³)">
            <input className="input" value={io.reserva_total || ''} onChange={(e) => upIo('reserva_total', e.target.value)} />
          </Field>
        </div>

        <div className="mt-4">
          <h4 className="text-sm font-semibold">Riscos especiais (Sim / Não)</h4>
          <div className="grid sm:grid-cols-3 gap-2 mt-2 text-sm">
            {[
              'Caldeiras', 'Sistema de GLP', 'Armazenamento de produtos químicos',
              'Central de distribuição elétrica', 'Produtos radioativos', 'Espaços confinados'
            ].map((nome) => (
              <label key={nome} className="flex items-center justify-between gap-2 border border-border rounded px-2 py-1">
                <span className="text-xs">{nome}</span>
                <select
                  className="text-xs border border-border rounded px-1"
                  value={risc[nome] || ''}
                  onChange={(e) => upRisc(nome, e.target.value)}
                >
                  <option value="">—</option>
                  <option value="SIM">SIM</option>
                  <option value="NÃO">NÃO</option>
                </select>
              </label>
            ))}
          </div>
        </div>

        <Field label="Outros riscos específicos da atividade">
          <textarea className="input" rows={2} value={io.outros_riscos || ''} onChange={(e) => upIo('outros_riscos', e.target.value)} />
        </Field>
      </div>

      {/* Acesso a viaturas */}
      <div className="card">
        <h3 className="font-semibold text-ink">{`Acesso a viaturas (${nptOuIn((dados.uf || 'PR') as UF, '006')})`}</h3>
        <div className="grid sm:grid-cols-3 gap-3 mt-3">
          <Field label="Largura da via (m)" hint="Mínimo 6,00 m">
            <input type="number" step="0.1" className="input" value={av.largura_via_m ?? ''} onChange={(e) => upAv('largura_via_m', e.target.value === '' ? null : Number(e.target.value))} />
          </Field>
          <Field label="Largura do portão (m)">
            <input type="number" step="0.1" className="input" value={av.largura_portao_m ?? ''} onChange={(e) => upAv('largura_portao_m', e.target.value === '' ? null : Number(e.target.value))} />
          </Field>
          <Field label="Altura do portão (m)">
            <input type="number" step="0.1" className="input" value={av.altura_portao_m ?? ''} onChange={(e) => upAv('altura_portao_m', e.target.value === '' ? null : Number(e.target.value))} />
          </Field>
        </div>
        <Field label="Observações complementares">
          <textarea className="input" rows={2} value={av.observacoes || ''} onChange={(e) => upAv('observacoes', e.target.value)} />
        </Field>
      </div>

      {/* Termo de saídas */}
      <div className="card">
        <h3 className="font-semibold text-ink">Termo de responsabilidade das saídas de emergência</h3>
        <Field label="Observações do termo" hint="Texto padrão será gerado automaticamente quando vazio.">
          <textarea className="input" rows={3} value={ts.observacoes || ''} onChange={(e) => upTs('observacoes', e.target.value)} />
        </Field>
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
