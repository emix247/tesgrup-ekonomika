import type { Metadata } from 'next';
import ThemeProvider from '@/components/layout/ThemeProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tesgrup Development — Ekonomika projektů',
  description: 'Správa ekonomiky developerských projektů',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs" suppressHydrationWarning>
      <body className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
