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

    const enderecoCompleto = [
      data.logradouro,
      data.numero,
      data.complemento,
      data.bairro
    ].filter(Boolean).join(', ');

    return NextResponse.json({
      cnpj,
      razao_social: data.razao_social || '',
      nome_fantasia: data.nome_fantasia || '',
      cnae_principal: cnaeFormatado,
      cnae_principal_descricao: data.cnae_fiscal_descricao || '',
      endereco: enderecoCompleto,
      cidade: data.municipio || '',
      uf: data.uf || '',
      cep: formatarCep(String(data.cep || '')),
      telefone: formatarTelefone(String(data.ddd_telefone_1 || '')),
      email: data.email || '',
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

// 80000000 -> 80000-000
function formatarCep(c: string): string {
  const d = c.replace(/\D/g, '');
  if (d.length !== 8) return c;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

// 4399999999 -> (43) 99999-9999  ou  4332220000 -> (43) 3222-0000
function formatarTelefone(t: string): string {
  const d = t.replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return t;
}
