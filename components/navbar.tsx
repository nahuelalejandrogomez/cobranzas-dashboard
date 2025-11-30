'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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
    <nav className="bg-white border-b-2 border-[#009444] sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Image
              src="/logo/PresenciaMedicaLogo.jpg"
              alt="Presencia Médica"
              width={140}
              height={50}
              className="object-contain"
              priority
            />
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-gray-700 hover:text-[#009444] transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/socios"
              className="text-sm font-medium text-gray-700 hover:text-[#009444] transition-colors"
            >
              Buscar Socios
            </Link>
            <Link
              href="/envio-mensajes"
              className="text-sm font-medium text-gray-700 hover:text-[#009444] transition-colors"
            >
              Envío de Mensajes
            </Link>
            <Link
              href="/observabilidad"
              className="text-sm font-medium text-gray-700 hover:text-[#009444] transition-colors"
            >
              Observabilidad
            </Link>
            <Link
              href="/observabilidad-ia"
              className="text-sm font-medium text-gray-700 hover:text-[#009444] transition-colors"
            >
              Uso IA
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {username && (
            <span className="text-sm text-gray-600">Hola, <span className="font-semibold text-[#009444]">{username}</span></span>
          )}
          <Button
            onClick={handleLogout}
            disabled={loading}
            variant="outline"
            className="border-[#009444] text-[#009444] hover:bg-[#009444] hover:text-white transition-colors"
          >
            {loading ? 'Cerrando sesión...' : 'Cerrar sesión'}
          </Button>
        </div>
      </div>
    </nav>
  );
}
