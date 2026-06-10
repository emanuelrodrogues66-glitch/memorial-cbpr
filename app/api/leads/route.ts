// API publica para criar leads (consultas de clientes)
// POST /api/leads — qualquer pessoa pode chamar (RLS controla)

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { calcularExigencias } from '@/lib/leads';
import { rotuloModalidade } from '@/lib/classificar-npt001';

const LeadSchema = z.object({
  // Cliente
  nome: z.string().min(3),
  telefone: z.string().min(8),
  email: z.string().email().optional().nullable(),
  cnpj: z.string().optional().nullable(),
  razao_social: z.string().optional().nullable(),
  // Edificacao
  cnae: z.string().optional().nullable(),
  cnae_descricao: z.string().optional().nullable(),
  divisao: z.string().regex(/^[A-M]-\d{1,2}$/),
  area_m2: z.number().positive(),
  altura_m: z.number().min(0),
  cidade: z.string().optional().nullable(),
  // NPT 001/002
  ano_construcao: z.number().int().min(1800).max(2100).optional().nullable(),
  tem_certificacao_anterior: z.boolean().optional().default(false),
  tem_subsolo_computado: z.boolean().optional().default(false),
  liquido_inflamavel_litros: z.number().nonnegative().optional().nullable(),
  glp_kg: z.number().nonnegative().optional().nullable(),
  tem_hidrantes_instalados: z.boolean().optional().default(false),
  populacao: z.number().int().nonnegative().optional().nullable()
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const parsed = LeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', detalhes: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const lead = parsed.data;

  // Calcula exigencias + classificacao NPT 001
  const { medidas, simplificada, classificacao } = calcularExigencias({
    nome: lead.nome,
    telefone: lead.telefone,
    divisao: lead.divisao,
    area_m2: lead.area_m2,
    altura_m: lead.altura_m,
    populacao: lead.populacao,
    ano_construcao: lead.ano_construcao,
    tem_certificacao_anterior: lead.tem_certificacao_anterior,
    tem_subsolo_computado: lead.tem_subsolo_computado,
    liquido_inflamavel_litros: lead.liquido_inflamavel_litros,
    glp_kg: lead.glp_kg,
    tem_hidrantes_instalados: lead.tem_hidrantes_instalados
  });

  // Concatena telefone e email no campo contato (compat) e salva separados tambem
  const contatoTexto = lead.email ? `${lead.telefone} · ${lead.email}` : lead.telefone;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supa = createSupabaseClient(url, anon);

  const { data, error } = await supa
    .from('leads')
    .insert({
      nome: lead.nome,
      contato: contatoTexto,
      telefone: lead.telefone,
      email: lead.email || null,
      cnpj: lead.cnpj || null,
      razao_social: lead.razao_social || null,
      cnae: lead.cnae || null,
      cnae_descricao: lead.cnae_descricao || null,
      divisao: lead.divisao,
      area_m2: lead.area_m2,
      altura_m: lead.altura_m,
      cidade: lead.cidade || null,
      ano_construcao: lead.ano_construcao || null,
      tem_certificacao_anterior: lead.tem_certificacao_anterior || false,
      tem_subsolo_computado: lead.tem_subsolo_computado || false,
      liquido_inflamavel_litros: lead.liquido_inflamavel_litros || null,
      glp_kg: lead.glp_kg || null,
      tem_hidrantes_instalados: lead.tem_hidrantes_instalados || false,
      populacao: lead.populacao || null,
      medidas,
      simplificada,
      modalidade: classificacao.modalidade,
      tipo_edificacao: classificacao.tipo_edificacao,
      justificativas: classificacao.justificativas,
      status: 'novo'
    })
    .select('id, created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Erro ao salvar', detail: error.message }, { status: 500 });
  }

  try {
    await notificarLeadNovo(lead, medidas, simplificada, classificacao);
  } catch (e) {
    console.error('Falha ao notificar lead:', e);
  }

  return NextResponse.json({
    id: data.id,
    created_at: data.created_at,
    medidas,
    simplificada,
    classificacao
  });
}

async function notificarLeadNovo(
  lead: z.infer<typeof LeadSchema>,
  medidas: Array<{ nome: string; status: string; observacao?: string }>,
  simplificada: boolean,
  classificacao: ReturnType<typeof calcularExigencias>['classificacao']
) {
  const apiKey = process.env.RESEND_API_KEY;
  const destino = process.env.LEAD_NOTIFICATION_EMAIL || 'emanuelrodrogues66@gmail.com';
  if (!apiKey) {
    console.log('[lead-notif] RESEND_API_KEY não configurada — pulando email');
    return;
  }

  const exigidas = medidas.filter((m) => m.status === 'EXIGIDO').length;
  const condicionais = medidas.filter((m) => m.status === 'CONDICIONAL').length;

  const html = `
    <h2>Novo lead — Memorial CBPR</h2>
    <p><strong>${escapeHtml(lead.nome)}</strong> consultou as exigências para uma edificação.</p>
    <p style="background:#01696F;color:white;padding:10px;border-radius:4px;font-weight:bold;display:inline-block">
      Modalidade exigida: ${rotuloModalidade(classificacao.modalidade)}
    </p>
    <h3>Cliente</h3>
    <ul>
      <li>Nome: ${escapeHtml(lead.nome)}</li>
      <li>Telefone: ${escapeHtml(lead.telefone)}</li>
      ${lead.email ? `<li>Email: ${escapeHtml(lead.email)}</li>` : ''}
      ${lead.cnpj ? `<li>CNPJ: ${escapeHtml(lead.cnpj)}</li>` : ''}
      ${lead.razao_social ? `<li>Empresa: ${escapeHtml(lead.razao_social)}</li>` : ''}
    </ul>
    <h3>Edificação</h3>
    <ul>
      <li>Divisão CSCIP: <strong>${lead.divisao}</strong></li>
      ${lead.cnae ? `<li>CNAE: ${escapeHtml(lead.cnae)} — ${escapeHtml(lead.cnae_descricao || '')}</li>` : ''}
      <li>Área: ${lead.area_m2} m²</li>
      <li>Altura: ${lead.altura_m} m</li>
      ${lead.cidade ? `<li>Cidade: ${escapeHtml(lead.cidade)}</li>` : ''}
      <li>Tipo: ${classificacao.tipo_edificacao}</li>
    </ul>
    <h3>Por que ${rotuloModalidade(classificacao.modalidade)}?</h3>
    <ul>
      ${classificacao.justificativas.map((j) => `<li>${escapeHtml(j)}</li>`).join('')}
    </ul>
    <h3>Resumo de medidas</h3>
    <ul>
      <li>${exigidas} exigidas, ${condicionais} condicionais</li>
      ${simplificada ? '<li>Edificação simplificada</li>' : ''}
    </ul>
    <p>Acesse o painel <a href="https://memorial-cbpr.vercel.app/leads">memorial-cbpr.vercel.app/leads</a> para ver detalhes e entrar em contato.</p>
  `;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || 'Memorial CBPR <onboarding@resend.dev>',
      to: destino,
      subject: `Novo lead [${rotuloModalidade(classificacao.modalidade)}]: ${lead.nome} - ${lead.divisao}`,
      html
    })
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
