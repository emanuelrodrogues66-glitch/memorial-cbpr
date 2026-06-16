// Classificador CBMSC pela IN 01 (Partes 1 e 2) - Abril/2024.
//
// PT 01 (Procedimentos administrativos) define 5 niveis de risco do imovel,
// e PT 02 (Anexos) define as SMSCI exigidas por ocupacao/altura.
//
// Niveis de risco (PT 01):
//   I   - Dispensado/Isento
//         ex.: residencias unifamiliares <= 200 m2 com ate 1 empregado,
//              condominios horizontais ate 6 unidades, ambulantes, foodtrucks.
//   II  - Processo Simplificado (autodeclaracao + vistoria pos-funcionamento)
//         Quadro 1: area <= 750 m2, altura <= 3 pav, GLP <= 190 kg,
//                  F-6/F-11 <= 100 pessoas, demais F <= 200 pessoas,
//                  liq. inflamavel interno <= 250 L (externo <= 20 m3),
//                  carga incendio <= 2280 MJ/m².
//   III - Processo Simplificado com previa regularizacao
//         Quadro 2: tabela area x altura por grupo/divisao.
//         Quadro 3: F todas com populacao <= 200; M-8 PRGLP I a IV.
//         Liquidos: ate 1 m3 interno, ate 40 m3 externo.
//   IV  - Processo Ordinario (PPCI completo)
//         Nao enquadrado em I, II, III ou V.
//   V   - Processo Ordinario com analise tecnica (alto risco)
//         Radioativos, inflamaveis classe I > 1000 L interno, toxicas,
//         explosivas, pirotecnicos, municao, carga > 2280 MJ/m².

import {
  type MedidaCSCIP,
  type StatusMedida,
  TODAS_MEDIDAS
} from './cscip-medidas';

export type RiscoSC = 'I' | 'II' | 'III' | 'IV' | 'V';

export type TipoProcessoSC =
  | 'ISENTO'
  | 'SIMPLIFICADO'
  | 'SIMPLIFICADO_PREVIA'
  | 'ORDINARIO'
  | 'ORDINARIO_ESPECIAL';

export type ClassificacaoSCInput = {
  divisao: string;            // ex.: "A-2", "F-6"
  area_m2: number;
  altura_m: number;
  pavimentos?: number | null;
  populacao?: number | null;
  ano_construcao?: number | null;
  tem_certificacao_anterior?: boolean;
  // SMSCI / cargas perigosas
  liquido_inflamavel_litros?: number | null;
  liquido_inflamavel_externo_m3?: number | null;
  glp_kg?: number | null;
  carga_incendio_mj_m2?: number | null;
  // Sinalizadores Risco V
  tem_substancia_radioativa?: boolean;
  tem_explosivos?: boolean;
  tem_pirotecnico?: boolean;
  tem_municao?: boolean;
  // Edif. unifamiliar
  residencia_unifamiliar?: boolean;
  empregados?: number | null;
  unidades_condominio_horizontal?: number | null;
};

export type ClassificacaoSCResultado = {
  risco: RiscoSC;
  tipo_processo: TipoProcessoSC;
  justificativas: string[];
  observacoes: string[];
};

export function rotuloRiscoSC(r: RiscoSC): string {
  switch (r) {
    case 'I': return 'Risco I — Dispensado';
    case 'II': return 'Risco II — Simplificado';
    case 'III': return 'Risco III — Simplificado com prévia regularização';
    case 'IV': return 'Risco IV — Ordinário';
    case 'V': return 'Risco V — Ordinário com análise técnica';
  }
}

export function rotuloProcessoSC(p: TipoProcessoSC): string {
  switch (p) {
    case 'ISENTO': return 'Dispensado de processo';
    case 'SIMPLIFICADO': return 'Processo Simplificado (autodeclaração + vistoria pós-funcionamento)';
    case 'SIMPLIFICADO_PREVIA': return 'Processo Simplificado com prévia regularização';
    case 'ORDINARIO': return 'Processo Ordinário (PPCI completo)';
    case 'ORDINARIO_ESPECIAL': return 'Processo Ordinário com análise técnica (alto risco)';
  }
}

export function corRiscoSC(r: RiscoSC): 'success' | 'primary' | 'warning' | 'danger' {
  switch (r) {
    case 'I': return 'success';
    case 'II': return 'primary';
    case 'III': return 'warning';
    case 'IV': return 'danger';
    case 'V': return 'danger';
  }
}

// Verifica Risco I (isencao)
function ehRiscoI(input: ClassificacaoSCInput): { eh: boolean; motivo?: string } {
  // Residencia unifamiliar <= 200 m2, ate 1 empregado
  if (
    input.residencia_unifamiliar &&
    input.area_m2 <= 200 &&
    (input.empregados == null || input.empregados <= 1)
  ) {
    return {
      eh: true,
      motivo: 'Residência unifamiliar com área ≤ 200 m² e até 1 empregado (IN 01 PT 01)'
    };
  }
  // Condominio horizontal ate 6 unidades
  if (
    input.unidades_condominio_horizontal != null &&
    input.unidades_condominio_horizontal > 0 &&
    input.unidades_condominio_horizontal <= 6
  ) {
    return {
      eh: true,
      motivo: `Condomínio horizontal com ${input.unidades_condominio_horizontal} unidades (≤ 6) — IN 01 PT 01`
    };
  }
  return { eh: false };
}

// Verifica Risco V (alto risco)
function ehRiscoV(input: ClassificacaoSCInput): { eh: boolean; motivos: string[] } {
  const motivos: string[] = [];
  if (input.tem_substancia_radioativa) motivos.push('Armazenamento ou manuseio de substâncias radioativas');
  if (input.tem_explosivos) motivos.push('Armazenamento de explosivos');
  if (input.tem_pirotecnico) motivos.push('Comércio ou armazenamento de fogos pirotécnicos');
  if (input.tem_municao) motivos.push('Comércio ou armazenamento de munição');
  if (input.liquido_inflamavel_litros && input.liquido_inflamavel_litros > 1000) {
    motivos.push(`Armazenamento interno de ${input.liquido_inflamavel_litros} L de líquido inflamável classe I (> 1000 L)`);
  }
  if (input.carga_incendio_mj_m2 && input.carga_incendio_mj_m2 > 2280) {
    motivos.push(`Carga de incêndio de ${input.carga_incendio_mj_m2} MJ/m² (> 2280 MJ/m²)`);
  }
  return { eh: motivos.length > 0, motivos };
}

// Verifica Risco II (Quadro 1)
function ehRiscoII(input: ClassificacaoSCInput): { eh: boolean; motivos: string[] } {
  const violacoes: string[] = [];
  // Limites do Quadro 1
  if (input.area_m2 > 750) violacoes.push(`área ${input.area_m2} m² > 750 m²`);
  if (input.pavimentos != null && input.pavimentos > 3) violacoes.push(`${input.pavimentos} pavimentos > 3`);
  if (input.altura_m > 12) violacoes.push(`altura ${input.altura_m} m > 12 m`);
  if (input.glp_kg && input.glp_kg > 190) violacoes.push(`GLP ${input.glp_kg} kg > 190 kg`);
  if (input.liquido_inflamavel_litros && input.liquido_inflamavel_litros > 250) {
    violacoes.push(`líq. inflamável interno ${input.liquido_inflamavel_litros} L > 250 L`);
  }
  if (input.liquido_inflamavel_externo_m3 && input.liquido_inflamavel_externo_m3 > 20) {
    violacoes.push(`líq. inflamável externo ${input.liquido_inflamavel_externo_m3} m³ > 20 m³`);
  }
  if (input.carga_incendio_mj_m2 && input.carga_incendio_mj_m2 > 2280) {
    violacoes.push(`carga de incêndio ${input.carga_incendio_mj_m2} MJ/m² > 2280 MJ/m²`);
  }
  // Populacao para grupo F
  if (input.divisao.startsWith('F-')) {
    const pop = input.populacao ?? 0;
    if (input.divisao === 'F-6' || input.divisao === 'F-11') {
      if (pop > 100) violacoes.push(`${input.divisao} com ${pop} pessoas > 100`);
    } else {
      if (pop > 200) violacoes.push(`${input.divisao} com ${pop} pessoas > 200`);
    }
  }

  if (violacoes.length === 0) {
    return {
      eh: true,
      motivos: [
        `Edificação se enquadra no Quadro 1 da IN 01 PT 01: área ≤ 750 m², altura ≤ 12 m, ${input.divisao} dentro dos limites de população`
      ]
    };
  }
  return { eh: false, motivos: violacoes };
}

// Verifica Risco III (Quadros 2 e 3)
// Implementacao simplificada baseada no padrao geral da IN 01 PT 01:
// - F com populacao <= 200 (Quadro 3) entre Risco II e IV
// - Grupo M-8 (PRGLP I a IV) tambem Risco III
// - Demais grupos: Quadro 2 estabelece relacao area x altura intermediaria.
//   Aproximacao: area entre 750 e 1500 m2 OU 4 a 5 pavimentos OU altura entre 12 e 23 m
//   sem violar limites de Risco V.
function ehRiscoIII(input: ClassificacaoSCInput): { eh: boolean; motivos: string[] } {
  const grupo = input.divisao[0] || '';
  // F com populacao <= 200 (Quadro 3)
  if (grupo === 'F' && (input.populacao ?? 0) <= 200) {
    return {
      eh: true,
      motivos: [
        `Ocupação ${input.divisao} (reunião de público) com população ≤ 200 pessoas — Quadro 3 da IN 01 PT 01`
      ]
    };
  }
  // M-8 (PRGLP I a IV)
  if (input.divisao === 'M-8') {
    return {
      eh: true,
      motivos: ['Ocupação M-8 (PRGLP categorias I a IV) — Quadro 3 da IN 01 PT 01']
    };
  }
  // Quadro 2 simplificado
  const areaIntermed = input.area_m2 > 750 && input.area_m2 <= 1500;
  const alturaIntermed = input.altura_m > 12 && input.altura_m <= 23;
  const pavIntermed = input.pavimentos != null && input.pavimentos >= 4 && input.pavimentos <= 5;
  if (areaIntermed || alturaIntermed || pavIntermed) {
    const motivos: string[] = [];
    if (areaIntermed) motivos.push(`área ${input.area_m2} m² entre 750 e 1500 m²`);
    if (alturaIntermed) motivos.push(`altura ${input.altura_m} m entre 12 e 23 m`);
    if (pavIntermed) motivos.push(`${input.pavimentos} pavimentos (4 a 5)`);
    return {
      eh: true,
      motivos: [
        `Edificação se enquadra no Quadro 2 da IN 01 PT 01 — ${motivos.join(', ')}`
      ]
    };
  }
  return { eh: false, motivos: [] };
}

export function classificarRiscoSC(
  input: ClassificacaoSCInput
): ClassificacaoSCResultado {
  const observacoes: string[] = [];

  // Risco V (testar primeiro - alto risco sobrescreve enquadramento por area)
  const rV = ehRiscoV(input);
  if (rV.eh) {
    return {
      risco: 'V',
      tipo_processo: 'ORDINARIO_ESPECIAL',
      justificativas: rV.motivos,
      observacoes: [
        'Risco V exige Projeto Técnico de Prevenção Contra Incêndio (PPCI) completo, com análise técnica diferenciada do CBMSC',
        ...observacoes
      ]
    };
  }

  // Risco I (isencao)
  const rI = ehRiscoI(input);
  if (rI.eh) {
    return {
      risco: 'I',
      tipo_processo: 'ISENTO',
      justificativas: [rI.motivo!],
      observacoes: [
        'Mesmo dispensada, recomenda-se atender às medidas básicas de segurança contra incêndio',
        ...observacoes
      ]
    };
  }

  // Risco II (Quadro 1)
  const rII = ehRiscoII(input);
  if (rII.eh) {
    return {
      risco: 'II',
      tipo_processo: 'SIMPLIFICADO',
      justificativas: rII.motivos,
      observacoes: [
        'Processo simplificado via autodeclaração — vistoria do CBMSC após início do funcionamento',
        ...observacoes
      ]
    };
  }

  // Risco III (Quadros 2 e 3)
  const rIII = ehRiscoIII(input);
  if (rIII.eh) {
    return {
      risco: 'III',
      tipo_processo: 'SIMPLIFICADO_PREVIA',
      justificativas: rIII.motivos,
      observacoes: [
        'Processo simplificado com prévia regularização — apresentação de PPCI antes do funcionamento',
        ...observacoes
      ]
    };
  }

  // Caiu para Risco IV
  return {
    risco: 'IV',
    tipo_processo: 'ORDINARIO',
    justificativas: [
      `Edificação ${input.divisao} com ${input.area_m2} m² e ${input.altura_m} m não se enquadra nos quadros simplificados da IN 01 PT 01`
    ],
    observacoes: [
      'Processo ordinário — exige PPCI completo com projeto técnico do CBMSC',
      ...observacoes
    ]
  };
}

// =====================================================================
// SMSCI pela IN 01 PT 02 - Tabela 2 e tabelas 3-30
// =====================================================================

type StatusObs = { status: StatusMedida; observacao?: string };
function E(observacao?: string): StatusObs { return { status: 'EXIGIDO', observacao }; }
function C(observacao?: string): StatusObs { return { status: 'CONDICIONAL', observacao }; }
function N(): StatusObs { return { status: 'NAO_SE_APLICA' }; }

// Tabela 2 da IN 01 PT 02 - imoveis com area <= 750 m2 E altura <= 12 m
function medidasTabela2(
  divisao: string,
  area: number,
  altura: number,
  populacao: number | null | undefined
): Record<string, StatusObs> {
  const grupo = divisao[0] || '';
  const t: Record<string, StatusObs> = {};

  // Sistemas universais nesta faixa
  t['Extintores'] = E('IN 06 — exigido em todas as ocupações (vital)');
  t['Gás combustível'] = E('IN 08 — exigido em todas as ocupações');
  t['Saídas de emergência'] = E('IN 09 — exigido em todas as ocupações');
  t['Sinalização de emergência'] = E('IN 13');

  // Hidraulico preventivo: somente edif. com 4+ pavimentos (nota 6)
  t['Hidrante e mangotinhos'] = C('IN 07 — exigido para edificações com 4 pavimentos ou mais (reservatório a partir de 2.000 L)');

  // Brigada: x¹ exceto A-1, A-2 e J-1 (nota 1)
  if (divisao === 'A-1' || divisao === 'A-2' || divisao === 'J-1') {
    t['Brigada de incêndio'] = C('IN 28 — recomenda-se capacitação EaD do CBMSC; brigadistas não exigidos para A-1, A-2 e J-1');
  } else {
    t['Brigada de incêndio'] = E('IN 28 — brigadistas orgânicos conforme população fixa');
  }

  // Iluminacao de emergencia: exigida em todas, com nota 7 para alguns grupos
  t['Iluminação de emergência'] = E('IN 11 — vital');

  // Instalacoes eletricas (IN 19): nota 2 - exigido para imoveis >= 200 m2
  // Para o nosso mapeamento, vamos colocar como condicional/exigido conforme area
  if (area >= 200) {
    t['Controle de materiais de acabamento'] = grupo === 'F' || grupo === 'L' ? E('IN 18') : N();
  } else {
    t['Controle de materiais de acabamento'] = N();
  }

  // Acesso de viaturas - exigido sempre (IN 35)
  t['Acesso de viatura na edificação'] = E('IN 35');

  // Proteção estrutural (TRRF) - normalmente nao exigido na Tabela 2
  // Exceto F-6 (nota 8)
  if (divisao === 'F-6') {
    t['Segurança estrutural contra incêndio'] = E('IN 14 — TRRF exigido para F-6');
  } else {
    t['Segurança estrutural contra incêndio'] = N();
  }

  // Detecção: nota 5 - somente em quartos de B (hospedagem)
  if (grupo === 'B') {
    t['Detecção de incêndio'] = C('IN 12 — detectores nos quartos (admitem-se detectores autônomos)');
  } else {
    t['Detecção de incêndio'] = N();
  }

  // Plano de emergencia: para F-11 e H (nota nao explicita, mas tabela 2)
  if (divisao === 'F-11' || grupo === 'H') {
    t['Plano de emergência'] = C('IN 31 — exigido conforme ocupação e lotação');
  } else {
    t['Plano de emergência'] = N();
  }

  // Controle de fumaça: nota 4 - lotação >= 500 em F-11 sem janelas
  if (divisao === 'F-11' && (populacao ?? 0) >= 500) {
    t['Controle de fumaça'] = C('IN 10 — exigido para lotação ≥ 500 em edificação sem janelas (pode ser substituído por sprinklers de resposta rápida)');
  } else {
    t['Controle de fumaça'] = N();
  }

  // Compartimentacao e chuveiros automaticos: nao exigidos na Tabela 2
  t['Compartimentação horizontal (áreas)'] = N();
  t['Compartimentação vertical'] = N();
  t['Chuveiros automáticos'] = N();
  t['Elevador de emergência'] = N();
  t['Alarme de incêndio'] = N();

  return t;
}

// Tabelas 3-30: imoveis com area >= 750 m2 OU altura >= 12 m
// Implementacao consolidada baseada em padroes recorrentes das tabelas:
// - sistemas universais (extintores, gas, hidraulico, iluminacao, saidas,
//   sinalizacao, brigada, alarme, instalacao eletrica, controle materiais,
//   proteção estrutural, acesso viaturas, detecção automatica)
// - chuveiros, compartimentacao, controle fumaca, elevador emergencia,
//   plano emergencia conforme altura.
function medidasTabelasGrupoGrande(
  divisao: string,
  area: number,
  altura: number,
  populacao: number | null | undefined
): Record<string, StatusObs> {
  const grupo = divisao[0] || '';
  const t: Record<string, StatusObs> = {};

  // Universais para >=750m2 ou >=12m
  t['Acesso de viatura na edificação'] = E('IN 35');
  t['Alarme de incêndio'] = E('IN 12');
  t['Extintores'] = E('IN 06 — vital');
  t['Gás combustível'] = E('IN 08');
  t['Hidrante e mangotinhos'] = E('IN 07 — sistema hidráulico preventivo');
  t['Iluminação de emergência'] = E('IN 11 — vital');
  t['Saídas de emergência'] = E('IN 09');
  t['Sinalização de emergência'] = E('IN 13 — vital');
  t['Segurança estrutural contra incêndio'] = E('IN 14 — TRRF');
  t['Brigada de incêndio'] = E('IN 28 — brigadistas orgânicos por população fixa');
  t['Controle de materiais de acabamento'] = grupo === 'A' && altura <= 12
    ? C('IN 18 — para A: somente em altura > 12 m, áreas comuns')
    : E('IN 18');

  // Detecção automatica de incendio (IN 12)
  if (grupo === 'B' || grupo === 'F') {
    t['Detecção de incêndio'] = E('IN 12 — exigido em todos os ambientes (exceto banheiros e locais de carga desprezível)');
  } else if (altura >= 40) {
    t['Detecção de incêndio'] = E('IN 12 — exigido para edificações com altura ≥ 40 m');
  } else {
    t['Detecção de incêndio'] = C('IN 12 — conforme carga de incêndio e tipo de ocupação');
  }

  // Compartimentacao horizontal
  if (grupo === 'B' || divisao.startsWith('F-11') || divisao === 'G-4') {
    t['Compartimentação horizontal (áreas)'] = altura > 6
      ? E('IN 14')
      : C('IN 14 — entre unidades autônomas');
  } else if (altura > 30) {
    t['Compartimentação horizontal (áreas)'] = E('IN 14');
  } else {
    t['Compartimentação horizontal (áreas)'] = N();
  }

  // Compartimentacao vertical
  if (altura > 15) {
    t['Compartimentação vertical'] = E('IN 14 — exigida para edificações altas');
  } else if (altura > 12) {
    t['Compartimentação vertical'] = C('IN 14 — conforme grupo de ocupação');
  } else {
    t['Compartimentação vertical'] = N();
  }

  // Chuveiros automaticos
  if (altura > 30) {
    t['Chuveiros automáticos'] = E('IN 15 — exigido para edificações > 30 m');
  } else if (divisao === 'F-4' && area >= 10000) {
    t['Chuveiros automáticos'] = E('IN 15 — F-4 com área ≥ 10.000 m²');
  } else if (divisao === 'F-11' && (populacao ?? 0) >= 3000) {
    t['Chuveiros automáticos'] = E('IN 15 — F-11 com lotação ≥ 3.000 pessoas');
  } else {
    t['Chuveiros automáticos'] = N();
  }

  // Controle de fumaça
  if (altura > 30) {
    t['Controle de fumaça'] = E('IN 10 — exigido para edificações altas, átrios e rotas de fuga');
  } else if (divisao === 'F-11' && (populacao ?? 0) >= 500) {
    t['Controle de fumaça'] = C('IN 10 — lotação acima de 500 pessoas');
  } else {
    t['Controle de fumaça'] = N();
  }

  // Elevador de emergencia
  if (altura >= 60) {
    t['Elevador de emergência'] = E('IN 09 — exigido para edificações ≥ 60 m');
  } else if (divisao.startsWith('F') && altura >= 40) {
    t['Elevador de emergência'] = E('IN 09 — F com altura ≥ 40 m');
  } else {
    t['Elevador de emergência'] = N();
  }

  // Plano de emergencia
  if (altura > 30 || grupo === 'B' || grupo === 'F' || grupo === 'H') {
    t['Plano de emergência'] = altura > 30
      ? E('IN 31')
      : C('IN 31 — conforme lotação (F-4 ≥ 1000 pessoas; F-11 ≥ 500 pessoas)');
  } else {
    t['Plano de emergência'] = N();
  }

  return t;
}

export function medidasSCParaImovel(
  divisao: string,
  area_m2: number,
  altura_m: number,
  populacao: number | null | undefined = null
): { medidas: MedidaCSCIP[]; simplificada: boolean } {
  if (!divisao || divisao.length === 0) {
    return { medidas: [], simplificada: false };
  }

  // Tabela 2: area <= 750 E altura <= 12
  const usaTabela2 = area_m2 <= 750 && altura_m <= 12;
  const t = usaTabela2
    ? medidasTabela2(divisao, area_m2, altura_m, populacao)
    : medidasTabelasGrupoGrande(divisao, area_m2, altura_m, populacao);

  const medidas: MedidaCSCIP[] = TODAS_MEDIDAS.map((nome) => {
    const ent = t[nome] ?? { status: 'NAO_SE_APLICA' as StatusMedida };
    return { nome, status: ent.status, observacao: ent.observacao };
  });

  return { medidas, simplificada: usaTabela2 };
}
