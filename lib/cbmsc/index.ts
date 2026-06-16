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
