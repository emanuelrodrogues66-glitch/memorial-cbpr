'use client';

import { useMemo, useState } from 'react';
import { buscarCnae, listarCnaes } from '@/lib/calculos';
import { formatarCnpj } from '@/lib/leads';
import type { MedidaCSCIP } from '@/lib/cscip-medidas';
import type { CnaeRow } from '@/lib/types';

type Etapa = 'cliente' | 'edificacao' | 'resultado';

type Resultado = {
  id: string;
  medidas: MedidaCSCIP[];
  simplificada: boolean;
};

export default function ConsultaForm() {
  const [etapa, setEtapa] = useState<Etapa>('cliente');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Cliente
  const [nome, setNome] = useState('');
  const [contato, setContato] = useState('');
  const [cnpj, setCnpj] = useState('');

  // Edificação
  const [cnaeTermo, setCnaeTermo] = useState('');
  const [cnaeSelecionado, setCnaeSelecionado] = useState<CnaeRow | null>(null);
  const [divisaoManual, setDivisaoManual] = useState('');
  const [area, setArea] = useState('');
  const [altura, setAltura] = useState('');
  const [cidade, setCidade] = useState('');

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

  function irParaEdificacao() {
    setErro(null);
    if (!nome.trim() || nome.trim().length < 3) {
      setErro('Informe seu nome completo');
      return;
    }
    if (!contato.trim() || contato.trim().length < 5) {
      setErro('Informe um contato válido (telefone ou email)');
      return;
    }
    setEtapa('edificacao');
  }

  async function enviar() {
    setErro(null);
    if (!divisaoFinal) {
      setErro('Selecione a ocupação (informe o CNAE ou escolha a divisão)');
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

    setEnviando(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          contato: contato.trim(),
          cnpj: cnpj.replace(/\D/g, '') || null,
          cnae: cnaeSelecionado?.cnae || null,
          cnae_descricao: cnaeSelecionado?.descricao || null,
          divisao: divisaoFinal,
          area_m2: areaNum,
          altura_m: alturaNum,
          cidade: cidade.trim() || null
        })
      });
      const json = await res.json();
      if (!res.ok) {
        setErro(json.error || 'Erro ao enviar consulta');
        return;
      }
      setResultado({
        id: json.id,
        medidas: json.medidas,
        simplificada: json.simplificada
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

            <Field label="Telefone ou email *">
              <input
                type="text"
                value={contato}
                onChange={(e) => setContato(e.target.value)}
                className="input"
                placeholder="(41) 99999-9999 ou seu@email.com"
              />
            </Field>

            <Field label="CNPJ (opcional)">
              <input
                type="text"
                value={cnpj}
                onChange={(e) => setCnpj(formatarCnpj(e.target.value))}
                className="input"
                placeholder="00.000.000/0000-00"
                maxLength={18}
              />
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
            <p className="text-sm text-muted">Informe a atividade e as dimensões da obra.</p>

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

            <Field label={`Divisão CSCIP ${cnaeSelecionado ? '(detectada pelo CNAE)' : '*'}`}>
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

            <Field label="Cidade (opcional)">
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
              <button onClick={() => setEtapa('cliente')} className="btn-secondary">
                Voltar
              </button>
              <button onClick={enviar} disabled={enviando} className="btn-primary disabled:opacity-50">
                {enviando ? 'Calculando...' : 'Ver exigências'}
              </button>
            </div>
          </div>
        )}

        {etapa === 'resultado' && resultado && (
          <ResultadoView
            resultado={resultado}
            dadosEnviados={{ nome, contato, divisao: divisaoFinal, area, altura, cidade, cnae: cnaeSelecionado }}
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
    { id: 'resultado', label: '3. Exigências' }
  ];
  const atual = passos.findIndex((p) => p.id === etapa);
  return (
    <div className="border-b border-border px-8 py-4 flex items-center gap-2">
      {passos.map((p, i) => (
        <div key={p.id} className="flex items-center gap-2 flex-1">
          <div className={`flex-1 text-sm font-medium ${i <= atual ? 'text-primary' : 'text-muted'}`}>
            {p.label}
          </div>
          {i < passos.length - 1 && <div className="w-8 h-px bg-border" />}
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
  const exigidas = resultado.medidas.filter((m) => m.status === 'EXIGIDO');
  const condicionais = resultado.medidas.filter((m) => m.status === 'CONDICIONAL');
  const naoSeAplica = resultado.medidas.filter((m) => m.status === 'NAO_SE_APLICA');

  function baixarPdf() {
    const url = `/api/leads/${resultado.id}/pdf`;
    window.open(url, '_blank');
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-ink">Exigências para sua edificação</h2>
        <p className="text-sm text-muted mt-1">
          Divisão <strong>{dadosEnviados.divisao}</strong> · {dadosEnviados.area} m² · {dadosEnviados.altura} m de altura
          {resultado.simplificada && <span className="ml-2 inline-block bg-success/10 text-success text-xs px-2 py-0.5 rounded-full font-medium">Edificação simplificada</span>}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Exigidas" value={exigidas.length} cor="text-danger" />
        <Stat label="Condicionais" value={condicionais.length} cor="text-warning" />
        <Stat label="Não se aplica" value={naoSeAplica.length} cor="text-muted" />
      </div>

      {exigidas.length > 0 && (
        <Secao titulo="Exigidas" cor="danger">
          {exigidas.map((m) => <Medida key={m.nome} m={m} />)}
        </Secao>
      )}

      {condicionais.length > 0 && (
        <Secao titulo="Condicionais" cor="warning">
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
          <button onClick={baixarPdf} className="btn-primary flex-1">
            Baixar PDF
          </button>
          <button onClick={onNovaConsulta} className="btn-secondary">
            Nova consulta
          </button>
        </div>

        <div className="bg-primary/5 border border-primary/30 rounded-lg p-5 text-center">
          <h3 className="font-semibold text-ink">Precisa do memorial descritivo completo?</h3>
          <p className="text-sm text-muted mt-1 mb-3">
            Elaboramos memoriais conforme NPT 005, 008, 011 e 017, prontos para protocolar.
          </p>
          <a
            href={`https://wa.me/${(process.env.NEXT_PUBLIC_WHATSAPP_PUBLICO || '5541999999999').replace(/\D/g, '')}?text=${encodeURIComponent(
              `Olá, gostaria de orçamento para memorial descritivo. Edificação ${dadosEnviados.divisao}, ${dadosEnviados.area} m², ${dadosEnviados.altura} m.`
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
