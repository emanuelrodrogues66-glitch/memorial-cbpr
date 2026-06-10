'use client';

import { useMemo, useState } from 'react';
import { buscarCnae, getCnae, listarCnaes } from '@/lib/calculos';
import { formatarCnpj, formatarTelefone } from '@/lib/leads';
import type { MedidaCSCIP } from '@/lib/cscip-medidas';
import { rotuloModalidade, type ClassificacaoResultado } from '@/lib/classificar-npt001';
import type { CnaeRow } from '@/lib/types';

type Etapa = 'cliente' | 'edificacao' | 'detalhes' | 'resultado';

type Resultado = {
  id: string;
  medidas: MedidaCSCIP[];
  simplificada: boolean;
  classificacao: ClassificacaoResultado;
};

export default function ConsultaForm() {
  const [etapa, setEtapa] = useState<Etapa>('cliente');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Etapa 1 - Cliente
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [buscandoCnpj, setBuscandoCnpj] = useState(false);

  // Etapa 2 - Edificacao
  const [cnaeTermo, setCnaeTermo] = useState('');
  const [cnaeSelecionado, setCnaeSelecionado] = useState<CnaeRow | null>(null);
  const [divisaoManual, setDivisaoManual] = useState('');
  const [area, setArea] = useState('');
  const [altura, setAltura] = useState('');
  const [cidade, setCidade] = useState('');

  // Etapa 3 - Detalhes NPT 001/002
  const [anoConstrucao, setAnoConstrucao] = useState('');
  const [temCertificacao, setTemCertificacao] = useState(false);
  const [temSubsolo, setTemSubsolo] = useState(false);
  const [liquidoInflamavel, setLiquidoInflamavel] = useState('');
  const [glpKg, setGlpKg] = useState('');
  const [temHidrantes, setTemHidrantes] = useState(false);
  const [populacao, setPopulacao] = useState('');

  // Resultado
  const [resultado, setResultado] = useState<Resultado | null>(null);

  const sugestoesCnae = useMemo(() => {
    if (cnaeTermo.length < 2) return [];
    return buscarCnae(cnaeTermo, 8);
  }, [cnaeTermo]);

  const divisoes = useMemo(() => {
    const all = listarCnaes();
    const set = new Set<string>();
    for (const r of all) {
      if (r.divisao && r.divisao !== '.') set.add(r.divisao);
    }
    return Array.from(set).sort();
  }, []);

  const divisaoFinal = cnaeSelecionado?.divisao || divisaoManual;

  async function buscarCnpjApi() {
    const limpo = cnpj.replace(/\D/g, '');
    if (limpo.length !== 14) {
      setErro('CNPJ deve ter 14 dígitos');
      return;
    }
    setErro(null);
    setBuscandoCnpj(true);
    try {
      const res = await fetch(`/api/cnpj/${limpo}`);
      const json = await res.json();
      if (!res.ok) {
        setErro(json.error || 'Não foi possível consultar o CNPJ');
        return;
      }
      if (json.razao_social) setRazaoSocial(json.razao_social);
      if (json.cidade) setCidade(json.cidade);
      if (json.cnae_principal) {
        // Procurar CNAE na nossa base
        const local = getCnae(json.cnae_principal);
        if (local) {
          setCnaeSelecionado(local);
          setCnaeTermo('');
        } else {
          // Pelo menos pré-preenche o termo de busca
          setCnaeTermo(json.cnae_principal_descricao || json.cnae_principal);
        }
      }
    } catch (e: any) {
      setErro('Erro de conexão ao buscar CNPJ: ' + (e?.message || ''));
    } finally {
      setBuscandoCnpj(false);
    }
  }

  function irParaEdificacao() {
    setErro(null);
    if (!nome.trim() || nome.trim().length < 3) {
      setErro('Informe seu nome completo');
      return;
    }
    if (!telefone.trim() || telefone.replace(/\D/g, '').length < 10) {
      setErro('Informe um telefone válido com DDD');
      return;
    }
    if (email && !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
      setErro('Email inválido');
      return;
    }
    setEtapa('edificacao');
  }

  function irParaDetalhes() {
    setErro(null);
    if (!divisaoFinal) {
      setErro('Selecione a ocupação (informe o CNAE/CNPJ ou escolha a divisão)');
      return;
    }
    const areaNum = parseFloat(area.replace(',', '.'));
    const alturaNum = parseFloat(altura.replace(',', '.'));
    if (!areaNum || areaNum <= 0) {
      setErro('Informe a área em m²');
      return;
    }
    if (isNaN(alturaNum) || alturaNum < 0) {
      setErro('Informe a altura em metros');
      return;
    }
    setEtapa('detalhes');
  }

  async function enviar() {
    setErro(null);
    setEnviando(true);
    try {
      const payload = {
        nome: nome.trim(),
        telefone: telefone.trim(),
        email: email.trim() || null,
        cnpj: cnpj.replace(/\D/g, '') || null,
        razao_social: razaoSocial.trim() || null,
        cnae: cnaeSelecionado?.cnae || null,
        cnae_descricao: cnaeSelecionado?.descricao || null,
        divisao: divisaoFinal,
        area_m2: parseFloat(area.replace(',', '.')),
        altura_m: parseFloat(altura.replace(',', '.')),
        cidade: cidade.trim() || null,
        ano_construcao: anoConstrucao ? parseInt(anoConstrucao) : null,
        tem_certificacao_anterior: temCertificacao,
        tem_subsolo_computado: temSubsolo,
        liquido_inflamavel_litros: liquidoInflamavel ? parseFloat(liquidoInflamavel.replace(',', '.')) : null,
        glp_kg: glpKg ? parseFloat(glpKg.replace(',', '.')) : null,
        tem_hidrantes_instalados: temHidrantes,
        populacao: populacao ? parseInt(populacao) : null
      };
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok) {
        setErro(json.error || 'Erro ao enviar consulta');
        return;
      }
      setResultado({
        id: json.id,
        medidas: json.medidas,
        simplificada: json.simplificada,
        classificacao: json.classificacao
      });
      setEtapa('resultado');
    } catch (e: any) {
      setErro('Erro de conexão: ' + (e?.message || 'desconhecido'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="bg-white border border-border rounded-xl shadow-sm">
      <Stepper etapa={etapa} />

      <div className="p-8">
        {etapa === 'cliente' && (
          <div className="space-y-5">
            <h2 className="text-xl font-semibold text-ink">Seus dados</h2>
            <p className="text-sm text-muted">Precisamos saber com quem estamos falando antes de mostrar as exigências.</p>

            <Field label="Nome completo *">
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="input"
                placeholder="João da Silva"
                autoFocus
              />
            </Field>

            <Field label="Telefone (com DDD) *">
              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                className="input"
                placeholder="(41) 99999-9999"
                maxLength={16}
              />
            </Field>

            <Field label="Email (opcional)">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="seu@email.com"
              />
            </Field>

            <Field label="CNPJ (opcional, agiliza o preenchimento)">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={cnpj}
                  onChange={(e) => setCnpj(formatarCnpj(e.target.value))}
                  className="input flex-1"
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                />
                <button
                  type="button"
                  onClick={buscarCnpjApi}
                  disabled={buscandoCnpj || cnpj.replace(/\D/g, '').length !== 14}
                  className="btn-secondary disabled:opacity-50 whitespace-nowrap"
                >
                  {buscandoCnpj ? 'Buscando...' : 'Buscar dados'}
                </button>
              </div>
              {razaoSocial && (
                <p className="text-xs text-success mt-1">Empresa: {razaoSocial}</p>
              )}
            </Field>

            {erro && <Erro>{erro}</Erro>}

            <div className="flex justify-end pt-2">
              <button onClick={irParaEdificacao} className="btn-primary">
                Continuar
              </button>
            </div>
          </div>
        )}

        {etapa === 'edificacao' && (
          <div className="space-y-5">
            <h2 className="text-xl font-semibold text-ink">Dados da edificação</h2>
            <p className="text-sm text-muted">
              {cnaeSelecionado
                ? 'CNAE detectado automaticamente. Confira os demais dados abaixo.'
                : 'Informe a atividade e as dimensões da obra.'}
            </p>

            <Field label="Atividade / CNAE">
              <input
                type="text"
                value={cnaeSelecionado ? `${cnaeSelecionado.cnae} — ${cnaeSelecionado.descricao}` : cnaeTermo}
                onChange={(e) => {
                  setCnaeSelecionado(null);
                  setCnaeTermo(e.target.value);
                }}
                className="input"
                placeholder="Digite atividade, CNAE ou descrição (ex: hotel, 5611-2, escola)"
              />
              {!cnaeSelecionado && sugestoesCnae.length > 0 && (
                <div className="mt-1 border border-border rounded-md bg-white shadow-sm max-h-60 overflow-y-auto">
                  {sugestoesCnae.map((c) => (
                    <button
                      key={`${c.cnae}-${c.divisao}`}
                      type="button"
                      onClick={() => {
                        setCnaeSelecionado(c);
                        setCnaeTermo('');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-bg border-b border-border last:border-b-0 text-sm"
                    >
                      <div className="font-medium text-ink">{c.cnae} — {c.divisao}</div>
                      <div className="text-muted text-xs">{c.descricao}</div>
                    </button>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted mt-1">Não encontrou? Escolha a divisão direto abaixo.</p>
            </Field>

            <Field label={`Divisão CSCIP ${cnaeSelecionado ? '(detectada)' : '*'}`}>
              <select
                value={divisaoFinal}
                onChange={(e) => {
                  setCnaeSelecionado(null);
                  setDivisaoManual(e.target.value);
                }}
                className="input"
                disabled={!!cnaeSelecionado}
              >
                <option value="">Selecione</option>
                {divisoes.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Área total (m²) *">
                <input
                  type="text"
                  inputMode="decimal"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="input"
                  placeholder="350"
                />
              </Field>
              <Field label="Altura (m) *">
                <input
                  type="text"
                  inputMode="decimal"
                  value={altura}
                  onChange={(e) => setAltura(e.target.value)}
                  className="input"
                  placeholder="6"
                />
              </Field>
            </div>

            <Field label="Cidade">
              <input
                type="text"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                className="input"
                placeholder="Curitiba"
              />
            </Field>

            {erro && <Erro>{erro}</Erro>}

            <div className="flex justify-between pt-2">
              <button onClick={() => setEtapa('cliente')} className="btn-secondary">Voltar</button>
              <button onClick={irParaDetalhes} className="btn-primary">Continuar</button>
            </div>
          </div>
        )}

        {etapa === 'detalhes' && (
          <div className="space-y-5">
            <h2 className="text-xl font-semibold text-ink">Detalhes para classificação</h2>
            <p className="text-sm text-muted">
              Essas informações determinam se sua edificação precisa de memorial simplificado, projeto técnico (PTPID) ou está dispensada (NPT 001 parte 2).
            </p>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Ano de construção / regularização">
                <input
                  type="number"
                  value={anoConstrucao}
                  onChange={(e) => setAnoConstrucao(e.target.value)}
                  className="input"
                  placeholder="Ex: 2010"
                  min="1900"
                  max={new Date().getFullYear() + 5}
                />
              </Field>
              <Field label="População estimada (pessoas)">
                <input
                  type="number"
                  value={populacao}
                  onChange={(e) => setPopulacao(e.target.value)}
                  className="input"
                  placeholder="Ex: 150"
                  min="0"
                />
              </Field>
            </div>

            <Field label="Tem certificação anterior do CBPR (PPI, PSS, PSCIP aprovado antes de 04/2018)?">
              <Toggle value={temCertificacao} onChange={setTemCertificacao} />
            </Field>

            <Field label="Possui subsolo computado para classificação de altura?">
              <Toggle value={temSubsolo} onChange={setTemSubsolo} />
            </Field>

            <Field label="Tem sistema de hidrantes instalado e funcionando?">
              <Toggle value={temHidrantes} onChange={setTemHidrantes} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Armazena líquido inflamável (L)">
                <input
                  type="text"
                  inputMode="decimal"
                  value={liquidoInflamavel}
                  onChange={(e) => setLiquidoInflamavel(e.target.value)}
                  className="input"
                  placeholder="0 ou em branco"
                />
                <p className="text-xs text-muted mt-1">Acima de 1000L exige PTPID</p>
              </Field>
              <Field label="Central de GLP (kg)">
                <input
                  type="text"
                  inputMode="decimal"
                  value={glpKg}
                  onChange={(e) => setGlpKg(e.target.value)}
                  className="input"
                  placeholder="0 ou em branco"
                />
                <p className="text-xs text-muted mt-1">Acima de 190kg exige PTPID</p>
              </Field>
            </div>

            {erro && <Erro>{erro}</Erro>}

            <div className="flex justify-between pt-2">
              <button onClick={() => setEtapa('edificacao')} className="btn-secondary">Voltar</button>
              <button onClick={enviar} disabled={enviando} className="btn-primary disabled:opacity-50">
                {enviando ? 'Calculando...' : 'Ver classificação e exigências'}
              </button>
            </div>
          </div>
        )}

        {etapa === 'resultado' && resultado && (
          <ResultadoView
            resultado={resultado}
            dadosEnviados={{ nome, telefone, divisao: divisaoFinal, area, altura, cidade, cnae: cnaeSelecionado }}
            onNovaConsulta={() => {
              setEtapa('cliente');
              setResultado(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

function Stepper({ etapa }: { etapa: Etapa }) {
  const passos: { id: Etapa; label: string }[] = [
    { id: 'cliente', label: '1. Seus dados' },
    { id: 'edificacao', label: '2. Edificação' },
    { id: 'detalhes', label: '3. Detalhes' },
    { id: 'resultado', label: '4. Resultado' }
  ];
  const atual = passos.findIndex((p) => p.id === etapa);
  return (
    <div className="border-b border-border px-6 py-4 flex items-center gap-2">
      {passos.map((p, i) => (
        <div key={p.id} className="flex items-center gap-2 flex-1">
          <div className={`flex-1 text-xs sm:text-sm font-medium ${i <= atual ? 'text-primary' : 'text-muted'}`}>
            {p.label}
          </div>
          {i < passos.length - 1 && <div className="w-4 sm:w-8 h-px bg-border" />}
        </div>
      ))}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-ink mb-1">{label}</span>
      {children}
    </label>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`flex-1 py-2 px-4 border rounded-md text-sm font-medium ${value ? 'bg-primary text-white border-primary' : 'bg-white border-border text-muted hover:border-ink'}`}
      >
        Sim
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`flex-1 py-2 px-4 border rounded-md text-sm font-medium ${!value ? 'bg-ink text-white border-ink' : 'bg-white border-border text-muted hover:border-ink'}`}
      >
        Não
      </button>
    </div>
  );
}

function Erro({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-danger/10 text-danger border border-danger/30 rounded-md px-3 py-2 text-sm">
      {children}
    </div>
  );
}

function ResultadoView({
  resultado,
  dadosEnviados,
  onNovaConsulta
}: {
  resultado: Resultado;
  dadosEnviados: any;
  onNovaConsulta: () => void;
}) {
  const { classificacao } = resultado;
  const exigidas = resultado.medidas.filter((m) => m.status === 'EXIGIDO');
  const condicionais = resultado.medidas.filter((m) => m.status === 'CONDICIONAL');
  const naoSeAplica = resultado.medidas.filter((m) => m.status === 'NAO_SE_APLICA');

  const corClass: Record<string, string> = {
    DISPENSA: 'bg-success/10 text-success border-success/30',
    MEMORIAL_SIMPLIFICADO: 'bg-primary/10 text-primary border-primary/30',
    PTPID: 'bg-danger/10 text-danger border-danger/30',
    PTPID_IOT: 'bg-warning/10 text-warning border-warning/30',
    ANALISE_NPT002: 'bg-warning/10 text-warning border-warning/30'
  };

  function baixarPdf() {
    window.open(`/api/leads/${resultado.id}/pdf`, '_blank');
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-ink">Classificação e exigências</h2>
        <p className="text-sm text-muted mt-1">
          Divisão <strong>{dadosEnviados.divisao}</strong> · {dadosEnviados.area} m² · {dadosEnviados.altura} m de altura
        </p>
      </div>

      {/* Modalidade exigida */}
      <div className={`border rounded-lg p-5 ${corClass[classificacao.modalidade]}`}>
        <div className="text-xs uppercase tracking-wider font-semibold opacity-70">Modalidade exigida</div>
        <div className="text-2xl font-bold mt-1">{rotuloModalidade(classificacao.modalidade)}</div>
        <div className="text-xs mt-1 opacity-70">
          Tipo da edificação: <strong>{rotuloTipo(classificacao.tipo_edificacao)}</strong>
          {resultado.simplificada && <span className="ml-2">· edificação simplificada (Tabela 5)</span>}
        </div>

        {classificacao.justificativas.length > 0 && (
          <div className="mt-3 pt-3 border-t border-current/20">
            <div className="text-xs font-semibold uppercase mb-1 opacity-70">Por quê?</div>
            <ul className="text-sm space-y-1">
              {classificacao.justificativas.map((j, i) => (
                <li key={i}>• {j}</li>
              ))}
            </ul>
          </div>
        )}

        {classificacao.observacoes.length > 0 && (
          <div className="mt-3 pt-3 border-t border-current/20">
            <div className="text-xs font-semibold uppercase mb-1 opacity-70">Observações</div>
            <ul className="text-sm space-y-1">
              {classificacao.observacoes.map((o, i) => (
                <li key={i}>• {o}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Medidas exigidas */}
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Exigidas" value={exigidas.length} cor="text-danger" />
        <Stat label="Condicionais" value={condicionais.length} cor="text-warning" />
        <Stat label="Não se aplica" value={naoSeAplica.length} cor="text-muted" />
      </div>

      {exigidas.length > 0 && (
        <Secao titulo="Medidas exigidas" cor="danger">
          {exigidas.map((m) => <Medida key={m.nome} m={m} />)}
        </Secao>
      )}

      {condicionais.length > 0 && (
        <Secao titulo="Medidas condicionais" cor="warning">
          {condicionais.map((m) => <Medida key={m.nome} m={m} />)}
        </Secao>
      )}

      {naoSeAplica.length > 0 && (
        <details className="border border-border rounded-lg">
          <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-muted">
            Ver medidas que não se aplicam ({naoSeAplica.length})
          </summary>
          <div className="px-4 pb-3 space-y-1">
            {naoSeAplica.map((m) => (
              <div key={m.nome} className="text-sm text-muted">• {m.nome}</div>
            ))}
          </div>
        </details>
      )}

      <div className="border-t border-border pt-6 space-y-3">
        <div className="flex gap-3">
          <button onClick={baixarPdf} className="btn-primary flex-1">Baixar PDF completo</button>
          <button onClick={onNovaConsulta} className="btn-secondary">Nova consulta</button>
        </div>

        <div className="bg-primary/5 border border-primary/30 rounded-lg p-5 text-center">
          <h3 className="font-semibold text-ink">Precisa do {rotuloModalidade(classificacao.modalidade)}?</h3>
          <p className="text-sm text-muted mt-1 mb-3">
            Elaboramos toda a documentação conforme NPT 001, 005, 008, 011 e 017, pronta para protocolar.
          </p>
          <a
            href={`https://wa.me/${(process.env.NEXT_PUBLIC_WHATSAPP_PUBLICO || '5541999999999').replace(/\D/g, '')}?text=${encodeURIComponent(
              `Olá, fiz a consulta no site. Minha edificação ${dadosEnviados.divisao} (${dadosEnviados.area} m², ${dadosEnviados.altura} m) precisa de ${rotuloModalidade(classificacao.modalidade)}. Gostaria de orçamento.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-block"
          >
            Falar com especialista no WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

function rotuloTipo(t: string): string {
  const map: Record<string, string> = {
    NOVA: 'Nova',
    EXISTENTE_TIPO_2: 'Existente tipo 2',
    EXISTENTE_TIPO_1: 'Existente tipo 1',
    ANTIGA: 'Antiga'
  };
  return map[t] || t;
}

function Stat({ label, value, cor }: { label: string; value: number; cor: string }) {
  return (
    <div className="border border-border rounded-lg p-4 text-center">
      <div className={`text-3xl font-bold ${cor}`}>{value}</div>
      <div className="text-xs text-muted mt-1">{label}</div>
    </div>
  );
}

function Secao({ titulo, cor, children }: { titulo: string; cor: 'danger' | 'warning'; children: React.ReactNode }) {
  const corClass = cor === 'danger' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning';
  return (
    <div>
      <h3 className={`inline-block text-xs font-semibold uppercase tracking-wider ${corClass} px-2 py-1 rounded mb-2`}>
        {titulo}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Medida({ m }: { m: MedidaCSCIP }) {
  return (
    <div className="border border-border rounded-md px-4 py-3">
      <div className="font-medium text-ink text-sm">{m.nome}</div>
      {m.observacao && <div className="text-xs text-muted mt-1">{m.observacao}</div>}
    </div>
  );
}
