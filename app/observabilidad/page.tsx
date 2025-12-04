'use client';

import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronUp, ChevronDown } from 'lucide-react';

// Intervalo de auto-refresh: 45 minutos
const REFRESH_INTERVAL = 45 * 60 * 1000;

// Obtener fecha de hoy en Argentina (UTC-3)
function getArgentinaDate(daysOffset: number = 0): string {
  const now = new Date();
  const argentinaOffset = -3 * 60;
  const argentinaTime = new Date(now.getTime() + (argentinaOffset - now.getTimezoneOffset()) * 60000);
  argentinaTime.setDate(argentinaTime.getDate() + daysOffset);
  return argentinaTime.toISOString().slice(0, 10);
}

// Convertir fecha UTC a hora de Argentina y formatear
function formatArgentinaDateTime(dateString: string): string {
  const date = new Date(dateString);
  // Convertir a hora de Argentina (UTC-3)
  const argentinaOffset = -3 * 60; // -3 horas en minutos
  const argentinaTime = new Date(date.getTime() + (argentinaOffset - date.getTimezoneOffset()) * 60000);

  return argentinaTime.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ===== INTERFACES =====
interface ResumenHoy {
  fecha: string;
  total: number;
  enviados: number;
  errores: number;
  porcentajeExito: number;
}

interface Socio {
  socio_id: string;
  nombre: string;
}

interface DatosDia {
  fecha: string;
  enviados: number;
  errores: number;
  total: number;
  socios: {
    ok: Socio[];
    error: Socio[];
  };
}

interface MensajeDetalle {
  id: number;
  liquidacion_id: number;
  socio_id: string;
  nombre_socio: string;
  telefono_socio: string;
  estado: string;
  resultado_envio: string;
  fecha_evento: string;
  mensaje_error: string;
}

interface FiltrosDisponibles {
  estados: string[];
  resultados: string[];
}

export default function ObservabilidadPage() {
  const [session, setSession] = useState<{ username: string } | null>(null);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Estado datos
  const [resumenHoy, setResumenHoy] = useState<ResumenHoy | null>(null);
  const [ultimos7Dias, setUltimos7Dias] = useState<DatosDia[]>([]);
  const [mensajes, setMensajes] = useState<MensajeDetalle[]>([]);
  const [filtrosDisponibles, setFiltrosDisponibles] = useState<FiltrosDisponibles>({
    estados: [],
    resultados: []
  });

  // Filtros
  const [fechaDesde, setFechaDesde] = useState(getArgentinaDate(-7));
  const [fechaHasta, setFechaHasta] = useState(getArgentinaDate());
  const [estadoFiltro, setEstadoFiltro] = useState<string>('TODOS');
  const [resultadoFiltro, setResultadoFiltro] = useState<string>('TODOS');

  // Paginación
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Ordenamiento
  type SortField = 'fecha_evento' | 'estado' | 'resultado_envio' | 'liquidacion_id' | 'nombre_socio' | 'telefono_socio';
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Tooltip del gráfico
  const [tooltipData, setTooltipData] = useState<{ socios: Socio[]; tipo: 'ok' | 'error'; fecha: string; count: number } | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

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

  // Cargar filtros disponibles
  useEffect(() => {
    const fetchFiltros = async () => {
      try {
        const res = await fetch('/api/observabilidad/filtros-disponibles');
        if (res.ok) {
          const data = await res.json();
          setFiltrosDisponibles(data);
        }
      } catch (error) {
        console.error('Error fetching filtros:', error);
      }
    };
    if (!checking) fetchFiltros();
  }, [checking]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Resumen del día seleccionado (fechaHasta)
      const resumenRes = await fetch(`/api/observabilidad/resumen-hoy?fecha=${fechaHasta}`);
      if (resumenRes.ok) setResumenHoy(await resumenRes.json());

      // Últimos 7 días o rango seleccionado
      const diasRes = await fetch(`/api/observabilidad/ultimos-7-dias?desde=${fechaDesde}&hasta=${fechaHasta}`);
      if (diasRes.ok) setUltimos7Dias(await diasRes.json());

      // Detalle de mensajes
      const detalleRes = await fetch(
        `/api/observabilidad/detalle-mensajes?desde=${fechaDesde}&hasta=${fechaHasta}&estado=${estadoFiltro}&resultado=${resultadoFiltro}&page=${page}&limit=50`
      );
      if (detalleRes.ok) {
        const data = await detalleRes.json();
        setMensajes(data.mensajes);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      }

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
  }, [checking, fechaDesde, fechaHasta, estadoFiltro, resultadoFiltro, page]);

  // Función para manejar el ordenamiento
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Mensajes ordenados
  const mensajesOrdenados = [...mensajes].sort((a, b) => {
    if (!sortField) return 0;

    let aVal: any = a[sortField];
    let bVal: any = b[sortField];

    // Manejo especial para fechas
    if (sortField === 'fecha_evento') {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }

    // Manejo para strings
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (sortOrder === 'asc') {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    } else {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    }
  });

  const handleCardClick = (filtro: string) => {
    setResultadoFiltro(filtro);
    setPage(1);
  };

  const aplicarFiltroRapido = (dias: number) => {
    setFechaDesde(getArgentinaDate(-dias));
    setFechaHasta(getArgentinaDate());
    setPage(1);
  };

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
              <p className="text-gray-600 mt-1">Monitoreo de envíos de WhatsApp</p>
            </div>
            {lastUpdate && (
              <div className="text-xs text-gray-500 text-right">
                Última actualización: {formatArgentinaDateTime(lastUpdate.toISOString())}
                <br />
                <span className="text-gray-400">Auto-refresh: 45 min</span>
              </div>
            )}
          </div>

          {/* Filtros de Fecha */}
          <Card className="bg-white border border-gray-200">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                  <input
                    type="date"
                    value={fechaDesde}
                    onChange={(e) => {
                      setFechaDesde(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                  <input
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => {
                      setFechaHasta(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => aplicarFiltroRapido(0)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Hoy
                  </button>
                  <button
                    onClick={() => aplicarFiltroRapido(7)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Últimos 7 días
                  </button>
                  <button
                    onClick={() => aplicarFiltroRapido(30)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Últimos 30 días
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="text-gray-500">Cargando datos...</div>
          ) : (
            <div className="space-y-8">
              {/* Resumen del Día */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Resumen del Día</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card
                    className="bg-white border border-gray-200 cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleCardClick('TODOS')}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">Total Hoy</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-900">{resumenHoy?.total || 0}</div>
                      <p className="text-xs text-gray-500 mt-1">mensajes procesados</p>
                    </CardContent>
                  </Card>
                  <Card
                    className="bg-white border border-gray-200 cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleCardClick('OK')}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">Enviados OK</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">{resumenHoy?.enviados || 0}</div>
                      <p className="text-xs text-gray-500 mt-1">sin errores</p>
                    </CardContent>
                  </Card>
                  <Card
                    className="bg-white border border-gray-200 cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleCardClick('ERROR')}
                  >
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

              {/* Evolución por Día */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Evolución por Día</h2>
                <Card className="bg-white border border-gray-200">
                  <CardContent className="pt-6">
                    {ultimos7Dias.length === 0 ? (
                      <div className="text-gray-500 text-center py-8">No hay datos en el rango seleccionado</div>
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
                            <div key={dia.fecha} className="flex items-center gap-3 relative">
                              <div className="w-24 text-xs text-gray-600 text-right">{fechaStr}</div>
                              <div className="flex-1 flex gap-1 h-6">
                                <div
                                  className="bg-green-500 rounded-l cursor-pointer hover:bg-green-600 transition-colors"
                                  style={{ width: `${(dia.enviados / maxTotal) * 100}%`, minWidth: dia.enviados > 0 ? '4px' : '0' }}
                                  onMouseEnter={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setTooltipData({
                                      socios: dia.socios.ok,
                                      tipo: 'ok',
                                      fecha: fechaStr,
                                      count: dia.enviados
                                    });
                                    setTooltipPosition({ x: rect.left + rect.width / 2, y: rect.top - 10 });
                                  }}
                                  onMouseLeave={() => {
                                    setTooltipData(null);
                                    setTooltipPosition(null);
                                  }}
                                ></div>
                                <div
                                  className="bg-red-500 rounded-r cursor-pointer hover:bg-red-600 transition-colors"
                                  style={{ width: `${(dia.errores / maxTotal) * 100}%`, minWidth: dia.errores > 0 ? '4px' : '0' }}
                                  onMouseEnter={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setTooltipData({
                                      socios: dia.socios.error,
                                      tipo: 'error',
                                      fecha: fechaStr,
                                      count: dia.errores
                                    });
                                    setTooltipPosition({ x: rect.left + rect.width / 2, y: rect.top - 10 });
                                  }}
                                  onMouseLeave={() => {
                                    setTooltipData(null);
                                    setTooltipPosition(null);
                                  }}
                                ></div>
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

              {/* Detalle de Mensajes */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Detalle de Mensajes {total > 0 && <span className="text-sm font-normal text-gray-500">({total} registros)</span>}
                </h2>

                {/* Filtros adicionales */}
                <div className="mb-4 flex gap-4 flex-wrap">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Envío</label>
                    <select
                      value={estadoFiltro}
                      onChange={(e) => {
                        setEstadoFiltro(e.target.value);
                        setPage(1);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="TODOS">Todos</option>
                      {filtrosDisponibles.estados.map(estado => (
                        <option key={estado} value={estado}>{estado}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Resultado</label>
                    <select
                      value={resultadoFiltro}
                      onChange={(e) => {
                        setResultadoFiltro(e.target.value);
                        setPage(1);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="TODOS">Todos</option>
                      {filtrosDisponibles.resultados.map(resultado => (
                        <option key={resultado} value={resultado}>{resultado}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <Card className="bg-white border border-gray-200">
                  <CardContent className="pt-6">
                    {mensajes.length === 0 ? (
                      <div className="text-gray-500 text-center py-8">No hay mensajes con los filtros seleccionados</div>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th
                                  onClick={() => handleSort('fecha_evento')}
                                  className="text-left py-3 px-2 font-medium text-gray-600 cursor-pointer hover:bg-gray-50 select-none"
                                >
                                  <div className="flex items-center gap-1">
                                    Fecha/Hora
                                    {sortField === 'fecha_evento' && (
                                      sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                                    )}
                                  </div>
                                </th>
                                <th
                                  onClick={() => handleSort('estado')}
                                  className="text-left py-3 px-2 font-medium text-gray-600 cursor-pointer hover:bg-gray-50 select-none"
                                >
                                  <div className="flex items-center gap-1">
                                    Tipo
                                    {sortField === 'estado' && (
                                      sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                                    )}
                                  </div>
                                </th>
                                <th
                                  onClick={() => handleSort('resultado_envio')}
                                  className="text-left py-3 px-2 font-medium text-gray-600 cursor-pointer hover:bg-gray-50 select-none"
                                >
                                  <div className="flex items-center gap-1">
                                    Resultado
                                    {sortField === 'resultado_envio' && (
                                      sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                                    )}
                                  </div>
                                </th>
                                <th
                                  onClick={() => handleSort('liquidacion_id')}
                                  className="text-left py-3 px-2 font-medium text-gray-600 cursor-pointer hover:bg-gray-50 select-none"
                                >
                                  <div className="flex items-center gap-1">
                                    Liquidación
                                    {sortField === 'liquidacion_id' && (
                                      sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                                    )}
                                  </div>
                                </th>
                                <th
                                  onClick={() => handleSort('nombre_socio')}
                                  className="text-left py-3 px-2 font-medium text-gray-600 cursor-pointer hover:bg-gray-50 select-none"
                                >
                                  <div className="flex items-center gap-1">
                                    Socio
                                    {sortField === 'nombre_socio' && (
                                      sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                                    )}
                                  </div>
                                </th>
                                <th
                                  onClick={() => handleSort('telefono_socio')}
                                  className="text-left py-3 px-2 font-medium text-gray-600 cursor-pointer hover:bg-gray-50 select-none"
                                >
                                  <div className="flex items-center gap-1">
                                    Teléfono
                                    {sortField === 'telefono_socio' && (
                                      sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                                    )}
                                  </div>
                                </th>
                                <th className="text-left py-3 px-2 font-medium text-gray-600">Mensaje/Error</th>
                              </tr>
                            </thead>
                            <tbody>
                              {mensajesOrdenados.map((msg) => (
                                <tr key={msg.id} className="border-b border-gray-100 hover:bg-gray-50">
                                  <td className="py-3 px-2 text-gray-500 text-xs">
                                    {formatArgentinaDateTime(msg.fecha_evento)}
                                  </td>
                                  <td className="py-3 px-2">
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                      {msg.estado}
                                    </span>
                                  </td>
                                  <td className="py-3 px-2">
                                    <span className={`px-2 py-1 rounded text-xs ${
                                      msg.resultado_envio === 'OK'
                                        ? 'bg-green-100 text-green-800'
                                        : msg.resultado_envio === 'ERROR'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {msg.resultado_envio}
                                    </span>
                                  </td>
                                  <td className="py-3 px-2">
                                    <span className="font-mono text-gray-600 text-xs">{msg.liquidacion_id}</span>
                                  </td>
                                  <td className="py-3 px-2">
                                    <div className="flex flex-col">
                                      <span className="font-mono text-blue-600 text-xs">{msg.socio_id}</span>
                                      <span className="text-gray-600 text-xs">{msg.nombre_socio}</span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-2 text-gray-600 text-xs">{msg.telefono_socio}</td>
                                  <td className="py-3 px-2 text-gray-500 text-xs max-w-xs truncate" title={msg.mensaje_error}>
                                    {msg.mensaje_error || '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Paginación */}
                        {totalPages > 1 && (
                          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                            <div className="text-sm text-gray-600">
                              Página {page} de {totalPages} ({total} registros)
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setPage(Math.max(1, page - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                              >
                                Anterior
                              </button>
                              <button
                                onClick={() => setPage(Math.min(totalPages, page + 1))}
                                disabled={page === totalPages}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                              >
                                Siguiente
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>

        {/* Tooltip para socios del gráfico */}
        {tooltipData && tooltipPosition && (
          <div
            className="fixed z-50 pointer-events-none"
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y,
              transform: 'translate(-50%, -100%)'
            }}
          >
            <div className={`rounded-lg shadow-xl border-2 p-4 max-w-md max-h-96 overflow-y-auto ${
              tooltipData.tipo === 'ok'
                ? 'bg-green-50 border-green-300'
                : 'bg-red-50 border-red-300'
            }`}>
              <div className="mb-2 pb-2 border-b border-gray-300">
                <div className="font-bold text-sm">
                  {tooltipData.fecha}
                </div>
                <div className={`text-xs ${tooltipData.tipo === 'ok' ? 'text-green-700' : 'text-red-700'}`}>
                  {tooltipData.tipo === 'ok' ? '✅ Enviados OK' : '❌ Errores'}: {tooltipData.count} socios
                </div>
              </div>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {tooltipData.socios.map((socio, idx) => (
                  <div key={idx} className="text-xs text-gray-700 py-1 border-b border-gray-200 last:border-0">
                    <span className="font-mono font-semibold">{socio.socio_id}</span> - {socio.nombre}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
