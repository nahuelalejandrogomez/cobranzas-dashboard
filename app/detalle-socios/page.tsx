'use client';

import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import SociosResumen from '@/components/socios-resumen';

export default function DetalleSocios() {
  const [session, setSession] = useState<{ username: string } | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check session on client side
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/check');
        if (res.ok) {
          const data = await res.json();
          setSession(data);
        } else {
          redirect('/login');
        }
      } catch (error) {
        console.error('Session check error:', error);
        redirect('/login');
      } finally {
        setChecking(false);
      }
    };

    checkSession();
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  return (
    <>
      <Navbar username={session?.username} />
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="border-l-4 border-[#009444] pl-4">
            <h1 className="text-3xl font-bold text-[#009444]">
              Lista de Socios
            </h1>
            <p className="text-gray-600 mt-1">
              Análisis y seguimiento de los socios - Presencia Médica
            </p>
          </div>

          {/* Componente de Socios */}
          <SociosResumen />
        </div>
      </main>
    </>
  );
}
