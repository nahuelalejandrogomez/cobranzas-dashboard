'use client';

import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Intervalo de auto-refresh: 45 minutos
const REFRESH_INTERVAL = 45 * 60 * 1000;

// ===== INTERFACES MENSAJES =====
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

// ===== INTERFACES OPENAI API =====
interface OpenAIUsage {
  total_requests: number;
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
  por_dia: { fecha: string; tokens: number; requests: number }[];
  por_modelo: { modelo: string; requests: number; tokens: number }[];
  dias_consultados: number;
  errores: { fecha: string; error: string | number }[];
}

export default function ObservabilidadPage() {
  const [session, setSession] = useState<{ username: string } | null>(null);
  const [checking, setChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<'mensajes' | 'ia'>('mensajes');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Estado Mensajes
  const [loadingMensajes, setLoadingMensajes] = useState(true);
  const [resumenHoy, setResumenHoy] = useState<ResumenHoy | null>(null);
  const [ultimos7Dias, setUltimos7Dias] = useState<DatosDia[]>([]);
  const [erroresMensajes, setErroresMensajes] = useState<ErrorMensaje[]>([]);

  // Estado IA (OpenAI API)
  const [loadingIA, setLoadingIA] = useState(true);
  const [openaiUsage, setOpenaiUsage] = useState<OpenAIUsage | null>(null);
  const [openaiError, setOpenaiError] = useState<string | null>(null);

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

  // Fetch Mensajes
  const fetchMensajes = async () => {
    setLoadingMensajes(true);
    try {
      const [resumenRes, diasRes, erroresRes] = await Promise.all([
        fetch('/api/observabilidad/resumen-hoy'),
        fetch('/api/observabilidad/ultimos-7-dias'),
        fetch('/api/observabilidad/errores')
      ]);
      if (resumenRes.ok) setResumenHoy(await resumenRes.json());
      if (diasRes.ok) setUltimos7Dias(await diasRes.json());
      if (erroresRes.ok) setErroresMensajes(await erroresRes.json());
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching mensajes:', error);
    } finally {
      setLoadingMensajes(false);
    }
  };

  // Fetch IA desde OpenAI API
  const fetchIA = async () => {
    setLoadingIA(true);
    setOpenaiError(null);
    try {
      const res = await fetch('/api/observabilidad-ia/openai-usage?dias=7');
      const data = await res.json();

      if (data.error) {
        setOpenaiError(data.error);
        setOpenaiUsage(null);
      } else {
        setOpenaiUsage(data);
      }
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching IA:', error);
      setOpenaiError('Error de conexión');
    } finally {
      setLoadingIA(false);
    }
  };

  useEffect(() => {
    if (!checking) {
      if (activeTab === 'mensajes') {
        fetchMensajes();
      } else {
        fetchIA();
      }
      const interval = setInterval(() => {
        if (activeTab === 'mensajes') fetchMensajes();
        else fetchIA();
      }, REFRESH_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [checking, activeTab]);

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Verificando sesión...</div>
      </div>
    );
  }

  const maxTotalMensajes = Math.max(...ultimos7Dias.map(d => d.total), 1);
  const maxTokensIA = Math.max(...(openaiUsage?.por_dia?.map(d => d.tokens) || [1]), 1);
  const maxTokensModelo = Math.max(...(openaiUsage?.por_modelo?.map(d => d.tokens) || [1]), 1);

  return (
    <>
      <Navbar username={session?.username} />
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Observabilidad</h1>
              <p className="text-gray-600 mt-1">Monitoreo de flujos automáticos</p>
            </div>
            {lastUpdate && (
              <div className="text-xs text-gray-500 text-right">
                Última actualización: {lastUpdate.toLocaleTimeString('es-AR')}
                <br />
                <span className="text-gray-400">Auto-refresh: 45 min</span>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('mensajes')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'mensajes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Mensajes (n8n)
            </button>
            <button
              onClick={() => setActiveTab('ia')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'ia'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Uso de IA (ChatGPT)
            </button>
          </div>

          {/* ===== TAB MENSAJES ===== */}
          {activeTab === 'mensajes' && (
            loadingMensajes ? (
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
                                  <div className="bg-green-500 rounded-l" style={{ width: `${(dia.enviados / maxTotalMensajes) * 100}%`, minWidth: dia.enviados > 0 ? '4px' : '0' }} title={`OK: ${dia.enviados}`}></div>
                                  <div className="bg-red-500 rounded-r" style={{ width: `${(dia.errores / maxTotalMensajes) * 100}%`, minWidth: dia.errores > 0 ? '4px' : '0' }} title={`Error: ${dia.errores}`}></div>
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

                {/* Errores Mensajes */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Últimos Errores {erroresMensajes.length > 0 && <span className="text-sm font-normal text-gray-500">({erroresMensajes.length})</span>}</h2>
                  <Card className="bg-white border border-gray-200">
                    <CardContent className="pt-6">
                      {erroresMensajes.length === 0 ? (
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
                              {erroresMensajes.map((error, idx) => (
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
            )
          )}

          {/* ===== TAB IA (OpenAI API) ===== */}
          {activeTab === 'ia' && (
            <div className="space-y-8">
              {loadingIA ? (
                <div className="text-gray-500">Consultando API de OpenAI...</div>
              ) : openaiError ? (
                <Card className="bg-red-50 border border-red-200">
                  <CardContent className="pt-6">
                    <div className="text-red-600 text-center py-4">
                      <p className="font-medium">Error al consultar OpenAI</p>
                      <p className="text-sm mt-1">{openaiError}</p>
                      <p className="text-xs mt-2 text-gray-500">Verificá que OPENAI_API_KEY y OPENAI_ORG_ID estén configuradas en Railway</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* KPIs OpenAI */}
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      Resumen Últimos 7 Días
                      <span className="text-sm font-normal text-gray-500 ml-2">(datos de OpenAI API)</span>
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="bg-white border border-gray-200">
                        <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-gray-600">Requests</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold text-purple-600">{openaiUsage?.total_requests?.toLocaleString() || 0}</div></CardContent>
                      </Card>
                      <Card className="bg-white border border-gray-200">
                        <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-gray-600">Tokens Totales</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold text-gray-900">{openaiUsage?.total_tokens?.toLocaleString() || 0}</div></CardContent>
                      </Card>
                      <Card className="bg-white border border-gray-200">
                        <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-gray-600">Input Tokens</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold text-blue-600">{openaiUsage?.input_tokens?.toLocaleString() || 0}</div></CardContent>
                      </Card>
                      <Card className="bg-white border border-gray-200">
                        <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-gray-600">Output Tokens</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold text-green-600">{openaiUsage?.output_tokens?.toLocaleString() || 0}</div></CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Gráfico por Día */}
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Uso por Día</h2>
                    <Card className="bg-white border border-gray-200">
                      <CardContent className="pt-6">
                        {(!openaiUsage?.por_dia || openaiUsage.por_dia.length === 0) ? (
                          <div className="text-gray-500 text-center py-8">No hay datos disponibles</div>
                        ) : (
                          <div className="space-y-3">
                            {openaiUsage.por_dia.map((dia) => {
                              const fecha = new Date(dia.fecha);
                              const fechaStr = fecha.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: 'short' });
                              return (
                                <div key={dia.fecha} className="flex items-center gap-3">
                                  <div className="w-24 text-xs text-gray-600 text-right">{fechaStr}</div>
                                  <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                                    <div className="h-full bg-purple-500 rounded" style={{ width: `${(dia.tokens / maxTokensIA) * 100}%` }} title={`${dia.tokens.toLocaleString()} tokens`}></div>
                                  </div>
                                  <div className="w-32 text-xs text-gray-600 text-right">{dia.requests} req / {dia.tokens.toLocaleString()} tok</div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Gráfico por Modelo */}
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Uso por Modelo</h2>
                    <Card className="bg-white border border-gray-200">
                      <CardContent className="pt-6">
                        {(!openaiUsage?.por_modelo || openaiUsage.por_modelo.length === 0) ? (
                          <div className="text-gray-500 text-center py-8">No hay datos disponibles</div>
                        ) : (
                          <div className="space-y-3">
                            {openaiUsage.por_modelo.map((modelo) => (
                              <div key={modelo.modelo} className="flex items-center gap-3">
                                <div className="w-40 text-xs text-gray-600 text-right truncate" title={modelo.modelo}>{modelo.modelo}</div>
                                <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                                  <div className="h-full bg-indigo-500 rounded" style={{ width: `${(modelo.tokens / maxTokensModelo) * 100}%` }}></div>
                                </div>
                                <div className="w-36 text-xs text-gray-600 text-right">{modelo.requests} req / {modelo.tokens.toLocaleString()} tok</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Errores de consulta */}
                  {openaiUsage?.errores && openaiUsage.errores.length > 0 && (
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">Errores de Consulta API</h2>
                      <Card className="bg-yellow-50 border border-yellow-200">
                        <CardContent className="pt-6">
                          <div className="text-sm text-yellow-800">
                            <p className="mb-2">Algunos días no pudieron consultarse:</p>
                            <ul className="list-disc list-inside">
                              {openaiUsage.errores.map((err, idx) => (
                                <li key={idx}>{err.fecha}: {err.error}</li>
                              ))}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
