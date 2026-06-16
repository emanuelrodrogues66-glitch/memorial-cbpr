// Dimensionamento de saidas de emergencia — IN 09 / CBMSC (Santa Catarina)
// Fonte: Instrucao Normativa 09 do CBMSC, Anexo B (Tabela 7) — vigente desde 24/04/2024.
//
// Conceitos (mesma matematica da NPT 011 do PR, com coeficientes diferentes):
// - Populacao por ambiente = (area util - excluir) * coef da divisao
// - Unidade de Passagem (UP) = 0,55 m (IN 09 art. 18)
// - N (no de UPs) = ceil( Populacao / Capacidade C )       (IN 09 art. 17)
// - L (largura) = 0,55 . N                                  (IN 09 art. 18)
// - Largura minima horizontal: 1,20 m geral / 1,65 m H-2 / 2,20 m H-3 (art. 19)
// - Largura minima vertical:   1,20 m geral / 1,65 m H-2 e H-3         (art. 20)

import type { DivCsicipSaida } from '../saidas-npt011';

// Tabela 7 do Anexo B da IN 09 — capacidades por divisao CSCIP
// Coeficientes: pessoas por m² (1 / densidade).
export const DATA_SAIDAS_IN09: Record<string, DivCsicipSaida> = {
  // A — Residencial
  'A-1': { pop: '2 por dormitorio', coef: null, acc: 60, esc: 45, port: 100, special: 'dorm' },
  'A-2': { pop: '2 por dormitorio', coef: null, acc: 60, esc: 45, port: 100, special: 'dorm' },
  'A-3': { pop: '1 por 4 m² (alojamento)', coef: 1 / 4, acc: 60, esc: 45, port: 100 },

  // B — Hospedagem (IN 09: 1 por 4 m² em alojamento; aqui usamos a forma alojamento como fallback)
  'B-1': { pop: '1 por 4 m² (alojamento)', coef: 1 / 4, acc: 60, esc: 45, port: 100 },
  'B-2': { pop: '1 por 4 m² (alojamento)', coef: 1 / 4, acc: 60, esc: 45, port: 100 },

  // C — Comercial
  'C-1': { pop: '1 por 7 m²', coef: 1 / 7, acc: 100, esc: 75, port: 100 },
  'C-2': { pop: '1 por 7 m²', coef: 1 / 7, acc: 100, esc: 75, port: 100 },
  'C-3': { pop: '1 por 5 m²', coef: 1 / 5, acc: 100, esc: 75, port: 100 },

  // D — Servico profissional
  'D-1': { pop: '1 por 7 m²', coef: 1 / 7, acc: 100, esc: 60, port: 100 },
  'D-2': { pop: '1 por 7 m²', coef: 1 / 7, acc: 100, esc: 60, port: 100 },
  'D-3': { pop: '1 por 7 m²', coef: 1 / 7, acc: 100, esc: 60, port: 100 },
  'D-4': { pop: '1 por 7 m²', coef: 1 / 7, acc: 100, esc: 60, port: 100 },

  // E — Educacional
  'E-1': { pop: '1 por 1,5 m² (sala de aula)', coef: 1 / 1.5, acc: 100, esc: 60, port: 100 },
  'E-2': { pop: '1 por 2 m² (sala de aula)', coef: 1 / 2, acc: 100, esc: 60, port: 100 },
  'E-3': { pop: '1 por 2 m² (sala/espaco)', coef: 1 / 2, acc: 100, esc: 60, port: 100 },
  'E-4': { pop: '1 por 2 m² (sala de aula)', coef: 1 / 2, acc: 100, esc: 60, port: 100 },
  'E-5': { pop: '1 por 1,5 m² (sala de aula)', coef: 1 / 1.5, acc: 30, esc: 22, port: 30 },
  'E-6': { pop: '1 por 1,5 m² (sala de aula)', coef: 1 / 1.5, acc: 30, esc: 22, port: 30 },

  // F — Reuniao de publico
  'F-1': { pop: '1 por 3 m²', coef: 1 / 3, acc: 100, esc: 75, port: 100 },
  'F-2': { pop: '1 por 1 m² (sem assentos)', coef: 1, acc: 100, esc: 75, port: 100 },
  'F-3': { pop: '2 por 1 m² (publico)', coef: 2, acc: 100, esc: 75, port: 100 },
  'F-4': { pop: '1 por 3 m²', coef: 1 / 3, acc: 100, esc: 75, port: 100 },
  'F-5': { pop: '1 por 1 m² (sem assentos)', coef: 1, acc: 100, esc: 75, port: 100 },
  'F-6': { pop: '2 por 1 m² (publico)', coef: 2, acc: 100, esc: 75, port: 100 },
  'F-7': { pop: '2 por 1 m² (publico)', coef: 2, acc: 100, esc: 75, port: 100 },
  'F-8': { pop: '1 por 1 m² (sem assentos)', coef: 1, acc: 100, esc: 75, port: 100 },
  'F-9': { pop: '1 por 1 m² (publico)', coef: 1, acc: 100, esc: 75, port: 100 },
  'F-10': { pop: '1 por 1 m² (publico)', coef: 1, acc: 100, esc: 75, port: 100 },
  'F-11': { pop: '3 por 1 m² (publico)', coef: 3, acc: 100, esc: 75, port: 100 },

  // G — Automotivo
  'G-1': { pop: '1 por 40 vagas', coef: null, acc: 100, esc: 60, port: 100, special: 'vagas' },
  'G-2': { pop: '1 por 40 vagas', coef: null, acc: 100, esc: 60, port: 100, special: 'vagas' },
  'G-3': { pop: '1 por 40 vagas', coef: null, acc: 100, esc: 60, port: 100, special: 'vagas' },
  'G-4': { pop: '1 por 20 m²', coef: 1 / 20, acc: 100, esc: 60, port: 100 },
  'G-5': { pop: '1 por 20 m²', coef: 1 / 20, acc: 100, esc: 60, port: 100 },

  // H — Saude / institucional
  'H-1': { pop: '1 por 7 m²', coef: 1 / 7, acc: 100, esc: 60, port: 100 },
  'H-2': { pop: '1 por 4 m² (alojamento)', coef: 1 / 4, acc: 30, esc: 22, port: 30 },
  'H-3': { pop: '1,5 por leito + 1/7 m² (amb.)', coef: 1 / 7, acc: 30, esc: 22, port: 30 },
  'H-4': { pop: '1 por 7 m²', coef: 1 / 7, acc: 60, esc: 45, port: 100 },
  'H-5': { pop: '1 por 7 m²', coef: 1 / 7, acc: 60, esc: 45, port: 100 },
  'H-6': { pop: '1 por 7 m²', coef: 1 / 7, acc: 100, esc: 60, port: 100 },

  // I — Industrial
  'I-1': { pop: '1 por 10 m²', coef: 1 / 10, acc: 100, esc: 60, port: 100 },
  'I-2': { pop: '1 por 10 m²', coef: 1 / 10, acc: 100, esc: 60, port: 100 },
  'I-3': { pop: '1 por 10 m²', coef: 1 / 10, acc: 100, esc: 60, port: 100 },

  // J — Deposito
  'J-1': { pop: '1 por 30 m²', coef: 1 / 30, acc: 100, esc: 60, port: 100 },
  'J-2': { pop: '1 por 30 m²', coef: 1 / 30, acc: 100, esc: 60, port: 100 },
  'J-3': { pop: '1 por 30 m²', coef: 1 / 30, acc: 100, esc: 60, port: 100 },
  'J-4': { pop: '1 por 30 m²', coef: 1 / 30, acc: 100, esc: 60, port: 100 },

  // K — Energia
  'K-1': { pop: '1 por 10 m²', coef: 1 / 10, acc: 100, esc: 60, port: 100 },
  'K-2': { pop: '1 por 7 m²', coef: 1 / 7, acc: 100, esc: 60, port: 100 },

  // L — Explosivos
  'L-1': { pop: '1 por 3 m²', coef: 1 / 3, acc: 100, esc: 60, port: 100 },
  'L-2': { pop: '1 por 10 m²', coef: 1 / 10, acc: 100, esc: 60, port: 100 },
  'L-3': { pop: '1 por 10 m²', coef: 1 / 10, acc: 100, esc: 60, port: 100 },

  // M — Especial
  'M-1': { pop: 'Consultar norma especifica', coef: null, acc: 100, esc: 75, port: 100 },
  'M-2': { pop: '1 por 30 m² (ambientes internos)', coef: 1 / 30, acc: 100, esc: 60, port: 100 },
  'M-3': { pop: '1 por 9 m²', coef: 1 / 9, acc: 100, esc: 60, port: 100 },
  'M-4': { pop: '1 por 7 m²', coef: 1 / 7, acc: 100, esc: 60, port: 100 },
  'M-5': { pop: '1 por 9 m²', coef: 1 / 9, acc: 100, esc: 60, port: 100 },
  'M-6': { pop: 'Consultar norma especifica', coef: null, acc: 100, esc: 75, port: 100 },
  'M-7': { pop: '1 por 30 m² (ambientes internos)', coef: 1 / 30, acc: 100, esc: 60, port: 100 },
  'M-8': { pop: '1 por 30 m² (ambientes internos)', coef: 1 / 30, acc: 100, esc: 60, port: 100 },
  'M-9': { pop: '1 por 30 m² (ambientes internos)', coef: 1 / 30, acc: 100, esc: 60, port: 100 },
  'M-10': { pop: 'Consultar norma especifica', coef: null, acc: 100, esc: 75, port: 100 },
  'M-11': { pop: 'Consultar norma especifica', coef: null, acc: 100, esc: 75, port: 100 }
};
