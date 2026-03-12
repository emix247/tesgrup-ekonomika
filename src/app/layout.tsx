import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tesgrup Development — Ekonomika projektů',
  description: 'Správa ekonomiky developerských projektů',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
