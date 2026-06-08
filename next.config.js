/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['@react-pdf/renderer', 'exceljs', 'docx']
  }
};
module.exports = nextConfig;
