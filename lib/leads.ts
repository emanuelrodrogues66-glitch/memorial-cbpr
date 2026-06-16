// Helpers para a página pública de consulta de exigências CSCIP/IN 01
import { getMedidasCSCIP, MedidaCSCIP } from './cscip-medidas';
import { classificar, type ClassificacaoResultado, type Modalidade } from './classificar-npt001';
import {
  classificarRiscoSC,
  medidasSCParaImovel,
  type ClassificacaoSCResultado
} from './classificar-in01-sc';
import type { UF } from './cbmsc';

export type LeadInput = {
  // Cliente
  nome: string;
  telefone: string;             // OBRIGATORIO
  email?: string | null;        // opcional
  cnpj?: string | null;
  razao_social?: string | null;
  // Edificacao - basico
  uf?: UF;                      // PR (default) | SC
  cnae?: string | null;
  cnae_descricao?: string | null;
  divisao: string;
  area_m2: number;
  altura_m: number;
  cidade?: string | null;
  // NPT 001/002 (PR) ou IN 01 (SC)
  ano_construcao?: number | null;
  tem_certificacao_anterior?: boolean;
  populacao?: number | null;
  tem_subsolo_computado?: boolean;
  liquido_inflamavel_litros?: number | null;
  glp_kg?: number | null;
  tem_hidrantes_instalados?: boolean;
  // Adicionais SC (IN 01 PT 01)
  pavimentos?: number | null;
  liquido_inflamavel_externo_m3?: number | null;
  carga_incendio_mj_m2?: number | null;
  tem_substancia_radioativa?: boolean;
  tem_explosivos?: boolean;
  tem_pirotecnico?: boolean;
  tem_municao?: boolean;
  residencia_unifamiliar?: boolean;
  empregados?: number | null;
  unidades_condominio_horizontal?: number | null;
};

export type LeadResultado = {
  medidas: MedidaCSCIP[];
  simplificada: boolean;
  classificacao: ClassificacaoResultado;
  // Opcional: presente apenas quando uf === 'SC'
  classificacao_sc?: ClassificacaoSCResultado;
};

// Converte resultado SC (Risco I-V) em uma estrutura compatível com ClassificacaoResultado
// para que o frontend existente continue funcionando.
function modalidadeFromRiscoSC(risco: ClassificacaoSCResultado['risco']): Modalidade {
  switch (risco) {
    case 'I': return 'DISPENSA';
    case 'II': return 'MEMORIAL_SIMPLIFICADO';
    case 'III': return 'MEMORIAL_SIMPLIFICADO';
    case 'IV': return 'PTPID';
    case 'V': return 'PTPID';
  }
}

export function calcularExigencias(input: LeadInput): LeadResultado {
  const uf: UF = (input.uf || 'PR') as UF;

  if (uf === 'SC') {
    // Classificação SC pela IN 01 PT 01
    const scClass = classificarRiscoSC({
      divisao: input.divisao,
      area_m2: input.area_m2,
      altura_m: input.altura_m,
      pavimentos: input.pavimentos,
      populacao: input.populacao,
      ano_construcao: input.ano_construcao,
      tem_certificacao_anterior: input.tem_certificacao_anterior,
      liquido_inflamavel_litros: input.liquido_inflamavel_litros,
      liquido_inflamavel_externo_m3: input.liquido_inflamavel_externo_m3,
      glp_kg: input.glp_kg,
      carga_incendio_mj_m2: input.carga_incendio_mj_m2,
      tem_substancia_radioativa: input.tem_substancia_radioativa,
      tem_explosivos: input.tem_explosivos,
      tem_pirotecnico: input.tem_pirotecnico,
      tem_municao: input.tem_municao,
      residencia_unifamiliar: input.residencia_unifamiliar,
      empregados: input.empregados,
      unidades_condominio_horizontal: input.unidades_condominio_horizontal
    });
    // SMSCI pela IN 01 PT 02
    const m = medidasSCParaImovel(input.divisao, input.area_m2, input.altura_m, input.populacao);

    // Adapta para ClassificacaoResultado para compat com o frontend existente
    const c: ClassificacaoResultado = {
      modalidade: modalidadeFromRiscoSC(scClass.risco),
      tipo_edificacao: 'NOVA',
      justificativas: scClass.justificativas,
      observacoes: scClass.observacoes
    };

    return {
      medidas: m.medidas,
      simplificada: m.simplificada,
      classificacao: c,
      classificacao_sc: scClass
    };
  }

  // PR (CBMPR) - fluxo original
  const m = getMedidasCSCIP(input.divisao, input.area_m2, input.altura_m);
  const c = classificar({
    divisao: input.divisao,
    area_m2: input.area_m2,
    altura_m: input.altura_m,
    populacao: input.populacao,
    ano_construcao: input.ano_construcao,
    tem_certificacao_anterior: input.tem_certificacao_anterior,
    tem_subsolo_computado: input.tem_subsolo_computado,
    liquido_inflamavel_litros: input.liquido_inflamavel_litros,
    glp_kg: input.glp_kg,
    tem_hidrantes_instalados: input.tem_hidrantes_instalados
  });
  return { medidas: m.medidas, simplificada: m.simplificada, classificacao: c };
}

export function formatarCnpj(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export function formatarTelefone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
