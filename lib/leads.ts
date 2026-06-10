// Helpers para a página pública de consulta de exigências CSCIP
import { getMedidasCSCIP, MedidaCSCIP } from './cscip-medidas';

export type LeadInput = {
  // Cliente
  nome: string;
  contato: string;
  cnpj?: string;
  // Edificação
  cnae?: string;
  cnae_descricao?: string;
  divisao: string;
  area_m2: number;
  altura_m: number;
  cidade?: string;
};

export type LeadResultado = {
  medidas: MedidaCSCIP[];
  simplificada: boolean;
};

export function calcularExigencias(input: Pick<LeadInput, 'divisao' | 'area_m2' | 'altura_m'>): LeadResultado {
  return getMedidasCSCIP(input.divisao, input.area_m2, input.altura_m);
}

export function validarLead(input: Partial<LeadInput>): string | null {
  if (!input.nome || input.nome.trim().length < 3) return 'Informe o nome completo';
  if (!input.contato || input.contato.trim().length < 5) return 'Informe um contato válido (telefone ou email)';
  if (!input.divisao) return 'Selecione a ocupação (divisão CSCIP)';
  if (!input.area_m2 || input.area_m2 <= 0) return 'Informe a área em m²';
  if (input.altura_m == null || input.altura_m < 0) return 'Informe a altura em metros';
  return null;
}

export function formatarCnpj(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}
