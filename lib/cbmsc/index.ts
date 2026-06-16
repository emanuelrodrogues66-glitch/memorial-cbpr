// Indice de modulos CBMSC — Santa Catarina.
// Conjunto de Instrucoes Normativas (IN) do Corpo de Bombeiros Militar
// de Santa Catarina (CBMSC), vigentes desde 24/04/2024.
//
// Cobertura desta integracao:
//   IN 01 — Procedimentos administrativos e classificacao de risco do imovel.
//   IN 03 — Carga de incendio.
//   IN 09 — Saidas de emergencia (Anexo B Tabela 7 + Anexo C Tabela 8).
//   IN 11 — Sistema de iluminacao de emergencia.
//   IN 28 — Brigada de incendio (Anexo A Tabela 3).

export { DATA_SAIDAS_IN09 } from './saidas-in09';
export {
  REGRAS_BRIGADA_SC,
  calcularBrigadaSC,
  type ResultadoBrigadaSC,
  type NivelTreinamento
} from './brigada-in28';
export {
  dimensionarIluminacaoSC,
  type ResultadoIluminacaoSC
} from './iluminacao-in11';
export {
  classificarCargaSC,
  descreverClasseCargaSC,
  type ClasseCargaIncendioSC
} from './carga-in03';

export type UF = 'PR' | 'SC';

// Rotulo da norma de saidas conforme UF
export function rotuloNormaSaidas(uf: UF): string {
  return uf === 'SC' ? 'IN 09 do CBMSC' : 'NPT 011 do CBMPR';
}

export function rotuloNormaBrigada(uf: UF): string {
  return uf === 'SC' ? 'IN 28 do CBMSC' : 'NPT 017 do CBMPR';
}

export function rotuloNormaIluminacao(uf: UF): string {
  return uf === 'SC' ? 'IN 11 do CBMSC' : 'NPT 018 do CBMPR';
}

export function rotuloNormaCarga(uf: UF): string {
  return uf === 'SC' ? 'IN 03 do CBMSC' : 'NPT 014 do CBMPR';
}

export function rotuloCBM(uf: UF): string {
  return uf === 'SC'
    ? 'Corpo de Bombeiros Militar de Santa Catarina (CBMSC)'
    : 'Corpo de Bombeiros Militar do Paraná (CBMPR)';
}

// Rotulo do conjunto normativo geral (PR usa CSCIP; SC usa as INs)
export function rotuloConjuntoNormativo(uf: UF): string {
  return uf === 'SC'
    ? 'Instruções Normativas (IN) do CBMSC'
    : 'CSCIP-CBMPR';
}

// Sigla curta usada em títulos
export function siglaCBM(uf: UF): string {
  return uf === 'SC' ? 'CBMSC' : 'CBMPR';
}

// Rotulo de UF por extenso
export function ufExtenso(uf: UF): string {
  return uf === 'SC' ? 'Santa Catarina' : 'Paraná';
}

// Sigla do projeto tecnico de prevencao contra incendio
// PR: PSCIP (Projeto de Sistema Contra Incendio e Panico)
// SC: PPCI (Projeto de Prevencao Contra Incendio)
export function siglaProjeto(uf: UF): string {
  return uf === 'SC' ? 'PPCI' : 'PSCIP';
}

// Nome completo do projeto tecnico
export function nomeProjeto(uf: UF): string {
  return uf === 'SC'
    ? 'Projeto de Prevenção Contra Incêndio (PPCI)'
    : 'Projeto de Sistema Contra Incêndio e Pânico (PSCIP)';
}

// ============================================================================
// Mapeamento completo NPT (CBMPR) <-> IN (CBMSC)
// Fonte: https://portal.cbm.sc.gov.br/index.php/sci/instrucoes-normativas
// ============================================================================
//
// PR (NPT)                        | SC (IN)
// --------------------------------|----------------------------------------
// NPT 001 Procedimentos Adm.      | IN 01 Procedimentos Administrativos
// NPT 002 Termos e definicoes     | IN 01 (Parte 2)
// NPT 003 Terminologia            | IN 01 (Parte 2)
// NPT 004 Símbolos gráficos       | IN 21 Símbolos gráficos para PPCI
// NPT 005 Urbanística/classif.    | IN 01 (Parte 1)
// NPT 006 Acesso de viaturas      | IN 35 Acesso de viaturas
// NPT 007 Separação entre edif.   | IN 14 (compartimentação/isolamento)
// NPT 008 Segurança estrutural    | IN 14 (TRRF/compartimentação)
// NPT 009 Compartimentação        | IN 14
// NPT 010 Materiais acabamento    | IN 18 Controle de materiais
// NPT 011 Saídas de emergência    | IN 09 Sistema de saída de emergência
// NPT 012 Centros esportivos     | IN 24 / IN 1-P2
// NPT 013 Press./escada           | IN 09 (anexos)
// NPT 014 Carga de incêndio       | IN 03 Carga de incêndio
// NPT 015 Controle de fumaça      | IN 10 Controle de fumaça
// NPT 016 Plano de emergência     | IN 31 Plano de emergência
// NPT 017 Brigada de incêndio     | IN 28 Brigada de incêndio
// NPT 018 Iluminação emergência    | IN 11 Sistema de iluminação de emergência
// NPT 019 Detecção e alarme       | IN 12 Detecção e alarme de incêndio
// NPT 020 Sinalização emergência   | IN 13 Sinalização para abandono de local
// NPT 021 Extintores             | IN 06 Sistema preventivo por extintores
// NPT 022 Hidrantes/mangotinhos   | IN 07 Sistema hidráulico preventivo
// NPT 023 Chuveiros automáticos   | IN 15 Sistema de chuveiros automáticos (sprinklers)
// NPT 024 Sistema fixo CO2/gases | IN 16 Gases limpos e CO2
// NPT 025 Água nebulizada         | IN 17 Água nebulizada (mulsifyre)
// NPT 026 Sist. fixo espuma       | IN 1-P2 (Art. 15)
// NPT 027 GLP                     | IN 08 Inst. de gás combustível / IN 29
// NPT 028 Manutenção              | IN 04 Manutenção dos sistemas preventivos
// NPT 029 Comercialização GLP    | IN 29 Comercialização de gás
// NPT 030 Fogos/explosivos       | IN 30 Fogos de artifícios, explosivos
// NPT 031 Caldeiras/vasos       | IN 32 Caldeiras e vasos de pressão
// NPT 032 Líquidos inflam.       | IN 20 Uso e armaz. de líquidos inflamáveis
// NPT 033 Eventos temporários     | IN 24 Eventos temporários
// NPT 034 Liberdade restringida   | IN 26 Locais onde a liberdade das pessoas sofre restrições
// NPT 035 Pátio de contêineres   | IN 22 Pátio de contêineres
// NPT 036 Edif. existentes       | IN 05 Edificações existentes e recentes
// NPT 037 Inst. elétricas         | IN 19 Instalações elétricas de baixa tensão
// NPT 038 Piscinas/lazer         | IN 33 Piscinas e áreas recreativas
// NPT 039 Estufas/silos          | IN 34 Estufas de secagem e silos
// NPT 040 Rede púb. hidrantes     | IN 25 Rede pública de hidrantes
// NPT 041 Espetáculos pirotéc.    | IN 27 Espetáculos pirotécnicos
//
// ============================================================================

// Mapa NPT (PR) -> rótulo da IN equivalente (SC)
// Chave: numero NPT em string ("005", "011", "017", etc) ou alias
const MAPA_NPT_PARA_IN: Record<string, string> = {
  '001': 'IN 01',
  '002': 'IN 01',
  '003': 'IN 01',
  '004': 'IN 21',
  '005': 'IN 01',
  '006': 'IN 35',
  '007': 'IN 14',
  '008': 'IN 14',
  '009': 'IN 14',
  '010': 'IN 18',
  '011': 'IN 09',
  '012': 'IN 24',
  '013': 'IN 09',
  '014': 'IN 03',
  '015': 'IN 10',
  '016': 'IN 31',
  '017': 'IN 28',
  '018': 'IN 11',
  '019': 'IN 12',
  '020': 'IN 13',
  '021': 'IN 06',
  '022': 'IN 07',
  '023': 'IN 15',
  '024': 'IN 16',
  '025': 'IN 17',
  '026': 'IN 01',
  '027': 'IN 08',
  '028': 'IN 04',
  '029': 'IN 29',
  '030': 'IN 30',
  '031': 'IN 32',
  '032': 'IN 20',
  '033': 'IN 24',
  '034': 'IN 26',
  '035': 'IN 22',
  '036': 'IN 05',
  '037': 'IN 19',
  '038': 'IN 33',
  '039': 'IN 34',
  '040': 'IN 25',
  '041': 'IN 27'
};

// Retorna o numero do CBMSC equivalente a uma NPT (apenas a sigla "IN XX")
export function npt2in(numeroNpt: string | number): string {
  const k = String(numeroNpt).padStart(3, '0');
  return MAPA_NPT_PARA_IN[k] || `IN equivalente à NPT ${k}`;
}

// Retorna o rótulo da norma aplicável conforme UF.
// Ex.: norma(uf, '011') => "NPT 011 do CBMPR" se uf=PR, "IN 09 do CBMSC" se uf=SC.
export function norma(uf: UF, numeroNpt: string | number): string {
  const npt = String(numeroNpt).padStart(3, '0');
  if (uf === 'SC') return `${npt2in(npt)} do CBMSC`;
  return `NPT ${npt} do CBMPR`;
}

// Sigla curta (sem "do CBMxx"). Ex.: nptOuIn(uf, '011') => "NPT 011" ou "IN 09".
export function nptOuIn(uf: UF, numeroNpt: string | number): string {
  const npt = String(numeroNpt).padStart(3, '0');
  if (uf === 'SC') return npt2in(npt);
  return `NPT ${npt}`;
}

// Cita item normativo respeitando UF. Quando SC, omite a referência ao item
// específico da NPT (que não se aplica) e cita apenas a IN equivalente.
// Ex.: itemNorma(uf, '011', '5.4') => "item 5.4 da NPT 011" ou "IN 09".
export function itemNorma(uf: UF, numeroNpt: string | number, item: string): string {
  if (uf === 'SC') return nptOuIn(uf, numeroNpt);
  return `item ${item} da NPT ${String(numeroNpt).padStart(3, '0')}`;
}
