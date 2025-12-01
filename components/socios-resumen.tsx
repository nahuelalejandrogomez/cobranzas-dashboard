'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format-utils';
import DeudoresDetalle from './deudores-detalle';

interface DeudoresStats {
  // Mes Actual
  cuponesDeudaMesActual: number;   // Cantidad de cupones con deuda (mes actual)
  deudaMesActual: number;          // $ deuda del mes actual
  cobradoMesActual: number;        // $ cobrado del mes actual (solo CA y AD)
  bonificadoMesActual: number;     // $ bonificado del mes actual (BO)
  // Total Histórico
  cuponesDeudaTotal: number;       // Cantidad de cupones con deuda (total)
  deudaTotal: number;              // $ deuda total histórica
  cobradoTotal: number;            // $ cobrado total histórico (solo CA y AD)
  bonificadoTotal: number;         // $ bonificado total histórico (BO)
}

function SociosResumen() {
  const [stats, setStats] = useState<DeudoresStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetalle, setShowDetalle] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async (retries = 3) => {
    try {
      const response = await fetch('/api/kpi/deudores');
      if (!response.ok) {
        if (retries > 0) {
          await new Promise(r => setTimeout(r, 1000));
          return fetchStats(retries - 1);
        }
        throw new Error('Error al obtener estadísticas de deudores');
      }

      const data = await response.json();
      setStats(data.stats);
      setError(null);
    } catch (err) {
      if (retries > 0) {
        await new Promise(r => setTimeout(r, 1000));
        return fetchStats(retries - 1);
      }
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-red-800">
            🔄 Cargando lista de socios...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-50 border-2 border-red-200">
        <CardContent className="p-6">
          <p className="text-red-600">Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (showDetalle) {
    return (
      <DeudoresDetalle
        onBack={() => setShowDetalle(false)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Lista de Socios
        </h2>
        <p className="text-gray-600">
          Análisis y seguimiento de los socios
        </p>
      </div>
      
      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* TARJETA 1: MES ACTUAL */}
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-blue-800">📅 Mes Actual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm text-gray-600">Cupones con deuda:</span>
                  <span className="text-xl font-bold text-blue-600">{stats.cuponesDeudaMesActual}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm text-gray-600">$ Deuda:</span>
                  <span className="text-xl font-bold text-red-600">{formatCurrency(stats.deudaMesActual)}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm text-gray-600">$ Cobrado:</span>
                  <span className="text-xl font-bold text-green-600">{formatCurrency(stats.cobradoMesActual)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">$ Bonificado:</span>
                  <span className="text-xl font-bold text-orange-600">{formatCurrency(stats.bonificadoMesActual || 0)}</span>
                </div>
              </CardContent>
            </Card>

            {/* TARJETA 2: TOTAL HISTÓRICO */}
            <Card className="border-2 border-purple-200 bg-purple-50">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-purple-800">📊 Total Histórico</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm text-gray-600">Cupones con deuda:</span>
                  <span className="text-xl font-bold text-purple-600">{stats.cuponesDeudaTotal}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm text-gray-600">$ Deuda:</span>
                  <span className="text-xl font-bold text-red-700">{formatCurrency(stats.deudaTotal)}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm text-gray-600">$ Cobrado:</span>
                  <span className="text-xl font-bold text-green-700">{formatCurrency(stats.cobradoTotal || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">$ Bonificado:</span>
                  <span className="text-xl font-bold text-orange-700">{formatCurrency(stats.bonificadoTotal || 0)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-6">
            <Card 
              className="border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 cursor-pointer hover:shadow-lg transition-all duration-200"
              onClick={() => setShowDetalle(true)}
            >
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-blue-800 mb-2">
                  📋 Ver Lista Detallada de Socios
                </h3>
                <p className="text-gray-600">
                  Accede al detalle completo de socios con información de cobradores
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

export default SociosResumen;