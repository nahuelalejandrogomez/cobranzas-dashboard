import { CuponData } from './cuponData';
import fs from 'fs';
import path from 'path';

/**
 * Genera el HTML completo del cupón de pago con estilos inline
 * Reproduce fielmente el diseño del cupón físico de Presencia Médica
 */
export function generateCuponHTML(data: CuponData): string {
  // Leer el logo como base64 para incrustar en el PDF
  const logoPath = path.join(process.cwd(), 'public', 'logo', 'PresenciaMedicaLogo.jpg');
  let logoBase64 = '';

  try {
    const logoBuffer = fs.readFileSync(logoPath);
    logoBase64 = `data:image/jpeg;base64,${logoBuffer.toString('base64')}`;
  } catch (error) {
    console.warn('[cuponTemplate] Logo no encontrado:', error);
  }

  // Formatear monto con separador de miles
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cupón de Pago - Presencia Médica</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Arial', 'Helvetica', sans-serif;
      font-size: 11px;
      color: #333;
      background: white;
      padding: 20px;
    }

    .cupon-container {
      max-width: 700px;
      margin: 0 auto;
      border: 1px solid #ddd;
      padding: 15px;
    }

    /* CABECERA */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #009444;
    }

    .logo-section img {
      max-width: 180px;
      height: auto;
    }

    .info-section {
      text-align: right;
      font-size: 9px;
      line-height: 1.4;
    }

    .info-section .direccion {
      color: #D9534F;
      font-weight: bold;
      margin-bottom: 3px;
    }

    .info-section .contacto {
      color: #333;
      margin-bottom: 2px;
    }

    .info-section .emergencia {
      color: #D9534F;
      font-weight: bold;
    }

    /* CUERPO DE DATOS */
    .datos-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px 20px;
      margin-bottom: 20px;
    }

    .campo {
      position: relative;
    }

    .campo-label {
      font-size: 9px;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 3px;
      letter-spacing: 0.5px;
    }

    .campo-label.rojo {
      color: #D9534F;
    }

    .campo-label.verde {
      color: #009444;
    }

    .campo-valor {
      font-size: 11px;
      color: #333;
      font-weight: normal;
      padding: 5px 0;
      border-bottom: 1px solid #ccc;
      min-height: 24px;
    }

    .campo-full {
      grid-column: 1 / -1;
    }

    /* PIE */
    .footer {
      margin-top: 20px;
      margin-bottom: 10px;
      padding-top: 10px;
      border-top: 1px solid #ccc;
      font-size: 8px;
      color: #666;
      line-height: 1.6;
    }

    .footer-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 3px;
    }

    .consumidor-final {
      text-align: right;
      font-weight: bold;
      color: #333;
      margin-top: 0px;
      margin-bottom: 5px;
    }

    /* Responsive adjustments */
    @media print {
      body {
        padding: 0;
      }
      .cupon-container {
        border: none;
        max-width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="cupon-container">

    <!-- CABECERA -->
    <div class="header">
      <div class="logo-section">
        ${logoBase64 ? `<img src="${logoBase64}" alt="Presencia Médica">` : '<div style="width:180px;height:60px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;color:#999;">LOGO</div>'}
      </div>
      <div class="info-section">
        <div class="direccion">BME. MITRE 542 (1744) MORENO. PCIA. DE BS. AS.</div>
        <div class="contacto">ADMINISTRACIÓN (0237) 446 1381 / 488 3336 / 466 6630</div>
        <div class="emergencia">EMERGENCIA (0237) 463 3444 / 462 9555 / 463 2050</div>
      </div>
    </div>

    <!-- CUERPO DE DATOS -->
    <div class="datos-grid">

      <div class="campo">
        <div class="campo-label verde">N°</div>
        <div class="campo-valor">${data.numeroComprobante}</div>
      </div>

      <div class="campo">
        <div class="campo-label rojo">SOCIO N°</div>
        <div class="campo-valor">${data.socioNumero}</div>
      </div>

      <div class="campo campo-full">
        <div class="campo-label rojo">APELLIDO</div>
        <div class="campo-valor">${data.apellidoNombre}</div>
      </div>

      <div class="campo campo-full">
        <div class="campo-label rojo">DIRECCIÓN</div>
        <div class="campo-valor">${data.direccion}</div>
      </div>

      <div class="campo">
        <div class="campo-label verde">PERÍODO</div>
        <div class="campo-valor">${data.periodo}</div>
      </div>

      <div class="campo">
        <div class="campo-label verde">ZONA</div>
        <div class="campo-valor">${data.zona}</div>
      </div>

      <div class="campo">
        <div class="campo-label rojo">VALOR ABONO</div>
        <div class="campo-valor" style="font-weight: bold; font-size: 13px;">${formatCurrency(data.valorAbono)}</div>
      </div>

    </div>

    <!-- PIE -->
    <div class="footer">
      <div class="footer-row">
        <span>CUIT: 30-70847458-0</span>
        <span>ING. BRUTOS: 30-70847458-0</span>
      </div>
      <div class="footer-row">
        <span>IVA RESPONSABLE INSCRIPTO</span>
        <span class="consumidor-final" style="margin-top: 0;">A CONSUMIDOR FINAL</span>
      </div>
    </div>

  </div>
</body>
</html>
  `.trim();
}
