// PDF resumido das exigências CSCIP para o cliente público
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import React from 'react';
import type { MedidaCSCIP } from './cscip-medidas';
import { rotuloModalidade, type Modalidade, type TipoEdificacao } from './classificar-npt001';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  header: { borderBottom: '2pt solid #01696F', paddingBottom: 10, marginBottom: 20 },
  brand: { fontSize: 16, fontWeight: 700, color: '#01696F' },
  subBrand: { fontSize: 9, color: '#7A7974', marginTop: 2 },
  h1: { fontSize: 14, fontWeight: 700, color: '#28251D', marginBottom: 8 },
  h2: { fontSize: 11, fontWeight: 700, color: '#28251D', marginTop: 14, marginBottom: 6 },
  box: { backgroundColor: '#F9F8F5', padding: 10, borderRadius: 4, marginBottom: 12 },
  modalBox: { padding: 12, borderRadius: 4, marginBottom: 12 },
  modalLabel: { fontSize: 9, color: '#fff', opacity: 0.85, textTransform: 'uppercase' },
  modalValue: { fontSize: 14, fontWeight: 700, color: '#fff', marginTop: 3 },
  modalSub: { fontSize: 9, color: '#fff', opacity: 0.85, marginTop: 3 },
  row: { flexDirection: 'row', marginBottom: 3 },
  label: { width: 100, color: '#7A7974' },
  value: { flex: 1, color: '#28251D', fontWeight: 700 },
  medida: { marginBottom: 6, paddingLeft: 8, borderLeft: '2pt solid #D4D1CA' },
  medidaNome: { fontWeight: 700, color: '#28251D' },
  medidaObs: { color: '#7A7974', marginTop: 2, fontSize: 9 },
  bullet: { color: '#28251D', marginBottom: 3, paddingLeft: 8 },
  footer: { position: 'absolute', bottom: 20, left: 40, right: 40, fontSize: 8, color: '#7A7974', textAlign: 'center', borderTop: '1pt solid #D4D1CA', paddingTop: 6 }
});

const CORES_MODAL: Record<Modalidade, string> = {
  DISPENSA: '#437A22',
  MEMORIAL_SIMPLIFICADO: '#01696F',
  PTPID: '#A12C7B',
  PTPID_IOT: '#964219',
  ANALISE_NPT002: '#964219'
};

const ROTULO_TIPO: Record<TipoEdificacao, string> = {
  NOVA: 'Nova',
  EXISTENTE_TIPO_2: 'Existente tipo 2',
  EXISTENTE_TIPO_1: 'Existente tipo 1',
  ANTIGA: 'Antiga'
};

type LeadPdfInput = {
  nome: string;
  telefone?: string | null;
  email?: string | null;
  contato?: string | null;
  cnpj?: string | null;
  razao_social?: string | null;
  cnae?: string | null;
  cnae_descricao?: string | null;
  divisao: string;
  area_m2: number;
  altura_m: number;
  cidade?: string | null;
  ano_construcao?: number | null;
  populacao?: number | null;
  medidas: MedidaCSCIP[];
  simplificada: boolean;
  modalidade?: Modalidade | null;
  tipo_edificacao?: TipoEdificacao | null;
  justificativas?: string[] | null;
  created_at: string;
};

function LeadDocument({ lead }: { lead: LeadPdfInput }) {
  const exigidas = lead.medidas.filter((m) => m.status === 'EXIGIDO');
  const condicionais = lead.medidas.filter((m) => m.status === 'CONDICIONAL');
  const data = new Date(lead.created_at).toLocaleDateString('pt-BR');
  const modalidade = lead.modalidade || 'MEMORIAL_SIMPLIFICADO';
  const corModal = CORES_MODAL[modalidade];

  return React.createElement(
    Document,
    {},
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      // Header
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(Text, { style: styles.brand }, 'Memorial CBPR'),
        React.createElement(Text, { style: styles.subBrand }, 'Consulta gratuita — Classificação e exigências CSCIP/PR (NPT 001 parte 2)')
      ),
      // Titulo
      React.createElement(Text, { style: styles.h1 }, 'Classificação e exigências de segurança contra incêndio'),
      // Modalidade exigida
      React.createElement(
        View,
        { style: [styles.modalBox, { backgroundColor: corModal }] },
        React.createElement(Text, { style: styles.modalLabel }, 'Modalidade exigida'),
        React.createElement(Text, { style: styles.modalValue }, rotuloModalidade(modalidade)),
        React.createElement(
          Text,
          { style: styles.modalSub },
          `Tipo da edificação: ${ROTULO_TIPO[lead.tipo_edificacao || 'NOVA']}${lead.simplificada ? ' · edificação simplificada (Tabela 5)' : ''}`
        )
      ),
      // Justificativas
      lead.justificativas && lead.justificativas.length > 0
        ? React.createElement(
            View,
            {},
            React.createElement(Text, { style: styles.h2 }, 'Por quê?'),
            ...lead.justificativas.map((j, i) =>
              React.createElement(Text, { key: `j${i}`, style: styles.bullet }, `• ${j}`)
            )
          )
        : null,
      // Dados do cliente
      React.createElement(Text, { style: styles.h2 }, 'Cliente'),
      React.createElement(
        View,
        { style: styles.box },
        linha('Nome', lead.nome),
        lead.telefone ? linha('Telefone', lead.telefone) : null,
        lead.email ? linha('Email', lead.email) : null,
        lead.cnpj ? linha('CNPJ', lead.cnpj) : null,
        lead.razao_social ? linha('Empresa', lead.razao_social) : null,
        linha('Data', data)
      ),
      // Dados da edificacao
      React.createElement(Text, { style: styles.h2 }, 'Edificação'),
      React.createElement(
        View,
        { style: styles.box },
        lead.cnae ? linha('CNAE', `${lead.cnae} — ${lead.cnae_descricao || ''}`) : null,
        linha('Divisão CSCIP', lead.divisao),
        linha('Área', `${lead.area_m2} m²`),
        linha('Altura', `${lead.altura_m} m`),
        lead.populacao != null ? linha('População', `${lead.populacao} pessoas`) : null,
        lead.ano_construcao ? linha('Ano construção', String(lead.ano_construcao)) : null,
        lead.cidade ? linha('Cidade', lead.cidade) : null
      ),
      // Exigidas
      exigidas.length > 0
        ? React.createElement(
            View,
            { wrap: false },
            React.createElement(Text, { style: styles.h2 }, `Medidas exigidas (${exigidas.length})`),
            ...exigidas.map((m, i) =>
              React.createElement(
                View,
                { key: `e${i}`, style: styles.medida },
                React.createElement(Text, { style: styles.medidaNome }, m.nome),
                m.observacao ? React.createElement(Text, { style: styles.medidaObs }, m.observacao) : null
              )
            )
          )
        : null,
      // Condicionais
      condicionais.length > 0
        ? React.createElement(
            View,
            {},
            React.createElement(Text, { style: styles.h2 }, `Medidas condicionais (${condicionais.length})`),
            ...condicionais.map((m, i) =>
              React.createElement(
                View,
                { key: `c${i}`, style: styles.medida },
                React.createElement(Text, { style: styles.medidaNome }, m.nome),
                m.observacao ? React.createElement(Text, { style: styles.medidaObs }, m.observacao) : null
              )
            )
          )
        : null,
      // Rodape
      React.createElement(
        Text,
        { style: styles.footer, fixed: true },
        'Este documento é uma estimativa baseada nas tabelas do CSCIP/PR e na NPT 001 parte 2 (abril/2024). A documentação oficial requer análise técnica detalhada por responsável técnico habilitado.'
      )
    )
  );
}

function linha(label: string, value: string) {
  return React.createElement(
    View,
    { style: styles.row },
    React.createElement(Text, { style: styles.label }, label),
    React.createElement(Text, { style: styles.value }, value)
  );
}

export async function gerarPdfLead(lead: LeadPdfInput): Promise<Buffer> {
  const doc = LeadDocument({ lead });
  const stream = await pdf(doc as any).toBuffer();
  return await streamToBuffer(stream);
}

function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (c: Buffer) => chunks.push(c));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}
