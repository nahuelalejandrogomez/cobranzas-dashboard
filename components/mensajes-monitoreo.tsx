'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MensajesMes {
  total_mensajes_del_mes: number;
  total_ok: number;
  total_error: number;
}

interface MensajesDia {
  dia: string;
  total: number;
  ok: number;
  error: number;
}

export function MensajesMonitoreo() {
  const [totales, setTotales] = useState<MensajesMes | null>(null);
  const [porDia, setPorDia] = useState<MensajesDia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mesRes, diaRes] = await Promise.all([
          fetch('/api/dashboard/mensajes-mes'),
          fetch('/api/dashboard/mensajes-por-dia')
        ]);

        if (mesRes.ok) {
          setTotales(await mesRes.json());
        }
        if (diaRes.ok) {
          setPorDia(await diaRes.json());
        }
      } catch (error) {
        console.error('Error fetching mensajes data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Card className="bg-white border border-gray-200">
        <CardContent className="p-6">
          <div className="text-gray-500">Cargando monitoreo de mensajes...</div>
        </CardContent>
      </Card>
    );
  }

  // Calcular el máximo para escalar las barras
  const maxTotal = Math.max(...porDia.map(d => d.total), 1);

  return (
    <div className="space-y-6">
      {/* Título de sección */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Monitoreo de Mensajes</h2>
        <p className="text-sm text-gray-500">Envíos de cobranza del mes actual</p>
      </div>

      {/* Contadores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Mensajes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {totales?.total_mensajes_del_mes || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Este mes</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Enviados OK
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totales?.total_ok || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Sin errores</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Errores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {totales?.total_error || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Fallidos</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico por día */}
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-600">
            Mensajes por Día
          </CardTitle>
        </CardHeader>
        <CardContent>
          {porDia.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              No hay datos de mensajes este mes
            </div>
          ) : (
            <div className="space-y-3">
              {/* Leyenda */}
              <div className="flex gap-4 text-xs mb-4">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-gray-400 rounded"></div>
                  <span className="text-gray-600">Total</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-gray-600">OK</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="text-gray-600">Error</span>
                </div>
              </div>

              {/* Barras */}
              {porDia.map((dia) => {
                const fecha = new Date(dia.dia);
                const fechaStr = fecha.toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: 'short'
                });

                return (
                  <div key={dia.dia} className="flex items-center gap-3">
                    <div className="w-16 text-xs text-gray-600 text-right">
                      {fechaStr}
                    </div>
                    <div className="flex-1 flex gap-1 h-6">
                      {/* Barra OK */}
                      <div
                        className="bg-green-500 rounded-l"
                        style={{
                          width: `${(dia.ok / maxTotal) * 100}%`,
                          minWidth: dia.ok > 0 ? '4px' : '0'
                        }}
                        title={`OK: ${dia.ok}`}
                      ></div>
                      {/* Barra Error */}
                      <div
                        className="bg-red-500 rounded-r"
                        style={{
                          width: `${(dia.error / maxTotal) * 100}%`,
                          minWidth: dia.error > 0 ? '4px' : '0'
                        }}
                        title={`Error: ${dia.error}`}
                      ></div>
                    </div>
                    <div className="w-12 text-xs text-gray-600 text-right">
                      {dia.total}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
