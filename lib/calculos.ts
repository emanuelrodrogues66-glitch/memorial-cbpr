// Lógica de cálculo do Memorial Descritivo, baseada nas NPTs do CBPR
import anexoA from './data/anexo_a.json';
import npt008 from './data/npt008.json';
import npt011 from './data/npt011.json';
import tiposAltura from './data/tipos_altura.json';
import { getMedidasCSCIP, type MedidaCSCIP } from './cscip-medidas';
import {
  dimensionarTodos,
  populacaoGlobal,
  DATA_SAIDAS,
  type Pavimento,
  type DimPavimento,
  type DivCsicipSaida
} from './saidas-npt011';
import { DATA_SAIDAS_IN09 } from './cbmsc/saidas-in09';
import { calcularBrigadaSC } from './cbmsc/brigada-in28';
import { dimensionarIluminacaoSC } from './cbmsc/iluminacao-in11';
import { classificarCargaSC, descreverClasseCargaSC } from './cbmsc/carga-in03';
import type { UF } from './cbmsc';
import { nptOuIn } from './cbmsc';
import {
  calcularMediaPonderada,
  type ItemCargaIncendio,
  type ResultadoCargaIncendio
} from './carga-incendio';
import type {
  CnaeRow,
  Npt008Row,
  Npt011Row,
  TipoAltura,
  RiscoIncendio
} from './types';

const CNAES = anexoA as CnaeRow[];
const NPT008 = npt008 as Npt008Row[];
const NPT011 = npt011 as Npt011Row[];
const TIPOS = tiposAltura as unknown as TipoAltura[];

export function listarCnaes(): CnaeRow[] {
  return CNAES;
}

function norm(s: string): string {
  return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function buscarCnae(termo: string, limit = 50): CnaeRow[] {
  const t = norm(termo.trim());
  if (!t) return [];
  return CNAES.filter((r) => {
    const hay = norm(
      [r.cnae, r.descricao, r.divisao, r.ocupacao, r.grupo, r.exemplos].join(' | ')
    );
    return hay.includes(t);
  }).slice(0, limit);
}

export function getCnae(cnae: string): CnaeRow | undefined {
  return CNAES.find((r) => r.cnae === cnae);
}

// Determina TIPO de edificação por altura (NPT 005 / Tabela 1)
export function classificarTipoEdificacao(alturaM: number): TipoAltura {
  // h = 0 -> Térrea (TIPO I)
  if (alturaM <= 0) return TIPOS[0];
  for (const t of TIPOS) {
    if (t.altura_min === 0 && (t.altura_max === null || alturaM <= t.altura_max)) {
      // Pula térrea se altura > 0
      if (t.tipo === 'TIPO I') continue;
      return t;
    }
    if (alturaM > t.altura_min && (t.altura_max === null || alturaM <= t.altura_max)) {
      return t;
    }
  }
  return TIPOS[TIPOS.length - 1];
}

// Determina classe da NPT 008 a partir da altura (Classe P1..P8 / S1/S2 para subsolo)
// Para edificações comuns (não-subsolo), usa P1..P8.
export function classeNpt008(alturaM: number, subsolo = false): string {
  if (subsolo) return alturaM > 10 ? 'Classe S2 hs > 10' : 'Classe S1 hs ≤10';
  if (alturaM <= 6) return 'Classe P1 h ≤  6';
  if (alturaM <= 12) return 'Classe P2 6 < h ≤12';
  if (alturaM <= 23) return 'Classe P3 12 < h ≤23';
  if (alturaM <= 30) return 'Classe P4 23 < h ≤30';
  if (alturaM <= 80) return 'Classe P5 30 < h ≤80';
  if (alturaM <= 120) return 'Classe P6 80 < h ≤120';
  if (alturaM <= 150) return 'Classe P7 120 < h ≤150';
  return 'Classe P8 150 < h ≤250';
}

// Tempo Requerido de Resistência ao Fogo (TRRF) em minutos
export function trrfMinutos(divisao: string, classe: string): number | null {
  const r = NPT008.find((x) => x.divisao === divisao);
  if (!r) return null;
  const v = r.trrf?.[classe];
  return typeof v === 'number' ? v : null;
}

// Risco de incêndio com base na carga (MJ/m²)
export function classificarRisco(cargaMjM2: number): RiscoIncendio {
  if (cargaMjM2 <= 300) return 'BAIXO';
  if (cargaMjM2 <= 1200) return 'MEDIO';
  return 'ALTO';
}

// NPT 011: linha aplicável por divisão (preferir match exato; cair para grupo)
export function npt011Para(divisao: string): Npt011Row | undefined {
  const exato = NPT011.find((x) => x.divisao === divisao);
  if (exato) return exato;
  const grupo = divisao.split('-')[0];
  return NPT011.find((x) => x.grupo === grupo);
}

// População: por densidade (m²/pessoa) ou descrição textual quando densidade não se aplica
export function calcularPopulacao(
  divisao: string,
  areaM2: number,
  override?: number
): { valor: number; descricao: string } {
  if (override && override > 0) {
    return { valor: Math.ceil(override), descricao: 'Informada pelo responsável técnico' };
  }
  const linha = npt011Para(divisao);
  if (!linha) return { valor: 0, descricao: 'Sem regra NPT 011 aplicável' };
  if (linha.densidade_m2_por_pessoa && linha.densidade_m2_por_pessoa > 0) {
    const valor = Math.ceil(areaM2 / linha.densidade_m2_por_pessoa);
    return {
      valor,
      descricao: `${linha.populacao_descricao} (1 pessoa a cada ${linha.densidade_m2_por_pessoa} m²)`
    };
  }
  return { valor: 0, descricao: linha.populacao_descricao };
}

// Unidades de passagem necessárias por tipo de saída
// Cap = capacidade da unidade de passagem (pessoas) -> nº unidades = ceil(populacao / cap)
export function unidadesPassagem(divisao: string, populacao: number) {
  const linha = npt011Para(divisao);
  const cap = linha?.capacidade_unidade_passagem ?? {
    acesso_descarga: 60,
    escada: 45,
    rampa: 45,
    porta: 100
  };
  return {
    acesso_descarga: cap.acesso_descarga ? Math.ceil(populacao / cap.acesso_descarga) : 0,
    escada: cap.escada ? Math.ceil(populacao / cap.escada) : 0,
    porta: cap.porta ? Math.ceil(populacao / cap.porta) : 0,
    capacidades: cap
  };
}

// NPT 017 item 6.2: a composição da brigada é determinada pela população
// potencialmente exposta, na proporção de 1 brigadista a cada 200 pessoas,
// considerando-se o número inteiro imediatamente superior.
// Para o Grupo F (locais de reunião de público) a população é acrescida em 30%.
export function calcularBrigada(populacao: number, grupo: string | undefined, origem?: 'saidas' | 'estimativa') {
  const pop = Math.max(0, Math.ceil(Number(populacao) || 0));
  const isGrupoF = (grupo || '').toUpperCase().trim().startsWith('F');
  const popAjustada = isGrupoF ? Math.ceil(pop * 1.30) : pop;
  const razao = popAjustada / 200;
  const brigadistas = Math.max(1, Math.ceil(razao));
  const partes: string[] = [];
  const fonte = origem === 'saidas'
    ? '(soma dos ambientes do memorial de saídas)'
    : '(estimativa pela área total da divisão principal)';
  partes.push(`População potencialmente exposta: ${pop} pessoa(s) ${fonte}.`);
  if (isGrupoF) {
    partes.push(`Grupo F (locais de reunião de público): acréscimo de 30% → ${pop} × 1,30 = ${popAjustada} pessoa(s).`);
  }
  partes.push(
    `Cálculo NPT 017 item 6.2 (PR): ${popAjustada} ÷ 200 = ${razao.toFixed(2)} → ${brigadistas} brigadista(s) ` +
    `(arredondamento para o número inteiro imediatamente superior).`
  );
  partes.push('Critério (PR): 1 brigadista orgânico para cada 200 (duzentas) pessoas (Tabela 1 da NPT 011).');
  return {
    brigadistas,
    populacao_ajustada: popAjustada,
    descricao: partes.join(' ')
  };
}

// Sugere medidas de proteção mínimas com base em altura, área e risco.
// Cita a NPT (PR) ou a IN equivalente (SC) conforme a UF do projeto.
export function sugerirMedidas(
  alturaM: number,
  area: number,
  risco: RiscoIncendio,
  uf?: string
): string[] {
  const u: UF = (uf || '').toUpperCase() === 'SC' ? 'SC' : 'PR';
  const ref = (npt: string) => nptOuIn(u, npt);
  const m: string[] = [];
  m.push('Sinalização de emergência');
  m.push('Iluminação de emergência');
  m.push(`Saídas de emergência dimensionadas conforme ${ref('011')}`);
  m.push(`Extintores portáteis conforme ${ref('021')}`);
  m.push(`Brigada de incêndio conforme ${ref('017')}`);
  if (alturaM > 12 || area > 750) {
    m.push(`Sistema de hidrantes e mangotinhos (${ref('022')})`);
  }
  if (alturaM > 23 || area > 1500 || risco === 'ALTO') {
    m.push(`Sistema de chuveiros automáticos – sprinklers (${ref('023')})`);
  }
  if (alturaM > 23) {
    m.push(`Sistema de detecção e alarme de incêndio (${ref('019')})`);
  }
  if (risco === 'ALTO') {
    m.push(`Controle de materiais de acabamento e revestimento (${ref('010')})`);
  }
  return m;
}

// Resumo de ocupação quando há mais de um CNAE (edificação mista)
export function resumoOcupacao(
  cnaes: { divisao?: string; grupo?: string; ocupacao?: string }[],
  fallbackOcupacao?: string,
  fallbackDivisao?: string
): string {
  const valid = (cnaes || []).filter((c) => (c?.divisao || '').trim());
  if (valid.length <= 1) {
    const div = valid[0]?.divisao || fallbackDivisao || '';
    const oc = valid[0]?.ocupacao || fallbackOcupacao || '';
    return div ? `${oc} (${div})` : oc;
  }
  // Remove divisões repetidas mantendo ordem
  const divs = Array.from(new Set(valid.map((c) => (c.divisao || '').trim()).filter(Boolean)));
  return `Mista (Grupo ${divs.join(' e ')})`;
}

// Seleciona tabela de capacidades CSCIP conforme UF (PR=NPT 011, SC=IN 09)
export function tabelaSaidasPorUF(uf?: string): Record<string, DivCsicipSaida> {
  return (uf || '').toUpperCase() === 'SC' ? DATA_SAIDAS_IN09 : DATA_SAIDAS;
}

// Função orquestradora: dados parciais -> dados completos calculados
export function calcular(dados: any) {
  // UF determina a norma aplicavel: PR usa NPT (CBMPR); SC usa IN (CBMSC).
  const uf: UF = ((dados.uf || '').toUpperCase() === 'SC' ? 'SC' : 'PR');
  const tabelaSaidas = tabelaSaidasPorUF(uf);
  const cnae = getCnae(dados.cnae);
  // Memorial de carga de incêndio (média ponderada por área) tem prioridade quando preenchido
  const itensCi: ItemCargaIncendio[] = Array.isArray(dados.carga_incendio_itens)
    ? (dados.carga_incendio_itens as ItemCargaIncendio[])
    : [];
  const memCi: ResultadoCargaIncendio = calcularMediaPonderada(itensCi);
  const cargaCnae = cnae?.carga_incendio_mj_m2 ?? dados.carga_incendio_mj_m2 ?? 0;
  const carga =
    memCi.media_ponderada_mj_m2 > 0
      ? memCi.media_ponderada_mj_m2
      : cargaCnae;
  const risco = classificarRisco(Number(carga) || 0);
  const tipo = classificarTipoEdificacao(Number(dados.altura_edificacao_m) || 0);
  const classe = classeNpt008(Number(dados.altura_edificacao_m) || 0);
  const divisao = cnae?.divisao ?? dados.divisao ?? '';
  const trrf = divisao ? trrfMinutos(divisao, classe) : null;

  const pop = calcularPopulacao(
    divisao,
    Number(dados.area_construida_m2) || 0,
    dados.populacao_calculada
  );
  const up = unidadesPassagem(divisao, pop.valor);
  const grupoPrincipal = cnae?.grupo ?? dados.grupo ?? '';

  // Memorial detalhado de saidas (NPT 011 / IN 09): pavimentos + ambientes
  const pavs: Pavimento[] = Array.isArray(dados.saidas_pavimentos)
    ? (dados.saidas_pavimentos as Pavimento[])
    : [];

  // Brigada: PR usa NPT 017 (1/200 + 30% Grupo F).
  //          SC usa IN 28 do CBMSC (GPF por divisao, com isencao, e nivel de treinamento).
  // Em ambos os casos, quando o memorial detalhado de saidas esta preenchido,
  // usamos a populacao real somada dos ambientes em vez da estimativa por area.
  const populacaoSaidasCalc = pavs.length ? populacaoGlobal(pavs, tabelaSaidas) : 0;
  const populacaoParaBrigada = populacaoSaidasCalc > 0 ? populacaoSaidasCalc : pop.valor;

  let brig: { brigadistas: number; populacao_ajustada: number; descricao: string };
  let brigadaTreinamento: string | undefined;
  let brigadaIsento = false;

  if (uf === 'SC') {
    // IN 28: usa populacao FIXA. Por enquanto adotamos a populacao potencialmente
    // exposta como aproximacao quando a populacao fixa nao for informada manualmente.
    const popFixa = Number(dados.brigada_populacao_fixa) || populacaoParaBrigada;
    const possuiSprinkler = Boolean(dados.brigada_possui_sprinkler);
    const resSC = calcularBrigadaSC(popFixa, divisao, possuiSprinkler);
    brig = {
      brigadistas: resSC.brigadistas,
      populacao_ajustada: resSC.populacao_usada,
      descricao: resSC.descricao
    };
    brigadaTreinamento = resSC.treinamento;
    brigadaIsento = resSC.isento;
  } else {
    const resPR = calcularBrigada(
      populacaoParaBrigada,
      grupoPrincipal,
      populacaoSaidasCalc > 0 ? 'saidas' : 'estimativa'
    );
    brig = {
      brigadistas: resPR.brigadistas,
      populacao_ajustada: resPR.populacao_ajustada,
      descricao: resPR.descricao
    };
  }
  const medidas = sugerirMedidas(
    Number(dados.altura_edificacao_m) || 0,
    Number(dados.area_construida_m2) || 0,
    risco,
    uf
  );

  // Verificador CSCIP/PR: matriz Grupo+Divisão+Altura+Área → medidas
  const cscip = divisao
    ? getMedidasCSCIP(
        divisao,
        Number(dados.area_construida_m2) || 0,
        Number(dados.altura_edificacao_m) || 0
      )
    : { medidas: [] as MedidaCSCIP[], simplificada: false };

  const saidas_dimensionamento: DimPavimento[] = pavs.length
    ? dimensionarTodos(pavs, tabelaSaidas)
    : [];
  const populacao_saidas = populacaoSaidasCalc;

  // Iluminacao de emergencia (apenas SC tem dimensionamento agregado nesta versao)
  const iluminacaoSC = uf === 'SC'
    ? dimensionarIluminacaoSC({
        divisao,
        altura_m: Number(dados.altura_edificacao_m) || 0,
        area_m2: Number(dados.area_construida_m2) || 0,
        populacao: populacaoParaBrigada
      })
    : null;

  // Classificacao de carga de incendio SC (5 niveis IN 03)
  const cargaClasseSC = uf === 'SC' ? classificarCargaSC(Number(carga) || 0) : null;
  const cargaClasseSCDesc = cargaClasseSC ? descreverClasseCargaSC(cargaClasseSC) : null;

  // Resumo de ocupação (edificação mista quando houver mais de um CNAE)
  const cnaesArr: any[] = Array.isArray(dados.cnaes) ? dados.cnaes : [];
  const ocupacaoResumo = resumoOcupacao(
    cnaesArr,
    cnae?.ocupacao ?? dados.ocupacao,
    divisao
  );

  return {
    grupo: cnae?.grupo ?? dados.grupo ?? '',
    ocupacao: cnae?.ocupacao ?? dados.ocupacao ?? '',
    divisao,
    descricao_atividade: cnae?.descricao ?? dados.descricao_atividade ?? '',
    carga_incendio_mj_m2: Number(carga) || 0,
    risco_incendio: risco,
    tipo_edificacao: tipo.tipo,
    classe_npt008: classe,
    trrf_minutos: trrf,
    populacao_calculada: pop.valor,
    populacao_descricao_npt011: pop.descricao,
    unidades_passagem_acesso: up.acesso_descarga,
    unidades_passagem_escada: up.escada,
    unidades_passagem_porta: up.porta,
    brigadistas_necessarios: brig.brigadistas,
    brigadistas_descricao: brig.descricao,
    brigada_populacao_ajustada: brig.populacao_ajustada,
    medidas_protecao: medidas,
    medidas_cscip: cscip.medidas,
    cscip_simplificada: cscip.simplificada,
    saidas_dimensionamento,
    populacao_saidas,
    carga_incendio_memorial: memCi,
    ocupacao_resumo: ocupacaoResumo,
    // Campos SC-especificos (preservados quando uf === 'PR')
    uf,
    brigada_treinamento: brigadaTreinamento,
    brigada_isento: brigadaIsento,
    iluminacao_sc: iluminacaoSC,
    carga_classe_sc: cargaClasseSC,
    carga_classe_sc_descricao: cargaClasseSCDesc
  };
}
