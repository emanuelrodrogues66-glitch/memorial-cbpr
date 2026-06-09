// Gera planilha XLSX preenchida
import ExcelJS from 'exceljs';
import { getMedidasCSCIP } from './cscip-medidas';
import { dimensionarTodos, DATA_SAIDAS, type Pavimento } from './saidas-npt011';

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

  secao('4. Memorial de saídas (NPT 011)');
  const pavs: Pavimento[] = Array.isArray(d.saidas_pavimentos) ? d.saidas_pavimentos : [];
  if (pavs.length === 0) {
    par('População', d.populacao_calculada);
    par('Critério', d.populacao_descricao_npt011);
    par('Unid. passagem — acesso/descarga', d.unidades_passagem_acesso);
    par('Unid. passagem — escada', d.unidades_passagem_escada);
    par('Unid. passagem — porta', d.unidades_passagem_porta);
  } else {
    par('Pavimentos dimensionados', String(pavs.length));
    par('Detalhe', 'Ver aba "Saídas" para dimensionamento por pavimento e verificação.');
  }

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

  // Aba separada "Saídas" com tabelas no estilo da planilha original
  if (pavs.length > 0) {
    addAbaSaidas(wb, pavs);
  }

  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
}

function addAbaSaidas(wb: ExcelJS.Workbook, pavs: Pavimento[]) {
  const ws = wb.addWorksheet('Saídas', { properties: { defaultRowHeight: 18 } });
  ws.getColumn(1).width = 3;
  ws.getColumn(2).width = 22;
  ws.getColumn(3).width = 14;
  ws.getColumn(4).width = 12;
  ws.getColumn(5).width = 30;
  ws.getColumn(6).width = 18;

  const dims = dimensionarTodos(pavs);
  let r = 2;

  function setBorder(cells: ExcelJS.Cell[]) {
    cells.forEach((c) => {
      c.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });
  }

  for (const dim of dims) {
    // Título do pavimento
    const tCell = ws.getCell(r, 2);
    tCell.value = `DIMENSIONAMENTO DAS SAÍDAS — ${dim.label.toUpperCase()}`;
    tCell.font = { bold: true, size: 12 };
    ws.mergeCells(r, 2, r, 6);
    r++;

    // Cabeçalho da tabela
    const heads = ['AMBIENTE', 'OCUPAÇÃO', 'ÁREA', 'POPULAÇÃO/m²', 'POPULAÇÃO TOTAL'];
    heads.forEach((h, i) => {
      const c = ws.getCell(r, 2 + i);
      c.value = h;
      c.font = { bold: true };
      c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
    });
    setBorder([2, 3, 4, 5, 6].map((c) => ws.getCell(r, c)));
    r++;

    // Linhas de ambientes (com highlight amarelo como na imagem)
    for (const a of dim.por_ambiente) {
      ws.getCell(r, 2).value = a.nome;
      const cellDiv = ws.getCell(r, 3);
      cellDiv.value = a.divisao;
      cellDiv.alignment = { horizontal: 'center' };
      cellDiv.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };

      const cellArea = ws.getCell(r, 4);
      cellArea.value = a.net;
      cellArea.numFmt = '#,##0.00" m²"';
      cellArea.alignment = { horizontal: 'center' };
      cellArea.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };

      ws.getCell(r, 5).value = DATA_SAIDAS[a.divisao]?.pop ?? '—';
      ws.getCell(r, 5).alignment = { horizontal: 'center' };

      const cellPop = ws.getCell(r, 6);
      cellPop.value = `${a.pop} pessoas`;
      cellPop.alignment = { horizontal: 'center' };
      cellPop.font = { bold: true };

      setBorder([2, 3, 4, 5, 6].map((c) => ws.getCell(r, c)));
      r++;
    }
    r++;

    // Dimensionamento por componente (formato da imagem: OCUPAÇÃO, Porta, C: , P:)
    for (const comp of dim.dimensionamento) {
      const oc = ws.getCell(r, 2);
      oc.value = `OCUPAÇÃO — ${comp.label.toUpperCase()}`;
      oc.font = { bold: true };
      oc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
      ws.mergeCells(r, 2, r, 6);
      r++;

      const N = Math.max(1, Math.ceil(dim.populacao_total / Math.max(comp.c_critico, 1)));

      ws.getCell(r, 2).value = `C: ${comp.c_critico}`;
      ws.getCell(r, 3).value = `P: ${dim.populacao_total}`;
      ws.getCell(r, 4).value = `N = P/C`;
      ws.getCell(r, 5).value = `N = ${dim.populacao_total}/${comp.c_critico} = ${N}`;
      ws.getCell(r, 6).value = `${N} UP`;
      ws.getCell(r, 6).font = { bold: true };
      r++;

      const lg = ws.getCell(r, 2);
      lg.value = `Largura — ${comp.label.toLowerCase()}`;
      lg.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
      lg.font = { bold: true };
      ws.getCell(r, 5).value = `${comp.total_largura_m.toFixed(2)} m`;
      ws.getCell(r, 5).alignment = { horizontal: 'right' };
      const upCell = ws.getCell(r, 6);
      upCell.value = `${comp.total_up} UPs`;
      upCell.font = { bold: true };
      upCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
      r++;

      const tot = ws.getCell(r, 2);
      tot.value = 'TOTAL';
      tot.font = { bold: true };
      ws.getCell(r, 6).value = `${comp.total_up} UPs`;
      ws.getCell(r, 6).font = { bold: true };
      ws.getCell(r, 6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
      r += 2;
    }

    // Verificação
    if (dim.verificacao.some((v) => v.quantidade_elementos > 0)) {
      const vt = ws.getCell(r, 2);
      vt.value = 'VERIFICAÇÃO DAS SAÍDAS EXISTENTES';
      vt.font = { bold: true, size: 11 };
      ws.mergeCells(r, 2, r, 6);
      r++;

      const vHeads = ['COMPONENTE', 'EXIGIDO', 'REAL', 'RESULTADO'];
      vHeads.forEach((h, i) => {
        const c = ws.getCell(r, 2 + i);
        c.value = h;
        c.font = { bold: true };
        c.alignment = { horizontal: 'center' };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
      });
      setBorder([2, 3, 4, 5].map((c) => ws.getCell(r, c)));
      r++;

      for (const v of dim.verificacao) {
        ws.getCell(r, 2).value = v.label;
        ws.getCell(r, 3).value = `${v.up_exigido} UP / ${v.largura_exigida_m.toFixed(2)} m`;
        ws.getCell(r, 3).alignment = { horizontal: 'center' };
        ws.getCell(r, 4).value = `${v.up_real} UP / ${v.largura_real_m.toFixed(2)} m (${v.quantidade_elementos} un)`;
        ws.getCell(r, 4).alignment = { horizontal: 'center' };
        const res = ws.getCell(r, 5);
        res.value = v.atende ? 'ATENDE' : 'NÃO ATENDE';
        res.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        res.alignment = { horizontal: 'center' };
        res.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: v.atende ? 'FF437A22' : 'FFA12C7B' }
        };
        setBorder([2, 3, 4, 5].map((c) => ws.getCell(r, c)));
        r++;

        // Detalhes dos elementos
        if (v.detalhes && v.detalhes !== 'Nenhum elemento informado') {
          const dc = ws.getCell(r, 2);
          dc.value = `• ${v.detalhes}`;
          dc.font = { italic: true, color: { argb: 'FF7A7974' }, size: 10 };
          ws.mergeCells(r, 2, r, 5);
          r++;
        }
      }
      r++;
    }

    // Texto final
    const final = ws.getCell(r, 2);
    final.value =
      'Para a presente edificação foram dimensionadas as saídas conforme NPT 011, considerando o C mais restritivo dos ambientes (item 5.3.2.2). UP = 0,55 m.';
    final.font = { italic: true, size: 10, color: { argb: 'FF7A7974' } };
    final.alignment = { wrapText: true };
    ws.mergeCells(r, 2, r, 6);
    r += 3;
  }
}
