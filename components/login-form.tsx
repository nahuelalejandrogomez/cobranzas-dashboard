'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error en el login');
        return;
      }

      router.push('/');
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white border-2 border-[#009444] shadow-lg">
        <CardHeader className="border-b-2 border-[#009444] text-center pb-6">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo/PresenciaMedicaLogo.jpg"
              alt="Presencia Médica"
              width={200}
              height={70}
              className="object-contain"
              priority
            />
          </div>
          <CardTitle className="text-2xl text-[#009444] font-bold">
            Dashboard de Cobranzas
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">Inicia sesión para continuar</p>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-[#D9534F] rounded-lg text-[#D9534F] text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingresa tu usuario"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#009444] focus:border-transparent outline-none transition-all"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#009444] focus:border-transparent outline-none transition-all"
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full bg-[#009444] hover:bg-[#007a38] text-white font-semibold transition-colors"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Button>

            <div className="p-3 bg-green-50 border border-[#009444] rounded-lg text-xs text-gray-700">
              <p className="font-semibold mb-1 text-[#009444]">Credenciales de prueba:</p>
              <p>Usuario: <span className="font-mono">admin</span> | Contraseña: <span className="font-mono">admin123</span></p>
              <p>Usuario: <span className="font-mono">cobranzas</span> | Contraseña: <span className="font-mono">cobranzas123</span></p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
