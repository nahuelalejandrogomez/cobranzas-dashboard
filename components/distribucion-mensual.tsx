'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format-utils';
import { DistribucionMensual as DistribucionMensualType } from '@/lib/types';

// Colores estéticos y modernos con alta legibilidad
const COLORS = {
  cobrado: '#10B981',    // Verde esmeralda
  adeudado: '#F59E0B',   // Ámbar
  bonificado: '#8B5CF6'  // Violeta
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center space-x-2 mb-1">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-700">
              {entry.name}: {entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function DistribucionMensual() {
  const [data, setData] = useState<DistribucionMensualType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (retries = 3) => {
    try {
      const response = await fetch('/api/kpi/distribucion-mensual');
      if (!response.ok) {
        if (retries > 0) {
          // Reintentar después de 1 segundo
          await new Promise(r => setTimeout(r, 1000));
          return fetchData(retries - 1);
        }
        throw new Error('Error al obtener datos');
      }

      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      if (retries > 0) {
        await new Promise(r => setTimeout(r, 1000));
        return fetchData(retries - 1);
      }
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="h-80 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-500">Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  // Preparar datos para el gráfico
  const chartData = data.map(item => ({
    periodo: `${item.mes.substring(0, 3)} ${item.año}`,
    'Cupones Cobrados': item.cuponesCobrados,
    'Cupones Adeudados': item.cuponesAdeudados,
    'Cupones Bonificados': item.cuponesBonificados,
  }));



  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Distribución Mensual de Estados
        </h2>
        <p className="text-gray-600">
          Análisis de cupones y montos por estado en los últimos 5 meses
        </p>
      </div>

      {/* Gráfico de Barras */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">
            Distribución por Cantidad de Cupones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="periodo" 
                tick={{ fontSize: 12 }}
                stroke="#6B7280"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#6B7280"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: '14px', fontWeight: '500' }}
              />
              <Bar 
                dataKey="Cupones Cobrados" 
                fill={COLORS.cobrado}
                radius={[4, 4, 0, 0]}
                name="Cobrados"
              />
              <Bar 
                dataKey="Cupones Adeudados" 
                fill={COLORS.adeudado}
                radius={[4, 4, 0, 0]}
                name="Adeudados"
              />
              <Bar 
                dataKey="Cupones Bonificados" 
                fill={COLORS.bonificado}
                radius={[4, 4, 0, 0]}
                name="Bonificados"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>



      {/* Tabla detallada */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">
            Detalle Mensual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-3 font-semibold text-gray-700">Mes</th>
                  <th className="text-right p-3 font-semibold" style={{ color: COLORS.cobrado }}>
                    Cobrados
                  </th>
                  <th className="text-right p-3 font-semibold" style={{ color: COLORS.adeudado }}>
                    Adeudados
                  </th>
                  <th className="text-right p-3 font-semibold" style={{ color: COLORS.bonificado }}>
                    Bonificados
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-900">
                      {item.mes} {item.año}
                    </td>
                    <td className="p-3 text-right">
                      <div className="space-y-1">
                        <div className="font-semibold text-gray-900">
                          {item.cuponesCobrados.toLocaleString()}
                        </div>
                        <div className="text-xs" style={{ color: COLORS.cobrado }}>
                          {formatCurrency(item.montoCobrado)}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="space-y-1">
                        <div className="font-semibold text-gray-900">
                          {item.cuponesAdeudados.toLocaleString()}
                        </div>
                        <div className="text-xs" style={{ color: COLORS.adeudado }}>
                          {formatCurrency(item.montoAdeudado)}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="space-y-1">
                        <div className="font-semibold text-gray-900">
                          {item.cuponesBonificados.toLocaleString()}
                        </div>
                        <div className="text-xs" style={{ color: COLORS.bonificado }}>
                          {formatCurrency(item.montoBonificado)}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}