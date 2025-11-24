'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface NavbarProps {
  username?: string;
}

export function Navbar({ username }: NavbarProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-bold text-xl text-gray-900">
            Cobranzas
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Dashboard
            </Link>
            <Link
              href="/socios"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Buscar Socios
            </Link>
            <Link
              href="/observabilidad"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Mensajes
            </Link>
            <Link
              href="/observabilidad-ia"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Uso IA
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {username && (
            <span className="text-sm text-gray-600">Hola, {username}</span>
          )}
          <Button
            onClick={handleLogout}
            disabled={loading}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            {loading ? 'Cerrando sesión...' : 'Cerrar sesión'}
          </Button>
        </div>
      </div>
    </nav>
  );
}
