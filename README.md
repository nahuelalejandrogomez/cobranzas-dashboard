# 📊 Dashboard de Cobranzas - Presencia Médica

Sistema de análisis y seguimiento de liquidaciones de cobranzas.

## 🚀 Stack Tecnológico

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19
- **Estilos:** Tailwind CSS 4.x
- **Tipografía:** Inter (Google Fonts)
- **Componentes:** shadcn/ui + Radix UI
- **Base de datos:** MySQL (via mysql2)
- **Gráficos:** Recharts
- **Autenticación:** Sesiones con cookies HTTP-only
- **Exportación:** CSV, JSON, PDF (jsPDF + html2pdf.js)

## 📋 Prerequisitos

- Node.js 18+ 
- npm o pnpm
- Acceso a base de datos MySQL (configurada en migration_project)

## ⚙️ Configuración

### 1. Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```bash
DB_HOST=srv1781.hstgr.io
DB_USER=u596151945_cobranza
DB_PASSWORD=cobranzaPresencia1*
DB_NAME=u596151945_cobranza
DB_PORT=3306
NODE_ENV=development
```

### 2. Instalar Dependencias

```bash
npm install --legacy-peer-deps
```

**Nota:** Usamos `--legacy-peer-deps` porque React 19 es muy nuevo y algunas librerías (como `vaul`) aún no declaran compatibilidad oficial.

## 🏃 Ejecutar en Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 👤 Usuarios de Prueba

El sistema tiene autenticación con usuarios hardcodeados (en `lib/auth.ts`):

- **Usuario:** `admin` / **Contraseña:** `admin123`
- **Usuario:** `cobranzas` / **Contraseña:** `cobranzas123`

## 📁 Estructura del Proyecto

```
cobranzas-dashboard/
├── app/                      # App Router (Next.js 16)
│   ├── api/                 # API Routes
│   │   ├── auth/           # Login, logout, check session
│   │   ├── cobradores/     # Top cobradores
│   │   ├── kpi/            # KPIs y métricas
│   │   └── socios/         # Socios y detalles
│   ├── login/              # Página de login
│   ├── socios/             # Páginas de socios
│   ├── layout.tsx          # Layout raíz
│   ├── page.tsx            # Dashboard principal
│   └── globals.css         # Estilos globales
├── components/              # Componentes React
│   ├── ui/                 # Componentes shadcn/ui
│   ├── analytics-dashboard.tsx
│   ├── collections-chart.tsx
│   ├── data-table.tsx
│   ├── date-filter-advanced.tsx
│   ├── kpi-card.tsx
│   ├── navbar.tsx
│   └── ...
├── lib/                     # Utilidades
│   ├── auth.ts             # Autenticación
│   ├── db.ts               # Conexión MySQL
│   ├── types.ts            # Tipos TypeScript
│   ├── session-utils.ts    # Manejo de cookies
│   └── export-utils.ts     # Exportación CSV/JSON/PDF
├── public/                  # Archivos estáticos
├── .env                     # Variables de entorno (no commitear)
├── .env.example             # Template de .env
├── package.json
└── tsconfig.json
```

## 🔌 Conexión con Base de Datos

El dashboard se conecta a la misma base de datos MySQL que el proyecto `migration_project`:

- **Host:** srv1781.hstgr.io (Hostinger)
- **Base de datos:** u596151945_cobranza
- **Tablas usadas:** Liquidaciones, Cobradores, Socios, TbComentariosSocios

**Verificación de datos:** Asegúrate de que el proyecto `migration_project` haya sincronizado los datos antes de usar el dashboard.

### 📅 Campo de Período: PERLIQUIDANRO

**IMPORTANTE:** El dashboard utiliza el campo `PERLIQUIDANRO` como fuente autorizada para agrupar y filtrar datos por período de liquidación.

- **PERLIQUIDANRO**: Campo DATETIME que representa el **período oficial de liquidación** (primer día del mes)
  - Ejemplo: `2025-11-01 00:00:00` representa el período noviembre 2025
  - Es el campo correcto para agrupar liquidaciones por mes/período

- **FECLIQUIDA**: Fecha real de la transacción/liquidación
  - Puede diferir del período de liquidación
  - No se usa para agrupaciones por período

**Cálculos en el Dashboard:**
- **Total Cobrado (Mes Actual):** `SUM(ABOLIQUIDA) WHERE YEAR(PERLIQUIDANRO) = X AND MONTH(PERLIQUIDANRO) = Y`
- **Deuda Pendiente:** `SUM(IMPLIQUIDA - ABOLIQUIDA) WHERE PERLIQUIDANRO = período`
- **Distribución Mensual:** `GROUP BY YEAR(PERLIQUIDANRO), MONTH(PERLIQUIDANRO)`

Esta migración de `FECLIQUIDA` a `PERLIQUIDANRO` se completó el 19/11/2025 para asegurar consistencia en los reportes mensuales.

## 📊 Funcionalidades

### Dashboard Principal (`/`)

#### 📋 Sección de Deudores
- **2 Tarjetas de Resumen:**
  - **Mes Actual:** Cupones con deuda, $ Deuda, $ Cobrado (del período actual usando PERLIQUIDANRO)
  - **Total Histórico:** Cupones con deuda, $ Deuda (de todos los períodos)
- **Acceso al Detalle Completo:** Tarjeta clickeable para ver lista detallada con información de cobradores

#### 📈 Gráfico de Distribución de Deudas
- Visualización de estados de liquidación (AD, DE, CA, BO)
- Análisis por período usando PERLIQUIDANRO

### Detalle de Deudores (`/` - vista expandida)
- Lista completa de deudores ordenable y filtrable
- Información por socio: cupones del período, montos cobrados, deudas pendientes, deuda histórica
- Navegación a páginas de socio y cobradores
- Estados destacados con colores (AD: rojo, DE: naranja)

### Detalle de Socio (`/socios/[numsocio]`)
- Información completa del socio
- Historial de liquidaciones
- Comentarios asociados
- Estadísticas personalizadas

## 🛠️ Comandos Disponibles

```bash
npm run dev      # Desarrollo (localhost:3000)
npm run build    # Build para producción
npm run start    # Ejecutar build de producción
npm run lint     # Ejecutar ESLint
```

## 📝 Notas Técnicas

### Autenticación
- Sistema de sesiones en memoria (no persistente)
- Cookies HTTP-only con expiración de 24 horas
- En producción: migrar a Redis o base de datos

### Base de Datos
- Pool de conexiones MySQL (max 10 conexiones)
- Queries parametrizadas para prevenir SQL injection
- Manejo de errores centralizado

### Performance
- App Router con Server Components por defecto
- Client Components solo donde sea necesario (`'use client'`)
- Lazy loading de librerías pesadas (jsPDF, html2pdf)

## 🐛 Troubleshooting

### Error: "Cannot connect to database"
- Verifica que el archivo `.env` exista y tenga las credenciales correctas
- Verifica que el servidor MySQL en Hostinger esté activo
- Prueba la conexión con: `npm run dev` y revisa la consola

### Error: "Module not found"
- Ejecuta: `npm install --legacy-peer-deps`
- Borra `node_modules` y `.next`, luego reinstala

### Error de peer dependencies
- Usa siempre `--legacy-peer-deps` con npm por React 19

## 🎯 Endpoints API Principales

### `/api/kpi/deudores`
- **Método:** GET
- **Propósito:** Obtener estadísticas de deudores y lista detallada
- **Respuesta:**
  ```json
  {
    "deudores": [...],
    "stats": {
      "cuponesDeudaMesActual": 100,
      "deudaMesActual": 37987382,
      "cobradoMesActual": 1820758,
      "cuponesDeudaTotal": 500,
      "deudaTotal": 12882820
    }
  }
  ```
- **Optimización:** Query optimizada con JOINs (respuesta en ~1.5s, 86x más rápido que versión anterior)

### `/api/kpi/deudas`
- **Método:** GET
- **Propósito:** Gráfico de distribución de deudas por estado
- **Filtrado:** Por PERLIQUIDANRO

### `/api/kpi/distribucion-mensual`
- **Método:** GET
- **Propósito:** Datos para gráfico de últimos 5 meses
- **Agrupación:** Por YEAR(PERLIQUIDANRO), MONTH(PERLIQUIDANRO)

### `/api/kpi/general`
- **Método:** GET  
- **Propósito:** KPIs generales del dashboard
- **Cálculos:** Basados en PERLIQUIDANRO para consistencia

## 🎨 Cambios Recientes (19/11/2025)

### ✅ Sección de Deudores Rediseñada
- Reemplazadas 4 tarjetas pequeñas por 2 tarjetas grandes más informativas
- Eliminada tarjeta de "Mes Anterior" y "Variación"
- Mejorada visualización con bordes de colores y gradientes

### ✅ Optimización de Performance
- Query de deudores optimizada: de 120s a 1.5s (mejora de 86x)
- Cambio de subqueries a JOINs eficientes
- Agregaciones calculadas en servidor (no en cliente)

### ✅ Migración a PERLIQUIDANRO
- Todos los endpoints migraron de FECLIQUIDA a PERLIQUIDANRO
- Consistencia en reportes mensuales
- Documentación actualizada con ejemplos de uso

### ✅ UI/UX Improvements
- Tipografía modernizada con Inter font
- Tarjeta descriptiva clickeable para acceso a detalle de deudores
- Iconos informativos (📅 📊 📋)
- Eliminación del fondo rojo del dashboard principal

## 🔮 Mejoras Futuras

- [ ] Persistencia de sesiones en Redis/DB
- [ ] Panel de administración de usuarios
- [ ] Notificaciones en tiempo real
- [ ] Reportes programados por email
- [ ] Filtros más avanzados (múltiples cobradores, zonas, etc)
- [ ] Gráficos interactivos mejorados
- [ ] Modo offline con Service Workers
- [ ] Tests unitarios y E2E

## 📄 Licencia

Proyecto privado - Presencia Médica Cobranzas

---

**Última actualización:** 19 de noviembre de 2025  
**Versión:** 2.0.0  
**Cambios mayores:** Rediseño completo de sección deudores, migración PERLIQUIDANRO, optimización de queries
