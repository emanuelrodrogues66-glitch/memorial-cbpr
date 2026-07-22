// Textos padrão preenchidos automaticamente nos documentos quando o usuário
// não preenche manualmente. Suporta UF (PR=NPT/CBMPR, SC=IN/CBMSC).

import { norma, nptOuIn, rotuloCBM, type UF } from './cbmsc';

function ufDe(d: any): UF {
  return ((d?.uf as string) || 'PR') === 'SC' ? 'SC' : 'PR';
}

export function textoEstruturas(d: any): string {
  const uf = ufDe(d);
  return (
    d?.memorial_construcao?.estruturas ||
    `Execução da obra realizada de acordo com as normas construtivas em vigor, ` +
      `estruturas em concreto armado, executadas de acordo com as características ` +
      `da construção. Atende ao TRRF (resistência ao fogo) de ${d?.trrf_minutos ?? 60} ` +
      `minutos, conforme ${norma(uf, '008')}.`
  );
}

export function textoAlvenarias(d: any): string {
  return (
    d?.memorial_construcao?.alvenarias ||
    'Alvenaria de bloco de concreto ou cerâmico, executada de acordo com as normas construtivas em vigor.'
  );
}

export function textoCompartimentacoes(d: any): string {
  const uf = ufDe(d);
  return (
    d?.memorial_construcao?.compartimentacoes ||
    `Realizada de acordo com as normas construtivas em vigor e ${nptOuIn(uf, '009')}, de acordo ` +
      `com as características da construção. Atende ao TRRF de ${d?.trrf_minutos ?? 60} minutos.`
  );
}

export function textoCompartimentos(d: any): string {
  return (
    d?.memorial_construcao?.compartimentos ||
    `Independentes de sua natureza de ocupação, os compartimentos possuem dimensões ` +
      `adequadas à sua atividade. Os materiais de construção (estruturas, vedações, ` +
      `acabamentos, etc.) empregados atendem aos requisitos das normas técnicas vigentes.`
  );
}

export function textoInstalacoes(d: any): string {
  return (
    d?.memorial_construcao?.instalacoes ||
    'As instalações hidráulicas e elétricas obedecem aos requisitos normativos da ABNT e das respectivas concessionárias.'
  );
}

export function textoVidros(d: any): string {
  return (
    d?.memorial_construcao?.vidros ||
    'Os elementos envidraçados atendem aos critérios de segurança previstos nas normas da ABNT.'
  );
}

export function textoMedidasSeguranca(d: any): string {
  const uf = ufDe(d);
  const conjunto = uf === 'SC'
    ? 'Instruções Normativas (IN) do CBMSC'
    : 'Código de Segurança Contra Incêndio e Pânico (CSCIP) do CBMPR';
  return (
    d?.memorial_construcao?.medidas_seguranca ||
    `As medidas de segurança contra incêndio e os riscos específicos obedecem aos ` +
      `requisitos das ${conjunto} — ${rotuloCBM(uf)} — conforme detalhado no quadro resumo.`
  );
}

export function textoAcessoViaturas(d: any): string {
  const uf = ufDe(d);
  const av = d?.acesso_viaturas || {};
  const largura = av.largura_via_m ? `${av.largura_via_m} m` : '6,00 m';
  const lp = av.largura_portao_m ? `${av.largura_portao_m} m` : '4,00 m';
  const ap = av.altura_portao_m ? `${av.altura_portao_m} m` : '4,50 m';
  return (
    av.observacoes ||
    `O acesso de viaturas na edificação e áreas de risco é normatizado pela ${norma(uf, '006')}. ` +
      `A edificação possui via de acesso com largura de ${largura} ` +
      `(mínimo regulamentar 6,00 m), portão de ${lp} de largura e ${ap} de altura, ` +
      `compatível com a passagem das viaturas operacionais do Corpo de Bombeiros. ` +
      `O piso da via suporta o peso das viaturas e permite manobra adequada.`
  );
}

export function textoTermoSaidas(d: any): string {
  const uf = ufDe(d);
  const ts = d?.termo_saidas || {};
  const ocupacao = d?.descricao_atividade || d?.ocupacao || 'edificação';
  const endereco = d?.endereco ? `R. ${d.endereco}`.replace(/^R\. R\. /i, 'R. ') : '';
  const cidade = d?.cidade ? `, no município de ${d.cidade.toUpperCase()}` : '';
  const nib = d?.nib ? ` sob o NIB: ${d.nib}` : ', ';
  const localizacao = endereco ? `, situada na: ${endereco}${cidade}` : '';
  return (
    ts.observacoes ||
    `Visando a concessão do Certificado de Vistoria de Estabelecimento do ${rotuloCBM(uf)}, ` +
      `atestamos que as PORTAS DE SAÍDA DE EMERGÊNCIA da ` +
      `edificação classificada como ${ocupacao}${localizacao} ` +
      `que possui Plano de Segurança Contra Incêndio e Pânico aprovado nesse Corpo de Bombeiros${nib} ` +
      `encontram-se em comunicação direta com o exterior/logradouro público e são utilizadas com a finalidade ` +
      `de segurança patrimonial, permanecendo abertas durante toda a permanência de pessoas na edificação.`
  );
}

// Lista padronizada de medidas para o quadro resumo (Anexo F).
// Cada medida cita a NPT (PR) e a IN (SC) correspondente; o documento
// escolhe qual mostrar com base na UF do projeto.
export type MedidaQuadro = { nome: string; npt: string; in: string };
export const MEDIDAS_QUADRO_PADRAO_BASE: MedidaQuadro[] = [
  { nome: 'ACESSO DE VIATURAS NA EDIFICAÇÃO', npt: '006', in: '35' },
  { nome: 'ALARME DE INCÊNDIO', npt: '019', in: '12' },
  { nome: 'BRIGADA DE INCÊNDIO', npt: '017', in: '28' },
  { nome: 'CHUVEIROS AUTOMÁTICOS', npt: '023', in: '15' },
  { nome: 'COMPARTIMENTAÇÃO HORIZONTAL', npt: '009', in: '14' },
  { nome: 'COMPARTIMENTAÇÃO VERTICAL', npt: '009', in: '14' },
  { nome: 'CONTROLE DE FUMAÇA', npt: '015', in: '10' },
  { nome: 'CONTROLE DE MATERIAIS DE ACABAMENTO', npt: '010', in: '18' },
  { nome: 'DETECÇÃO DE INCÊNDIO', npt: '019', in: '12' },
  { nome: 'EXTINTORES', npt: '021', in: '06' },
  { nome: 'HIDRANTES', npt: '022', in: '07' },
  { nome: 'ILUMINAÇÃO DE EMERGÊNCIA', npt: '018', in: '11' },
  { nome: 'PLANO DE EMERGÊNCIA', npt: '016', in: '31' },
  { nome: 'SAÍDAS DE EMERGÊNCIA', npt: '011', in: '09' },
  { nome: 'SEGURANÇA ESTRUTURAL CONTRA INCÊNDIO', npt: '008', in: '14' },
  { nome: 'SEPARAÇÃO ENTRE EDIFICAÇÕES', npt: '007', in: '14' },
  { nome: 'SINALIZAÇÃO DE EMERGÊNCIA', npt: '020', in: '13' }
];

// Compatibilidade: mantém o array antigo com rótulos NPT (PR) para não
// quebrar imports existentes. Para SC use medidasQuadroParaUF.
export const MEDIDAS_QUADRO_PADRAO: { nome: string; norma: string }[] =
  MEDIDAS_QUADRO_PADRAO_BASE.map((m) => ({
    nome: m.nome,
    norma: `CONFORME NPT ${m.npt}`
  }));

// Devolve a lista de medidas com o rótulo apropriado para a UF (PR/SC).
export function medidasQuadroParaUF(uf: UF): { nome: string; norma: string }[] {
  return MEDIDAS_QUADRO_PADRAO_BASE.map((m) => ({
    nome: m.nome,
    norma: uf === 'SC' ? `CONFORME IN ${m.in}` : `CONFORME NPT ${m.npt}`
  }));
}

// Verifica se uma das medidas exigidas/condicionais escolhidas casa com o nome do quadro
export function medidaAtende(d: any, nomeQuadro: string): boolean {
  const escolhidas: string[] = d?.medidas_protecao ?? [];
  const cscip: { nome: string; status: string }[] = d?.medidas_cscip ?? [];
  const simplificada: boolean = d?.cscip_simplificada ?? false;
  const nlc = nomeQuadro.toLowerCase();
  const chave = palavraChave(nlc);

  // Se a edificação se enquadra na Tabela 5 do CSCIP/PR (memorial simplificado),
  // usa EXCLUSIVAMENTE medidas_cscip — que reflete a tabela oficial.
  // Isso evita que sugerirMedidas (baseada em heurísticas de área/altura)
  // adicione Brigada e Hidrante indevidamente para divisões como F-2.
  // Para SC as INs têm critérios próprios, então mantém o comportamento normal.
  const uf: string = (d?.uf || 'PR').toUpperCase();
  if (simplificada && uf !== 'SC') {
    return cscip.some(
      (m) => m.status === 'EXIGIDO' && m.nome.toLowerCase().includes(chave)
    );
  }

  // Fora da Tabela 5: verifica medidas_cscip primeiro, depois medidas_protecao
  for (const m of cscip) {
    if (m.status === 'EXIGIDO' && m.nome.toLowerCase().includes(chave)) {
      return true;
    }
  }
  for (const nome of escolhidas) {
    if (nome.toLowerCase().includes(chave)) return true;
  }
  return false;
}

export function palavraChaveQuadro(nome: string): string {
  return palavraChave(nome.toLowerCase());
}

function palavraChave(nome: string): string {
  if (nome.includes('alarme')) return 'alarme';
  if (nome.includes('brigada')) return 'brigada';
  if (nome.includes('chuveiro')) return 'chuveiro';
  if (nome.includes('compartiment')) return 'compartiment';
  if (nome.includes('controle de fumaça') || nome.includes('controle de fumaca'))
    return 'fumaça';
  if (nome.includes('acabamento')) return 'acabamento';
  if (nome.includes('detec')) return 'detec';
  if (nome.includes('extintor')) return 'extintor';
  if (nome.includes('hidrant')) return 'hidrant';
  if (nome.includes('iluminação') || nome.includes('iluminacao')) return 'iluminação';
  if (nome.includes('plano')) return 'plano';
  if (nome.includes('saída') || nome.includes('saida')) return 'saída';
  if (nome.includes('estrutural')) return 'estrutural';
  if (nome.includes('separação') || nome.includes('separacao')) return 'separação';
  if (nome.includes('sinaliz')) return 'sinaliz';
  if (nome.includes('acesso')) return 'acesso';
  return nome;
}

export function formatarData(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dias = String(d.getDate()).padStart(2, '0');
  const meses = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];
  return `${dias} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
}
