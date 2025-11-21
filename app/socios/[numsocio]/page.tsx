'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/data-table';
import { Socio, Liquidacion, Comentario } from '@/lib/types';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format-utils';

export default function SocioDetailPage() {
  const params = useParams();
  const numsocio = params.numsocio as string;

  const [socio, setSocio] = useState<Socio | null>(null);
  const [liquidaciones, setLiquidaciones] = useState<Liquidacion[]>([]);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [socioRes, liqRes, comentRes] = await Promise.all([
          fetch(`/api/socios/${numsocio}`),
          fetch(`/api/socios/${numsocio}/liq`),
          fetch(`/api/socios/${numsocio}/coment`),
        ]);

        if (socioRes.ok) setSocio(await socioRes.json());
        if (liqRes.ok) setLiquidaciones(await liqRes.json());
        if (comentRes.ok) setComentarios(await comentRes.json());
      } catch (error) {
        console.error('Error fetching socio data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (numsocio) fetchData();
  }, [numsocio]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Cargando datos del socio...</div>
      </div>
    );
  }

  if (!socio) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 mb-6 inline-block"
          >
            ← Volver al dashboard
          </Link>
          <div className="text-center text-gray-600">Socio no encontrado</div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← Volver al dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            {socio.nomsocio}
          </h1>
          <p className="text-gray-600 mt-1">
            Número: {socio.numsocio}
          </p>
        </div>

        {/* Socio Info Card */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Información del Socio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Número</p>
                <p className="font-semibold text-gray-900">{socio.numsocio}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Subsocio</p>
                <p className="font-semibold text-gray-900">{socio.subsocio}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Importe</p>
                <p className="font-semibold text-gray-900">
                  {formatCurrency(socio.impsocio)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Estado</p>
                <p className={`font-semibold ${socio.baja ? 'text-red-600' : 'text-green-600'}`}>
                  {socio.baja ? 'Inactivo' : 'Activo'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liquidaciones Table */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Últimas Liquidaciones</CardTitle>
          </CardHeader>
          <CardContent>
            {liquidaciones.length > 0 ? (
              <DataTable
                columns={[
                  { key: 'cupliquida', label: 'Cupo' },
                  {
                    key: 'fecliquida',
                    label: 'Fecha',
                    format: (val) => formatDate(val),
                  },
                  {
                    key: 'impliquida',
                    label: 'Importe',
                    format: (val) => formatCurrency(Number(val)),
                  },
                  {
                    key: 'aboliquida',
                    label: 'Abonado',
                    format: (val) => formatCurrency(Number(val)),
                  },
                  { key: 'nomcob', label: 'Cobrador' },
                ]}
                data={liquidaciones}
              />
            ) : (
              <p className="text-gray-600 text-center py-4">
                No hay liquidaciones registradas
              </p>
            )}
          </CardContent>
        </Card>

        {/* Comentarios Timeline */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Comentarios</CardTitle>
          </CardHeader>
          <CardContent>
            {comentarios.length > 0 ? (
              <div className="space-y-4">
                {comentarios.map((comentario) => (
                  <div
                    key={comentario.idcomment}
                    className="border-l-2 border-blue-400 pl-4 pb-4"
                  >
                    <p className="text-sm text-gray-600">
                      {formatDateTime(comentario.fecha)}
                    </p>
                    <p className="text-gray-900 mt-1">{comentario.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-4">
                No hay comentarios registrados
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
