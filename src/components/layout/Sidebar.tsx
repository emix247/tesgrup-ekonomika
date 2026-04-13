'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import ThemeToggle from './ThemeToggle';

interface SidebarProps {
  projects: { id: string; name: string }[];
}

const navItems = [
  {
    label: 'Portfolio',
    href: '/portfolio',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
      </svg>
    ),
  },
  {
    label: 'Projekty',
    href: '/projekty',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
      </svg>
    ),
  },
  {
    label: 'Cashflow 13W',
    href: '/cashflow',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
      </svg>
    ),
  },
  {
    label: 'Režijní náklady',
    href: '/rezijni-naklady',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
      </svg>
    ),
  },
  {
    label: 'Archiv',
    href: '/archiv',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
      </svg>
    ),
  },
];

export default function Sidebar({ projects }: SidebarProps) {
  const pathname = usePathname();
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const sidebarContent = (
    <>
      <div className="px-3 py-6 border-b border-white/10">
        {/* Close button - mobile only */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden absolute top-3 right-3 p-1 text-gray-400 hover:text-white transition-colors z-10"
          aria-label="Zavřít menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
        <Link href="/portfolio" className="block text-center">
          <Image src="/tesgrup-logo.png" alt="Tesgrup Development" width={240} height={80} className="inline-block w-auto h-16" priority />
        </Link>
        <div className="text-[11px] text-gray-400 mt-2 tracking-wider uppercase text-center font-bold">Ekonomika projektů</div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === '/projekty'
              ? pathname === '/projekty' || pathname === '/projekty/novy'
              : pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <div key={item.href}>
              <div className="flex items-center">
                <Link
                  href={item.href}
                  className={cn(
                    'flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-active text-white'
                      : 'text-gray-300 hover:bg-sidebar-hover hover:text-white'
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
                {item.href === '/projekty' && projects.length > 0 && (
                  <button
                    onClick={() => setProjectsOpen(!projectsOpen)}
                    className="p-1.5 text-gray-400 hover:text-white transition-colors"
                  >
                    <svg
                      className={cn('w-4 h-4 transition-transform', projectsOpen ? 'rotate-90' : '')}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Project list */}
              {item.href === '/projekty' && projectsOpen && projects.length > 0 && (
                <div className="ml-4 mt-1 space-y-0.5">
                  {projects.map(p => {
                    const projActive = pathname.startsWith(`/projekty/${p.id}`);
                    return (
                      <Link
                        key={p.id}
                        href={`/projekty/${p.id}`}
                        className={cn(
                          'block px-3 py-1.5 rounded text-xs transition-colors truncate',
                          projActive
                            ? 'text-white bg-sidebar-active/50'
                            : 'text-gray-400 hover:text-white hover:bg-sidebar-hover'
                        )}
                        title={p.name}
                      >
                        {p.name}
                      </Link>
                    );
                  })}
                </div>
              )}

            </div>
          );
        })}
      </nav>

      <div className="px-3 pb-4 space-y-2">
        <Link
          href="/projekty/novy"
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nový projekt
        </Link>
        <div className="flex justify-center">
          <ThemeToggle />
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar text-white flex items-center gap-3 px-4 py-3 shadow-lg">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 text-gray-300 hover:text-white transition-colors"
          aria-label="Otevřít menu"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <Image src="/tesgrup-logo.png" alt="Tesgrup" width={120} height={40} className="w-auto h-7" priority />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={cn(
          'lg:hidden fixed left-0 top-0 z-50 h-screen w-72 bg-sidebar text-white flex flex-col transition-transform duration-300 ease-in-out shadow-2xl',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar - always visible */}
      <aside className="hidden lg:flex fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar text-white flex-col">
        {sidebarContent}
      </aside>
    </>
  );
}
