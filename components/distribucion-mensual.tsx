'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format-utils';

interface MesData {
  mes: string;
  año: number;
  cuponesCobrados: number;
  montoCobrado: number;
  cuponesAdeudados: number;
  montoAdeudado: number;
  cuponesBonificados: number;
  montoBonificado: number;
}

const COLORS = {
  cobrado: '#10B981',
  adeudado: '#F59E0B',
  bonificado: '#8B5CF6'
};

// Nombres de meses en español
const MESES_ES: Record<string, string> = {
  'January': 'Enero',
  'February': 'Febrero',
  'March': 'Marzo',
  'April': 'Abril',
  'May': 'Mayo',
  'June': 'Junio',
  'July': 'Julio',
  'August': 'Agosto',
  'September': 'Septiembre',
  'October': 'Octubre',
  'November': 'Noviembre',
  'December': 'Diciembre'
};

export function DistribucionMensual() {
  const [data, setData] = useState<MesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        console.log('[DistribucionMensual] Fetching data...');
        const response = await fetch('/api/kpi/distribucion-mensual');

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[DistribucionMensual] Error response:', response.status, errorText);
          throw new Error(`Error ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        console.log('[DistribucionMensual] Data received:', result);

        if (isMounted) {
          if (Array.isArray(result)) {
            setData(result);
            setError(null);
          } else {
            console.error('[DistribucionMensual] Invalid data format:', result);
            setError('Formato de datos inválido');
          }
        }
      } catch (err) {
        console.error('[DistribucionMensual] Fetch error:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Error desconocido');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Calcular totales
  const totales = data.reduce((acc, item) => ({
    cuponesCobrados: acc.cuponesCobrados + (item.cuponesCobrados || 0),
    montoCobrado: acc.montoCobrado + (item.montoCobrado || 0),
    cuponesAdeudados: acc.cuponesAdeudados + (item.cuponesAdeudados || 0),
    montoAdeudado: acc.montoAdeudado + (item.montoAdeudado || 0),
    cuponesBonificados: acc.cuponesBonificados + (item.cuponesBonificados || 0),
    montoBonificado: acc.montoBonificado + (item.montoBonificado || 0),
  }), {
    cuponesCobrados: 0,
    montoCobrado: 0,
    cuponesAdeudados: 0,
    montoAdeudado: 0,
    cuponesBonificados: 0,
    montoBonificado: 0,
  });

  // Calcular el máximo para las barras
  const maxCupones = Math.max(
    ...data.map(d => Math.max(d.cuponesCobrados || 0, d.cuponesAdeudados || 0, d.cuponesBonificados || 0)),
    1
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Cargando distribución mensual...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <p className="text-red-600 font-medium">Error al cargar distribución mensual</p>
          <p className="text-red-500 text-sm mt-1">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reintentar
          </button>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500 text-center">No hay datos disponibles</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Distribución Mensual
        </h2>
        <p className="text-gray-600">
          Últimos {data.length} meses - Cupones cobrados vs adeudados
        </p>
      </div>

      {/* Gráfico de barras simple (sin Recharts) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">
            Cupones por Mes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.map((item, index) => {
              const mesES = MESES_ES[item.mes] || item.mes;
              const cobradoPct = ((item.cuponesCobrados || 0) / maxCupones) * 100;
              const adeudadoPct = ((item.cuponesAdeudados || 0) / maxCupones) * 100;

              return (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{mesES} {item.año}</span>
                    <span className="text-gray-500">
                      {(item.cuponesCobrados || 0) + (item.cuponesAdeudados || 0)} cupones
                    </span>
                  </div>
                  <div className="flex gap-1 h-6">
                    {/* Barra cobrados */}
                    <div
                      className="rounded-l transition-all duration-300"
                      style={{
                        width: `${cobradoPct}%`,
                        backgroundColor: COLORS.cobrado,
                        minWidth: item.cuponesCobrados > 0 ? '20px' : '0'
                      }}
                      title={`Cobrados: ${item.cuponesCobrados}`}
                    />
                    {/* Barra adeudados */}
                    <div
                      className="rounded-r transition-all duration-300"
                      style={{
                        width: `${adeudadoPct}%`,
                        backgroundColor: COLORS.adeudado,
                        minWidth: item.cuponesAdeudados > 0 ? '20px' : '0'
                      }}
                      title={`Adeudados: ${item.cuponesAdeudados}`}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: COLORS.cobrado }}>
                      Cobrados: {item.cuponesCobrados || 0} ({formatCurrency(item.montoCobrado || 0)})
                    </span>
                    <span style={{ color: COLORS.adeudado }}>
                      Adeudados: {item.cuponesAdeudados || 0} ({formatCurrency(item.montoAdeudado || 0)})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Leyenda */}
          <div className="flex gap-6 mt-6 pt-4 border-t justify-center">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.cobrado }}></div>
              <span className="text-sm text-gray-600">Cobrados</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.adeudado }}></div>
              <span className="text-sm text-gray-600">Adeudados</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla detallada */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">
            Detalle por Mes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  <th className="text-left p-3 font-semibold text-gray-700">Mes</th>
                  <th className="text-right p-3 font-semibold" style={{ color: COLORS.cobrado }}>
                    Cobrados
                  </th>
                  <th className="text-right p-3 font-semibold" style={{ color: COLORS.cobrado }}>
                    $ Cobrado
                  </th>
                  <th className="text-right p-3 font-semibold" style={{ color: COLORS.adeudado }}>
                    Adeudados
                  </th>
                  <th className="text-right p-3 font-semibold" style={{ color: COLORS.adeudado }}>
                    $ Deuda
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => {
                  const mesES = MESES_ES[item.mes] || item.mes;
                  return (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-900">
                        {mesES} {item.año}
                      </td>
                      <td className="p-3 text-right font-semibold" style={{ color: COLORS.cobrado }}>
                        {(item.cuponesCobrados || 0).toLocaleString()}
                      </td>
                      <td className="p-3 text-right text-gray-700">
                        {formatCurrency(item.montoCobrado || 0)}
                      </td>
                      <td className="p-3 text-right font-semibold" style={{ color: COLORS.adeudado }}>
                        {(item.cuponesAdeudados || 0).toLocaleString()}
                      </td>
                      <td className="p-3 text-right text-gray-700">
                        {formatCurrency(item.montoAdeudado || 0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 bg-gray-100 font-bold">
                  <td className="p-3 text-gray-900">TOTAL</td>
                  <td className="p-3 text-right" style={{ color: COLORS.cobrado }}>
                    {totales.cuponesCobrados.toLocaleString()}
                  </td>
                  <td className="p-3 text-right text-gray-900">
                    {formatCurrency(totales.montoCobrado)}
                  </td>
                  <td className="p-3 text-right" style={{ color: COLORS.adeudado }}>
                    {totales.cuponesAdeudados.toLocaleString()}
                  </td>
                  <td className="p-3 text-right text-gray-900">
                    {formatCurrency(totales.montoAdeudado)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
