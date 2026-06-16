// Brigada de incendio — IN 28 / CBMSC (Santa Catarina)
// Fonte: IN 28, Anexo A, Tabela 3 — vigente desde 24/04/2024
//
// Mecanica CBMSC (diferente da NPT 017 do PR):
// - Cada divisao tem GPF (Grupo de Populacao Fixa) e nivel de treinamento.
// - Brigadistas = ceil(populacao_fixa / GPF), respeitando isencao.
// - Se houver chuveiros automaticos (sprinkler), GPF aumenta em 5 (Nota 1).
//
// Niveis de treinamento: B = Basico, I = Intermediario, A = Avancado.
// Misto possivel (ex: I-2 "50% Basico/50% Intermediario").

export type NivelTreinamento = 'Basico' | 'Intermediario' | 'Avancado' | 'Misto';

export type RegraBrigadaSC = {
  divisao: string;
  isencao: number | null; // populacao fixa abaixo da qual e isento
  gpf: number | null; // tamanho do Grupo de Populacao Fixa
  treinamento: NivelTreinamento;
  detalhe?: string; // texto especifico (ex: M-1 por extensao)
  modo?: 'por_gpf' | 'percentual_pop' | 'por_extensao' | 'isento' | 'consultar';
  percentual?: number; // para divisoes que treinam % da pop fixa (ex: L-1, L-2, M-2)
};

export const REGRAS_BRIGADA_SC: Record<string, RegraBrigadaSC> = {
  // A — Residencial: A-1/A-2 nao se aplica (recomenda EaD)
  'A-1': { divisao: 'A-1', isencao: null, gpf: null, treinamento: 'Basico', modo: 'isento', detalhe: 'Nao se aplica — recomenda-se treinamento EaD aos moradores.' },
  'A-2': { divisao: 'A-2', isencao: null, gpf: null, treinamento: 'Basico', modo: 'isento', detalhe: 'Nao se aplica — recomenda-se treinamento EaD aos moradores.' },
  'A-3': { divisao: 'A-3', isencao: 10, gpf: 20, treinamento: 'Basico', modo: 'por_gpf' },

  // B — Hospedagem
  'B-1': { divisao: 'B-1', isencao: 10, gpf: 20, treinamento: 'Intermediario', modo: 'por_gpf' },
  'B-2': { divisao: 'B-2', isencao: 10, gpf: 20, treinamento: 'Basico', modo: 'por_gpf' },

  // C — Comercial
  'C-1': { divisao: 'C-1', isencao: 10, gpf: 20, treinamento: 'Basico', modo: 'por_gpf' },
  'C-2': { divisao: 'C-2', isencao: 10, gpf: 20, treinamento: 'Intermediario', modo: 'por_gpf' },
  'C-3': { divisao: 'C-3', isencao: 10, gpf: 10, treinamento: 'Intermediario', modo: 'por_gpf' },

  // D — Servicos profissionais
  'D-1': { divisao: 'D-1', isencao: 10, gpf: 15, treinamento: 'Basico', modo: 'por_gpf' },
  'D-2': { divisao: 'D-2', isencao: 10, gpf: 15, treinamento: 'Basico', modo: 'por_gpf' },
  'D-3': { divisao: 'D-3', isencao: 10, gpf: 15, treinamento: 'Basico', modo: 'por_gpf' },
  'D-4': { divisao: 'D-4', isencao: 10, gpf: 15, treinamento: 'Basico', modo: 'por_gpf' },

  // E — Educacional
  'E-1': { divisao: 'E-1', isencao: 15, gpf: 20, treinamento: 'Basico', modo: 'por_gpf' },
  'E-2': { divisao: 'E-2', isencao: 15, gpf: 20, treinamento: 'Basico', modo: 'por_gpf' },
  'E-3': { divisao: 'E-3', isencao: 15, gpf: 20, treinamento: 'Basico', modo: 'por_gpf' },
  'E-4': { divisao: 'E-4', isencao: 15, gpf: 20, treinamento: 'Basico', modo: 'por_gpf' },
  'E-5': { divisao: 'E-5', isencao: 15, gpf: 20, treinamento: 'Basico', modo: 'por_gpf' },
  'E-6': { divisao: 'E-6', isencao: 15, gpf: 20, treinamento: 'Basico', modo: 'por_gpf' },

  // F — Reuniao de publico
  'F-1': { divisao: 'F-1', isencao: 10, gpf: 10, treinamento: 'Intermediario', modo: 'por_gpf' },
  'F-2': { divisao: 'F-2', isencao: 15, gpf: 15, treinamento: 'Basico', modo: 'por_gpf' },
  'F-3': { divisao: 'F-3', isencao: 15, gpf: 15, treinamento: 'Basico', modo: 'por_gpf' },
  'F-4': { divisao: 'F-4', isencao: 15, gpf: 15, treinamento: 'Basico', modo: 'por_gpf' },
  'F-5': { divisao: 'F-5', isencao: 10, gpf: 10, treinamento: 'Intermediario', modo: 'por_gpf' },
  'F-6': { divisao: 'F-6', isencao: 10, gpf: 10, treinamento: 'Intermediario', modo: 'por_gpf' },
  'F-7': { divisao: 'F-7', isencao: 5, gpf: 5, treinamento: 'Intermediario', modo: 'por_gpf', detalhe: 'Aplicavel para lotacao superior a 250 pessoas.' },
  'F-8': { divisao: 'F-8', isencao: 10, gpf: 10, treinamento: 'Intermediario', modo: 'por_gpf' },
  'F-9': { divisao: 'F-9', isencao: 15, gpf: 15, treinamento: 'Basico', modo: 'por_gpf' },
  'F-10': { divisao: 'F-10', isencao: 15, gpf: 15, treinamento: 'Basico', modo: 'por_gpf' },
  'F-11': { divisao: 'F-11', isencao: 5, gpf: 5, treinamento: 'Intermediario', modo: 'por_gpf', detalhe: 'Aplicavel para lotacao superior a 250 pessoas.' },

  // G — Automotivo
  'G-1': { divisao: 'G-1', isencao: 15, gpf: 15, treinamento: 'Basico', modo: 'por_gpf' },
  'G-2': { divisao: 'G-2', isencao: 15, gpf: 15, treinamento: 'Basico', modo: 'por_gpf' },
  'G-3': { divisao: 'G-3', isencao: 15, gpf: 15, treinamento: 'Intermediario', modo: 'por_gpf' },
  'G-4': { divisao: 'G-4', isencao: 15, gpf: 15, treinamento: 'Intermediario', modo: 'por_gpf' },
  'G-5': { divisao: 'G-5', isencao: 15, gpf: 15, treinamento: 'Intermediario', modo: 'por_gpf' },

  // H — Saude / institucional
  'H-1': { divisao: 'H-1', isencao: 10, gpf: 20, treinamento: 'Basico', modo: 'por_gpf' },
  'H-2': { divisao: 'H-2', isencao: 5, gpf: 15, treinamento: 'Intermediario', modo: 'por_gpf' },
  'H-3': { divisao: 'H-3', isencao: 5, gpf: 15, treinamento: 'Intermediario', modo: 'por_gpf' },
  'H-4': { divisao: 'H-4', isencao: 10, gpf: 20, treinamento: 'Basico', modo: 'por_gpf' },
  'H-5': { divisao: 'H-5', isencao: 5, gpf: 15, treinamento: 'Intermediario', modo: 'por_gpf' },
  'H-6': { divisao: 'H-6', isencao: 10, gpf: 20, treinamento: 'Basico', modo: 'por_gpf' },

  // I — Industrial
  'I-1': { divisao: 'I-1', isencao: 15, gpf: 25, treinamento: 'Basico', modo: 'por_gpf' },
  'I-2': { divisao: 'I-2', isencao: 10, gpf: 15, treinamento: 'Misto', modo: 'por_gpf', detalhe: '50% Basico / 50% Intermediario.' },
  'I-3': { divisao: 'I-3', isencao: 10, gpf: 10, treinamento: 'Misto', modo: 'por_gpf', detalhe: '75% Intermediario / 25% Avancado.' },

  // J — Deposito
  'J-1': { divisao: 'J-1', isencao: null, gpf: null, treinamento: 'Basico', modo: 'isento', detalhe: 'Isento de brigada.' },
  'J-2': { divisao: 'J-2', isencao: 10, gpf: 25, treinamento: 'Basico', modo: 'por_gpf' },
  'J-3': { divisao: 'J-3', isencao: 5, gpf: 20, treinamento: 'Intermediario', modo: 'por_gpf' },
  'J-4': { divisao: 'J-4', isencao: 5, gpf: 10, treinamento: 'Misto', modo: 'por_gpf', detalhe: '50% Intermediario / 50% Avancado.' },

  // K — Energia
  'K-1': { divisao: 'K-1', isencao: 10, gpf: 10, treinamento: 'Intermediario', modo: 'por_gpf' },
  'K-2': { divisao: 'K-2', isencao: 10, gpf: 10, treinamento: 'Intermediario', modo: 'por_gpf' },

  // L — Explosivos (treina percentual da populacao fixa)
  'L-1': { divisao: 'L-1', isencao: null, gpf: null, treinamento: 'Basico', modo: 'percentual_pop', percentual: 0.5, detalhe: 'Treinar 50% da populacao fixa, nivel Basico.' },
  'L-2': { divisao: 'L-2', isencao: null, gpf: null, treinamento: 'Avancado', modo: 'percentual_pop', percentual: 0.75, detalhe: 'Treinar 75% da populacao fixa, nivel Avancado.' },
  'L-3': { divisao: 'L-3', isencao: null, gpf: null, treinamento: 'Avancado', modo: 'percentual_pop', percentual: 0.75, detalhe: 'Treinar 75% da populacao fixa, nivel Avancado.' },

  // M — Especial
  'M-1': { divisao: 'M-1', isencao: null, gpf: null, treinamento: 'Basico', modo: 'por_extensao', detalhe: 'Por extensao: ate 200 m isento; 200-500 m: 2 Basico; 500-1000 m: 2 Bas+Inter; >1000 m: 2+1 a cada 1000 m Inter.' },
  'M-2': { divisao: 'M-2', isencao: null, gpf: null, treinamento: 'Intermediario', modo: 'percentual_pop', percentual: 0.75, detalhe: 'Treinar 75% da populacao fixa, nivel Intermediario.' },
  'M-3': { divisao: 'M-3', isencao: 5, gpf: 15, treinamento: 'Basico', modo: 'por_gpf' },
  'M-4': { divisao: 'M-4', isencao: null, gpf: null, treinamento: 'Basico', modo: 'isento', detalhe: 'Isento de brigada.' },
  'M-5': { divisao: 'M-5', isencao: 10, gpf: 10, treinamento: 'Intermediario', modo: 'por_gpf' },
  'M-6': { divisao: 'M-6', isencao: 20, gpf: 20, treinamento: 'Basico', modo: 'por_gpf' },
  'M-7': { divisao: 'M-7', isencao: 10, gpf: 10, treinamento: 'Intermediario', modo: 'por_gpf' },
  'M-8': { divisao: 'M-8', isencao: 15, gpf: 15, treinamento: 'Intermediario', modo: 'por_gpf' },
  'M-9': { divisao: 'M-9', isencao: 5, gpf: 10, treinamento: 'Avancado', modo: 'por_gpf' },
  'M-10': { divisao: 'M-10', isencao: 20, gpf: 20, treinamento: 'Basico', modo: 'por_gpf' },
  'M-11': { divisao: 'M-11', isencao: null, gpf: null, treinamento: 'Basico', modo: 'isento', detalhe: 'Isento de brigada.' }
};

export type ResultadoBrigadaSC = {
  brigadistas: number;
  populacao_usada: number;
  treinamento: NivelTreinamento;
  detalhe?: string;
  descricao: string;
  isento: boolean;
};

// Calcula brigada conforme IN 28 do CBMSC.
// populacaoFixa: numero de funcionarios/populacao fixa (Nota b: somente funcionarios contam).
// divisao: codigo CSCIP (ex: 'A-3', 'C-2').
// possuiSprinkler: aumenta GPF em 5 (Nota 1).
export function calcularBrigadaSC(
  populacaoFixa: number,
  divisao: string,
  possuiSprinkler = false
): ResultadoBrigadaSC {
  const pop = Math.max(0, Math.ceil(Number(populacaoFixa) || 0));
  const regra = REGRAS_BRIGADA_SC[divisao];

  if (!regra) {
    return {
      brigadistas: 0,
      populacao_usada: pop,
      treinamento: 'Basico',
      descricao: `Divisao ${divisao} nao encontrada na Tabela 3 da IN 28. Consultar norma.`,
      isento: true
    };
  }

  if (regra.modo === 'isento') {
    return {
      brigadistas: 0,
      populacao_usada: pop,
      treinamento: regra.treinamento,
      detalhe: regra.detalhe,
      descricao: `${divisao}: ${regra.detalhe || 'Isento de brigada conforme IN 28 (Tabela 3).'}`,
      isento: true
    };
  }

  if (regra.modo === 'consultar') {
    return {
      brigadistas: 0,
      populacao_usada: pop,
      treinamento: regra.treinamento,
      detalhe: regra.detalhe,
      descricao: `${divisao}: dimensionamento por norma especifica. ${regra.detalhe || ''}`.trim(),
      isento: true
    };
  }

  if (regra.modo === 'percentual_pop' && regra.percentual) {
    const brig = Math.ceil(pop * regra.percentual);
    return {
      brigadistas: brig,
      populacao_usada: pop,
      treinamento: regra.treinamento,
      detalhe: regra.detalhe,
      descricao: `${divisao}: treinar ${Math.round(regra.percentual * 100)}% da populacao fixa (${pop}) ` +
        `no nivel ${regra.treinamento} = ${brig} brigadista(s). Conforme IN 28 do CBMSC, Anexo A, Tabela 3.`,
      isento: false
    };
  }

  if (regra.modo === 'por_extensao') {
    // Para M-1, retornamos isento por padrao — calculo manual deve ser feito.
    return {
      brigadistas: 0,
      populacao_usada: pop,
      treinamento: regra.treinamento,
      detalhe: regra.detalhe,
      descricao: `${divisao}: dimensionamento por extensao. ${regra.detalhe || ''} Informe manualmente.`.trim(),
      isento: true
    };
  }

  // Caso padrao: por_gpf
  if (regra.isencao !== null && pop <= regra.isencao) {
    return {
      brigadistas: 0,
      populacao_usada: pop,
      treinamento: regra.treinamento,
      detalhe: regra.detalhe,
      descricao: `${divisao}: populacao fixa ${pop} <= ${regra.isencao} (limite de isencao). ` +
        `Isento de brigada conforme IN 28 do CBMSC, Anexo A, Tabela 3.`,
      isento: true
    };
  }

  let gpf = regra.gpf || 1;
  let bonus = '';
  if (possuiSprinkler) {
    gpf = gpf + 5;
    bonus = ' (GPF acrescido em 5 conforme Nota 1: edificacao com chuveiros automaticos)';
  }

  const brig = Math.ceil(pop / gpf);
  const partes: string[] = [];
  partes.push(`Divisao ${divisao} — IN 28 do CBMSC, Anexo A, Tabela 3.`);
  partes.push(`Populacao fixa: ${pop} pessoa(s) (Nota b: somente funcionarios contam).`);
  partes.push(`Limite de isencao: ${regra.isencao} pessoa(s).`);
  partes.push(`GPF (Grupo de Populacao Fixa): ${regra.gpf}${bonus}.`);
  partes.push(`Calculo: ${pop} / ${gpf} = ${(pop / gpf).toFixed(2)} -> ${brig} brigadista(s) ` +
    `(arredondamento para o numero inteiro imediatamente superior).`);
  partes.push(`Nivel de treinamento: ${regra.treinamento}${regra.detalhe ? ' — ' + regra.detalhe : ''}.`);

  return {
    brigadistas: brig,
    populacao_usada: pop,
    treinamento: regra.treinamento,
    detalhe: regra.detalhe,
    descricao: partes.join(' '),
    isento: false
  };
}
