'use client';

import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Intervalo de auto-refresh: 45 minutos
const REFRESH_INTERVAL = 45 * 60 * 1000;

// ===== INTERFACES =====
interface ResumenHoy {
  fecha: string;
  total: number;
  enviados: number;
  errores: number;
  porcentajeExito: number;
}

interface DatosDia {
  fecha: string;
  enviados: number;
  errores: number;
  total: number;
}

interface ErrorMensaje {
  socio_id: string;
  telefono: string;
  errormessage: string;
  fecha_envio: string;
  mensaje: string;
}

export default function ObservabilidadPage() {
  const [session, setSession] = useState<{ username: string } | null>(null);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Estado datos
  const [resumenHoy, setResumenHoy] = useState<ResumenHoy | null>(null);
  const [ultimos7Dias, setUltimos7Dias] = useState<DatosDia[]>([]);
  const [errores, setErrores] = useState<ErrorMensaje[]>([]);

  useEffect(() => {
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resumenRes, diasRes, erroresRes] = await Promise.all([
        fetch('/api/observabilidad/resumen-hoy'),
        fetch('/api/observabilidad/ultimos-7-dias'),
        fetch('/api/observabilidad/errores')
      ]);
      if (resumenRes.ok) setResumenHoy(await resumenRes.json());
      if (diasRes.ok) setUltimos7Dias(await diasRes.json());
      if (erroresRes.ok) setErrores(await erroresRes.json());
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!checking) {
      fetchData();
      const interval = setInterval(fetchData, REFRESH_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [checking]);

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Verificando sesión...</div>
      </div>
    );
  }

  const maxTotal = Math.max(...ultimos7Dias.map(d => d.total), 1);

  return (
    <>
      <Navbar username={session?.username} />
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Observabilidad - Mensajes</h1>
              <p className="text-gray-600 mt-1">Monitoreo de mensajes enviados por n8n</p>
            </div>
            {lastUpdate && (
              <div className="text-xs text-gray-500 text-right">
                Última actualización: {lastUpdate.toLocaleTimeString('es-AR')}
                <br />
                <span className="text-gray-400">Auto-refresh: 45 min</span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-gray-500">Cargando datos...</div>
          ) : (
            <div className="space-y-8">
              {/* Resumen del Día */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Resumen del Día</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="bg-white border border-gray-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">Total Hoy</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-900">{resumenHoy?.total || 0}</div>
                      <p className="text-xs text-gray-500 mt-1">mensajes procesados</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border border-gray-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">Enviados OK</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">{resumenHoy?.enviados || 0}</div>
                      <p className="text-xs text-gray-500 mt-1">sin errores</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border border-gray-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">Errores</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-red-600">{resumenHoy?.errores || 0}</div>
                      <p className="text-xs text-gray-500 mt-1">fallidos</p>
                    </CardContent>
                  </Card>
                  <Card className={`border-2 ${(resumenHoy?.porcentajeExito || 0) >= 90 ? 'bg-green-50 border-green-200' : (resumenHoy?.porcentajeExito || 0) >= 70 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">Tasa de Éxito</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-3xl font-bold ${(resumenHoy?.porcentajeExito || 0) >= 90 ? 'text-green-600' : (resumenHoy?.porcentajeExito || 0) >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {resumenHoy?.porcentajeExito || 0}%
                      </div>
                      <p className="text-xs text-gray-500 mt-1">del día</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Últimos 7 Días */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Últimos 7 Días</h2>
                <Card className="bg-white border border-gray-200">
                  <CardContent className="pt-6">
                    {ultimos7Dias.length === 0 ? (
                      <div className="text-gray-500 text-center py-8">No hay datos en los últimos 7 días</div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex gap-4 text-xs mb-4">
                          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded"></div><span className="text-gray-600">OK</span></div>
                          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded"></div><span className="text-gray-600">Error</span></div>
                        </div>
                        {ultimos7Dias.map((dia) => {
                          const fecha = new Date(dia.fecha);
                          const fechaStr = fecha.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: 'short' });
                          return (
                            <div key={dia.fecha} className="flex items-center gap-3">
                              <div className="w-24 text-xs text-gray-600 text-right">{fechaStr}</div>
                              <div className="flex-1 flex gap-1 h-6">
                                <div className="bg-green-500 rounded-l" style={{ width: `${(dia.enviados / maxTotal) * 100}%`, minWidth: dia.enviados > 0 ? '4px' : '0' }} title={`OK: ${dia.enviados}`}></div>
                                <div className="bg-red-500 rounded-r" style={{ width: `${(dia.errores / maxTotal) * 100}%`, minWidth: dia.errores > 0 ? '4px' : '0' }} title={`Error: ${dia.errores}`}></div>
                              </div>
                              <div className="w-16 text-xs text-gray-600 text-right">{dia.total}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Errores */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Últimos Errores {errores.length > 0 && <span className="text-sm font-normal text-gray-500">({errores.length})</span>}
                </h2>
                <Card className="bg-white border border-gray-200">
                  <CardContent className="pt-6">
                    {errores.length === 0 ? (
                      <div className="text-gray-500 text-center py-8">No hay errores registrados</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-3 px-2 font-medium text-gray-600">Socio</th>
                              <th className="text-left py-3 px-2 font-medium text-gray-600">Teléfono</th>
                              <th className="text-left py-3 px-2 font-medium text-gray-600">Error</th>
                              <th className="text-left py-3 px-2 font-medium text-gray-600">Fecha</th>
                            </tr>
                          </thead>
                          <tbody>
                            {errores.map((error, idx) => (
                              <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-3 px-2"><span className="font-mono text-blue-600">{error.socio_id}</span></td>
                                <td className="py-3 px-2 text-gray-600">{error.telefono}</td>
                                <td className="py-3 px-2"><span className="text-red-600 bg-red-50 px-2 py-1 rounded text-xs">{error.errormessage}</span></td>
                                <td className="py-3 px-2 text-gray-500 text-xs">{new Date(error.fecha_envio).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
