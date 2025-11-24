'use client';

import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Intervalo de auto-refresh: 45 minutos
const REFRESH_INTERVAL = 45 * 60 * 1000;

// ===== INTERFACES =====
interface ResumenMensual {
  total_requests: number;
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
  avg_latency: number;
  tasa_error: number;
  por_modelo: { modelo: string; requests: number; tokens: number }[];
}

interface DatosDia {
  fecha: string;
  requests: number;
  tokens: number;
}

interface DatosWorkflow {
  workflow_id: string;
  requests: number;
  tokens: number;
  avg_latency: number;
}

interface ErrorIA {
  workflow_id: string;
  socio_id: string;
  telefono: string;
  errormessage: string;
  model_used: string;
  created_at: string;
}

export default function ObservabilidadIAPage() {
  const [session, setSession] = useState<{ username: string } | null>(null);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Estado datos
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth() + 1);
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
  const [resumen, setResumen] = useState<ResumenMensual | null>(null);
  const [datosPorDia, setDatosPorDia] = useState<DatosDia[]>([]);
  const [datosPorWorkflow, setDatosPorWorkflow] = useState<DatosWorkflow[]>([]);
  const [errores, setErrores] = useState<ErrorIA[]>([]);

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
      const params = `?mes=${mesSeleccionado}&anio=${anioSeleccionado}`;
      const [resumenRes, diaRes, workflowRes, erroresRes] = await Promise.all([
        fetch(`/api/observabilidad-ia/resumen-mensual${params}`),
        fetch(`/api/observabilidad-ia/por-dia${params}`),
        fetch(`/api/observabilidad-ia/por-workflow${params}`),
        fetch('/api/observabilidad-ia/errores')
      ]);
      if (resumenRes.ok) setResumen(await resumenRes.json());
      if (diaRes.ok) setDatosPorDia(await diaRes.json());
      if (workflowRes.ok) setDatosPorWorkflow(await workflowRes.json());
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
  }, [checking, mesSeleccionado, anioSeleccionado]);

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Verificando sesión...</div>
      </div>
    );
  }

  const maxTokensDia = Math.max(...(datosPorDia.map(d => d.tokens) || [1]), 1);
  const maxTokensWorkflow = Math.max(...(datosPorWorkflow.map(d => d.tokens) || [1]), 1);
  const maxTokensModelo = Math.max(...(resumen?.por_modelo?.map(d => d.tokens) || [1]), 1);

  return (
    <>
      <Navbar username={session?.username} />
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Uso de IA (ChatGPT)</h1>
              <p className="text-gray-600 mt-1">Monitoreo de consumo de tokens desde n8n</p>
            </div>
            {lastUpdate && (
              <div className="text-xs text-gray-500 text-right">
                Última actualización: {lastUpdate.toLocaleTimeString('es-AR')}
                <br />
                <span className="text-gray-400">Auto-refresh: 45 min</span>
              </div>
            )}
          </div>

          {/* Selector de Mes */}
          <div className="flex gap-4 items-center">
            <label className="text-sm text-gray-600">Período:</label>
            <select
              value={mesSeleccionado}
              onChange={(e) => setMesSeleccionado(Number(e.target.value))}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            >
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                <option key={m} value={m}>{new Date(2000, m-1).toLocaleDateString('es-AR', { month: 'long' })}</option>
              ))}
            </select>
            <select
              value={anioSeleccionado}
              onChange={(e) => setAnioSeleccionado(Number(e.target.value))}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            >
              {[2024, 2025, 2026].map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="text-gray-500">Cargando datos...</div>
          ) : (
            <div className="space-y-8">
              {/* KPIs */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Resumen Mensual</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-white border border-gray-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium text-gray-600">Total Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-600">{resumen?.total_requests?.toLocaleString() || 0}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border border-gray-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium text-gray-600">Tokens Totales</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900">{resumen?.total_tokens?.toLocaleString() || 0}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border border-gray-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium text-gray-600">Input Tokens</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">{resumen?.input_tokens?.toLocaleString() || 0}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border border-gray-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium text-gray-600">Output Tokens</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{resumen?.output_tokens?.toLocaleString() || 0}</div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Gráfico por Día */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Uso por Día</h2>
                <Card className="bg-white border border-gray-200">
                  <CardContent className="pt-6">
                    {datosPorDia.length === 0 ? (
                      <div className="text-gray-500 text-center py-8">No hay datos este mes</div>
                    ) : (
                      <div className="space-y-3">
                        {datosPorDia.map((dia) => {
                          const fecha = new Date(dia.fecha);
                          const fechaStr = fecha.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: 'short' });
                          return (
                            <div key={dia.fecha} className="flex items-center gap-3">
                              <div className="w-24 text-xs text-gray-600 text-right">{fechaStr}</div>
                              <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                                <div className="h-full bg-purple-500 rounded" style={{ width: `${(dia.tokens / maxTokensDia) * 100}%` }} title={`${dia.tokens.toLocaleString()} tokens`}></div>
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

              {/* Gráfico por Workflow */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Uso por Workflow</h2>
                <Card className="bg-white border border-gray-200">
                  <CardContent className="pt-6">
                    {datosPorWorkflow.length === 0 ? (
                      <div className="text-gray-500 text-center py-8">No hay datos este mes</div>
                    ) : (
                      <div className="space-y-3">
                        {datosPorWorkflow.map((wf) => (
                          <div key={wf.workflow_id} className="flex items-center gap-3">
                            <div className="w-40 text-xs text-gray-600 text-right truncate" title={wf.workflow_id}>{wf.workflow_id}</div>
                            <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                              <div className="h-full bg-indigo-500 rounded" style={{ width: `${(wf.tokens / maxTokensWorkflow) * 100}%` }}></div>
                            </div>
                            <div className="w-36 text-xs text-gray-600 text-right">{wf.requests} req / {wf.avg_latency}ms</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Gráfico por Modelo */}
              {resumen?.por_modelo && resumen.por_modelo.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Uso por Modelo</h2>
                  <Card className="bg-white border border-gray-200">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        {resumen.por_modelo.map((modelo) => (
                          <div key={modelo.modelo} className="flex items-center gap-3">
                            <div className="w-40 text-xs text-gray-600 text-right truncate" title={modelo.modelo}>{modelo.modelo}</div>
                            <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded" style={{ width: `${(modelo.tokens / maxTokensModelo) * 100}%` }}></div>
                            </div>
                            <div className="w-36 text-xs text-gray-600 text-right">{modelo.requests} req / {modelo.tokens.toLocaleString()} tok</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

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
                              <th className="text-left py-3 px-2 font-medium text-gray-600">Workflow</th>
                              <th className="text-left py-3 px-2 font-medium text-gray-600">Socio</th>
                              <th className="text-left py-3 px-2 font-medium text-gray-600">Error</th>
                              <th className="text-left py-3 px-2 font-medium text-gray-600">Modelo</th>
                              <th className="text-left py-3 px-2 font-medium text-gray-600">Fecha</th>
                            </tr>
                          </thead>
                          <tbody>
                            {errores.map((error, idx) => (
                              <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-3 px-2 text-gray-600">{error.workflow_id}</td>
                                <td className="py-3 px-2"><span className="font-mono text-blue-600">{error.socio_id}</span></td>
                                <td className="py-3 px-2"><span className="text-red-600 bg-red-50 px-2 py-1 rounded text-xs">{error.errormessage}</span></td>
                                <td className="py-3 px-2 text-gray-500 text-xs">{error.model_used}</td>
                                <td className="py-3 px-2 text-gray-500 text-xs">{new Date(error.created_at).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
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
