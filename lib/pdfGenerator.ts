import puppeteer from 'puppeteer';

/**
 * Genera un PDF a partir de HTML usando Puppeteer
 * @param html - String HTML completo con estilos inline
 * @returns Buffer del PDF generado
 */
export async function generatePDF(html: string): Promise<Buffer> {
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      }
    });

    return Buffer.from(pdfBuffer);

  } catch (error) {
    console.error('[PDF Generator] Error:', error);
    throw new Error(`Error generando PDF: ${error}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
