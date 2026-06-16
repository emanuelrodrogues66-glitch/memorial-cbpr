// Iluminacao de emergencia — IN 11 / CBMSC (Santa Catarina)
// Fonte: IN 11 — vigente desde 24/04/2024.
//
// Resumo dos requisitos:
// - Autonomia minima: 3 horas para alturas > 60 m, H-2/H-3 > 1500 m², F-6/F-11 > 1000 pessoas; 1 h demais.
// - Iluminamento minimo: 3 lux planos / 5 lux desniveis ou F-6/F-11.
// - Isencao: ambientes <= 200 m² com caminhamento ate 20 m (alguns casos); banheiros < 8 m²;
//   interior de unidades autonomas A/B.

export type ResultadoIluminacaoSC = {
  autonomia_horas: 1 | 3;
  motivo_autonomia: string;
  iluminancia_lux_plano: number;
  iluminancia_lux_desnivel: number;
  descricao: string;
};

export function dimensionarIluminacaoSC(params: {
  divisao: string;
  altura_m: number;
  area_m2: number;
  populacao: number;
}): ResultadoIluminacaoSC {
  const { divisao, altura_m, area_m2, populacao } = params;
  const div = (divisao || '').toUpperCase().trim();

  // Determinar autonomia
  let autonomia: 1 | 3 = 1;
  const motivos: string[] = [];

  if (altura_m > 60) {
    autonomia = 3;
    motivos.push(`altura ${altura_m.toFixed(2)} m superior a 60 m (art. 8 inc. I)`);
  }

  if ((div === 'H-2' || div === 'H-3') && area_m2 > 1500) {
    autonomia = 3;
    motivos.push(`divisao ${div} com area ${area_m2.toFixed(2)} m² superior a 1.500 m² (art. 8 inc. II)`);
  }

  if ((div === 'F-6' || div === 'F-11') && populacao > 1000) {
    autonomia = 3;
    motivos.push(`divisao ${div} com lotacao ${populacao} pessoas superior a 1.000 (art. 8 inc. III)`);
  }

  const motivo = motivos.length > 0
    ? motivos.join('; ')
    : 'demais ocupacoes — autonomia minima de 1 hora (art. 8, paragrafo 1)';

  // Iluminamento minimo
  const lux_plano = 3;
  const lux_desnivel = (div === 'F-6' || div === 'F-11') ? 5 : 5;

  const partes: string[] = [];
  partes.push(`IN 11 do CBMSC (Sistema de Iluminacao de Emergencia — SIE).`);
  partes.push(`Autonomia minima: ${autonomia} hora(s) (${motivo}).`);
  partes.push(`Nivel minimo de iluminamento: ${lux_plano} lux em locais planos; ${lux_desnivel} lux em locais com desnivel ou divisoes F-6 e F-11 (art. 9).`);
  partes.push(`Unidade de passagem nas rotas de fuga deve estar nitidamente iluminada (art. 6).`);
  partes.push(`Distancia maxima entre dois pontos no mesmo ambiente: 4x a altura de instalacao (art. 11).`);
  partes.push(`Perda maxima de luminosidade durante a autonomia: 10% (art. 8 paragrafo 2).`);

  return {
    autonomia_horas: autonomia,
    motivo_autonomia: motivo,
    iluminancia_lux_plano: lux_plano,
    iluminancia_lux_desnivel: lux_desnivel,
    descricao: partes.join(' ')
  };
}
