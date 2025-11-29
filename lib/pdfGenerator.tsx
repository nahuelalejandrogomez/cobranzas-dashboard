import React from 'react';
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { CuponData } from './cuponData';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottom: '2px solid #009444',
  },
  title: {
    fontSize: 20,
    color: '#009444',
    fontWeight: 'bold',
  },
  contactInfo: {
    fontSize: 8,
    textAlign: 'right',
    lineHeight: 1.4,
  },
  contactRed: {
    color: '#D9534F',
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 25,
  },
  field: {
    flex: 1,
  },
  fieldFull: {
    width: '100%',
    marginBottom: 25,
  },
  label: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 3,
    letterSpacing: 0.5,
  },
  labelGreen: {
    color: '#009444',
  },
  labelRed: {
    color: '#D9534F',
  },
  value: {
    fontSize: 11,
    color: '#333',
    paddingTop: 5,
    paddingBottom: 5,
    borderBottom: '1px solid #ccc',
    minHeight: 24,
  },
  valueBold: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
  },
  footer: {
    marginTop: 30,
    paddingTop: 10,
    borderTop: '1px solid #ccc',
    fontSize: 8,
    color: '#666',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
});

/**
 * Genera un PDF del cupón de pago usando @react-pdf/renderer
 * @param cuponData - Datos del cupón
 * @returns Buffer del PDF generado
 */
export async function generatePDF(cuponData: CuponData): Promise<Buffer> {
  try {
    const valorFormateado = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(cuponData.valorAbono);

    const CuponDocument = (
      <Document>
        <Page size="A4" style={styles.page}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>PRESENCIA MÉDICA</Text>
            <View>
              <Text style={[styles.contactInfo, styles.contactRed]}>
                BME. MITRE 542 (1744) MORENO. PCIA. DE BS. AS.
              </Text>
              <Text style={styles.contactInfo}>
                ADMINISTRACIÓN (0237) 446 1381 / 488 3336 / 466 6630
              </Text>
              <Text style={[styles.contactInfo, styles.contactRed]}>
                EMERGENCIA (0237) 463 3444 / 462 9555 / 463 2050
              </Text>
            </View>
          </View>

          {/* N° y Socio N° */}
          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={[styles.label, styles.labelGreen]}>N°</Text>
              <Text style={styles.value}>{cuponData.numeroComprobante}</Text>
            </View>
            <View style={styles.field}>
              <Text style={[styles.label, styles.labelRed]}>SOCIO N°</Text>
              <Text style={styles.value}>{cuponData.socioNumero}</Text>
            </View>
          </View>

          {/* Apellido */}
          <View style={styles.fieldFull}>
            <Text style={[styles.label, styles.labelRed]}>APELLIDO</Text>
            <Text style={styles.value}>{cuponData.apellidoNombre}</Text>
          </View>

          {/* Dirección */}
          <View style={styles.fieldFull}>
            <Text style={[styles.label, styles.labelRed]}>DIRECCIÓN</Text>
            <Text style={styles.value}>{cuponData.direccion}</Text>
          </View>

          {/* Período y Zona */}
          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={[styles.label, styles.labelGreen]}>PERÍODO</Text>
              <Text style={styles.value}>{cuponData.periodo}</Text>
            </View>
            <View style={styles.field}>
              <Text style={[styles.label, styles.labelGreen]}>ZONA</Text>
              <Text style={styles.value}>{cuponData.zona}</Text>
            </View>
          </View>

          {/* Valor Abono */}
          <View style={styles.fieldFull}>
            <Text style={[styles.label, styles.labelRed]}>VALOR ABONO</Text>
            <Text style={styles.valueBold}>{valorFormateado}</Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerRow}>
              <Text>CUIT: 30-70847458-0</Text>
              <Text>ING. BRUTOS: 30-70847458-0</Text>
            </View>
            <View style={styles.footerRow}>
              <Text>IVA RESPONSABLE INSCRIPTO</Text>
              <Text style={{ fontWeight: 'bold', color: '#333' }}>A CONSUMIDOR FINAL</Text>
            </View>
          </View>
        </Page>
      </Document>
    );

    const buffer = await renderToBuffer(CuponDocument);
    return buffer;

  } catch (error) {
    console.error('[PDF Generator] Error:', error);
    throw new Error(`Error generando PDF: ${error}`);
  }
}
