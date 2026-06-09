// Lista de seções que podem compor o memorial completo
export type SecaoMemorial =
  | 'oficio'
  | 'classificacao'
  | 'memorial_construcao'
  | 'inf_operacional'
  | 'saidas'
  | 'carga_incendio'
  | 'brigada'
  | 'acesso_viaturas'
  | 'termo_saidas';

export const SECOES_MEMORIAL: { key: SecaoMemorial; label: string; descricao: string }[] = [
  { key: 'oficio', label: 'Ofício de apresentação', descricao: 'Capa endereçada ao CBMPR.' },
  { key: 'classificacao', label: 'Classificação e quadro de medidas', descricao: 'CNAE, grupo, divisão e medidas exigidas.' },
  { key: 'memorial_construcao', label: 'Memorial básico de construção', descricao: 'Estruturas, alvenarias, instalações.' },
  { key: 'inf_operacional', label: 'Informações operacionais', descricao: 'Planilha operacional da edificação.' },
  { key: 'saidas', label: 'Saídas de emergência (NPT 011)', descricao: 'Dimensionamento por pavimento.' },
  { key: 'carga_incendio', label: 'Carga de incêndio', descricao: 'Memorial de cálculo / média ponderada.' },
  { key: 'brigada', label: 'Brigada de incêndio (NPT 017)', descricao: 'Memorial de cálculo dos brigadistas.' },
  { key: 'acesso_viaturas', label: 'Acesso a viaturas (NPT 006)', descricao: 'Vias, portões e retornos.' },
  { key: 'termo_saidas', label: 'Termo das saídas de emergência', descricao: 'Termo de responsabilidade.' }
];

export const SECOES_TODAS: SecaoMemorial[] = SECOES_MEMORIAL.map((s) => s.key);

export function incluiSecao(secoes: SecaoMemorial[] | undefined, alvo: SecaoMemorial): boolean {
  if (!secoes || secoes.length === 0) return true; // default = todas
  return secoes.includes(alvo);
}
