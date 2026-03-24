'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simple demo auth — replace with real auth later
    if (email && password) {
      // Store login state
      document.cookie = 'tesgrup-auth=1; path=/; max-age=86400';
      router.push('/portfolio');
    } else {
      setError('Vyplňte e-mail a heslo');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#253631] px-4">
      {/* Background subtle pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 25% 25%, #c79c50 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Image
            src="/tesgrup-logo.png"
            alt="Tesgrup Development"
            width={280}
            height={93}
            className="inline-block w-auto h-20"
            priority
          />
          <div className="text-[13px] text-[#839590] mt-3 tracking-[0.2em] uppercase font-bold">
            Ekonomika projektů
          </div>
        </div>

        {/* Login card */}
        <div className="bg-[#2e423c] rounded-2xl border border-[#435550] p-8 shadow-2xl shadow-black/20">
          <h1 className="text-xl font-semibold text-[#f0e9da] mb-1">Přihlášení</h1>
          <p className="text-sm text-[#839590] mb-6">Zadejte své přihlašovací údaje</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#c0b8a8] mb-1.5">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vas@email.cz"
                className="w-full px-4 py-3 bg-[#344540] border border-[#435550] rounded-lg text-[#f0e9da] placeholder-[#6b7b76] focus:outline-none focus:border-[#c79c50] focus:ring-1 focus:ring-[#c79c50] transition-colors"
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#c0b8a8] mb-1.5">
                Heslo
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-[#344540] border border-[#435550] rounded-lg text-[#f0e9da] placeholder-[#6b7b76] focus:outline-none focus:border-[#c79c50] focus:ring-1 focus:ring-[#c79c50] transition-colors"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2.5">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#c79c50] hover:bg-[#b58a3e] text-[#1d2a26] font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Přihlašování...
                </span>
              ) : (
                'Přihlásit se'
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#435550] text-center">
            <a href="#" className="text-sm text-[#c79c50] hover:text-[#d4ad65] transition-colors">
              Zapomenuté heslo?
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-[#6b7b76]">
          &copy; {new Date().getFullYear()} Tesgrup Development s.r.o.
        </div>
      </div>
    </div>
  );
}
