// Tipos do domínio do Memorial Descritivo CBPR

export type CnaeRow = {
  cnae: string;
  grupo: string;
  ocupacao: string;
  descricao: string;
  divisao: string;
  carga_incendio_mj_m2: number | null;
  exemplos: string;
};

export type Npt008Row = {
  grupo: string;
  ocupacao: string;
  divisao: string;
  trrf: Record<string, number | null>;
};

export type Npt011Row = {
  divisao: string;
  grupo: string;
  grupo_descricao: string;
  populacao_descricao: string;
  densidade_m2_por_pessoa: number | null;
  capacidade_unidade_passagem: {
    acesso_descarga: number | null;
    escada: number | null;
    rampa: number | null;
    porta: number | null;
  };
};

export type TipoAltura = {
  tipo: string;
  descricao: string;
  altura_min: number;
  altura_max: number | null;
};

export type RiscoIncendio = 'BAIXO' | 'MEDIO' | 'ALTO';

export type DadosObra = {
  // 1. Dados da obra
  nome_obra: string;
  proprietario: string;
  cpf_cnpj: string;
  endereco: string;
  cidade: string;
  uf: string;
  cep: string;
  telefone: string;
  email_contato: string;

  // 2. Classificação
  cnae: string;
  grupo: string;
  ocupacao: string;
  divisao: string;
  descricao_atividade: string;
  carga_incendio_mj_m2: number;

  // 3. Características
  area_total_m2: number;
  area_construida_m2: number;
  altura_edificacao_m: number;
  numero_pavimentos: number;
  tipo_edificacao: string; // I, II, III...
  classe_npt008: string; // Classe S1/P1/...
  trrf_minutos: number | null;
  risco_incendio: RiscoIncendio;

  // 4. Saídas / população
  populacao_calculada: number;
  populacao_descricao_npt011: string;
  unidades_passagem_acesso: number;
  unidades_passagem_escada: number;
  unidades_passagem_porta: number;
  // 4b. Memorial de saídas detalhado (novo modelo NPT 011)
  saidas_pavimentos?: any[]; // Pavimento[] de lib/saidas-npt011.ts

  // 4c. Memorial de carga de incêndio (média ponderada por área)
  carga_incendio_itens?: any[]; // ItemCargaIncendio[]

  // 5. Brigada
  brigadistas_necessarios: number;
  brigadistas_descricao: string;

  // 6. Medidas / responsável
  medidas_protecao: string[];
  responsavel_tecnico: string;
  crea_resp: string;
  observacoes: string;

  // 7. Dados complementares (ofício, memorial construção, informações operacionais, acesso, termo)
  oficio_local?: string;
  oficio_data?: string;
  memorial_construcao?: MemorialConstrucao;
  info_operacional?: InformacoesOperacionais;
  acesso_viaturas?: AcessoViaturas;
  termo_saidas?: TermoSaidas;
};

export type MemorialConstrucao = {
  estruturas?: string;
  alvenarias?: string;
  compartimentacoes?: string;
  compartimentos?: string;
  instalacoes?: string;
  vidros?: string;
  medidas_seguranca?: string;
};

export type InformacoesOperacionais = {
  tipo_estrutura?: string;
  acabamento_paredes?: string;
  acabamento_pisos?: string;
  cobertura?: string;
  populacao_fixa?: string;
  populacao_flutuante?: string;
  ponto_encontro?: string;
  caracteristicas_funcionamento?: string;
  horario_funcionamento?: string;
  vias_acesso?: string;
  numero_brigadistas?: string;
  brigadista_profissional?: string;
  encarregado_seguranca?: string;
  telefone_emergencia?: string;
  sistemas_instalados?: Record<string, string>; // mapa de nome→sim/não/detalhe
  reserva_consumo?: string;
  reserva_rti?: string;
  reserva_total?: string;
  posto_bombeiros?: string;
  riscos_especiais?: Record<string, string>;
  outros_riscos?: string;
  outras_informacoes?: string;
};

export type AcessoViaturas = {
  largura_via_m?: number;
  altura_portao_m?: number;
  largura_portao_m?: number;
  observacoes?: string;
};

export type TermoSaidas = {
  observacoes?: string;
};

export type Projeto = {
  id: string;
  user_id: string;
  nome_obra: string;
  status: string;
  dados: Partial<DadosObra>;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  full_name: string | null;
  empresa: string | null;
  cnpj: string | null;
  crea: string | null;
  telefone: string | null;
  email: string | null;
};
