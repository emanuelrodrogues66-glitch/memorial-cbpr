// Download de PDF do lead (publico - id e UUID, dificil de adivinhar)
import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { gerarPdfLead } from '@/lib/gerar-pdf-lead';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  const { id } = ctx.params;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: 'ID invalido' }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  // Usa service_role para conseguir ler o lead sem login (id e UUID secreto)
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supa = createSupabaseClient(url, key);

  const { data, error } = await supa
    .from('leads')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Lead nao encontrado' }, { status: 404 });
  }

  try {
    const pdf = await gerarPdfLead({
      nome: data.nome,
      telefone: data.telefone,
      email: data.email,
      contato: data.contato,
      cnpj: data.cnpj,
      razao_social: data.razao_social,
      cnae: data.cnae,
      cnae_descricao: data.cnae_descricao,
      uf: data.uf || 'PR',
      divisao: data.divisao,
      area_m2: Number(data.area_m2),
      altura_m: Number(data.altura_m),
      cidade: data.cidade,
      ano_construcao: data.ano_construcao,
      populacao: data.populacao,
      medidas: data.medidas || [],
      simplificada: !!data.simplificada,
      modalidade: data.modalidade,
      tipo_edificacao: data.tipo_edificacao,
      justificativas: data.justificativas || [],
      created_at: data.created_at
    });

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="exigencias-${data.divisao}-${id.slice(0, 8)}.pdf"`,
        'Cache-Control': 'private, max-age=0'
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'Erro ao gerar PDF', detail: e?.message }, { status: 500 });
  }
}
