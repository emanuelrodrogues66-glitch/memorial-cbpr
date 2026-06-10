// API autenticada para atualizar status ou excluir lead
// PATCH /api/leads/[id] — { status: 'novo'|'contatado'|'convertido'|'descartado' }
// DELETE /api/leads/[id]

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const STATUS_VALIDOS = ['novo', 'contatado', 'convertido', 'descartado'] as const;
type StatusLead = typeof STATUS_VALIDOS[number];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const status = String(body?.status || '').trim();
  if (!STATUS_VALIDOS.includes(status as StatusLead)) {
    return NextResponse.json(
      { error: `Status inválido. Use: ${STATUS_VALIDOS.join(', ')}` },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from('leads')
    .update({ status })
    .eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: 'Erro ao atualizar', detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, status });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: 'Erro ao excluir', detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
