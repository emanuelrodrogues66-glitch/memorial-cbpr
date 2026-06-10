// Textos padrão preenchidos automaticamente nos documentos quando o usuário
// não preenche manualmente. Baseados no modelo SALMERON / NPT do CBPR.

export function textoEstruturas(d: any): string {
  return (
    d?.memorial_construcao?.estruturas ||
    `Execução da obra realizada de acordo com as normas construtivas em vigor, ` +
      `estruturas em concreto armado, executadas de acordo com as características ` +
      `da construção. Atende ao TRRF (resistência ao fogo) de ${d?.trrf_minutos ?? 60} ` +
      `minutos, conforme NPT 008 do CBPR.`
  );
}

export function textoAlvenarias(d: any): string {
  return (
    d?.memorial_construcao?.alvenarias ||
    'Alvenaria de bloco de concreto ou cerâmico, executada de acordo com as normas construtivas em vigor.'
  );
}

export function textoCompartimentacoes(d: any): string {
  return (
    d?.memorial_construcao?.compartimentacoes ||
    `Realizada de acordo com as normas construtivas em vigor e NPT 009, de acordo ` +
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
  return (
    d?.memorial_construcao?.medidas_seguranca ||
    `As medidas de segurança contra incêndio e os riscos específicos obedecem aos ` +
      `requisitos do Código de Segurança Contra Incêndio e Pânico (CSCIP) do Corpo ` +
      `de Bombeiros Militar do Paraná, conforme detalhado no quadro resumo.`
  );
}

export function textoAcessoViaturas(d: any): string {
  const av = d?.acesso_viaturas || {};
  const largura = av.largura_via_m ? `${av.largura_via_m} m` : '6,00 m';
  const lp = av.largura_portao_m ? `${av.largura_portao_m} m` : '4,00 m';
  const ap = av.altura_portao_m ? `${av.altura_portao_m} m` : '4,50 m';
  return (
    av.observacoes ||
    `O acesso de viaturas na edificação e áreas de risco é normatizado pela NPT 006 ` +
      `do CSCIP/CBMPR. A edificação possui via de acesso com largura de ${largura} ` +
      `(mínimo regulamentar 6,00 m), portão de ${lp} de largura e ${ap} de altura, ` +
      `compatível com a passagem das viaturas operacionais do Corpo de Bombeiros. ` +
      `O piso da via suporta o peso das viaturas e permite manobra adequada.`
  );
}

export function textoTermoSaidas(d: any): string {
  const ts = d?.termo_saidas || {};
  const ocupacao = d?.descricao_atividade || d?.ocupacao || 'edificação';
  return (
    ts.observacoes ||
    `Visando a concessão do Certificado de Vistoria de Estabelecimento do Corpo de ` +
      `Bombeiros Militar do Paraná, atestamos que as PORTAS DE SAÍDA DE EMERGÊNCIA da ` +
      `edificação classificada como ${ocupacao} permanecerão destrancadas durante todo ` +
      `o horário de funcionamento da edificação, abrindo no sentido do fluxo de saída ` +
      `e com sinalização adequada. Assumimos toda a responsabilidade civil e criminal ` +
      `quanto à permanência das portas em condições de uso imediato em caso de emergência.`
  );
}

// Lista padronizada de medidas para o quadro resumo (ANEXO F do modelo CBPR)
export const MEDIDAS_QUADRO_PADRAO: { nome: string; norma: string }[] = [
  { nome: 'ACESSO DE VIATURAS NA EDIFICAÇÃO', norma: 'CONFORME NPT 006' },
  { nome: 'ALARME DE INCÊNDIO', norma: 'CONFORME NPT 019' },
  { nome: 'BRIGADA DE INCÊNDIO', norma: 'CONFORME NPT 017' },
  { nome: 'CHUVEIROS AUTOMÁTICOS', norma: 'CONFORME NPT 023' },
  { nome: 'COMPARTIMENTAÇÃO HORIZONTAL', norma: 'CONFORME NPT 009' },
  { nome: 'COMPARTIMENTAÇÃO VERTICAL', norma: 'CONFORME NPT 009' },
  { nome: 'CONTROLE DE FUMAÇA', norma: 'CONFORME NPT 015' },
  { nome: 'CONTROLE DE MATERIAIS DE ACABAMENTO', norma: 'CONFORME NPT 010' },
  { nome: 'DETECÇÃO DE INCÊNDIO', norma: 'CONFORME NPT 019' },
  { nome: 'EXTINTORES', norma: 'CONFORME NPT 021' },
  { nome: 'HIDRANTES', norma: 'CONFORME NPT 022' },
  { nome: 'ILUMINAÇÃO DE EMERGÊNCIA', norma: 'CONFORME NPT 018' },
  { nome: 'PLANO DE EMERGÊNCIA', norma: 'CONFORME NPT 016' },
  { nome: 'SAÍDAS DE EMERGÊNCIA', norma: 'CONFORME NPT 011' },
  { nome: 'SEGURANÇA ESTRUTURAL CONTRA INCÊNDIO', norma: 'CONFORME NPT 008' },
  { nome: 'SEPARAÇÃO ENTRE EDIFICAÇÕES', norma: 'CONFORME NPT 007' },
  { nome: 'SINALIZAÇÃO DE EMERGÊNCIA', norma: 'CONFORME NPT 020' }
];

// Verifica se uma das medidas exigidas/condicionais escolhidas casa com o nome do quadro
export function medidaAtende(d: any, nomeQuadro: string): boolean {
  const escolhidas: string[] = d?.medidas_protecao ?? [];
  const cscip: { nome: string; status: string }[] = d?.medidas_cscip ?? [];
  const nlc = nomeQuadro.toLowerCase();
  // Match por palavra-chave
  for (const m of cscip) {
    if (m.status === 'EXIGIDO' && m.nome.toLowerCase().includes(palavraChave(nlc))) {
      return true;
    }
  }
  for (const nome of escolhidas) {
    if (nome.toLowerCase().includes(palavraChave(nlc))) return true;
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
