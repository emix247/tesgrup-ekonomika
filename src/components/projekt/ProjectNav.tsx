'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

const tabs = [
  { label: 'Přehled', href: '' },
  { label: 'Příjmy', href: '/prijmy' },
  { label: 'Náklady', href: '/naklady' },
  { label: 'Financování', href: '/financovani' },
  { label: 'Daně & Výstupy', href: '/dane-vystupy' },
  { label: 'Milníky', href: '/milniky' },
  { label: 'Srovnání', href: '/srovnani' },
];

interface ProjectNavProps {
  projectId: string;
  projectStatus?: string;
}

export default function ProjectNav({ projectId, projectStatus }: ProjectNavProps) {
  const pathname = usePathname();
  const basePath = `/projekty/${projectId}`;

  return (
    <div className="flex gap-1 border-b border-gray-200 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
      {tabs.map((tab) => {
        const href = `${basePath}${tab.href}`;
        const isActive = tab.href === ''
          ? pathname === basePath || pathname === `${basePath}/`
          : pathname === href || pathname.startsWith(href + '/');

        return (
          <Link
            key={tab.href}
            href={href}
            className={cn(
              'px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
              isActive
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            {tab.label}
            {tab.href === '/srovnani' && projectStatus === 'dokonceno' && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-100 text-emerald-700">
                ✓
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
