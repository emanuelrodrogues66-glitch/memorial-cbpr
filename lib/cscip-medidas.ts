// Verificador de Medidas de Segurança Contra Incêndio - CSCIP/PR
// Baseado no modelo do usuário (Tabelas do CSCIP/PR consolidadas)
// Entrada: Divisão (ex.: "A-2"), Altura (m), Área (m²)
// Saída: lista de medidas com status Exigido | Condicional | NaoSeAplica + observação

export type StatusMedida = 'EXIGIDO' | 'CONDICIONAL' | 'NAO_SE_APLICA';

export type MedidaCSCIP = {
  nome: string;
  status: StatusMedida;
  observacao?: string;
};

// Lista ordenada de todas as medidas possíveis (espelha o modelo fornecido)
export const TODAS_MEDIDAS: string[] = [
  'Acesso de viatura na edificação',
  'Segurança estrutural contra incêndio',
  'Compartimentação horizontal (áreas)',
  'Compartimentação vertical',
  'Controle de materiais de acabamento',
  'Saídas de emergência',
  'Elevador de emergência',
  'Controle de fumaça',
  'Plano de emergência',
  'Brigada de incêndio',
  'Iluminação de emergência',
  'Detecção de incêndio',
  'Alarme de incêndio',
  'Sinalização de emergência',
  'Extintores',
  'Hidrante e mangotinhos',
  'Chuveiros automáticos'
];

type Classe = 'T' | 'H6' | 'H12' | 'H23' | 'H30' | 'H30+';

function classeAltura(h: number): Classe {
  if (h <= 0) return 'T';
  if (h <= 6) return 'H6';
  if (h <= 12) return 'H12';
  if (h <= 23) return 'H23';
  if (h <= 30) return 'H30';
  return 'H30+';
}

function isAlta(c: Classe): boolean {
  return c === 'H23' || c === 'H30' || c === 'H30+';
}

// Verifica enquadramento em tabela simplificada (Tabela 5 do CSCIP)
export function isSimplificada(area: number, altura: number, grupo: string): boolean {
  const rl = ['A', 'C', 'D', 'F', 'G', 'H', 'I', 'J', 'M'].includes(grupo);
  const rm = ['B', 'E'].includes(grupo);
  if (rl && area <= 1500 && altura <= 9) return true;
  if (rm && area <= 1000 && altura <= 6) return true;
  return false;
}

type Tabela = Record<string, { status: StatusMedida; observacao?: string }>;

function E(observacao?: string) {
  return { status: 'EXIGIDO' as const, observacao };
}
function C(observacao?: string) {
  return { status: 'CONDICIONAL' as const, observacao };
}

export function getMedidasCSCIP(
  divisao: string,
  areaM2: number,
  alturaM: number
): { medidas: MedidaCSCIP[]; simplificada: boolean } {
  const grupo = divisao ? divisao[0] : '';
  if (!grupo) return { medidas: [], simplificada: false };

  const hc = classeAltura(alturaM);
  const simp = isSimplificada(areaM2, alturaM, grupo);

  const t: Tabela = {};

  if (simp) {
    t['Saídas de emergência'] = E();
    t['Iluminação de emergência'] = E();
    t['Sinalização de emergência'] = E();
    t['Extintores'] = E();

    if (grupo === 'E') {
      t['Brigada de incêndio'] = C('Exigido apenas para divisões E-5 e E-6');
    }
    if (['F', 'H'].includes(grupo)) {
      t['Controle de materiais de acabamento'] = E();
      t['Brigada de incêndio'] = C(
        'Exigido p/ lotação >400 pessoas (F-3, F-7) ou >100 pessoas (I, J)'
      );
      t['Detecção de incêndio'] = C(
        'Exigido p/ lotação >200 pessoas em locais com carga de incêndio ou forro combustível'
      );
    }

    return { medidas: toLista(t), simplificada: true };
  }

  // BASE para todas as ocupações não simplificadas
  t['Acesso de viatura na edificação'] = E();
  t['Segurança estrutural contra incêndio'] = E();
  t['Controle de materiais de acabamento'] = E();
  t['Saídas de emergência'] = E();
  t['Iluminação de emergência'] = E();
  t['Alarme de incêndio'] = E();
  t['Sinalização de emergência'] = E();
  t['Extintores'] = E();
  t['Hidrante e mangotinhos'] = E();

  if (grupo === 'A') {
    delete t['Alarme de incêndio'];
    t['Alarme de incêndio'] = isAlta(hc)
      ? E()
      : C('Pode ser substituído por interfone com vigilância 24h');
    t['Compartimentação vertical'] = isAlta(hc) ? E() : { status: 'NAO_SE_APLICA' };
    t['Controle de materiais de acabamento'] = isAlta(hc)
      ? C('Aplica-se somente às áreas comuns')
      : { status: 'NAO_SE_APLICA' };
    if (hc === 'H30+') t['Elevador de emergência'] = C('Exigido para altura >80m');
  } else if (grupo === 'B') {
    t['Compartimentação horizontal (áreas)'] = hc === 'H6'
      ? C('Pode ser substituída por chuveiros automáticos')
      : E('Pode ser substituída por chuveiros automáticos');
    t['Compartimentação vertical'] = isAlta(hc) ? E() : { status: 'NAO_SE_APLICA' };
    t['Detecção de incêndio'] = ['H6', 'H12', 'H23', 'H30', 'H30+'].includes(hc)
      ? E()
      : { status: 'NAO_SE_APLICA' };
    t['Plano de emergência'] = hc === 'H30' || hc === 'H30+' ? E() : { status: 'NAO_SE_APLICA' };
    t['Chuveiros automáticos'] = hc === 'H30' || hc === 'H30+'
      ? E()
      : { status: 'NAO_SE_APLICA' };
    t['Controle de fumaça'] = hc === 'H30+'
      ? C('Acima de 60m de altura')
      : { status: 'NAO_SE_APLICA' };
    if (hc === 'H30+') t['Elevador de emergência'] = C('Exigido acima de 60m');
  } else if (grupo === 'C') {
    t['Compartimentação horizontal (áreas)'] = E('Pode ser substituída por chuveiros automáticos');
    t['Compartimentação vertical'] = isAlta(hc) ? E() : { status: 'NAO_SE_APLICA' };
    t['Plano de emergência'] = E();
    t['Brigada de incêndio'] = divisao === 'C-3' ? E() : { status: 'NAO_SE_APLICA' };
    t['Detecção de incêndio'] = C('Somente para depósitos >1.000m²; obrigatório acima de 30m');
    t['Chuveiros automáticos'] = hc === 'H30' || hc === 'H30+'
      ? E()
      : { status: 'NAO_SE_APLICA' };
    t['Controle de fumaça'] = hc === 'H30+'
      ? C('Acima de 60m de altura')
      : { status: 'NAO_SE_APLICA' };
    if (hc === 'H30+') t['Elevador de emergência'] = C('Exigido acima de 60m');
  } else if (grupo === 'D') {
    t['Compartimentação horizontal (áreas)'] = E('Pode ser substituída por chuveiros automáticos');
    t['Compartimentação vertical'] = isAlta(hc) ? E() : { status: 'NAO_SE_APLICA' };
    t['Plano de emergência'] = hc === 'H30+' ? E() : { status: 'NAO_SE_APLICA' };
    t['Detecção de incêndio'] = hc === 'H30+' ? E() : { status: 'NAO_SE_APLICA' };
    t['Chuveiros automáticos'] = hc === 'H30+' ? E() : { status: 'NAO_SE_APLICA' };
    t['Controle de fumaça'] = hc === 'H30+'
      ? E('Acima de 60m de altura')
      : { status: 'NAO_SE_APLICA' };
    if (hc === 'H30+') t['Elevador de emergência'] = C('Exigido acima de 60m');
  } else if (grupo === 'E') {
    t['Compartimentação vertical'] = isAlta(hc) ? E() : { status: 'NAO_SE_APLICA' };
    t['Plano de emergência'] = hc === 'H30' || hc === 'H30+' ? E() : { status: 'NAO_SE_APLICA' };
    t['Brigada de incêndio'] = divisao === 'E-5' || divisao === 'E-6'
      ? E()
      : { status: 'NAO_SE_APLICA' };
    t['Detecção de incêndio'] = hc === 'H30' || hc === 'H30+'
      ? E()
      : { status: 'NAO_SE_APLICA' };
    t['Chuveiros automáticos'] = hc === 'H30+' ? E() : { status: 'NAO_SE_APLICA' };
    t['Controle de fumaça'] = hc === 'H30+'
      ? E('Acima de 60m de altura')
      : { status: 'NAO_SE_APLICA' };
    if (hc === 'H30+') t['Elevador de emergência'] = C('Exigido acima de 60m');
  } else if (grupo === 'F') {
    const isF1F2 = divisao === 'F-1' || divisao === 'F-2';
    const isF3F9 = divisao === 'F-3' || divisao === 'F-9';
    const isF5F6F11 = divisao === 'F-5' || divisao === 'F-6' || divisao === 'F-11';
    const isF8 = divisao === 'F-8';
    const isF10 = divisao === 'F-10';
    t['Plano de emergência'] = E(
      'Somente p/ locais com público >1000 pessoas (F-1, F-2, F-3) ou >500 (F-5)'
    );
    t['Brigada de incêndio'] = E();
    t['Detecção de incêndio'] = isF1F2
      ? E('Para locais com carga de incêndio ou forro combustível')
      : C('Para locais com carga de incêndio ou forro combustível');
    t['Compartimentação horizontal (áreas)'] = isF5F6F11 || isF8 || isF10
      ? E('Pode ser substituída por detecção + chuveiros')
      : { status: 'NAO_SE_APLICA' };
    t['Compartimentação vertical'] = isAlta(hc) ? E() : { status: 'NAO_SE_APLICA' };
    t['Chuveiros automáticos'] =
      hc === 'H30+' || (isF3F9 && (hc === 'H23' || hc === 'H30'))
        ? E()
        : { status: 'NAO_SE_APLICA' };
    t['Controle de fumaça'] =
      hc === 'H30+'
        ? E('Acima de 60m; obrigatório p/ F-5/F-6 com lotação >500')
        : isF5F6F11
        ? C('Acima de 60m; obrigatório p/ F-5/F-6 com lotação >500')
        : { status: 'NAO_SE_APLICA' };
    if (hc === 'H30+') t['Elevador de emergência'] = C('Exigido acima de 60m');
  } else if (grupo === 'G') {
    const isG3G4 = divisao === 'G-3' || divisao === 'G-4';
    const isG5G6 = divisao === 'G-5' || divisao === 'G-6';
    t['Compartimentação horizontal (áreas)'] = isG3G4
      ? E('Pode ser substituída por chuveiros automáticos')
      : { status: 'NAO_SE_APLICA' };
    t['Compartimentação vertical'] = isAlta(hc)
      ? C('Exigido para fachadas e shafts')
      : { status: 'NAO_SE_APLICA' };
    t['Plano de emergência'] = isG5G6
      ? C('Somente para áreas >5.000m²')
      : { status: 'NAO_SE_APLICA' };
    t['Detecção de incêndio'] = hc === 'H30+'
      ? E()
      : isG5G6
      ? C()
      : { status: 'NAO_SE_APLICA' };
    t['Chuveiros automáticos'] = hc === 'H30' || hc === 'H30+'
      ? E()
      : { status: 'NAO_SE_APLICA' };
    t['Controle de fumaça'] = hc === 'H30+'
      ? E('Acima de 60m; dispensado se aberta lateralmente')
      : { status: 'NAO_SE_APLICA' };
    if (hc === 'H30+') t['Elevador de emergência'] = C('Exigido acima de 60m');
  } else if (grupo === 'H') {
    const isH3 = divisao === 'H-3';
    const isH2H5 = divisao === 'H-2' || divisao === 'H-5';
    t['Compartimentação horizontal (áreas)'] = isH3
      ? E('Pode ser substituída por chuveiros automáticos')
      : { status: 'NAO_SE_APLICA' };
    t['Compartimentação vertical'] = isAlta(hc) ? E() : { status: 'NAO_SE_APLICA' };
    t['Plano de emergência'] = isH3 || isH2H5 ? E() : { status: 'NAO_SE_APLICA' };
    t['Brigada de incêndio'] = isH3 || isH2H5 ? E() : { status: 'NAO_SE_APLICA' };
    t['Detecção de incêndio'] = isH3 || isH2H5
      ? E('Detectores em todos os quartos')
      : C('Detectores em todos os quartos');
    t['Chuveiros automáticos'] = hc === 'H30+' ? E() : { status: 'NAO_SE_APLICA' };
    t['Controle de fumaça'] = hc === 'H30+'
      ? E('Acima de 60m de altura')
      : { status: 'NAO_SE_APLICA' };
    if (hc === 'H30+') t['Elevador de emergência'] = C('Exigido acima de 60m');
  } else if (grupo === 'I') {
    t['Compartimentação horizontal (áreas)'] = hc !== 'T'
      ? E('Pode ser substituída por chuveiros automáticos')
      : divisao === 'I-3'
      ? E('Pode ser substituída por chuveiros automáticos')
      : { status: 'NAO_SE_APLICA' };
    t['Compartimentação vertical'] = isAlta(hc) ? E() : { status: 'NAO_SE_APLICA' };
    t['Plano de emergência'] = divisao === 'I-2' || divisao === 'I-3'
      ? E()
      : { status: 'NAO_SE_APLICA' };
    t['Brigada de incêndio'] = divisao === 'I-2' || divisao === 'I-3'
      ? E()
      : { status: 'NAO_SE_APLICA' };
    t['Detecção de incêndio'] = divisao === 'I-3'
      ? isAlta(hc)
        ? E()
        : { status: 'NAO_SE_APLICA' }
      : hc === 'H30+'
      ? E()
      : { status: 'NAO_SE_APLICA' };
    t['Chuveiros automáticos'] = divisao === 'I-1'
      ? hc === 'H30+'
        ? E()
        : { status: 'NAO_SE_APLICA' }
      : hc === 'H30' || hc === 'H30+'
      ? E()
      : divisao === 'I-3' && hc === 'H23'
      ? E()
      : { status: 'NAO_SE_APLICA' };
    t['Controle de fumaça'] = hc === 'H30+'
      ? E('Acima de 60m de altura')
      : { status: 'NAO_SE_APLICA' };
    if (hc === 'H30+') t['Elevador de emergência'] = C('Exigido acima de 60m');
  } else if (grupo === 'J') {
    delete t['Hidrante e mangotinhos'];
    t['Hidrante e mangotinhos'] =
      divisao === 'J-1' && isAlta(hc)
        ? E()
        : ['J-2', 'J-3', 'J-4'].includes(divisao)
        ? E()
        : { status: 'NAO_SE_APLICA' };
    t['Compartimentação horizontal (áreas)'] = ['J-2', 'J-3', 'J-4'].includes(divisao)
      ? E('Pode ser substituída por chuveiros automáticos')
      : { status: 'NAO_SE_APLICA' };
    t['Compartimentação vertical'] = isAlta(hc) ? E() : { status: 'NAO_SE_APLICA' };
    t['Plano de emergência'] = divisao === 'J-3' || divisao === 'J-4'
      ? E()
      : { status: 'NAO_SE_APLICA' };
    t['Brigada de incêndio'] = divisao === 'J-3' || divisao === 'J-4'
      ? E()
      : { status: 'NAO_SE_APLICA' };
    t['Detecção de incêndio'] = isAlta(hc) ? E() : { status: 'NAO_SE_APLICA' };
    t['Alarme de incêndio'] = divisao === 'J-1' && hc === 'T' ? { status: 'NAO_SE_APLICA' } : E();
    t['Chuveiros automáticos'] =
      ['J-2', 'J-3', 'J-4'].includes(divisao) && (hc === 'H30' || hc === 'H30+')
        ? E()
        : ['J-3', 'J-4'].includes(divisao) && hc === 'H23'
        ? E()
        : { status: 'NAO_SE_APLICA' };
    t['Controle de fumaça'] = hc === 'H30+'
      ? E('Acima de 60m de altura')
      : { status: 'NAO_SE_APLICA' };
    if (hc === 'H30+') t['Elevador de emergência'] = C('Exigido acima de 60m');
  }

  return { medidas: toLista(t), simplificada: false };
}

function toLista(t: Tabela): MedidaCSCIP[] {
  const out: MedidaCSCIP[] = [];
  for (const nome of TODAS_MEDIDAS) {
    const v = t[nome];
    if (!v || v.status === 'NAO_SE_APLICA') continue;
    out.push({ nome, status: v.status, observacao: v.observacao });
  }
  return out;
}

// Helper p/ UI: rótulo curto da classe de altura
export function rotuloClasseAltura(alturaM: number): string {
  if (alturaM <= 0) return 'Térrea';
  if (alturaM <= 6) return 'Baixa (≤6m)';
  if (alturaM <= 12) return 'Baixa-Média (6–12m)';
  if (alturaM <= 23) return 'Média (12–23m)';
  if (alturaM <= 30) return 'Mediamente Alta (23–30m)';
  return 'Alta (>30m)';
}
