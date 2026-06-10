// Tabela 2 — Anexo B da NPT 011 (Distâncias máximas a serem percorridas)
// Valores em metros.

export type FaixaTabela2 =
  | 'AB'           // A, B
  | 'CDEFGHLM'     // C, D, E (G), F (G), G-2 (F), G-3, G-4, G-5, H (G), L, M
  | 'I1J1'         // I-1, J-1
  | 'G1J2'         // G-1 (F), J-2
  | 'I2I3J3J4';    // I-2, I-3, J-3, J-4

export type AndarTipo = 'descarga' | 'demais';

export type DistanciaCenario = {
  sem_sprinkler: { sem_deteccao: number; com_deteccao: number };
  com_sprinkler: { sem_deteccao: number; com_deteccao: number };
};

type LinhaTabela = {
  saida_unica: { descarga: DistanciaCenario; demais: DistanciaCenario };
  mais_de_uma: { descarga: DistanciaCenario; demais: DistanciaCenario };
};

export const TABELA_2_NPT_011: Record<FaixaTabela2, LinhaTabela> = {
  AB: {
    saida_unica: {
      descarga: {
        sem_sprinkler: { sem_deteccao: 45, com_deteccao: 55 },
        com_sprinkler: { sem_deteccao: 60, com_deteccao: 70 },
      },
      demais: {
        sem_sprinkler: { sem_deteccao: 40, com_deteccao: 45 },
        com_sprinkler: { sem_deteccao: 55, com_deteccao: 65 },
      },
    },
    mais_de_uma: {
      descarga: {
        sem_sprinkler: { sem_deteccao: 55, com_deteccao: 65 },
        com_sprinkler: { sem_deteccao: 80, com_deteccao: 95 },
      },
      demais: {
        sem_sprinkler: { sem_deteccao: 50, com_deteccao: 60 },
        com_sprinkler: { sem_deteccao: 75, com_deteccao: 90 },
      },
    },
  },
  CDEFGHLM: {
    saida_unica: {
      descarga: {
        sem_sprinkler: { sem_deteccao: 40, com_deteccao: 45 },
        com_sprinkler: { sem_deteccao: 55, com_deteccao: 65 },
      },
      demais: {
        sem_sprinkler: { sem_deteccao: 30, com_deteccao: 35 },
        com_sprinkler: { sem_deteccao: 45, com_deteccao: 55 },
      },
    },
    mais_de_uma: {
      descarga: {
        sem_sprinkler: { sem_deteccao: 50, com_deteccao: 60 },
        com_sprinkler: { sem_deteccao: 75, com_deteccao: 90 },
      },
      demais: {
        sem_sprinkler: { sem_deteccao: 40, com_deteccao: 45 },
        com_sprinkler: { sem_deteccao: 65, com_deteccao: 75 },
      },
    },
  },
  I1J1: {
    saida_unica: {
      descarga: {
        sem_sprinkler: { sem_deteccao: 80, com_deteccao: 95 },
        com_sprinkler: { sem_deteccao: 100, com_deteccao: 130 },
      },
      demais: {
        sem_sprinkler: { sem_deteccao: 70, com_deteccao: 80 },
        com_sprinkler: { sem_deteccao: 100, com_deteccao: 115 },
      },
    },
    mais_de_uma: {
      descarga: {
        sem_sprinkler: { sem_deteccao: 120, com_deteccao: 140 },
        com_sprinkler: { sem_deteccao: 180, com_deteccao: 210 },
      },
      demais: {
        sem_sprinkler: { sem_deteccao: 100, com_deteccao: 130 },
        com_sprinkler: { sem_deteccao: 160, com_deteccao: 200 },
      },
    },
  },
  G1J2: {
    saida_unica: {
      descarga: {
        sem_sprinkler: { sem_deteccao: 50, com_deteccao: 60 },
        com_sprinkler: { sem_deteccao: 80, com_deteccao: 95 },
      },
      demais: {
        sem_sprinkler: { sem_deteccao: 40, com_deteccao: 45 },
        com_sprinkler: { sem_deteccao: 70, com_deteccao: 80 },
      },
    },
    mais_de_uma: {
      descarga: {
        sem_sprinkler: { sem_deteccao: 60, com_deteccao: 70 },
        com_sprinkler: { sem_deteccao: 120, com_deteccao: 140 },
      },
      demais: {
        sem_sprinkler: { sem_deteccao: 50, com_deteccao: 60 },
        com_sprinkler: { sem_deteccao: 110, com_deteccao: 130 },
      },
    },
  },
  I2I3J3J4: {
    saida_unica: {
      descarga: {
        sem_sprinkler: { sem_deteccao: 40, com_deteccao: 45 },
        com_sprinkler: { sem_deteccao: 60, com_deteccao: 70 },
      },
      demais: {
        sem_sprinkler: { sem_deteccao: 30, com_deteccao: 35 },
        com_sprinkler: { sem_deteccao: 50, com_deteccao: 65 },
      },
    },
    mais_de_uma: {
      descarga: {
        sem_sprinkler: { sem_deteccao: 50, com_deteccao: 60 },
        com_sprinkler: { sem_deteccao: 100, com_deteccao: 120 },
      },
      demais: {
        sem_sprinkler: { sem_deteccao: 40, com_deteccao: 45 },
        com_sprinkler: { sem_deteccao: 80, com_deteccao: 95 },
      },
    },
  },
};

// Auto-detecção da faixa pela divisão CSCIP
export function faixaDaDivisao(divisao: string): FaixaTabela2 {
  const d = (divisao || '').toUpperCase().trim();
  if (d.startsWith('A') || d.startsWith('B')) return 'AB';
  if (d === 'I-1' || d === 'J-1') return 'I1J1';
  if (d === 'G-1' || d === 'J-2') return 'G1J2';
  if (d === 'I-2' || d === 'I-3' || d === 'J-3' || d === 'J-4') return 'I2I3J3J4';
  // C, D, E, F, G-2..G-5, H, L, M
  return 'CDEFGHLM';
}

export const ROTULO_FAIXA: Record<FaixaTabela2, string> = {
  AB: 'A, B',
  CDEFGHLM: 'C, D, E, F, G-2 a G-5, H, L, M',
  I1J1: 'I-1, J-1',
  G1J2: 'G-1, J-2',
  I2I3J3J4: 'I-2, I-3, J-3, J-4',
};

export type CenarioCaminhamento = {
  divisao_principal: string;
  faixa: FaixaTabela2;
  rotulo_faixa: string;
  com_sprinkler: boolean;
  com_deteccao_fumaca: boolean;
  leiaute_apresentado: boolean;
  // Distâncias finais (já com redução de 30% aplicada quando leiaute=false)
  descarga_uma: number;
  descarga_mais: number;
  demais_uma: number;
  demais_mais: number;
  // Brutas (antes da redução), para o texto
  brutas: {
    descarga_uma: number;
    descarga_mais: number;
    demais_uma: number;
    demais_mais: number;
  };
};

// Reduz 30% quando o leiaute não foi apresentado (NOTA B + Tabela 2A)
function aplicar(dist: number, leiaute: boolean): number {
  return leiaute ? dist : Math.round(dist * 0.7);
}

export function calcularCaminhamento(input: {
  divisao_principal: string;
  com_sprinkler: boolean;
  com_deteccao_fumaca: boolean;
  leiaute_apresentado: boolean;
}): CenarioCaminhamento {
  const faixa = faixaDaDivisao(input.divisao_principal);
  const linha = TABELA_2_NPT_011[faixa];

  const pegar = (
    bloco: { descarga: DistanciaCenario; demais: DistanciaCenario },
    andar: AndarTipo
  ) => {
    const c = bloco[andar];
    const grp = input.com_sprinkler ? c.com_sprinkler : c.sem_sprinkler;
    return input.com_deteccao_fumaca ? grp.com_deteccao : grp.sem_deteccao;
  };

  const brutas = {
    descarga_uma: pegar(linha.saida_unica, 'descarga'),
    descarga_mais: pegar(linha.mais_de_uma, 'descarga'),
    demais_uma: pegar(linha.saida_unica, 'demais'),
    demais_mais: pegar(linha.mais_de_uma, 'demais'),
  };

  return {
    divisao_principal: input.divisao_principal,
    faixa,
    rotulo_faixa: ROTULO_FAIXA[faixa],
    com_sprinkler: input.com_sprinkler,
    com_deteccao_fumaca: input.com_deteccao_fumaca,
    leiaute_apresentado: input.leiaute_apresentado,
    descarga_uma: aplicar(brutas.descarga_uma, input.leiaute_apresentado),
    descarga_mais: aplicar(brutas.descarga_mais, input.leiaute_apresentado),
    demais_uma: aplicar(brutas.demais_uma, input.leiaute_apresentado),
    demais_mais: aplicar(brutas.demais_mais, input.leiaute_apresentado),
    brutas,
  };
}

// Texto pronto para inserir no início do memorial de saídas (estilo do modelo)
export function textoCaminhamento(cen: CenarioCaminhamento): string {
  const partes: string[] = [];
  partes.push(
    `DISTÂNCIA MÁXIMA A SER PERCORRIDA: ${cen.descarga_uma} m para uma saída de emergência ` +
      `e ${cen.descarga_mais} m para duas ou mais saídas de emergência. DEMAIS PAVIMENTOS: ` +
      `${cen.demais_uma} m para uma saída de emergência e ${cen.demais_mais} m para duas ou ` +
      `mais saídas de emergência, conforme Tabela 2 da NPT 011`
  );
  const obs: string[] = [];
  if (!cen.leiaute_apresentado) {
    obs.push('foi reduzido 30% do caminhamento pois não foi apresentado o layout');
  }
  if (cen.com_sprinkler) obs.push('considerada a presença de chuveiros automáticos');
  if (cen.com_deteccao_fumaca) obs.push('considerada a presença de detecção automática de fumaça');
  if (obs.length) partes[0] = `${partes[0]}; ${obs.join(', ')}.`;
  else partes[0] = `${partes[0]}.`;
  return partes[0];
}
