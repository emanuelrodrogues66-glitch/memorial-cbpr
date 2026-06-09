// Gera planilha XLSX preenchida
import ExcelJS from 'exceljs';
import { getMedidasCSCIP } from './cscip-medidas';

function medidasComStatusXlsx(
  d: any
): { nome: string; status: 'EXIGIDO' | 'CONDICIONAL'; observacao?: string }[] {
  const escolhidas = new Set<string>(d.medidas_protecao ?? []);
  const lista = getMedidasCSCIP(
    d.divisao ?? '',
    Number(d.area_construida_m2) || 0,
    Number(d.altura_edificacao_m) || 0
  ).medidas;
  if (lista.length === 0) {
    return (d.medidas_protecao ?? []).map((nome: string) => ({
      nome,
      status: 'EXIGIDO' as const
    }));
  }
  const out: { nome: string; status: 'EXIGIDO' | 'CONDICIONAL'; observacao?: string }[] = [];
  for (const m of lista) {
    if (m.status === 'EXIGIDO') out.push({ nome: m.nome, status: 'EXIGIDO', observacao: m.observacao });
    else if (m.status === 'CONDICIONAL' && escolhidas.has(m.nome))
      out.push({ nome: m.nome, status: 'CONDICIONAL', observacao: m.observacao });
  }
  return out;
}

export async function gerarXlsxBlob(d: any): Promise<Blob> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Memorial CBPR';
  wb.created = new Date();

  const ws = wb.addWorksheet('Memorial', {
    properties: { defaultRowHeight: 18 },
    pageSetup: { paperSize: 9, orientation: 'portrait' }
  });
  ws.getColumn(1).width = 4;
  ws.getColumn(2).width = 32;
  ws.getColumn(3).width = 60;

  let r = 2;

  function titulo(t: string) {
    const cell = ws.getCell(r, 2);
    cell.value = t;
    cell.font = { bold: true, size: 14, color: { argb: 'FF28251D' } };
    ws.mergeCells(r, 2, r, 3);
    r++;
  }
  function secao(t: string) {
    r++;
    const cell = ws.getCell(r, 2);
    cell.value = t;
    cell.font = { bold: true, size: 12, color: { argb: 'FF01696F' } };
    ws.mergeCells(r, 2, r, 3);
    r++;
  }
  function par(k: string, v: any) {
    const cellK = ws.getCell(r, 2);
    const cellV = ws.getCell(r, 3);
    cellK.value = k;
    cellK.font = { color: { argb: 'FF7A7974' } };
    cellV.value = v == null || v === '' ? '—' : v;
    cellV.font = { bold: true };
    cellV.alignment = { wrapText: true, vertical: 'top' };
    [cellK, cellV].forEach(c => {
      c.border = { bottom: { style: 'thin', color: { argb: 'FFD4D1CA' } } };
    });
    r++;
  }

  titulo('Memorial Descritivo de Segurança Contra Incêndio');
  ws.getCell(r, 2).value = 'NPTs 005 / 008 / 011 / 017 — CBPR';
  ws.getCell(r, 2).font = { italic: true, color: { argb: 'FF7A7974' }, size: 10 };
  ws.mergeCells(r, 2, r, 3);
  r++;

  secao('1. Dados da obra');
  par('Nome da obra', d.nome_obra);
  par('Proprietário', d.proprietario);
  par('CPF / CNPJ', d.cpf_cnpj);
  par('Endereço', d.endereco);
  par('Cidade / UF', `${d.cidade ?? ''} / ${d.uf ?? ''}`);
  par('CEP', d.cep);
  par('Telefone', d.telefone);
  par('E-mail', d.email_contato);

  secao('2. Classificação');
  par('CNAE', d.cnae);
  par('Atividade', d.descricao_atividade);
  par('Grupo / Ocupação', `${d.grupo ?? ''} • ${d.ocupacao ?? ''}`);
  par('Divisão', d.divisao);
  par('Carga de incêndio', d.carga_incendio_mj_m2 ? `${d.carga_incendio_mj_m2} MJ/m²` : '—');
  par('Risco', d.risco_incendio);

  secao('3. Características físicas');
  par('Área do terreno (m²)', d.area_total_m2 || 0);
  par('Área construída (m²)', d.area_construida_m2 || 0);
  par('Altura (m)', d.altura_edificacao_m || 0);
  par('Pavimentos', d.numero_pavimentos || 1);
  par('Tipo (NPT 005)', d.tipo_edificacao);
  par('Classe (NPT 008)', d.classe_npt008);
  par('TRRF (min)', d.trrf_minutos);

  secao('4. População e saídas (NPT 011)');
  par('População', d.populacao_calculada);
  par('Critério', d.populacao_descricao_npt011);
  par('Unid. passagem — acesso/descarga', d.unidades_passagem_acesso);
  par('Unid. passagem — escada', d.unidades_passagem_escada);
  par('Unid. passagem — porta', d.unidades_passagem_porta);

  secao('5. Brigada (NPT 017)');
  par('Brigadistas', d.brigadistas_necessarios);
  par('Critério', d.brigadistas_descricao);

  secao('6. Medidas de segurança contra incêndio (CSCIP/PR)');
  medidasComStatusXlsx(d).forEach((m) => {
    const tag = m.status === 'EXIGIDO' ? 'Exigido' : 'Condicional';
    par(tag, m.observacao ? `${m.nome} — ${m.observacao}` : m.nome);
  });

  secao('7. Responsável técnico');
  par('Nome', d.responsavel_tecnico);
  par('CREA / CAU', d.crea_resp);
  if (d.observacoes) {
    secao('Observações');
    ws.getCell(r, 2).value = d.observacoes;
    ws.getCell(r, 2).alignment = { wrapText: true };
    ws.mergeCells(r, 2, r, 3);
    r++;
  }

  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
}
