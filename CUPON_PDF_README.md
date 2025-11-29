# 📄 Módulo de Generación de Cupones PDF

Sistema completo para generar cupones de pago idénticos al cupón físico de Presencia Médica.

---

## 🚀 Instalación

```bash
npm install puppeteer
# o
yarn add puppeteer
```

**Nota:** Puppeteer descarga Chromium automáticamente (~170-300MB). Para producción en Railway/Vercel, considera usar `@sparticuz/chromium` + `puppeteer-core`.

---

## 📋 Archivos del Módulo

```
cobranzas-dashboard/
├── app/api/cupon/[id]/route.ts   # Endpoint principal
├── lib/
│   ├── pdfGenerator.ts            # Generador PDF con Puppeteer
│   ├── cuponData.ts               # Consulta a MySQL
│   └── cuponTemplate.ts           # Template HTML/CSS
└── public/logo/PresenciaMedicaLogo.jpg  # Logo (requerido)
```

---

## 🔌 Endpoint

### `GET /api/cupon/[id]`

**Descripción:** Genera un cupón de pago en PDF para una liquidación específica.

**Parámetros:**
- `id` (path, requerido): ID de la liquidación
- `download` (query, opcional): Si es `true`, fuerza descarga. Por defecto muestra inline.

**Ejemplos:**

```bash
# Preview en navegador
GET http://localhost:3000/api/cupon/1

# Forzar descarga
GET http://localhost:3000/api/cupon/1?download=true
```

**Respuestas:**

| Código | Descripción |
|--------|-------------|
| 200 | PDF generado exitosamente |
| 400 | ID inválido |
| 404 | Liquidación no encontrada |
| 500 | Error del servidor |

---

## 📊 Query SQL

El endpoint consulta la siguiente estructura:

```sql
SELECT
  L.CUPLIQUIDA as numeroComprobante,
  S.NUMSOCIO as socioNumero,
  S.NOMSOCIO as apellidoNombre,
  S.DOMSOCIO as direccion,
  DATE_FORMAT(L.PERLIQUIDA, '%Y-%m') as periodo,
  S.LOCSOCIO as zona,
  L.IMPLIQUIDA as valorAbono
FROM Liquidaciones L
INNER JOIN Socios S ON L.SOCLIQUIDA = S.NUMSOCIO
WHERE L.id = ?
```

**Campos utilizados:**
- `numeroComprobante`: Liquidaciones.CUPLIQUIDA
- `socioNumero`: Socios.NUMSOCIO
- `apellidoNombre`: Socios.NOMSOCIO
- `direccion`: Socios.DOMSOCIO
- `periodo`: Liquidaciones.PERLIQUIDA (formato YYYY-MM)
- `zona`: Socios.LOCSOCIO
- `valorAbono`: Liquidaciones.IMPLIQUIDA

---

## 🎨 Diseño del Cupón

El template reproduce fielmente el cupón físico:

### Cabecera
- Logo Presencia Médica (izquierda)
- Información institucional (derecha): dirección, teléfonos, emergencia
- Colores: Verde `#009444`, Rojo `#D9534F`

### Cuerpo
Campos con etiquetas en rojo/verde y líneas divisorias:
- N° (verde)
- SOCIO N° (rojo)
- APELLIDO (rojo)
- DIRECCIÓN (rojo)
- PERÍODO (verde)
- ZONA (verde)
- VALOR ABONO (rojo, destacado)

### Pie
- CUIT, ING. BRUTOS, IVA RESPONSABLE INSCRIPTO
- "A CONSUMIDOR FINAL" (derecha, negrita)

---

## 🧪 Pruebas

### Postman

1. **Crear request GET:**
   ```
   GET http://localhost:3000/api/cupon/1
   ```

2. **Configurar response:**
   - En "Send and Download" → activar
   - Content-Type: `application/pdf`

3. **Enviar request** → Se descarga el PDF

### n8n

**Nodo HTTP Request:**

```json
{
  "method": "GET",
  "url": "https://tu-dominio.com/api/cupon/{{ $json.liquidacion_id }}",
  "options": {
    "response": {
      "response": {
        "neverError": false,
        "responseFormat": "file",
        "outputPropertyName": "data"
      }
    }
  }
}
```

**Configuración:**
- Download Response: **Yes**
- Response Format: **File**
- Binary Property: `data`

**Siguiente nodo (WhatsApp/Email):**
- Usar `{{ $binary.data }}` como adjunto

---

## ⚠️ Troubleshooting

### Error: "Logo no encontrado"

Verificar que existe:
```
/public/logo/PresenciaMedicaLogo.jpg
```

El cupón se generará igual (con placeholder gris si falta).

### Error: "Puppeteer no puede iniciar Chrome"

**Railway/Vercel:**

Reemplazar en `package.json`:
```json
{
  "dependencies": {
    "puppeteer-core": "^21.0.0",
    "@sparticuz/chromium": "^119.0.0"
  }
}
```

Y modificar `/lib/pdfGenerator.ts`:
```typescript
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

const browser = await puppeteer.launch({
  args: chromium.args,
  defaultViewport: chromium.defaultViewport,
  executablePath: await chromium.executablePath(),
  headless: chromium.headless
});
```

### PDF en blanco

Verificar:
1. Datos existen en MySQL (`getLiquidacionById` retorna datos)
2. HTML se genera correctamente (agregar `console.log(html)`)
3. Puppeteer tiene permisos de ejecución

---

## 📈 Optimizaciones Producción

### 1. Cache de Chromium (Railway)

Agregar a `railway.toml`:
```toml
[build]
builder = "NIXPACKS"

[[build.env]]
key = "PUPPETEER_SKIP_CHROMIUM_DOWNLOAD"
value = "true"
```

### 2. Timeouts

Ajustar en `/lib/pdfGenerator.ts`:
```typescript
await page.setContent(html, {
  waitUntil: 'networkidle0',
  timeout: 30000 // 30 segundos
});
```

### 3. Reutilizar instancia de Puppeteer

Para múltiples requests, mantener browser abierto:
```typescript
let browserInstance: Browser | null = null;

async function getBrowser() {
  if (!browserInstance) {
    browserInstance = await puppeteer.launch({ ... });
  }
  return browserInstance;
}
```

---

## 🔒 Seguridad

1. **Validar ID:** El endpoint valida que `id` sea numérico
2. **SQL Injection:** Usa parámetros preparados (`?`)
3. **Acceso:** Considerar agregar autenticación si es necesario
4. **Rate Limiting:** Implementar para evitar abuso

---

## 📝 Ejemplo de Respuesta

**Request:**
```
GET /api/cupon/1
```

**Response Headers:**
```
Content-Type: application/pdf
Content-Length: 45632
Content-Disposition: inline; filename="cupon_0030-00003970.pdf"
```

**Response Body:**
`[Binary PDF Data]`

---

## 🎯 Uso desde Código TypeScript

```typescript
// Desde otro endpoint o servidor
const response = await fetch('http://localhost:3000/api/cupon/1');
const pdfBuffer = await response.arrayBuffer();

// Guardar archivo
fs.writeFileSync('cupon.pdf', Buffer.from(pdfBuffer));

// O enviar por email
await sendEmail({
  to: 'cliente@example.com',
  subject: 'Tu cupón de pago',
  attachments: [{
    filename: 'cupon.pdf',
    content: Buffer.from(pdfBuffer)
  }]
});
```

---

## ✅ Checklist de Implementación

- [ ] Instalar `puppeteer`: `npm install puppeteer`
- [ ] Verificar logo en `/public/logo/PresenciaMedicaLogo.jpg`
- [ ] Probar endpoint localmente: `GET /api/cupon/1`
- [ ] Verificar PDF se genera correctamente
- [ ] Probar con n8n (si aplica)
- [ ] Deploy a producción
- [ ] Configurar Chromium para serverless (si aplica)

---

## 📚 Referencias

- [Puppeteer Docs](https://pptr.dev/)
- [Sparticuz Chromium](https://github.com/Sparticuz/chromium)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

**Status:** ✅ Módulo listo para producción
