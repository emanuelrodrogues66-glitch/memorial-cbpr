// Dimensionamento de saídas de emergência — NPT 011 / CBMPR
// Base: planilha do modelo (memorial_saidas_npt011_multi-1.html)
//
// Conceitos:
// - População por ambiente = (área útil - excluir) * coef da divisão
// - Unidade de Passagem (UP) = 0,55 m
// - N (nº de UPs) = ceil( População / Capacidade C )
// - Largura mínima: porta 0,80 m (1 UP), escada/rampa/acesso 1,20 m (2 UP)
// - Total agrupado de um pavimento usa o C mais restritivo (item 5.3.2.2 NPT 011)

export type DivCsicipSaida = {
  pop: string; // descrição textual ("1 por 7 m²", "2 por dormitório", etc.)
  coef: number | null; // pessoas por m² (1/densidade)
  acc: number; // capacidade C para acesso / descarga
  esc: number; // capacidade C para escada / rampa
  port: number; // capacidade C para porta
  special?: 'dorm' | 'leito' | 'vagas';
};

// Tabela completa da NPT 011 (capacidades por divisão CSCIP).
// Esta é a base do modelo HTML aprovado pelo Emanuel.
export const DATA_SAIDAS: Record<string, DivCsicipSaida> = {
  'A-1': { pop: '2 por dormitório', coef: null, acc: 60, esc: 45, port: 100, special: 'dorm' },
  'A-2': { pop: '2 por dormitório', coef: null, acc: 60, esc: 45, port: 100, special: 'dorm' },
  'A-3': { pop: '2 por dormitório (alojamento)', coef: null, acc: 60, esc: 45, port: 100, special: 'dorm' },

  'B-1': { pop: '1 por 15 m²', coef: 1 / 15, acc: 60, esc: 45, port: 100 },
  'B-2': { pop: '1 por 15 m²', coef: 1 / 15, acc: 60, esc: 45, port: 100 },

  'C-1': { pop: '1 por 5 m²', coef: 1 / 5, acc: 100, esc: 75, port: 100 },
  'C-2': { pop: '1 por 5 m²', coef: 1 / 5, acc: 100, esc: 75, port: 100 },
  'C-3': { pop: '1 por 5 m²', coef: 1 / 5, acc: 100, esc: 75, port: 100 },

  'D-1': { pop: '1 por 7 m²', coef: 1 / 7, acc: 100, esc: 75, port: 100 },
  'D-2': { pop: '1 por 7 m²', coef: 1 / 7, acc: 100, esc: 75, port: 100 },
  'D-3': { pop: '1 por 7 m²', coef: 1 / 7, acc: 100, esc: 75, port: 100 },

  'E-1': { pop: '1 por 1,5 m²', coef: 1 / 1.5, acc: 100, esc: 75, port: 100 },
  'E-2': { pop: '1 por 1,5 m²', coef: 1 / 1.5, acc: 100, esc: 75, port: 100 },
  'E-3': { pop: '1 por 1,5 m²', coef: 1 / 1.5, acc: 100, esc: 75, port: 100 },
  'E-4': { pop: '1 por 1,5 m²', coef: 1 / 1.5, acc: 100, esc: 75, port: 100 },
  'E-5': { pop: '1 por 1,5 m²', coef: 1 / 1.5, acc: 30, esc: 22, port: 30 },
  'E-6': { pop: '1 por 1,5 m²', coef: 1 / 1.5, acc: 30, esc: 22, port: 30 },

  'F-1': { pop: '1 por 3 m²', coef: 1 / 3, acc: 100, esc: 75, port: 100 },
  'F-2': { pop: '1 por 1 m²', coef: 1, acc: 100, esc: 75, port: 100 },
  'F-3': { pop: '2 por 1 m²', coef: 2, acc: 100, esc: 75, port: 100 },
  'F-4': { pop: '1 por 3 m²', coef: 1 / 3, acc: 100, esc: 75, port: 100 },
  'F-5': { pop: '1 por 1 m²', coef: 1, acc: 100, esc: 75, port: 100 },
  'F-6': { pop: '2 por 1 m²', coef: 2, acc: 100, esc: 75, port: 100 },
  'F-7': { pop: '2 por 1 m²', coef: 2, acc: 100, esc: 75, port: 100 },
  'F-8': { pop: '1 por 1 m²', coef: 1, acc: 100, esc: 75, port: 100 },
  'F-9': { pop: '2 por 1 m²', coef: 2, acc: 100, esc: 75, port: 100 },
  'F-10': { pop: '1 por 3 m²', coef: 1 / 3, acc: 100, esc: 75, port: 100 },
  'F-11': { pop: '2 por 1 m²', coef: 2, acc: 100, esc: 75, port: 100 },

  'G-1': { pop: '1 por 40 vagas', coef: null, acc: 100, esc: 60, port: 100, special: 'vagas' },
  'G-2': { pop: '1 por 40 vagas', coef: null, acc: 100, esc: 60, port: 100, special: 'vagas' },
  'G-3': { pop: '1 por 40 vagas', coef: null, acc: 100, esc: 60, port: 100, special: 'vagas' },
  'G-4': { pop: '1 por 20 m²', coef: 1 / 20, acc: 100, esc: 60, port: 100 },
  'G-5': { pop: '1 por 20 m²', coef: 1 / 20, acc: 100, esc: 60, port: 100 },

  'H-1': { pop: '1 por 7 m²', coef: 1 / 7, acc: 60, esc: 45, port: 100 },
  'H-2': { pop: '1 por 4 m² (alojamento)', coef: 1 / 4, acc: 30, esc: 22, port: 30 },
  'H-3': { pop: '1,5 por leito + 1/7 m² (amb.)', coef: 1 / 7, acc: 30, esc: 22, port: 30 },
  'H-4': { pop: '1 por 7 m²', coef: 1 / 7, acc: 60, esc: 45, port: 100 },
  'H-5': { pop: '1 por 7 m²', coef: 1 / 7, acc: 60, esc: 45, port: 100 },
  'H-6': { pop: '1 por 7 m²', coef: 1 / 7, acc: 60, esc: 45, port: 100 },

  'I-1': { pop: '1 por 10 m²', coef: 1 / 10, acc: 100, esc: 60, port: 100 },
  'I-2': { pop: '1 por 10 m²', coef: 1 / 10, acc: 100, esc: 60, port: 100 },
  'I-3': { pop: '1 por 10 m²', coef: 1 / 10, acc: 100, esc: 60, port: 100 },

  'J-1': { pop: '1 por 30 m²', coef: 1 / 30, acc: 100, esc: 60, port: 100 },
  'J-2': { pop: '1 por 30 m²', coef: 1 / 30, acc: 100, esc: 60, port: 100 },
  'J-3': { pop: '1 por 30 m²', coef: 1 / 30, acc: 100, esc: 60, port: 100 },
  'J-4': { pop: '1 por 30 m²', coef: 1 / 30, acc: 100, esc: 60, port: 100 },

  'L-1': { pop: '1 por 3 m²', coef: 1 / 3, acc: 100, esc: 60, port: 100 },
  'L-2': { pop: '1 por 3 m²', coef: 1 / 3, acc: 100, esc: 60, port: 100 },
  'L-3': { pop: '1 por 10 m²', coef: 1 / 10, acc: 100, esc: 60, port: 100 },

  'M-1': { pop: '1 por 10 m²', coef: 1 / 10, acc: 100, esc: 75, port: 100 },
  'M-3': { pop: '1 por 10 m²', coef: 1 / 10, acc: 100, esc: 60, port: 100 },
  'M-4': { pop: '1 por 4 m²', coef: 1 / 4, acc: 60, esc: 45, port: 100 },
  'M-5': { pop: '1 por 10 m²', coef: 1 / 10, acc: 100, esc: 60, port: 100 }
};

export const UP_METROS = 0.55;
// Mínimos definidos pela NPT 011 item 5.3.1 — em UPs (não derivar da largura, pois 1,20 m
// não é múltiplo exato de 0,55 m). Norma converte: porta 1 UP = 0,80 m, escada/acesso 2 UP = 1,20 m.
export const MIN_UP_PORTA = 1;
export const MIN_UP_ESCADA = 2;
export const MIN_UP_ACESSO = 2;
export const MIN_LARGURA_PORTA = 0.80; // 1 UP
export const MIN_LARGURA_ESCADA = 1.20; // 2 UP
export const MIN_LARGURA_ACESSO = 1.20; // 2 UP

// Lista de divisões agrupadas (para selects)
export const DIVS_AGRUPADAS: Array<[string, string[]]> = [
  ['A — Residencial', ['A-1', 'A-2', 'A-3']],
  ['B — Hospedagem', ['B-1', 'B-2']],
  ['C — Comercial', ['C-1', 'C-2', 'C-3']],
  ['D — Serviço profissional', ['D-1', 'D-2', 'D-3']],
  ['E — Educacional', ['E-1', 'E-2', 'E-3', 'E-4', 'E-5', 'E-6']],
  [
    'F — Reunião de público',
    ['F-1', 'F-2', 'F-3', 'F-4', 'F-5', 'F-6', 'F-7', 'F-8', 'F-9', 'F-10', 'F-11']
  ],
  ['G — Automotivo', ['G-1', 'G-2', 'G-3', 'G-4', 'G-5']],
  ['H — Saúde / institucional', ['H-1', 'H-2', 'H-3', 'H-4', 'H-5', 'H-6']],
  ['I — Industrial', ['I-1', 'I-2', 'I-3']],
  ['J — Depósito', ['J-1', 'J-2', 'J-3', 'J-4']],
  ['L — Explosivos', ['L-1', 'L-2', 'L-3']],
  ['M — Especial', ['M-1', 'M-3', 'M-4', 'M-5']]
];

export type ComponenteSaida = 'porta' | 'escada' | 'acesso';

export const COMPONENTE_LABEL: Record<ComponenteSaida, string> = {
  porta: 'Portas',
  escada: 'Escadas / rampas',
  acesso: 'Acessos / descargas'
};

export const COMPONENTE_FIELD: Record<ComponenteSaida, 'port' | 'esc' | 'acc'> = {
  porta: 'port',
  escada: 'esc',
  acesso: 'acc'
};

export const COMPONENTE_MIN_LARGURA: Record<ComponenteSaida, number> = {
  porta: MIN_LARGURA_PORTA,
  escada: MIN_LARGURA_ESCADA,
  acesso: MIN_LARGURA_ACESSO
};

export const COMPONENTE_MIN_UP: Record<ComponenteSaida, number> = {
  porta: MIN_UP_PORTA,
  escada: MIN_UP_ESCADA,
  acesso: MIN_UP_ACESSO
};

// === Tipos do estado do formulário ===

export type Ambiente = {
  id: number;
  nome: string;
  div: string;
  area: number; // área útil em m²
  excluir: number; // área a excluir em m²
  dormitorios?: number; // nº de dormitórios — usado para A-1, A-2, A-3 (2 pessoas/dorm)
  uso_leiaute?: boolean; // grupo F: usar nº de assentos em vez de área
  assentos?: number; // grupo F com leiaute: nº de cadeiras/assentos = população direta
};

// Item real informado pelo usuário (porta/escada/acesso instalado)
export type SaidaReal = {
  id: number;
  tipo: ComponenteSaida;
  identificacao: string; // ex: "Porta P1", "Escada E1"
  largura_m: number; // largura útil em metros
  quantidade: number; // nº de elementos iguais
};

export type Pavimento = {
  id: number;
  label: string; // "Pavimento 1", "Térreo"...
  componentes_ativos: Record<ComponenteSaida, boolean>;
  ambientes: Ambiente[];
  saidas_reais: SaidaReal[];
};

// === Funções de cálculo ===

// Arredondamento matemático (>=0,5 sobe). Usado para POPULAÇÃO conforme regra do Emanuel.
function roundMat(n: number) {
  return Math.round(n);
}

// Teto, usado para número de UPs (sempre arredondar para cima)
function ceil(n: number) {
  return Math.ceil(n);
}

// Ambiente é considerado "vazio" (não entra no memorial) se não tem ocupação definida
// ou se a área líquida é zero/negativa
export function ambienteTemOcupacao(
  a: Ambiente,
  data: Record<string, DivCsicipSaida> = DATA_SAIDAS
): boolean {
  const div = (a.div || '').trim();
  if (!div) return false;
  if (!data[div]) return false;
  const area = Number(a.area) || 0;
  const excl = Number(a.excluir) || 0;
  const net = Math.max(0, area - excl);
  // Para vagas, a área é a referência direta
  if (data[div].special === 'vagas') return area > 0;
  // Para dormitórios (A-1, A-2, A-3), o critério é ter ao menos 1 dormitório informado
  if (data[div].special === 'dorm') return (Number(a.dormitorios) || 0) > 0;
  // Para grupo F com leiaute, o critério é ter ao menos 1 assento informado
  if (isGrupoF(div) && a.uso_leiaute) return (Number(a.assentos) || 0) > 0;
  return net > 0;
}

export function isGrupoF(div: string): boolean {
  return /^F-\d+$/.test((div || '').trim());
}

export function calcularPopulacaoAmbiente(
  a: Ambiente,
  data: Record<string, DivCsicipSaida> = DATA_SAIDAS
): { pop: number; net: number; unit: 'm²' | 'vagas' | 'dorm' | 'assentos'; ok: boolean; descricao?: string } | null {
  const d = data[a.div];
  if (!d) return null;
  const area = Number(a.area) || 0;
  const excl = Number(a.excluir) || 0;
  const net = Math.max(0, area - excl);

  // Grupo F com leiaute: população = nº de assentos informados
  if (isGrupoF(a.div) && a.uso_leiaute) {
    const assentos = Number(a.assentos) || 0;
    if (assentos <= 0) {
      return {
        pop: 0,
        net: 0,
        unit: 'assentos',
        ok: false,
        descricao: 'Informe o número de assentos/cadeiras para calcular a população pelo leiaute.'
      };
    }
    return { pop: assentos, net: assentos, unit: 'assentos', ok: true };
  }

  if (d.special === 'dorm') {
    const dorms = Number(a.dormitorios) || 0;
    if (dorms <= 0) {
      return {
        pop: 0,
        net: 0,
        unit: 'dorm',
        ok: false,
        descricao: 'Informe o número de dormitórios para calcular a população (2 pessoas/dormitório — NPT 011).'
      };
    }
    // NPT 011: 2 pessoas por dormitório para A-1, A-2, A-3
    return { pop: dorms * 2, net: dorms, unit: 'dorm', ok: true };
  }
  if (d.special === 'leito') {
    // dormitório/leito: requer entrada específica (não suportada agora)
    return {
      pop: 0,
      net,
      unit: 'm²',
      ok: false,
      descricao: 'Cálculo por leito não suportado nesta etapa — informe população manual.'
    };
  }
  if (d.special === 'vagas') {
    return { pop: roundMat(area / 40), net: area, unit: 'vagas', ok: true };
  }
  if (d.coef == null) return null;
  return { pop: roundMat(net * d.coef), net, unit: 'm²', ok: true };
}

export type DimComponente = {
  mode: ComponenteSaida;
  label: string;
  min_largura: number;
  c_critico: number; // C mais restritivo entre ambientes
  total_up: number;
  total_largura_m: number;
  por_ambiente: Array<{
    ambiente: string;
    divisao: string;
    populacao: number;
    c: number;
    up_bruto: number;
    up_final: number;
    largura_m: number;
    ajustado_min: boolean;
  }>;
};

export type DimPavimento = {
  pavimento_id: number;
  label: string;
  populacao_total: number;
  por_ambiente: Array<{
    id: number;
    nome: string;
    divisao: string;
    net: number;
    unit: 'm²' | 'vagas' | 'dorm' | 'assentos';
    pop: number;
    erro?: string;
  }>;
  dimensionamento: DimComponente[]; // só para componentes ativos
  verificacao: VerificacaoPavimento[]; // resultado por tipo (porta/escada/acesso)
  verificacao_consolidada: VerificacaoConsolidada | null; // soma componentes do bloco (porta + escada etc)
};

export type VerificacaoConsolidada = {
  up_exigido: number; // máximo entre os tipos ativos (componente mais restritivo)
  tipo_mais_restritivo: ComponenteSaida; // qual tipo definiu o exigido
  up_real_total: number; // soma de todas as UPs reais (porta + escada + acesso)
  componentes: Array<{ tipo: ComponenteSaida; label: string; up: number; quantidade: number }>;
  atende: boolean;
};

export type VerificacaoPavimento = {
  tipo: ComponenteSaida;
  label: string;
  up_exigido: number;
  largura_exigida_m: number;
  up_real: number;
  largura_real_m: number;
  atende: boolean;
  quantidade_elementos: number;
  detalhes: string;
};

export function dimensionarPavimento(
  p: Pavimento,
  data: Record<string, DivCsicipSaida> = DATA_SAIDAS
): DimPavimento {
  // Filtra ambientes sem ocupação (campo vazio não vai para o memorial)
  const ambientesValidos = p.ambientes.filter((a) => ambienteTemOcupacao(a, data));
  const populadosResultados = ambientesValidos.map((a) => ({
    a,
    r: calcularPopulacaoAmbiente(a, data)
  }));

  const por_ambiente = populadosResultados.map(({ a, r }) => ({
    id: a.id,
    nome: a.nome || a.div || 'Ambiente',
    divisao: a.div,
    net: r?.net ?? 0,
    unit: (r?.unit ?? 'm²') as 'm²' | 'vagas',
    pop: r?.ok ? r.pop : 0,
    erro: r && !r.ok ? r.descricao : undefined
  }));

  const valid = populadosResultados.filter((x) => x.r && x.r.ok) as Array<{
    a: Ambiente;
    r: NonNullable<ReturnType<typeof calcularPopulacaoAmbiente>>;
  }>;
  const populacao_total = valid.reduce((s, { r }) => s + r.pop, 0);

  const modosAtivos = (Object.keys(p.componentes_ativos) as ComponenteSaida[]).filter(
    (m) => p.componentes_ativos[m]
  );

  const dimensionamento: DimComponente[] = modosAtivos.map((mode) => {
    const label = COMPONENTE_LABEL[mode];
    const field = COMPONENTE_FIELD[mode];
    const minW = COMPONENTE_MIN_LARGURA[mode];
    const upMin = COMPONENTE_MIN_UP[mode]; // 1 UP porta, 2 UP escada/acesso

    const por_amb = valid.map(({ a, r }) => {
      const d = data[a.div];
      const C = d[field];
      const upBruto = Math.max(1, ceil(r.pop / C));
      // Por-ambiente é informativo: mostra o cálculo bruto sem aplicar o mínimo agrupado
      // (o mínimo só vale para o componente final do pavimento, não para cada ambiente)
      return {
        ambiente: a.nome || a.div || 'Ambiente',
        divisao: a.div,
        populacao: r.pop,
        c: C,
        up_bruto: upBruto,
        up_final: upBruto,
        largura_m: round2(upBruto * UP_METROS),
        ajustado_min: false
      };
    });

    const Cs = valid.map(({ a }) => data[a.div][field]);
    const cCritico = Cs.length ? Math.min(...Cs) : 0;
    // Total exigido do pavimento: aplica o mínimo da norma apenas no agrupado
    const totalUp = cCritico ? Math.max(upMin, ceil(populacao_total / cCritico)) : 0;
    // Largura exigida = máximo entre (UP × 0,55 m) e o mínimo absoluto da norma
    const totalLarg = Math.max(minW, round2(totalUp * UP_METROS));

    return {
      mode,
      label,
      min_largura: minW,
      c_critico: cCritico,
      total_up: totalUp,
      total_largura_m: totalLarg,
      por_ambiente: por_amb
    };
  });

  // Verificação: somatório das UPs reais por TIPO. Cada elemento real contribui com
  // floor(largura / UP) UPs, pois só UPs inteiras são contadas (item 5.4.1 NPT 011).
  // Em seguida, o total é comparado com o UP exigido do bloco/pavimento.
  const verificacao: VerificacaoPavimento[] = dimensionamento.map((dim) => {
    const reais = p.saidas_reais.filter((s) => s.tipo === dim.mode);
    const larguraReal = reais.reduce(
      (s, x) => s + (Number(x.largura_m) || 0) * (Number(x.quantidade) || 0),
      0
    );
    // SOMA das UPs por elemento (cada elemento arredondado para baixo na sua UP)
    const upReal = reais.reduce((s, x) => {
      const upPorElemento = Math.floor((Number(x.largura_m) || 0) / UP_METROS);
      return s + upPorElemento * (Number(x.quantidade) || 0);
    }, 0);
    const qtd = reais.reduce((s, x) => s + (Number(x.quantidade) || 0), 0);
    const detalhes =
      reais.length === 0
        ? 'Nenhum elemento informado'
        : reais
            .map((x) => {
              const upEl = Math.floor((Number(x.largura_m) || 0) / UP_METROS);
              return `${x.identificacao || COMPONENTE_LABEL[x.tipo]} ${round2(x.largura_m)} m × ${x.quantidade} (${upEl} UP cada)`;
            })
            .join(' • ');
    return {
      tipo: dim.mode,
      label: dim.label,
      up_exigido: dim.total_up,
      largura_exigida_m: dim.total_largura_m,
      up_real: upReal,
      largura_real_m: round2(larguraReal),
      atende: upReal >= dim.total_up && larguraReal >= dim.total_largura_m,
      quantidade_elementos: qtd,
      detalhes
    };
  });

  // Verificação consolidada: soma todas as UPs reais do bloco (porta + escada + acesso)
  // e compara com o componente mais restritivo. Permite que escadas/rampas/acessos
  // ajudem a atender o exigido das portas (e vice-versa) quando estão no mesmo bloco de saída.
  let verificacao_consolidada: VerificacaoConsolidada | null = null;
  if (dimensionamento.length > 0) {
    const componentes = dimensionamento.map((dim) => {
      const reais = p.saidas_reais.filter((s) => s.tipo === dim.mode);
      const up = reais.reduce((s, x) => {
        const upPorEl = Math.floor((Number(x.largura_m) || 0) / UP_METROS);
        return s + upPorEl * (Number(x.quantidade) || 0);
      }, 0);
      const qtd = reais.reduce((s, x) => s + (Number(x.quantidade) || 0), 0);
      return { tipo: dim.mode, label: dim.label, up, quantidade: qtd };
    });
    const upTotalReal = componentes.reduce((s, c) => s + c.up, 0);
    // Componente mais restritivo: aquele com maior UP exigido
    const maisRestritivo = dimensionamento.reduce((acc, d) =>
      d.total_up > acc.total_up ? d : acc
    );
    verificacao_consolidada = {
      up_exigido: maisRestritivo.total_up,
      tipo_mais_restritivo: maisRestritivo.mode,
      up_real_total: upTotalReal,
      componentes,
      atende: upTotalReal >= maisRestritivo.total_up
    };
  }

  return {
    pavimento_id: p.id,
    label: p.label,
    populacao_total,
    por_ambiente,
    dimensionamento,
    verificacao,
    verificacao_consolidada
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function dimensionarTodos(
  pavs: Pavimento[],
  data: Record<string, DivCsicipSaida> = DATA_SAIDAS
): DimPavimento[] {
  return pavs.map((p) => dimensionarPavimento(p, data));
}

export function populacaoGlobal(
  pavs: Pavimento[],
  data: Record<string, DivCsicipSaida> = DATA_SAIDAS
): number {
  return pavs.reduce((s, p) => s + dimensionarPavimento(p, data).populacao_total, 0);
}

// Helpers para criação de itens vazios

export function novoPavimento(id: number, label?: string): Pavimento {
  return {
    id,
    label: label || `Pavimento ${id}`,
    componentes_ativos: { porta: true, escada: false, acesso: false },
    ambientes: [{ id: 1, nome: '', div: '', area: 0, excluir: 0 }],
    saidas_reais: []
  };
}

export function novoAmbiente(id: number): Ambiente {
  return { id, nome: '', div: '', area: 0, excluir: 0, dormitorios: 0, uso_leiaute: false, assentos: 0 };
}

export function novaSaidaReal(id: number, tipo: ComponenteSaida = 'porta'): SaidaReal {
  return { id, tipo, identificacao: '', largura_m: 0, quantidade: 1 };
}
