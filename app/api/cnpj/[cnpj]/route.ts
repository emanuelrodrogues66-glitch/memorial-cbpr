// GET /api/cnpj/[cnpj] - busca dados do CNPJ via BrasilAPI
// Inclui CNAE principal, razao social, cidade etc.
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, ctx: { params: { cnpj: string } }) {
  const raw = ctx.params.cnpj || '';
  const cnpj = raw.replace(/\D/g, '');
  if (cnpj.length !== 14) {
    return NextResponse.json({ error: 'CNPJ inválido' }, { status: 400 });
  }

  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
      headers: { 'User-Agent': 'memorial-cbpr/1.0' },
      next: { revalidate: 86400 }
    });

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json({ error: 'CNPJ não encontrado' }, { status: 404 });
      }
      return NextResponse.json(
        { error: 'Erro ao consultar BrasilAPI', status: res.status },
        { status: 502 }
      );
    }

    const data = await res.json();
    const cnaePrincipal = String(data.cnae_fiscal || '');
    const cnaeFormatado = formatarCnae(cnaePrincipal);

    return NextResponse.json({
      cnpj,
      razao_social: data.razao_social || '',
      nome_fantasia: data.nome_fantasia || '',
      cnae_principal: cnaeFormatado,
      cnae_principal_descricao: data.cnae_fiscal_descricao || '',
      cidade: data.municipio || '',
      uf: data.uf || '',
      situacao: data.descricao_situacao_cadastral || '',
      porte: data.porte || '',
      cnaes_secundarios: Array.isArray(data.cnaes_secundarios)
        ? data.cnaes_secundarios.map((c: any) => ({
            codigo: formatarCnae(String(c.codigo || '')),
            descricao: c.descricao || ''
          }))
        : []
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Erro ao buscar CNPJ', detail: e?.message },
      { status: 500 }
    );
  }
}

// 8112500 -> 8112-5/00
function formatarCnae(c: string): string {
  const d = c.replace(/\D/g, '');
  if (d.length !== 7) return c;
  return `${d.slice(0, 4)}-${d.slice(4, 5)}/${d.slice(5, 7)}`;
}
