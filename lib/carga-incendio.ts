// Memorial de cálculo da carga de incêndio (média ponderada por área)
// Conforme NPT 014 / Anexo A do CSCIP-PR.

export type ItemCargaIncendio = {
  id: string;
  pavimento_setor: string; // Ex.: "TÉRREO", "MEZANINO"
  ocupacao_descricao: string; // Ex.: "INDÚSTRIA (I-2)" ou "DEPÓSITO (J-3)"
  divisao: string; // Ex.: "I-2", "J-3", "D-1"
  ci_mj_m2: number; // Valor de tabela (MJ/m²)
  area_m2: number; // Área do setor
};

export function novoItemCargaIncendio(parcial: Partial<ItemCargaIncendio> = {}): ItemCargaIncendio {
  return {
    id: 'ci-' + Math.random().toString(36).slice(2, 9),
    pavimento_setor: parcial.pavimento_setor ?? 'TÉRREO',
    ocupacao_descricao: parcial.ocupacao_descricao ?? '',
    divisao: parcial.divisao ?? '',
    ci_mj_m2: parcial.ci_mj_m2 ?? 0,
    area_m2: parcial.area_m2 ?? 0
  };
}

export type ResultadoCargaIncendio = {
  itens: ItemCargaIncendio[];
  area_total: number;
  ci_total_mj: number; // Soma de (ci × área) em MJ
  media_ponderada_mj_m2: number; // ci_total / area_total
};

export function calcularMediaPonderada(itens: ItemCargaIncendio[]): ResultadoCargaIncendio {
  let area_total = 0;
  let ci_total_mj = 0;
  for (const it of itens) {
    const area = Number(it.area_m2) || 0;
    const ci = Number(it.ci_mj_m2) || 0;
    area_total += area;
    ci_total_mj += ci * area;
  }
  const media = area_total > 0 ? ci_total_mj / area_total : 0;
  return {
    itens,
    area_total,
    ci_total_mj,
    media_ponderada_mj_m2: media
  };
}
