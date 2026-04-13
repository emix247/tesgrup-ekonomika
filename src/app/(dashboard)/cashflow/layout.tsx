'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

const tabs = [
  { label: 'Dashboard', href: '/cashflow' },
  { label: 'Položky', href: '/cashflow/polozky' },
  { label: 'Úvěry', href: '/cashflow/uvery' },
  { label: 'Zůstatky', href: '/cashflow/zustatky' },
  { label: 'Snapshoty', href: '/cashflow/snapshoty' },
  { label: 'Nastavení', href: '/cashflow/nastaveni' },
];

export default function CashflowLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Cashflow 13W</h1>
        <p className="text-sm text-gray-500 mt-1">13-týdenní forecast peněžních toků</p>
      </div>

      {/* Tab navigation */}
      <div className="mb-6 border-b border-gray-200 overflow-x-auto scrollbar-hide">
        <nav className="flex gap-0 min-w-max">
          {tabs.map(tab => {
            const isActive = tab.href === '/cashflow'
              ? pathname === '/cashflow'
              : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                  isActive
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Page content */}
      {children}
    </div>
  );
}
