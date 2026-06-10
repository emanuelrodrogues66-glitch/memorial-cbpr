// Helpers para a página pública de consulta de exigências CSCIP
import { getMedidasCSCIP, MedidaCSCIP } from './cscip-medidas';
import { classificar, type ClassificacaoResultado } from './classificar-npt001';

export type LeadInput = {
  // Cliente
  nome: string;
  telefone: string;             // OBRIGATORIO
  email?: string | null;        // opcional
  cnpj?: string | null;
  razao_social?: string | null;
  // Edificacao - basico
  cnae?: string | null;
  cnae_descricao?: string | null;
  divisao: string;
  area_m2: number;
  altura_m: number;
  cidade?: string | null;
  // NPT 001/002
  ano_construcao?: number | null;
  tem_certificacao_anterior?: boolean;
  populacao?: number | null;
  tem_subsolo_computado?: boolean;
  liquido_inflamavel_litros?: number | null;
  glp_kg?: number | null;
  tem_hidrantes_instalados?: boolean;
};

export type LeadResultado = {
  medidas: MedidaCSCIP[];
  simplificada: boolean;
  classificacao: ClassificacaoResultado;
};

export function calcularExigencias(input: LeadInput): LeadResultado {
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
