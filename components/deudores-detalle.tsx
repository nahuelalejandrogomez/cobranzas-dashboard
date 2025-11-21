'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, DollarSign, ChevronUp, ChevronDown } from "lucide-react";
import { DeudorDetalle } from "@/lib/types";
import Link from "next/link";

interface DeudoresDetalleProps {
  estado?: 'AD' | 'DE';
  startDate?: string;
  endDate?: string;
  onBack?: () => void;
}

type SortField = keyof DeudorDetalle;
type SortOrder = 'asc' | 'desc';

export default function DeudoresDetalle({ 
  estado, 
  startDate, 
  endDate, 
  onBack 
}: DeudoresDetalleProps) {
  const [deudores, setDeudores] = useState<DeudorDetalle[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('deudaTotalHistorica');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    const fetchDeudores = async () => {
      try {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (estado) params.append('estado', estado);

        const response = await fetch(`/api/kpi/deudores?${params}`);
        const data = await response.json();
        // El endpoint ahora retorna { deudores: [], stats: {} }
        setDeudores(data.deudores || data);
      } catch (error) {
        console.error('Error fetching deudores:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeudores();
  }, [estado, startDate, endDate]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.round(amount));
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? 
      <ChevronUp className="h-3 w-3 ml-1 inline" /> : 
      <ChevronDown className="h-3 w-3 ml-1 inline" />;
  };

  const sortedDeudores = [...deudores].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    
    // Handle null values
    if (aVal === null && bVal === null) return 0;
    if (aVal === null) return 1;
    if (bVal === null) return -1;
    
    // Handle string values
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

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'AD':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'DE':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const totalDeudores = sortedDeudores.length;
  const totalCuponesPeriodo = sortedDeudores.reduce((sum, d) => sum + d.cantidadCuponesPeriodo, 0);
  const totalDeudaPeriodo = sortedDeudores.reduce((sum, d) => sum + d.deudaPendientePeriodo, 0);
  const totalDeudaHistorica = sortedDeudores.reduce((sum, d) => sum + d.deudaTotalHistorica, 0);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center space-x-4">
        {onBack && (
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver</span>
          </Button>
        )}
        <h2 className="text-2xl font-bold">
          Detalle de Deudores
          {estado && ` - ${estado === 'AD' ? 'Deuda Total' : 'Deuda Parcial'}`}
        </h2>
      </div>

      {/* Deudores list */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Deudores</CardTitle>
          <CardDescription>
            Haz clic en las columnas para ordenar. Links: 
            <span className="text-blue-600 font-semibold">Socio</span> y <span className="text-blue-600 font-semibold">Cobrador</span> navegables.
            <span className="text-red-600 font-semibold ml-2">Cup.Deu</span>: cupones de periodos con deuda (total histórica)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {deudores.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No se encontraron deudores para el período seleccionado
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-13 gap-2 px-4 py-2 bg-gray-50 rounded-lg font-semibold text-xs">
                <button 
                  onClick={() => handleSort('numsocio')}
                  className="col-span-1 text-left hover:bg-gray-200 px-1 py-1 rounded flex items-center"
                >
                  Socio {getSortIcon('numsocio')}
                </button>
                <button 
                  onClick={() => handleSort('nomsocio')}
                  className="col-span-3 text-left hover:bg-gray-200 px-1 py-1 rounded flex items-center"
                >
                  Nombre {getSortIcon('nomsocio')}
                </button>
                <button 
                  onClick={() => handleSort('nombreCobrador')}
                  className="col-span-2 text-left hover:bg-gray-200 px-1 py-1 rounded flex items-center"
                >
                  Cobrador {getSortIcon('nombreCobrador')}
                </button>
                <button 
                  onClick={() => handleSort('estado')}
                  className="col-span-1 text-center hover:bg-gray-200 px-1 py-1 rounded flex items-center justify-center"
                >
                  Estado {getSortIcon('estado')}
                </button>
                <button 
                  onClick={() => handleSort('cuponesTotalHistorica')}
                  className="col-span-1 text-center hover:bg-gray-200 px-1 py-1 rounded flex items-center justify-center"
                >
                  Cup.Deu {getSortIcon('cuponesTotalHistorica')}
                </button>
                <button 
                  onClick={() => handleSort('deudaPendientePeriodo')}
                  className="col-span-2 text-right hover:bg-gray-200 px-1 py-1 rounded flex items-center justify-end"
                >
                  Deuda Per {getSortIcon('deudaPendientePeriodo')}
                </button>
                <button 
                  onClick={() => handleSort('deudaTotalHistorica')}
                  className="col-span-3 text-right hover:bg-gray-200 px-1 py-1 rounded flex items-center justify-end"
                >
                  Deuda Total {getSortIcon('deudaTotalHistorica')}
                </button>
              </div>
              
              {sortedDeudores.map((deudor, index) => (
                <div key={`${deudor.numsocio}-${index}`} className="grid grid-cols-13 gap-2 px-4 py-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="col-span-1 font-mono text-xs">
                    <Link 
                      href={`/socios/${deudor.numsocio}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {deudor.numsocio}
                    </Link>
                  </div>
                  <div className="col-span-3 font-medium text-sm">
                    {deudor.nomsocio}
                  </div>
                  <div className="col-span-2 text-sm">
                    {deudor.numCobrador ? (
                      <Link 
                        href={`/cobradores/${deudor.numCobrador}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {deudor.nombreCobrador}
                      </Link>
                    ) : (
                      <span className="text-gray-500">{deudor.nombreCobrador}</span>
                    )}
                  </div>
                  <div className="col-span-1 text-center">
                    <span className={`inline-flex px-1 py-1 text-xs rounded-full border ${getEstadoColor(deudor.estado)}`}>
                      {deudor.estado}
                    </span>
                  </div>
                  <div className="col-span-1 text-center text-sm">
                    {deudor.cuponesTotalHistorica}
                  </div>
                  <div className="col-span-2 text-right text-sm">
                    {formatCurrency(deudor.deudaPendientePeriodo)}
                  </div>
                  <div className="col-span-3 text-right font-bold text-red-600 text-sm">
                    {formatCurrency(deudor.deudaTotalHistorica)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}