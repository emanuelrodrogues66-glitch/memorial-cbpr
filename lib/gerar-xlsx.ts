// Gera planilha XLSX preenchida com as mesmas seções do PDF/DOCX:
// 1) Ofício, 2) Classificação consolidada (geral + física + quadro de medidas),
// 3) Memorial básico de construção, 4) Informações operacionais,
// 5) Saídas (NPT 011), 6) Carga de incêndio (média ponderada),
// 7) Acesso de viaturas, 8) Termo de saídas de emergência.
import ExcelJS from 'exceljs';
import { getMedidasCSCIP } from './cscip-medidas';
import { dimensionarTodos, DATA_SAIDAS, type Pavimento } from './saidas-npt011';
import {
  MEDIDAS_QUADRO_PADRAO,
  medidaAtende,
  textoEstruturas,
  textoAlvenarias,
  textoCompartimentacoes,
  textoCompartimentos,
  textoInstalacoes,
  textoVidros,
  textoMedidasSeguranca,
  textoAcessoViaturas,
  textoTermoSaidas,
  formatarData
} from './textos-padrao';
import { calcularMediaPonderada, type ItemCargaIncendio } from './carga-incendio';
import { incluiSecao, type SecaoMemorial } from './secoes-memorial';

// Helper: texto consolidado da ocupação (mista ou simples)
function ocupacaoTexto(d: any): string {
  if (d.ocupacao_resumo && String(d.ocupacao_resumo).trim()) return String(d.ocupacao_resumo);
  const oc = d.ocupacao ?? '';
  const div = d.divisao ?? '';
  return div ? `${oc} (${div})` : oc;
}

// ============================== Helpers de estilo ==============================

const COR_TITULO = 'FF01696F';
const COR_TEXTO = 'FF28251D';
const COR_BORDA = 'FFD4D1CA';
const COR_AMARELO = 'FFFFF2CC'; // realce do modelo CBPR
const COR_HEADER_TABELA = 'FFF2F2F2';
const COR_VERDE = 'FF437A22';
const COR_VERMELHO = 'FFA12C7B';

function bordasFinas(cells: ExcelJS.Cell[]) {
  cells.forEach((c) => {
    c.border = {
      top: { style: 'thin', color: { argb: COR_BORDA } },
      bottom: { style: 'thin', color: { argb: COR_BORDA } },
      left: { style: 'thin', color: { argb: COR_BORDA } },
      right: { style: 'thin', color: { argb: COR_BORDA } }
    };
  });
}

function bordasPretas(cells: ExcelJS.Cell[]) {
  cells.forEach((c) => {
    c.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };
  });
}

// ============================== Geração principal ==============================

export async function gerarXlsxBlob(d: any, secoes?: SecaoMemorial[]): Promise<Blob> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Memorial CBPR';
  wb.created = new Date();

  if (incluiSecao(secoes, 'oficio')) abaOficio(wb, d);
  if (incluiSecao(secoes, 'classificacao')) abaClassificacao(wb, d);
  if (incluiSecao(secoes, 'memorial_construcao')) abaMemorialConstrucao(wb, d);
  if (incluiSecao(secoes, 'inf_operacional')) abaInformacoesOperacionais(wb, d);

  if (incluiSecao(secoes, 'saidas')) {
    const pavs: Pavimento[] = Array.isArray(d.saidas_pavimentos) ? d.saidas_pavimentos : [];
    if (pavs.length > 0) {
      addAbaSaidas(wb, pavs);
    } else {
      abaSaidasResumo(wb, d);
    }
  }

  if (incluiSecao(secoes, 'carga_incendio')) abaCargaIncendio(wb, d);
  if (incluiSecao(secoes, 'brigada')) abaBrigada(wb, d);
  if (incluiSecao(secoes, 'acesso_viaturas')) abaAcessoViaturas(wb, d);
  if (incluiSecao(secoes, 'termo_saidas')) abaTermoSaidas(wb, d);

  // Garante pelo menos uma aba
  if (wb.worksheets.length === 0) {
    const ws = wb.addWorksheet('Memorial');
    ws.getCell('B2').value = 'Nenhuma seção selecionada.';
  }

  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
}

// ============================== 1) Ofício de apresentação ==============================

function abaOficio(wb: ExcelJS.Workbook, d: any) {
  const ws = wb.addWorksheet('1 Ofício', {
    properties: { defaultRowHeight: 18 },
    pageSetup: { paperSize: 9, orientation: 'portrait' }
  });
  ws.getColumn(1).width = 3;
  ws.getColumn(2).width = 30;
  ws.getColumn(3).width = 70;

  let r = 2;
  const t = ws.getCell(r, 2);
  t.value = 'OFÍCIO DE APRESENTAÇÃO';
  t.font = { bold: true, size: 14, color: { argb: COR_TITULO } };
  ws.mergeCells(r, 2, r, 3);
  r += 2;

  const dest = ws.getCell(r, 2);
  dest.value =
    'Ao Comando do Corpo de Bombeiros Militar do Estado do Paraná\nDivisão de Atividades Técnicas - DAT';
  dest.alignment = { wrapText: true };
  dest.font = { bold: true };
  ws.mergeCells(r, 2, r, 3);
  ws.getRow(r).height = 36;
  r += 2;

  const local = d.oficio_local || `${d.cidade ?? ''}/${d.uf ?? ''}`;
  const data = formatarData(d.oficio_data) || formatarData(new Date().toISOString());
  ws.getCell(r, 2).value = `Local e data: ${local}, ${data}`;
  ws.mergeCells(r, 2, r, 3);
  r += 2;

  const corpo = ws.getCell(r, 2);
  corpo.value =
    `Prezados Senhores,\n\n` +
    `Encaminhamos para análise e aprovação o Plano de Prevenção e Proteção Contra Incêndio (PPCI) ` +
    `referente à edificação abaixo identificada, em conformidade com o Código de Segurança Contra ` +
    `Incêndio e Pânico (CSCIP) do CBMPR e demais Normas de Procedimento Técnico (NPTs) aplicáveis.`;
  corpo.alignment = { wrapText: true, vertical: 'top' };
  ws.mergeCells(r, 2, r, 3);
  ws.getRow(r).height = 80;
  r += 2;

  const linhas: [string, any][] = [
    ['Nome da obra', d.nome_obra],
    ['Proprietário', d.proprietario],
    ['CPF / CNPJ', d.cpf_cnpj],
    ['Inscrição Imobiliária', d.inscricao_imobiliaria],
    ['Endereço', d.endereco],
    ['Cidade / UF', `${d.cidade ?? ''} / ${d.uf ?? ''}`],
    ['CEP', d.cep],
    ['Telefone', d.telefone],
    ['E-mail', d.email_contato]
  ];
  for (const [k, v] of linhas) {
    const ck = ws.getCell(r, 2);
    ck.value = k;
    ck.font = { color: { argb: 'FF7A7974' } };
    const cv = ws.getCell(r, 3);
    cv.value = v == null || v === '' ? '—' : v;
    cv.font = { bold: true };
    cv.alignment = { wrapText: true };
    bordasFinas([ck, cv]);
    r++;
  }

  r += 2;
  ws.getCell(r, 2).value = 'Atenciosamente,';
  ws.mergeCells(r, 2, r, 3);
  r += 3;
  assinaturaXlsx(ws, r, d);
}

// ============================== 2) Classificação consolidada ==============================
// Atende: "as medidas de segurança exigidas fiquem na mesma pagina da classificação
// geral da edificação" + "classificação física" + "no mesmo tópico".

function abaClassificacao(wb: ExcelJS.Workbook, d: any) {
  const ws = wb.addWorksheet('2 Classificação', {
    properties: { defaultRowHeight: 18 },
    pageSetup: { paperSize: 9, orientation: 'portrait' }
  });
  ws.getColumn(1).width = 3;
  ws.getColumn(2).width = 34;
  ws.getColumn(3).width = 58;

  let r = 2;
  const t = ws.getCell(r, 2);
  t.value = 'CLASSIFICAÇÃO DA EDIFICAÇÃO E MEDIDAS DE SEGURANÇA';
  t.font = { bold: true, size: 14, color: { argb: COR_TITULO } };
  ws.mergeCells(r, 2, r, 3);
  r += 2;

  // 2.1 — Dados da obra
  r = subtitulo(ws, r, '1. Dados da obra');
  const dados: [string, any][] = [
    ['Nome da obra', d.nome_obra],
    ['Proprietário', d.proprietario],
    ['CPF / CNPJ', d.cpf_cnpj],
    ['Inscrição Imobiliária', d.inscricao_imobiliaria],
    ['Endereço', d.endereco],
    ['Cidade / UF', `${d.cidade ?? ''} / ${d.uf ?? ''}`],
    ['CEP', d.cep]
  ];
  r = listaPares(ws, r, dados);

  // 2.2 — Classificação geral (CNAE / ocupação / risco)
  r = subtitulo(ws, r, '2. Classificação geral');
  const cnaes = Array.isArray(d.cnaes) ? d.cnaes : [];
  const geral: [string, any][] = [];
  if (cnaes.length > 1) {
    geral.push(['Ocupação consolidada', ocupacaoTexto(d)]);
    cnaes.forEach((c: any, i: number) => {
      geral.push([
        `CNAE ${i + 1}`,
        `${c.cnae || '—'} • ${c.ocupacao || '—'} (${c.divisao || '—'})`
      ]);
    });
  } else {
    geral.push(['CNAE', d.cnae]);
    geral.push(['Atividade', d.descricao_atividade]);
    geral.push(['Ocupação', ocupacaoTexto(d)]);
    geral.push(['Grupo', d.grupo]);
  }
  geral.push([
    'Carga de incêndio',
    d.carga_incendio_mj_m2 ? `${d.carga_incendio_mj_m2} MJ/m²` : '—'
  ]);
  geral.push(['Risco de incêndio', d.risco_incendio]);
  r = listaPares(ws, r, geral);

  // 2.3 — Classificação física
  r = subtitulo(ws, r, '3. Classificação física');
  const fis: [string, any][] = [
    ['Área do terreno (m²)', d.area_total_m2 || 0],
    ['Área construída (m²)', d.area_construida_m2 || 0],
    ['Altura (m)', d.altura_edificacao_m || 0],
    ['Pavimentos', d.numero_pavimentos || 1],
    ['Tipo (NPT 005)', d.tipo_edificacao],
    ['Classe (NPT 008)', d.classe_npt008],
    ['TRRF (min)', d.trrf_minutos]
  ];
  r = listaPares(ws, r, fis);

  // 2.4 — Quadro resumo das medidas
  r = subtitulo(ws, r, '4. Quadro resumo das medidas de segurança contra incêndio');
  r = quadroMedidas(ws, r, d);
}

function quadroMedidas(ws: ExcelJS.Worksheet, r: number, d: any): number {
  // Garante d.medidas_cscip preenchido para o medidaAtende()
  const cscip = getMedidasCSCIP(
    d.divisao ?? '',
    Number(d.area_construida_m2) || 0,
    Number(d.altura_edificacao_m) || 0
  ).medidas;
  const dadosComCscip = { ...d, medidas_cscip: cscip };

  const heads = ['MEDIDA DE SEGURANÇA', 'NORMA', 'EXIGIDA'];
  heads.forEach((h, i) => {
    const c = ws.getCell(r, 2 + i);
    c.value = h;
    c.font = { bold: true };
    c.alignment = { horizontal: 'center', vertical: 'middle' };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COR_HEADER_TABELA } };
  });
  bordasPretas([2, 3, 4].map((col) => ws.getCell(r, col)));
  r++;

  for (const m of MEDIDAS_QUADRO_PADRAO) {
    const atende = medidaAtende(dadosComCscip, m.nome);
    ws.getCell(r, 2).value = m.nome;
    ws.getCell(r, 2).alignment = { wrapText: true, vertical: 'middle' };
    const cn = ws.getCell(r, 3);
    cn.value = m.norma;
    cn.alignment = { horizontal: 'center', vertical: 'middle' };
    cn.font = { color: { argb: 'FF7A7974' }, size: 10 };
    const cr = ws.getCell(r, 4);
    cr.value = atende ? 'SIM' : 'NÃO';
    cr.alignment = { horizontal: 'center', vertical: 'middle' };
    cr.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cr.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: atende ? COR_VERDE : COR_VERMELHO }
    };
    bordasPretas([2, 3, 4].map((col) => ws.getCell(r, col)));
    r++;
  }
  return r + 2;
}

// ============================== 3) Memorial básico de construção ==============================

function abaMemorialConstrucao(wb: ExcelJS.Workbook, d: any) {
  const ws = wb.addWorksheet('3 Memorial', {
    properties: { defaultRowHeight: 22 },
    pageSetup: { paperSize: 9, orientation: 'portrait' }
  });
  ws.getColumn(1).width = 3;
  ws.getColumn(2).width = 28;
  ws.getColumn(3).width = 80;

  let r = 2;
  const t = ws.getCell(r, 2);
  t.value = 'MEMORIAL BÁSICO DE CONSTRUÇÃO';
  t.font = { bold: true, size: 14, color: { argb: COR_TITULO } };
  ws.mergeCells(r, 2, r, 3);
  r += 2;

  const blocos: [string, string][] = [
    ['1. Estruturas', textoEstruturas(d)],
    ['2. Alvenarias', textoAlvenarias(d)],
    ['3. Compartimentações', textoCompartimentacoes(d)],
    ['4. Compartimentos', textoCompartimentos(d)],
    ['5. Instalações', textoInstalacoes(d)],
    ['6. Vidros', textoVidros(d)],
    ['7. Medidas de segurança', textoMedidasSeguranca(d)]
  ];
  for (const [titulo, corpo] of blocos) {
    const ct = ws.getCell(r, 2);
    ct.value = titulo;
    ct.font = { bold: true, color: { argb: COR_TITULO } };
    ct.alignment = { vertical: 'top' };
    const cc = ws.getCell(r, 3);
    cc.value = corpo;
    cc.alignment = { wrapText: true, vertical: 'top' };
    bordasFinas([ct, cc]);
    ws.getRow(r).height = Math.max(40, Math.min(120, Math.ceil(corpo.length / 60) * 16));
    r++;
  }

  r += 2;
  assinaturaXlsx(ws, r, d);
}

// ============================== 4) Informações operacionais ==============================

function abaInformacoesOperacionais(wb: ExcelJS.Workbook, d: any) {
  const ws = wb.addWorksheet('4 Inf Operacionais', {
    properties: { defaultRowHeight: 18 },
    pageSetup: { paperSize: 9, orientation: 'portrait' }
  });
  ws.getColumn(1).width = 3;
  ws.getColumn(2).width = 38;
  ws.getColumn(3).width = 55;

  let r = 2;
  const t = ws.getCell(r, 2);
  t.value = 'PLANILHA DE INFORMAÇÕES OPERACIONAIS';
  t.font = { bold: true, size: 14, color: { argb: COR_TITULO } };
  ws.mergeCells(r, 2, r, 3);
  r += 2;

  const io = d.info_operacional || {};

  r = subtitulo(ws, r, '1. Características construtivas');
  r = listaPares(ws, r, [
    ['Tipo de estrutura', io.tipo_estrutura],
    ['Acabamento das paredes', io.acabamento_paredes],
    ['Acabamento dos pisos', io.acabamento_pisos],
    ['Cobertura', io.cobertura]
  ]);

  r = subtitulo(ws, r, '2. População e funcionamento');
  r = listaPares(ws, r, [
    ['População fixa', io.populacao_fixa],
    ['População flutuante', io.populacao_flutuante],
    ['Ponto de encontro', io.ponto_encontro],
    ['Características de funcionamento', io.caracteristicas_funcionamento],
    ['Horário de funcionamento', io.horario_funcionamento],
    ['Vias de acesso', io.vias_acesso]
  ]);

  r = subtitulo(ws, r, '3. Brigada e contatos');
  r = listaPares(ws, r, [
    ['Número de brigadistas', io.numero_brigadistas],
    ['Brigadista profissional', io.brigadista_profissional],
    ['Encarregado de segurança', io.encarregado_seguranca],
    ['Telefone de emergência', io.telefone_emergencia]
  ]);

  r = subtitulo(ws, r, '4. Sistemas de segurança instalados');
  const sistemas = io.sistemas_instalados || {};
  const sysNomes = Object.keys(sistemas);
  if (sysNomes.length === 0) {
    ws.getCell(r, 2).value = '—';
    ws.mergeCells(r, 2, r, 3);
    r++;
  } else {
    for (const nome of sysNomes) {
      const ck = ws.getCell(r, 2);
      ck.value = nome;
      ck.font = { color: { argb: 'FF7A7974' } };
      const cv = ws.getCell(r, 3);
      cv.value = sistemas[nome] || '—';
      cv.font = { bold: true };
      cv.alignment = { wrapText: true };
      bordasFinas([ck, cv]);
      r++;
    }
  }

  r = subtitulo(ws, r, '5. Reserva e posto de bombeiros');
  r = listaPares(ws, r, [
    ['Reserva de consumo (L)', io.reserva_consumo],
    ['Reserva RTI (L)', io.reserva_rti],
    ['Reserva total (L)', io.reserva_total],
    ['Posto de bombeiros mais próximo', io.posto_bombeiros]
  ]);

  r = subtitulo(ws, r, '6. Riscos especiais');
  const riscos = io.riscos_especiais || {};
  const rNomes = Object.keys(riscos);
  if (rNomes.length === 0 && !io.outros_riscos) {
    ws.getCell(r, 2).value = '—';
    ws.mergeCells(r, 2, r, 3);
    r++;
  } else {
    for (const nome of rNomes) {
      const ck = ws.getCell(r, 2);
      ck.value = nome;
      ck.font = { color: { argb: 'FF7A7974' } };
      const cv = ws.getCell(r, 3);
      cv.value = riscos[nome] || '—';
      cv.font = { bold: true };
      bordasFinas([ck, cv]);
      r++;
    }
    if (io.outros_riscos) {
      const ck = ws.getCell(r, 2);
      ck.value = 'Outros riscos';
      ck.font = { color: { argb: 'FF7A7974' } };
      const cv = ws.getCell(r, 3);
      cv.value = io.outros_riscos;
      cv.alignment = { wrapText: true };
      bordasFinas([ck, cv]);
      r++;
    }
  }

  if (io.outras_informacoes) {
    r = subtitulo(ws, r, '7. Outras informações');
    const c = ws.getCell(r, 2);
    c.value = io.outras_informacoes;
    c.alignment = { wrapText: true };
    ws.mergeCells(r, 2, r, 3);
    r++;
  }

  r += 2;
  assinaturaXlsx(ws, r, d);
}

// ============================== 5) Saídas — fallback resumo ==============================

function abaSaidasResumo(wb: ExcelJS.Workbook, d: any) {
  const ws = wb.addWorksheet('5 Saídas', { properties: { defaultRowHeight: 18 } });
  ws.getColumn(1).width = 3;
  ws.getColumn(2).width = 38;
  ws.getColumn(3).width = 55;

  let r = 2;
  const t = ws.getCell(r, 2);
  t.value = 'MEMORIAL DE SAÍDAS DE EMERGÊNCIA (NPT 011)';
  t.font = { bold: true, size: 14, color: { argb: COR_TITULO } };
  ws.mergeCells(r, 2, r, 3);
  r += 2;
  listaPares(ws, r, [
    ['População calculada', d.populacao_calculada],
    ['Critério', d.populacao_descricao_npt011],
    ['Unid. passagem — acesso/descarga', d.unidades_passagem_acesso],
    ['Unid. passagem — escada', d.unidades_passagem_escada],
    ['Unid. passagem — porta', d.unidades_passagem_porta]
  ]);
}

// ============================== 5) Saídas — versão completa (tabela do modelo) ==============================

function addAbaSaidas(wb: ExcelJS.Workbook, pavs: Pavimento[]) {
  const ws = wb.addWorksheet('5 Saídas', { properties: { defaultRowHeight: 18 } });
  ws.getColumn(1).width = 3;
  ws.getColumn(2).width = 22;
  ws.getColumn(3).width = 14;
  ws.getColumn(4).width = 12;
  ws.getColumn(5).width = 30;
  ws.getColumn(6).width = 18;

  const dims = dimensionarTodos(pavs);
  let r = 2;

  for (const dim of dims) {
    const tCell = ws.getCell(r, 2);
    tCell.value = `DIMENSIONAMENTO DAS SAÍDAS — ${dim.label.toUpperCase()}`;
    tCell.font = { bold: true, size: 12 };
    ws.mergeCells(r, 2, r, 6);
    r++;

    const heads = ['AMBIENTE', 'OCUPAÇÃO', 'ÁREA', 'POPULAÇÃO/m²', 'POPULAÇÃO TOTAL'];
    heads.forEach((h, i) => {
      const c = ws.getCell(r, 2 + i);
      c.value = h;
      c.font = { bold: true };
      c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COR_HEADER_TABELA } };
    });
    bordasPretas([2, 3, 4, 5, 6].map((c) => ws.getCell(r, c)));
    r++;

    for (const a of dim.por_ambiente) {
      ws.getCell(r, 2).value = a.nome;
      const cellDiv = ws.getCell(r, 3);
      cellDiv.value = a.divisao;
      cellDiv.alignment = { horizontal: 'center' };
      cellDiv.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COR_AMARELO } };

      const cellArea = ws.getCell(r, 4);
      cellArea.value = a.net;
      cellArea.numFmt = '#,##0.00" m²"';
      cellArea.alignment = { horizontal: 'center' };
      cellArea.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COR_AMARELO } };

      ws.getCell(r, 5).value = DATA_SAIDAS[a.divisao]?.pop ?? '—';
      ws.getCell(r, 5).alignment = { horizontal: 'center' };

      const cellPop = ws.getCell(r, 6);
      cellPop.value = `${a.pop} pessoas`;
      cellPop.alignment = { horizontal: 'center' };
      cellPop.font = { bold: true };

      bordasPretas([2, 3, 4, 5, 6].map((c) => ws.getCell(r, c)));
      r++;
    }
    r++;

    for (const comp of dim.dimensionamento) {
      const oc = ws.getCell(r, 2);
      oc.value = `OCUPAÇÃO — ${comp.label.toUpperCase()}`;
      oc.font = { bold: true };
      oc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COR_AMARELO } };
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
      lg.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COR_AMARELO } };
      lg.font = { bold: true };
      ws.getCell(r, 5).value = `${comp.total_largura_m.toFixed(2)} m`;
      ws.getCell(r, 5).alignment = { horizontal: 'right' };
      const upCell = ws.getCell(r, 6);
      upCell.value = `${comp.total_up} UPs`;
      upCell.font = { bold: true };
      upCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COR_AMARELO } };
      r++;

      const tot = ws.getCell(r, 2);
      tot.value = 'TOTAL';
      tot.font = { bold: true };
      ws.getCell(r, 6).value = `${comp.total_up} UPs`;
      ws.getCell(r, 6).font = { bold: true };
      ws.getCell(r, 6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COR_AMARELO } };
      r += 2;
    }

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
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COR_HEADER_TABELA } };
      });
      bordasPretas([2, 3, 4, 5].map((c) => ws.getCell(r, c)));
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
          fgColor: { argb: v.atende ? COR_VERDE : COR_VERMELHO }
        };
        bordasPretas([2, 3, 4, 5].map((c) => ws.getCell(r, c)));
        r++;

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

    const final = ws.getCell(r, 2);
    final.value =
      'Para a presente edificação foram dimensionadas as saídas conforme NPT 011, considerando o C mais restritivo dos ambientes (item 5.3.2.2). UP = 0,55 m.';
    final.font = { italic: true, size: 10, color: { argb: 'FF7A7974' } };
    final.alignment = { wrapText: true };
    ws.mergeCells(r, 2, r, 6);
    r += 3;
  }
}

// ============================== 6) Carga de incêndio (média ponderada) ==============================

function abaCargaIncendio(wb: ExcelJS.Workbook, d: any) {
  const ws = wb.addWorksheet('6 Carga Incêndio', {
    properties: { defaultRowHeight: 18 },
    pageSetup: { paperSize: 9, orientation: 'landscape' }
  });
  ws.getColumn(1).width = 3;
  ws.getColumn(2).width = 20;
  ws.getColumn(3).width = 32;
  ws.getColumn(4).width = 10;
  ws.getColumn(5).width = 14;
  ws.getColumn(6).width = 12;
  ws.getColumn(7).width = 16;

  let r = 2;
  const t = ws.getCell(r, 2);
  t.value = 'MEMORIAL DE CÁLCULO — CARGA DE INCÊNDIO';
  t.font = { bold: true, size: 14, color: { argb: COR_TITULO } };
  ws.mergeCells(r, 2, r, 7);
  r++;
  const sub = ws.getCell(r, 2);
  sub.value = 'Método: média ponderada por área (NPT 014 / Anexo A do CSCIP-PR)';
  sub.font = { italic: true, color: { argb: 'FF7A7974' }, size: 10 };
  ws.mergeCells(r, 2, r, 7);
  r += 2;

  const itens: ItemCargaIncendio[] = Array.isArray(d.carga_incendio_itens)
    ? d.carga_incendio_itens
    : [];

  if (itens.length === 0) {
    ws.getCell(r, 2).value =
      'Nenhum item lançado. A carga de incêndio considerada foi a do CNAE: ' +
      (d.carga_incendio_mj_m2 ? `${d.carga_incendio_mj_m2} MJ/m²` : '—');
    ws.mergeCells(r, 2, r, 7);
    return;
  }

  // Cabeçalho
  const heads = ['PAVTO / SETOR', 'OCUPAÇÃO', 'DIVISÃO', 'C.I. (MJ/m²)', 'ÁREA (m²)', 'C.I. (MJ)'];
  heads.forEach((h, i) => {
    const c = ws.getCell(r, 2 + i);
    c.value = h;
    c.font = { bold: true };
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COR_AMARELO } };
  });
  bordasPretas([2, 3, 4, 5, 6, 7].map((col) => ws.getCell(r, col)));
  r++;

  const inicioLinhas = r;
  for (const it of itens) {
    ws.getCell(r, 2).value = it.pavimento_setor || '—';
    ws.getCell(r, 3).value = it.ocupacao_descricao || '—';
    const cd = ws.getCell(r, 4);
    cd.value = it.divisao || '—';
    cd.alignment = { horizontal: 'center' };

    const cci = ws.getCell(r, 5);
    cci.value = Number(it.ci_mj_m2) || 0;
    cci.numFmt = '#,##0';
    cci.alignment = { horizontal: 'right' };

    const ca = ws.getCell(r, 6);
    ca.value = Number(it.area_m2) || 0;
    ca.numFmt = '#,##0.00';
    ca.alignment = { horizontal: 'right' };

    // Produto via fórmula = ci × área
    const cprod = ws.getCell(r, 7);
    cprod.value = { formula: `E${r}*F${r}` } as any;
    cprod.numFmt = '#,##0.00';
    cprod.alignment = { horizontal: 'right' };

    bordasPretas([2, 3, 4, 5, 6, 7].map((col) => ws.getCell(r, col)));
    r++;
  }
  const fimLinhas = r - 1;

  // Totais
  r++;
  const lblArea = ws.getCell(r, 4);
  lblArea.value = 'ÁREA TOTAL';
  lblArea.font = { bold: true };
  lblArea.alignment = { horizontal: 'right' };
  ws.mergeCells(r, 2, r, 5);

  const cAreaTotal = ws.getCell(r, 6);
  cAreaTotal.value = { formula: `SUM(F${inicioLinhas}:F${fimLinhas})` } as any;
  cAreaTotal.numFmt = '#,##0.00';
  cAreaTotal.font = { bold: true };
  cAreaTotal.alignment = { horizontal: 'right' };
  cAreaTotal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COR_AMARELO } };

  const cTotalMJ = ws.getCell(r, 7);
  cTotalMJ.value = { formula: `SUM(G${inicioLinhas}:G${fimLinhas})` } as any;
  cTotalMJ.numFmt = '#,##0.00';
  cTotalMJ.font = { bold: true };
  cTotalMJ.alignment = { horizontal: 'right' };
  cTotalMJ.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COR_AMARELO } };
  bordasPretas([4, 5, 6, 7].map((col) => ws.getCell(r, col)));
  const linhaTotal = r;
  r += 2;

  // Média ponderada
  const lblM = ws.getCell(r, 2);
  lblM.value = 'MÉDIA PONDERADA (MJ/m²)';
  lblM.font = { bold: true, size: 12 };
  ws.mergeCells(r, 2, r, 5);

  const cMedia = ws.getCell(r, 6);
  cMedia.value = { formula: `IFERROR(G${linhaTotal}/F${linhaTotal},0)` } as any;
  cMedia.numFmt = '#,##0.00';
  cMedia.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
  cMedia.alignment = { horizontal: 'center', vertical: 'middle' };
  cMedia.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COR_TITULO } };
  ws.mergeCells(r, 6, r, 7);
  bordasPretas([2, 3, 4, 5, 6, 7].map((col) => ws.getCell(r, col)));
  r += 2;

  // Snapshot calculado (referência) + classificação de risco
  const calc = calcularMediaPonderada(itens);
  const risco =
    calc.media_ponderada_mj_m2 <= 300
      ? 'BAIXO'
      : calc.media_ponderada_mj_m2 <= 1200
      ? 'MÉDIO'
      : 'ALTO';
  const corRisco =
    risco === 'BAIXO' ? COR_VERDE : risco === 'MÉDIO' ? 'FFDA7101' : COR_VERMELHO;
  const cR = ws.getCell(r, 2);
  cR.value = `Classificação do risco: ${risco}`;
  cR.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  cR.alignment = { horizontal: 'center', vertical: 'middle' };
  cR.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: corRisco } };
  ws.mergeCells(r, 2, r, 7);
  ws.getRow(r).height = 22;
  r += 2;

  const obs = ws.getCell(r, 2);
  obs.value =
    'Faixas de risco — NPT 014 / CSCIP-PR: Baixo ≤ 300 MJ/m² · Médio ≤ 1.200 MJ/m² · Alto > 1.200 MJ/m².';
  obs.font = { italic: true, color: { argb: 'FF7A7974' }, size: 10 };
  obs.alignment = { wrapText: true };
  ws.mergeCells(r, 2, r, 7);
  r += 2;

  assinaturaXlsx(ws, r, d);
}

// ============================== Brigada de incêndio (NPT 017) ==============================

function abaBrigada(wb: ExcelJS.Workbook, d: any) {
  const ws = wb.addWorksheet('Brigada', {
    properties: { defaultRowHeight: 18 },
    pageSetup: { paperSize: 9, orientation: 'portrait' }
  });
  ws.getColumn(1).width = 3;
  ws.getColumn(2).width = 38;
  ws.getColumn(3).width = 55;

  let r = 2;
  const t = ws.getCell(r, 2);
  t.value = 'MEMORIAL DE CÁLCULO — BRIGADA DE INCÊNDIO';
  t.font = { bold: true, size: 14, color: { argb: COR_TITULO } };
  ws.mergeCells(r, 2, r, 3);
  r++;
  const sub = ws.getCell(r, 2);
  sub.value = 'NPT 017 / CSCIP-PR — item 6.2';
  sub.font = { italic: true, color: { argb: 'FF7A7974' }, size: 10 };
  ws.mergeCells(r, 2, r, 3);
  r += 2;

  r = subtitulo(ws, r, '1. Dados de entrada');
  const popFixa = Number(d.info_operacional?.populacao_fixa) || 0;
  const popFlut = Number(d.info_operacional?.populacao_flutuante) || 0;
  const popTotal = popFixa + popFlut;
  const popAjustada = Number(d.brigada_populacao_ajustada) || popTotal;
  const grupo = String(d.grupo || '').toUpperCase().trim();
  const isGrupoF = grupo.startsWith('F');
  const brigadistas = Number(d.numero_brigadistas) || Math.max(1, Math.ceil(popAjustada / 200));

  r = listaPares(ws, r, [
    ['Ocupação', ocupacaoTexto(d)],
    ['Grupo', d.grupo],
    ['População fixa', popFixa],
    ['População flutuante', popFlut],
    ['População total', popTotal],
    ['Acréscimo Grupo F (+30%)', isGrupoF ? 'Sim' : 'Não'],
    ['População ajustada (cálculo)', popAjustada]
  ]);

  r = subtitulo(ws, r, '2. Critério (NPT 017 item 6.2)');
  const crit = ws.getCell(r, 2);
  crit.value =
    '1 brigadista orgânico para cada 200 pessoas, considerando-se o número inteiro imediatamente superior. ' +
    'Para edificações do Grupo F (locais de reunião de público), aplica-se acréscimo de 30% sobre a população total.';
  crit.alignment = { wrapText: true };
  ws.mergeCells(r, 2, r, 3);
  ws.getRow(r).height = 56;
  r += 2;

  r = subtitulo(ws, r, '3. Cálculo');
  const calcTxt = d.brigadistas_descricao
    ? String(d.brigadistas_descricao)
    : `População ajustada (${popAjustada}) ÷ 200 = ${(popAjustada / 200).toFixed(2)} → arredondado para cima = ${brigadistas} brigadista(s).`;
  const cc = ws.getCell(r, 2);
  cc.value = calcTxt;
  cc.alignment = { wrapText: true, vertical: 'top' };
  ws.mergeCells(r, 2, r, 3);
  ws.getRow(r).height = 70;
  r += 2;

  const res = ws.getCell(r, 2);
  res.value = `RESULTADO: ${brigadistas} brigadista(s)`;
  res.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
  res.alignment = { horizontal: 'center', vertical: 'middle' };
  res.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COR_TITULO } };
  ws.mergeCells(r, 2, r, 3);
  ws.getRow(r).height = 26;
  r += 3;

  assinaturaXlsx(ws, r, d);
}

// ============================== 7) Acesso de viaturas ==============================

function abaAcessoViaturas(wb: ExcelJS.Workbook, d: any) {
  const ws = wb.addWorksheet('7 Acesso Viaturas', {
    properties: { defaultRowHeight: 20 },
    pageSetup: { paperSize: 9, orientation: 'portrait' }
  });
  ws.getColumn(1).width = 3;
  ws.getColumn(2).width = 30;
  ws.getColumn(3).width = 65;

  let r = 2;
  const t = ws.getCell(r, 2);
  t.value = 'ACESSO DE VIATURAS À EDIFICAÇÃO';
  t.font = { bold: true, size: 14, color: { argb: COR_TITULO } };
  ws.mergeCells(r, 2, r, 3);
  r += 2;

  const av = d.acesso_viaturas || {};
  r = listaPares(ws, r, [
    ['Largura da via (m)', av.largura_via_m],
    ['Largura do portão (m)', av.largura_portao_m],
    ['Altura do portão (m)', av.altura_portao_m]
  ]);

  r += 1;
  const c = ws.getCell(r, 2);
  c.value = textoAcessoViaturas(d);
  c.alignment = { wrapText: true, vertical: 'top' };
  ws.mergeCells(r, 2, r, 3);
  ws.getRow(r).height = 100;
  r += 3;
  assinaturaXlsx(ws, r, d);
}

// ============================== 8) Termo de saídas de emergência ==============================

function abaTermoSaidas(wb: ExcelJS.Workbook, d: any) {
  const ws = wb.addWorksheet('8 Termo Saídas', {
    properties: { defaultRowHeight: 20 },
    pageSetup: { paperSize: 9, orientation: 'portrait' }
  });
  ws.getColumn(1).width = 3;
  ws.getColumn(2).width = 90;

  let r = 2;
  const t = ws.getCell(r, 2);
  t.value = 'TERMO DE COMPROMISSO — SAÍDAS DE EMERGÊNCIA';
  t.font = { bold: true, size: 14, color: { argb: COR_TITULO } };
  r += 2;

  const c = ws.getCell(r, 2);
  c.value = textoTermoSaidas(d);
  c.alignment = { wrapText: true, vertical: 'top' };
  ws.getRow(r).height = 140;
  r += 3;

  const local = `${d.cidade ?? ''}/${d.uf ?? ''}`;
  const data = formatarData(new Date().toISOString());
  ws.getCell(r, 2).value = `${local}, ${data}`;
  ws.getCell(r, 2).alignment = { horizontal: 'right' };
  r += 3;

  // Assinatura do proprietário
  const lin = ws.getCell(r, 2);
  lin.value = '_________________________________________________';
  lin.alignment = { horizontal: 'center' };
  r++;
  const nm = ws.getCell(r, 2);
  nm.value = (d.proprietario || '—') + (d.cpf_cnpj ? ` — ${d.cpf_cnpj}` : '');
  nm.alignment = { horizontal: 'center' };
  nm.font = { bold: true };
  r++;
  const lb = ws.getCell(r, 2);
  lb.value = 'Proprietário / Responsável pelo estabelecimento';
  lb.alignment = { horizontal: 'center' };
  lb.font = { color: { argb: 'FF7A7974' }, italic: true, size: 10 };
  r += 3;

  assinaturaXlsx(ws, r, d);
}

// ============================== Helpers de layout ==============================

function subtitulo(ws: ExcelJS.Worksheet, r: number, texto: string): number {
  r++;
  const c = ws.getCell(r, 2);
  c.value = texto;
  c.font = { bold: true, size: 12, color: { argb: COR_TITULO } };
  ws.mergeCells(r, 2, r, ws.columnCount > 3 ? ws.columnCount : 3);
  return r + 1;
}

function listaPares(ws: ExcelJS.Worksheet, r: number, pares: [string, any][]): number {
  for (const [k, v] of pares) {
    const ck = ws.getCell(r, 2);
    ck.value = k;
    ck.font = { color: { argb: 'FF7A7974' } };
    const cv = ws.getCell(r, 3);
    cv.value = v == null || v === '' ? '—' : v;
    cv.font = { bold: true };
    cv.alignment = { wrapText: true, vertical: 'top' };
    bordasFinas([ck, cv]);
    r++;
  }
  return r + 1;
}

function assinaturaXlsx(ws: ExcelJS.Worksheet, r: number, d: any) {
  const lin = ws.getCell(r, 2);
  lin.value = '_________________________________________________';
  lin.alignment = { horizontal: 'center' };
  ws.mergeCells(r, 2, r, ws.columnCount > 3 ? ws.columnCount : 3);
  r++;
  const nm = ws.getCell(r, 2);
  nm.value = d.responsavel_tecnico || '—';
  nm.alignment = { horizontal: 'center' };
  nm.font = { bold: true };
  ws.mergeCells(r, 2, r, ws.columnCount > 3 ? ws.columnCount : 3);
  r++;
  const cr = ws.getCell(r, 2);
  cr.value = `Responsável técnico — CREA/CAU ${d.crea_resp || ''}`;
  cr.alignment = { horizontal: 'center' };
  cr.font = { color: { argb: 'FF7A7974' }, italic: true, size: 10 };
  ws.mergeCells(r, 2, r, ws.columnCount > 3 ? ws.columnCount : 3);
}
