import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Memorial CBPR — Gerador de Memorial Descritivo',
  description: 'Gere memoriais descritivos do Corpo de Bombeiros do Paraná com base nas NPTs 005, 008, 011 e 017.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
