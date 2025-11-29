'use client';

import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { KPICard } from '@/components/kpi-card';
import { KPIData } from '@/lib/types';
import { Navbar } from '@/components/navbar';
import { DeudasChart } from '@/components/deudas-chart';
import DeudoresResumen from '../components/deudores-resumen';
import { MensajesMonitoreo } from '@/components/mensajes-monitoreo';
import { formatCurrency } from '@/lib/format-utils';

export default function Dashboard() {
  const [kpi, setKpi] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<{ username: string } | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check session on client side
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
      const kpiRes = await fetch('/api/kpi/general');
      if (kpiRes.ok) setKpi(await kpiRes.json());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!checking) {
      fetchData();
    }
  }, [checking]);

  if (checking || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Cargando dashboard...</div>
      </div>
    );
  }

  return (
    <>
      <Navbar username={session?.username} />
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="border-l-4 border-[#009444] pl-4">
            <h1 className="text-3xl font-bold text-[#009444]">
              Dashboard de Cobranzas
            </h1>
            <p className="text-gray-600 mt-1">
              Análisis y seguimiento de liquidaciones - Presencia Médica
            </p>
          </div>

          {/* 1. DETALLE DE DEUDORES - Primera sección */}
          <DeudoresResumen />

          {/* 2. DISTRIBUCIÓN MENSUAL - Segunda sección */}
          <DeudasChart />

          {/* 3. MONITOREO DE MENSAJES - Tercera sección */}
          <MensajesMonitoreo />
        </div>
      </main>
    </>
  );
}


