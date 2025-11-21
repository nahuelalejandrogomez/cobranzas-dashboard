'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatCurrency } from '@/lib/format-utils';

interface Socio {
  numsocio: string;
  nomsocio: string;
  liquidaciones: number;
  monto: number;
}

export function SocioSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Socio[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      alert('Ingresa un término de búsqueda');
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams({
        q: searchTerm,
        ...(minAmount && { minAmount }),
        ...(maxAmount && { maxAmount }),
      });

      const res = await fetch(`/api/socios/search?${params}`);
      const data = await res.json();
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSearchTerm('');
    setMinAmount('');
    setMaxAmount('');
    setResults([]);
    setSearched(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-white border border-gray-200">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar por nombre o número
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Nombre o número de socio..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto mínimo
                </label>
                <input
                  type="number"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto máximo
                </label>
                <input
                  type="number"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  placeholder="∞"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSearch}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? 'Buscando...' : 'Buscar'}
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Limpiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {searched && (
        <Card className="bg-white border border-gray-200">
          <CardContent className="pt-6">
            {loading ? (
              <div className="text-center text-gray-600">Buscando...</div>
            ) : results.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 mb-4">
                  Se encontraron {results.length} resultado(s)
                </p>
                {results.map((socio) => (
                  <Link
                    key={socio.numsocio}
                    href={`/socios/${socio.numsocio}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {socio.nomsocio}
                        </p>
                        <p className="text-xs text-gray-500">
                          #{socio.numsocio}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {socio.liquidaciones} liquidaciones
                        </p>
                        <p className="text-sm text-blue-600">
                          {formatCurrency(socio.monto)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-600">
                No se encontraron resultados
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
