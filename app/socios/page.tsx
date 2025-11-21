'use client';

import { useState, useEffect } from 'react';
import { SocioSearch } from '@/components/socio-search';
import { Navbar } from '@/components/navbar';

export default function SociosPage() {
  const [session, setSession] = useState<{ username: string } | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const res = await fetch('/api/auth/check');
      if (res.ok) {
        const data = await res.json();
        setSession(data);
      }
    };
    checkSession();
  }, []);

  return (
    <>
      <Navbar username={session?.username} />
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Búsqueda de Socios
            </h1>
            <p className="text-gray-600 mt-1">
              Busca y visualiza información detallada de socios
            </p>
          </div>

          {/* Search Component */}
          <SocioSearch />
        </div>
      </main>
    </>
  );
}
