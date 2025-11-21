'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import DeudoresDetalle from './deudores-detalle';
import { DistribucionMensual } from './distribucion-mensual';

interface DeudasChartProps {
  startDate?: string;
  endDate?: string;
}

export function DeudasChart({ startDate, endDate }: DeudasChartProps) {
  const [showDetalle, setShowDetalle] = useState(false);
  const [selectedEstado, setSelectedEstado] = useState<'AD' | 'DE' | undefined>();

  const handleBackToChart = () => {
    setShowDetalle(false);
    setSelectedEstado(undefined);
  };

  if (showDetalle) {
    return (
      <DeudoresDetalle
        estado={selectedEstado}
        startDate={startDate}
        endDate={endDate}
        onBack={handleBackToChart}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Nuevo componente de distribución mensual */}
      <DistribucionMensual />
      
      {/* Botón para ver deudores detallados */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Button
              onClick={() => setShowDetalle(true)}
              size="lg"
              className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold px-8 py-3"
            >
              📋 Ver Lista Detallada de Deudores
            </Button>
            <p className="text-sm text-gray-500 mt-2">
              Accede al detalle completo de deudores con información de cobradores
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}