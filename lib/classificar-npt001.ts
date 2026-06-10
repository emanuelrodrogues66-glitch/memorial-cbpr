// Classificador NPT 001 parte 2 (Abril/2024) - decide entre:
// - DISPENSA (5.1.2.1): edificacoes com certificacao anterior a 2018 valida
// - MEMORIAL_SIMPLIFICADO (5.1.3.1): edif. tipo 2 com area >= 200m2 enquadradas Tabela 5
// - PTPID (5.1.3.2): projeto tecnico completo (regras a..m)
//
// Classificacao automatica de tipo da edificacao baseada na data de construcao:
// - NOVA: construida apos 05/04/2018 (Lei 19.449/2018)
// - EXISTENTE_TIPO_2: construida entre 2003 e 2018 (sem certificacao previa)
// - EXISTENTE_TIPO_1 / ANTIGA: anterior a 2003 (sujeita a analise NPT 002 item 8.1)

export type Modalidade =
  | 'DISPENSA'
  | 'MEMORIAL_SIMPLIFICADO'
  | 'PTPID'
  | 'PTPID_IOT'
  | 'ANALISE_NPT002';

export type TipoEdificacao = 'NOVA' | 'EXISTENTE_TIPO_2' | 'EXISTENTE_TIPO_1' | 'ANTIGA';

export type ClassificacaoInput = {
  divisao: string;            // "D-1", "F-2" etc
  area_m2: number;
  altura_m: number;
  populacao?: number | null;
  ano_construcao?: number | null;       // ex: 2010
  tem_certificacao_anterior?: boolean;  // PPI, PSS, PSCIP aprovado antes 2018
  tem_subsolo_computado?: boolean;
  liquido_inflamavel_litros?: number | null;  // > 1000L = PTPID
  glp_kg?: number | null;                     // > 190kg = PTPID
  tem_hidrantes_instalados?: boolean;
  tem_escada_enclausurada_exigida?: boolean;  // NPT 11
  instalacao_temporaria?: boolean;           // circo, feira etc
};

export type ClassificacaoResultado = {
  modalidade: Modalidade;
  tipo_edificacao: TipoEdificacao;
  justificativas: string[];   // razoes que levaram a modalidade exigida
  observacoes: string[];       // alertas adicionais
};

// Tipo da edificacao baseado em data + certificacao
export function classificarTipoEdificacao(
  ano_construcao: number | null | undefined,
  tem_certificacao_anterior: boolean | undefined,
  hoje: Date = new Date()
): TipoEdificacao {
  const anoAtual = hoje.getFullYear();
  if (!ano_construcao) {
    // Sem data informada, assume NOVA (mais conservador)
    return 'NOVA';
  }
  // Lei 19449/2018 - 5 de abril de 2018
  if (ano_construcao >= 2019) return 'NOVA';
  if (ano_construcao === 2018) return 'NOVA'; // assumir construcao apos a lei (conservador)
  // Antes de 2003 (referencia comum para "antiga")
  if (ano_construcao < 2003) return 'ANTIGA';
  // 2003-2017 sem certificacao = existente tipo 2
  if (tem_certificacao_anterior) return 'EXISTENTE_TIPO_1';
  return 'EXISTENTE_TIPO_2';
}

// Grupos H-2, H-3 e F com populacao >= 200
function exigePtpidPorPopulacao(divisao: string, populacao: number | null | undefined): boolean {
  if (!populacao || populacao < 200) return false;
  if (divisao.startsWith('H-2') || divisao.startsWith('H-3')) return true;
  if (divisao.startsWith('F-')) return true;
  return false;
}

export function classificar(input: ClassificacaoInput, hoje: Date = new Date()): ClassificacaoResultado {
  const justificativas: string[] = [];
  const observacoes: string[] = [];

  const tipo = classificarTipoEdificacao(
    input.ano_construcao,
    input.tem_certificacao_anterior,
    hoje
  );

  // Instalacao temporaria
  if (input.instalacao_temporaria) {
    return {
      modalidade: 'PTPID_IOT',
      tipo_edificacao: tipo,
      justificativas: ['Instalação ou ocupação temporária (circos, feiras, eventos) — NPT 001 parte 2, item 5.1.3.3'],
      observacoes: ['Após 6 meses, passa a ser regida pelas regras de edificações fixas']
    };
  }

  // DISPENSA: certificacao anterior a 2018 mantida
  // (na pratica precisa avaliacao tecnica; aqui sinalizamos como possivel)
  if (input.tem_certificacao_anterior && (tipo === 'EXISTENTE_TIPO_1' || tipo === 'ANTIGA')) {
    observacoes.push('Possível dispensa de apresentação se mantiver as condições do PPI/PSS/PSCIP aprovado antes de 2018 (NPT 001 parte 2, item 5.1.2.1)');
  }

  // PTPID - regras 5.1.3.2.1
  const grupo = input.divisao[0] || '';

  // a) Enquadramento Tabela 6 (regra simplificada: tipica indicacao por altura/area)
  // Sem tabela 6 completa aqui, usamos heuristica: tipo NOVA + (altura > 12m OU area >= 1500m2)
  if (tipo === 'NOVA' && (input.altura_m > 12 || input.area_m2 >= 1500)) {
    justificativas.push('Edificação nova enquadrada na Tabela 6 do CSCIP (altura > 12m ou área ≥ 1500 m²)');
  }

  // b) Escada enclausurada exigida (NPT 11)
  if (input.tem_escada_enclausurada_exigida) {
    justificativas.push('Ocupação exige escada enclausurada (NPT 11), independente da altura');
  }

  // c) Grupos L e M sempre PTPID
  if (grupo === 'L') {
    justificativas.push('Ocupação do Grupo L (Explosivos) — sempre exige PTPID, independente da área');
  }
  if (grupo === 'M') {
    justificativas.push('Ocupação do Grupo M (Especial) — sempre exige PTPID, independente da área');
  }

  // d) H-2, H-3, F com populacao >= 200
  if (exigePtpidPorPopulacao(input.divisao, input.populacao)) {
    justificativas.push(`Ocupação ${input.divisao} com população ≥ 200 pessoas`);
  }

  // e) Subsolo computado para altura
  if (input.tem_subsolo_computado) {
    justificativas.push('Edificação possui subsolo computado para classificação de altura');
  }

  // f) Liquido inflamavel > 1000L
  if (input.liquido_inflamavel_litros && input.liquido_inflamavel_litros > 1000) {
    justificativas.push(`Armazenamento de ${input.liquido_inflamavel_litros}L de líquido inflamável (> 1000L)`);
  }

  // g) GLP > 190kg
  if (input.glp_kg && input.glp_kg > 190) {
    justificativas.push(`Central de GLP com ${input.glp_kg}kg (> 190kg)`);
  }

  // i,j,k) Edificacoes existentes/antigas sem hidrantes
  if (tipo === 'ANTIGA' && !input.tem_hidrantes_instalados) {
    // Risco moderado/elevado: area >= 1500 ou 4+ pav
    // Risco leve: area >= 2000 ou 4+ pav
    if (input.area_m2 >= 1500) {
      justificativas.push('Edificação antiga sem sistema de hidrantes, com área ≥ 1500 m² (regra 5.1.3.2.1 letras j/k)');
    }
  }

  // Se ja temos motivos, e PTPID
  if (justificativas.length > 0) {
    return {
      modalidade: 'PTPID',
      tipo_edificacao: tipo,
      justificativas,
      observacoes
    };
  }

  // MEMORIAL_SIMPLIFICADO - regra 5.1.3.1.1.1
  // Obrigatorio para edif. novas/existentes tipo 2 com area >= 200m2 enquadradas Tabela 5
  if (input.area_m2 >= 200) {
    if (tipo === 'NOVA' || tipo === 'EXISTENTE_TIPO_2') {
      return {
        modalidade: 'MEMORIAL_SIMPLIFICADO',
        tipo_edificacao: tipo,
        justificativas: [
          `Edificação ${tipo === 'NOVA' ? 'nova' : 'existente tipo 2'} com área de ${input.area_m2} m² (≥ 200 m²), enquadrada na Tabela 5 do CSCIP`
        ],
        observacoes
      };
    }
    // Antiga/existente tipo 1: facultativo, sujeito a analise da NPT 002
    if (tipo === 'EXISTENTE_TIPO_1' || tipo === 'ANTIGA') {
      return {
        modalidade: 'ANALISE_NPT002',
        tipo_edificacao: tipo,
        justificativas: [
          'Edificação antiga ou existente tipo 1 — sujeita a análise do vistoriador conforme NPT 002 item 8.1 (adaptação às normas de segurança contra incêndio — edificações existentes e antigas)'
        ],
        observacoes: [
          'Memorial simplificado é facultativo, a critério do proprietário, podendo substituir PTPID se atender requisitos básicos',
          ...observacoes
        ]
      };
    }
  }

  // Area < 200m2 - geralmente dispensada de memorial simplificado obrigatorio
  return {
    modalidade: 'DISPENSA',
    tipo_edificacao: tipo,
    justificativas: [
      `Edificação com área de ${input.area_m2} m² (< 200 m²) — dispensada de apresentação obrigatória de memorial simplificado`
    ],
    observacoes: [
      'Mesmo dispensada, recomenda-se atender às medidas básicas de segurança contra incêndio',
      ...observacoes
    ]
  };
}

export function rotuloModalidade(m: Modalidade): string {
  switch (m) {
    case 'DISPENSA': return 'Dispensada';
    case 'MEMORIAL_SIMPLIFICADO': return 'Memorial Simplificado';
    case 'PTPID': return 'Projeto Técnico (PTPID)';
    case 'PTPID_IOT': return 'Projeto Técnico - Ocupação Temporária';
    case 'ANALISE_NPT002': return 'Análise NPT 002';
  }
}

export function corModalidade(m: Modalidade): 'success' | 'primary' | 'warning' | 'danger' | 'muted' {
  switch (m) {
    case 'DISPENSA': return 'success';
    case 'MEMORIAL_SIMPLIFICADO': return 'primary';
    case 'PTPID': return 'danger';
    case 'PTPID_IOT': return 'warning';
    case 'ANALISE_NPT002': return 'warning';
  }
}
