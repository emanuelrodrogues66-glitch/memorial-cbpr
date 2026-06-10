// PDF resumido das exigências CSCIP para o cliente público
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import React from 'react';
import type { MedidaCSCIP } from './cscip-medidas';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  header: { borderBottom: '2pt solid #01696F', paddingBottom: 10, marginBottom: 20 },
  brand: { fontSize: 16, fontWeight: 700, color: '#01696F' },
  subBrand: { fontSize: 9, color: '#7A7974', marginTop: 2 },
  h1: { fontSize: 14, fontWeight: 700, color: '#28251D', marginBottom: 8 },
  h2: { fontSize: 11, fontWeight: 700, color: '#28251D', marginTop: 14, marginBottom: 6 },
  box: { backgroundColor: '#F9F8F5', padding: 10, borderRadius: 4, marginBottom: 12 },
  row: { flexDirection: 'row', marginBottom: 3 },
  label: { width: 100, color: '#7A7974' },
  value: { flex: 1, color: '#28251D', fontWeight: 700 },
  badge: { fontSize: 8, padding: 3, borderRadius: 2, marginRight: 4, color: '#fff' },
  exigido: { backgroundColor: '#A12C7B' },
  condicional: { backgroundColor: '#964219' },
  medida: { marginBottom: 6, paddingLeft: 8, borderLeft: '2pt solid #D4D1CA' },
  medidaNome: { fontWeight: 700, color: '#28251D' },
  medidaObs: { color: '#7A7974', marginTop: 2, fontSize: 9 },
  footer: { position: 'absolute', bottom: 20, left: 40, right: 40, fontSize: 8, color: '#7A7974', textAlign: 'center', borderTop: '1pt solid #D4D1CA', paddingTop: 6 }
});

type LeadPdfInput = {
  nome: string;
  contato: string;
  cnpj?: string | null;
  cnae?: string | null;
  cnae_descricao?: string | null;
  divisao: string;
  area_m2: number;
  altura_m: number;
  cidade?: string | null;
  medidas: MedidaCSCIP[];
  simplificada: boolean;
  created_at: string;
};

function LeadDocument({ lead }: { lead: LeadPdfInput }) {
  const exigidas = lead.medidas.filter((m) => m.status === 'EXIGIDO');
  const condicionais = lead.medidas.filter((m) => m.status === 'CONDICIONAL');
  const data = new Date(lead.created_at).toLocaleDateString('pt-BR');

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
        React.createElement(Text, { style: styles.subBrand }, 'Consulta gratuita de exigências — CSCIP/PR')
      ),
      // Titulo
      React.createElement(Text, { style: styles.h1 }, 'Exigências de segurança contra incêndio'),
      // Dados do cliente
      React.createElement(
        View,
        { style: styles.box },
        linha('Cliente', lead.nome),
        linha('Contato', lead.contato),
        lead.cnpj ? linha('CNPJ', lead.cnpj) : null,
        linha('Data', data)
      ),
      // Dados da edificacao
      React.createElement(
        View,
        { style: styles.box },
        lead.cnae ? linha('CNAE', `${lead.cnae} — ${lead.cnae_descricao || ''}`) : null,
        linha('Divisão', lead.divisao),
        linha('Área', `${lead.area_m2} m²`),
        linha('Altura', `${lead.altura_m} m`),
        lead.cidade ? linha('Cidade', lead.cidade) : null,
        linha('Regime', lead.simplificada ? 'Edificação simplificada' : 'Edificação não simplificada')
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
        'Este documento é uma estimativa baseada nas tabelas do CSCIP/PR. O memorial descritivo oficial requer análise técnica detalhada. Para serviço completo, fale com nossos especialistas.'
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
