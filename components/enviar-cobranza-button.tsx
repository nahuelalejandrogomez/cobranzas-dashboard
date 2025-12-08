'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';

export function EnviarCobranzaButton() {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resultado, setResultado] = useState<{
    status: string;
    mensaje: string;
    enviados?: number;
    errores?: number;
  } | null>(null);

  const handleEnviar = async () => {
    setShowConfirm(false);
    setLoading(true);
    setResultado(null);

    try {
      const response = await fetch('/api/enviar-cobranza', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setResultado(data);
      } else {
        setResultado({
          status: 'error',
          mensaje: 'Error al ejecutar el proceso de cobranza',
        });
      }
    } catch (error) {
      console.error('Error enviando cobranza:', error);
      setResultado({
        status: 'error',
        mensaje: 'Error de conexión con el servidor',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Envío de Cobranza Inicial
          </h2>
          <p className="text-sm text-gray-600">
            Envía mensajes de WhatsApp a socios con cupones nuevos pendientes de pago
          </p>
        </div>

        <button
          onClick={() => setShowConfirm(true)}
          disabled={loading}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium px-6 py-3 rounded-lg transition-colors shadow-sm"
        >
          <MessageCircle size={20} />
          {loading ? 'Enviando...' : 'Enviar Cobranza Inicial'}
        </button>
      </div>

      {/* Modal de confirmación */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Confirmar envío
            </h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas enviar mensajes de cobranza inicial por WhatsApp?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEnviar}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <MessageCircle size={18} />
                Confirmar Envío
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resultado del envío */}
      {resultado && (
        <div className={`mt-4 p-4 rounded-lg border ${
          resultado.status === 'ok'
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className={`font-medium ${
                resultado.status === 'ok' ? 'text-green-800' : 'text-red-800'
              }`}>
                {resultado.mensaje}
              </p>
              {resultado.enviados !== undefined && (
                <div className="mt-2 text-sm text-gray-700">
                  <p>✓ Mensajes enviados: <span className="font-semibold">{resultado.enviados}</span></p>
                  {resultado.errores !== undefined && resultado.errores > 0 && (
                    <p className="text-red-600">✗ Errores: <span className="font-semibold">{resultado.errores}</span></p>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => setResultado(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
