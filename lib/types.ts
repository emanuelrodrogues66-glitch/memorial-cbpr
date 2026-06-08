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

  // 5. Brigada
  brigadistas_necessarios: number;
  brigadistas_descricao: string;

  // 6. Medidas / responsável
  medidas_protecao: string[];
  responsavel_tecnico: string;
  crea_resp: string;
  observacoes: string;
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
