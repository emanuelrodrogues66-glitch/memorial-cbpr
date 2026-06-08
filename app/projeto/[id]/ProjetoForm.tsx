'use client';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { buscarCnae, calcular, getCnae } from '@/lib/calculos';
import type { CnaeRow } from '@/lib/types';

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
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">População e saídas (NPT 011)</h2>
      <p className="text-sm text-muted">População calculada com base na densidade da divisão. Você pode informar um valor diferente quando justificado.</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="População — calculada" hint={calc.populacao_descricao_npt011}>
          <input className="input" disabled value={calc.populacao_calculada} />
        </Field>
        <Field label="Sobrescrever população" hint="Deixe 0 para usar o cálculo automático.">
          <input type="number" min="0" className="input" value={dados.populacao_calculada || 0} onChange={e => up('populacao_calculada', Number(e.target.value))} />
        </Field>
      </div>
      <div className="rounded-md bg-surface border border-border p-4 text-sm grid sm:grid-cols-3 gap-3">
        <Info label="Unid. passagem (acesso)" value={String(calc.unidades_passagem_acesso)} />
        <Info label="Unid. passagem (escada)" value={String(calc.unidades_passagem_escada)} />
        <Info label="Unid. passagem (porta)" value={String(calc.unidades_passagem_porta)} />
      </div>
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
  function toggleMedida(m: string) {
    const set = new Set<string>(dados.medidas_protecao || []);
    set.has(m) ? set.delete(m) : set.add(m);
    up('medidas_protecao', Array.from(set));
  }
  const sugeridas = calc.medidas_protecao as string[];
  const escolhidas: string[] = dados.medidas_protecao?.length ? dados.medidas_protecao : sugeridas;

  // Inicializa as medidas escolhidas com as sugeridas
  useEffect(() => {
    if (!dados.medidas_protecao || dados.medidas_protecao.length === 0) {
      up('medidas_protecao', sugeridas);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Medidas e responsável técnico</h2>
      <Field label="Medidas de proteção previstas">
        <div className="space-y-2">
          {sugeridas.map((m) => (
            <label key={m} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={escolhidas.includes(m)} onChange={() => toggleMedida(m)} />
              <span>{m}</span>
            </label>
          ))}
        </div>
      </Field>
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
