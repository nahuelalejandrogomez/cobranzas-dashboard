import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

/**
 * Genera un PDF a partir de HTML usando Puppeteer
 * @param html - String HTML completo con estilos inline
 * @returns Buffer del PDF generado
 */
export async function generatePDF(html: string): Promise<Buffer> {
  let browser;

  try {
    // Detectar si estamos en producción (Railway/serverless)
    const isProduction = process.env.NODE_ENV === 'production';

    browser = await puppeteer.launch({
      args: isProduction ? chromium.args : [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath: isProduction
        ? await chromium.executablePath()
        : process.env.PUPPETEER_EXECUTABLE_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: chromium.headless || true
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
