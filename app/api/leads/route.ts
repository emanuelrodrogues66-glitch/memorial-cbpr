// API publica para criar leads (consultas de clientes)
// POST /api/leads — qualquer pessoa pode chamar (RLS controla)

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { calcularExigencias } from '@/lib/leads';

const LeadSchema = z.object({
  nome: z.string().min(3),
  contato: z.string().min(5),
  cnpj: z.string().optional().nullable(),
  cnae: z.string().optional().nullable(),
  cnae_descricao: z.string().optional().nullable(),
  divisao: z.string().regex(/^[A-M]-\d{1,2}$/),
  area_m2: z.number().positive(),
  altura_m: z.number().min(0),
  cidade: z.string().optional().nullable()
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

  // Calcula exigências
  const { medidas, simplificada } = calcularExigencias({
    divisao: lead.divisao,
    area_m2: lead.area_m2,
    altura_m: lead.altura_m
  });

  // Salva no Supabase (anon key — RLS permite insert público)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supa = createSupabaseClient(url, anon);

  const { data, error } = await supa
    .from('leads')
    .insert({
      nome: lead.nome,
      contato: lead.contato,
      cnpj: lead.cnpj || null,
      cnae: lead.cnae || null,
      cnae_descricao: lead.cnae_descricao || null,
      divisao: lead.divisao,
      area_m2: lead.area_m2,
      altura_m: lead.altura_m,
      cidade: lead.cidade || null,
      medidas,
      simplificada,
      status: 'novo'
    })
    .select('id, created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Erro ao salvar', detail: error.message }, { status: 500 });
  }

  // Notificação por email (Resend ou similar — falha silenciosa)
  try {
    await notificarLeadNovo(lead, medidas, simplificada);
  } catch (e) {
    console.error('Falha ao notificar lead:', e);
  }

  return NextResponse.json({
    id: data.id,
    created_at: data.created_at,
    medidas,
    simplificada
  });
}

async function notificarLeadNovo(
  lead: z.infer<typeof LeadSchema>,
  medidas: Array<{ nome: string; status: string; observacao?: string }>,
  simplificada: boolean
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
    <p><strong>${lead.nome}</strong> consultou as exigências para uma edificação.</p>
    <h3>Cliente</h3>
    <ul>
      <li>Nome: ${escapeHtml(lead.nome)}</li>
      <li>Contato: ${escapeHtml(lead.contato)}</li>
      ${lead.cnpj ? `<li>CNPJ: ${escapeHtml(lead.cnpj)}</li>` : ''}
    </ul>
    <h3>Edificação</h3>
    <ul>
      <li>Divisão CSCIP: <strong>${lead.divisao}</strong></li>
      ${lead.cnae ? `<li>CNAE: ${escapeHtml(lead.cnae)} — ${escapeHtml(lead.cnae_descricao || '')}</li>` : ''}
      <li>Área: ${lead.area_m2} m²</li>
      <li>Altura: ${lead.altura_m} m</li>
      ${lead.cidade ? `<li>Cidade: ${escapeHtml(lead.cidade)}</li>` : ''}
    </ul>
    <h3>Resultado</h3>
    <ul>
      <li>Edificação ${simplificada ? '<strong>simplificada</strong>' : 'não simplificada'}</li>
      <li>${exigidas} medidas exigidas, ${condicionais} condicionais</li>
    </ul>
    <p>Acesse o painel para ver detalhes e entrar em contato.</p>
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
      subject: `Novo lead: ${lead.nome} (${lead.divisao})`,
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
