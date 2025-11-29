import PDFDocument from 'pdfkit';
import { CuponData } from './cuponData';

/**
 * Genera un PDF del cupón de pago usando PDFKit
 * @param cuponData - Datos del cupón
 * @returns Buffer del PDF generado
 */
export async function generatePDF(cuponData: CuponData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Colores
      const verdePresencia = '#009444';
      const rojoPresencia = '#D9534F';

      // Header con logo (texto como placeholder)
      doc
        .fontSize(20)
        .fillColor(verdePresencia)
        .text('PRESENCIA MÉDICA', 50, 50, { align: 'left' });

      // Información de contacto
      doc
        .fontSize(8)
        .fillColor(rojoPresencia)
        .text('BME. MITRE 542 (1744) MORENO. PCIA. DE BS. AS.', 350, 50, { align: 'right' })
        .fillColor('#333')
        .text('ADMINISTRACIÓN (0237) 446 1381 / 488 3336 / 466 6630', 350, 62, { align: 'right' })
        .fillColor(rojoPresencia)
        .text('EMERGENCIA (0237) 463 3444 / 462 9555 / 463 2050', 350, 74, { align: 'right' });

      // Línea separadora
      doc
        .strokeColor(verdePresencia)
        .lineWidth(2)
        .moveTo(50, 100)
        .lineTo(545, 100)
        .stroke();

      // Datos del cupón
      let y = 130;
      const lineHeight = 40;

      // N° Comprobante y Socio N°
      doc
        .fontSize(9)
        .fillColor(verdePresencia)
        .text('N°', 50, y);
      doc
        .fontSize(11)
        .fillColor('#333')
        .text(cuponData.numeroComprobante, 50, y + 12);
      doc
        .strokeColor('#ccc')
        .lineWidth(1)
        .moveTo(50, y + 30)
        .lineTo(270, y + 30)
        .stroke();

      doc
        .fontSize(9)
        .fillColor(rojoPresencia)
        .text('SOCIO N°', 300, y);
      doc
        .fontSize(11)
        .fillColor('#333')
        .text(cuponData.socioNumero, 300, y + 12);
      doc
        .strokeColor('#ccc')
        .moveTo(300, y + 30)
        .lineTo(545, y + 30)
        .stroke();

      y += lineHeight;

      // Apellido y Nombre
      doc
        .fontSize(9)
        .fillColor(rojoPresencia)
        .text('APELLIDO', 50, y);
      doc
        .fontSize(11)
        .fillColor('#333')
        .text(cuponData.apellidoNombre, 50, y + 12);
      doc
        .strokeColor('#ccc')
        .moveTo(50, y + 30)
        .lineTo(545, y + 30)
        .stroke();

      y += lineHeight;

      // Dirección
      doc
        .fontSize(9)
        .fillColor(rojoPresencia)
        .text('DIRECCIÓN', 50, y);
      doc
        .fontSize(11)
        .fillColor('#333')
        .text(cuponData.direccion, 50, y + 12);
      doc
        .strokeColor('#ccc')
        .moveTo(50, y + 30)
        .lineTo(545, y + 30)
        .stroke();

      y += lineHeight;

      // Período y Zona
      doc
        .fontSize(9)
        .fillColor(verdePresencia)
        .text('PERÍODO', 50, y);
      doc
        .fontSize(11)
        .fillColor('#333')
        .text(cuponData.periodo, 50, y + 12);
      doc
        .strokeColor('#ccc')
        .moveTo(50, y + 30)
        .lineTo(270, y + 30)
        .stroke();

      doc
        .fontSize(9)
        .fillColor(verdePresencia)
        .text('ZONA', 300, y);
      doc
        .fontSize(11)
        .fillColor('#333')
        .text(cuponData.zona, 300, y + 12);
      doc
        .strokeColor('#ccc')
        .moveTo(300, y + 30)
        .lineTo(545, y + 30)
        .stroke();

      y += lineHeight;

      // Valor Abono
      const valorFormateado = new Intl.NumberFormat('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(cuponData.valorAbono);

      doc
        .fontSize(9)
        .fillColor(rojoPresencia)
        .text('VALOR ABONO', 50, y);
      doc
        .fontSize(13)
        .font('Helvetica-Bold')
        .fillColor('#333')
        .text(valorFormateado, 50, y + 12);
      doc
        .strokeColor('#ccc')
        .lineWidth(1)
        .moveTo(50, y + 30)
        .lineTo(270, y + 30)
        .stroke();

      // Footer
      y += 60;
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#666')
        .text('CUIT: 30-70847458-0', 50, y)
        .text('ING. BRUTOS: 30-70847458-0', 300, y)
        .text('IVA RESPONSABLE INSCRIPTO', 50, y + 12)
        .fontSize(8)
        .font('Helvetica-Bold')
        .fillColor('#333')
        .text('A CONSUMIDOR FINAL', 300, y + 12, { align: 'right' });

      doc.end();

    } catch (error) {
      console.error('[PDF Generator] Error:', error);
      reject(new Error(`Error generando PDF: ${error}`));
    }
  });
}
