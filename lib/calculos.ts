// Lógica de cálculo do Memorial Descritivo, baseada nas NPTs do CBPR
import anexoA from './data/anexo_a.json';
import npt008 from './data/npt008.json';
import npt011 from './data/npt011.json';
import tiposAltura from './data/tipos_altura.json';
import { getMedidasCSCIP, type MedidaCSCIP } from './cscip-medidas';
import {
  dimensionarTodos,
  populacaoGlobal,
  type Pavimento,
  type DimPavimento
} from './saidas-npt011';
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

// NPT 017: Brigada de incêndio. Regra simplificada: 6 brigadistas para cada 200 pessoas
// (acima de 200, somar 1 brigadista a cada 50 pessoas adicionais — varia por risco).
export function calcularBrigada(populacao: number, risco: RiscoIncendio) {
  // Coeficientes por nível de risco (proporção em %): baixo 5, médio 10, alto 20
  const coef = risco === 'BAIXO' ? 0.05 : risco === 'MEDIO' ? 0.10 : 0.20;
  const minimoLei = Math.max(2, Math.ceil(populacao * coef));
  // Regra prática 6 a cada 200 pessoas conforme planilha original
  const regra200 = Math.max(6, Math.ceil(populacao / 200) * 6);
  const brigadistas = Math.max(minimoLei, regra200);
  return {
    brigadistas,
    descricao: `Risco ${risco.toLowerCase()} • ${brigadistas} brigadista(s) treinado(s) conforme NPT 017`
  };
}

// Sugere medidas de proteção mínimas com base em altura, área e risco
export function sugerirMedidas(
  alturaM: number,
  area: number,
  risco: RiscoIncendio
): string[] {
  const m: string[] = [];
  m.push('Sinalização de emergência');
  m.push('Iluminação de emergência');
  m.push('Saídas de emergência dimensionadas conforme NPT 011');
  m.push('Extintores portáteis conforme NPT 021');
  m.push('Brigada de incêndio conforme NPT 017');
  if (alturaM > 12 || area > 750) {
    m.push('Sistema de hidrantes e mangotinhos (NPT 022)');
  }
  if (alturaM > 23 || area > 1500 || risco === 'ALTO') {
    m.push('Sistema de chuveiros automáticos – sprinklers (NPT 023)');
  }
  if (alturaM > 23) {
    m.push('Sistema de detecção e alarme de incêndio (NPT 019)');
  }
  if (risco === 'ALTO') {
    m.push('Controle de materiais de acabamento e revestimento (NPT 010)');
  }
  return m;
}

// Função orquestradora: dados parciais -> dados completos calculados
export function calcular(dados: any) {
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
  const brig = calcularBrigada(pop.valor, risco);
  const medidas = sugerirMedidas(
    Number(dados.altura_edificacao_m) || 0,
    Number(dados.area_construida_m2) || 0,
    risco
  );

  // Verificador CSCIP/PR: matriz Grupo+Divisão+Altura+Área → medidas
  const cscip = divisao
    ? getMedidasCSCIP(
        divisao,
        Number(dados.area_construida_m2) || 0,
        Number(dados.altura_edificacao_m) || 0
      )
    : { medidas: [] as MedidaCSCIP[], simplificada: false };

  // Memorial detalhado de saídas (NPT 011) — quando o usuário preenche pavimentos
  const pavs: Pavimento[] = Array.isArray(dados.saidas_pavimentos)
    ? (dados.saidas_pavimentos as Pavimento[])
    : [];
  const saidas_dimensionamento: DimPavimento[] = pavs.length ? dimensionarTodos(pavs) : [];
  const populacao_saidas = pavs.length ? populacaoGlobal(pavs) : 0;

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
    medidas_protecao: medidas,
    medidas_cscip: cscip.medidas,
    cscip_simplificada: cscip.simplificada,
    saidas_dimensionamento,
    populacao_saidas,
    carga_incendio_memorial: memCi
  };
}
