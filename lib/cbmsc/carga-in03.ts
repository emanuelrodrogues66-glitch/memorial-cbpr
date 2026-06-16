// Carga de incendio — IN 03 / CBMSC (Santa Catarina)
// Fonte: IN 03, art. 11 — vigente desde 24/04/2024.
//
// Classificacao em 5 niveis (art. 11):
//   I — Desprezivel:  qfi <= 100 MJ/m²
//   II — Baixa:       100 < qfi <= 300 MJ/m²
//   III — Media:      300 < qfi <= 1200 MJ/m²
//   IV — Alta:        1200 < qfi <= 2280 MJ/m²
//   V — Altissima:    qfi > 2280 MJ/m²

export type ClasseCargaIncendioSC =
  | 'DESPREZIVEL'
  | 'BAIXA'
  | 'MEDIA'
  | 'ALTA'
  | 'ALTISSIMA';

export function classificarCargaSC(qfi_mj_m2: number): ClasseCargaIncendioSC {
  const q = Number(qfi_mj_m2) || 0;
  if (q <= 100) return 'DESPREZIVEL';
  if (q <= 300) return 'BAIXA';
  if (q <= 1200) return 'MEDIA';
  if (q <= 2280) return 'ALTA';
  return 'ALTISSIMA';
}

export function descreverClasseCargaSC(classe: ClasseCargaIncendioSC): string {
  switch (classe) {
    case 'DESPREZIVEL':
      return 'Desprezivel (qfi <= 100 MJ/m²)';
    case 'BAIXA':
      return 'Baixa (100 < qfi <= 300 MJ/m²)';
    case 'MEDIA':
      return 'Media (300 < qfi <= 1200 MJ/m²)';
    case 'ALTA':
      return 'Alta (1200 < qfi <= 2280 MJ/m²)';
    case 'ALTISSIMA':
      return 'Altissima (qfi > 2280 MJ/m²)';
  }
}
