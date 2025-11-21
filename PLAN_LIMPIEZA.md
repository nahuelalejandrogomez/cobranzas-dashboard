# 🧹 PLAN DE LIMPIEZA COMPLETO - COBRANZAS DASHBOARD

**Fecha:** 19 de Noviembre 2025  
**Objetivo:** Eliminar código no usado, archivos generados por V0 que no se usan, y optimizar el proyecto.

---

## 📊 RESUMEN EJECUTIVO

- **Total archivos a ELIMINAR:** 90+ archivos
- **Total componentes NO USADOS:** 3 componentes
- **Total archivos a LIMPIAR:** 10+ archivos
- **Espacio estimado a liberar:** ~2-3 MB (código + node_modules no usados)

---

## 🗑️ PARTE 1: ARCHIVOS A ELIMINAR

### 📁 A. COMPONENTES NO USADOS (3 archivos)

Estos componentes fueron generados por V0 pero nunca se importaron en ningún lugar:

```
❌ components/analytics-dashboard.tsx
   - No hay import en ningún archivo
   - Componente de ejemplo de V0

❌ components/analytics-summary.tsx
   - No hay import en ningún archivo
   - Componente de ejemplo de V0

❌ components/collections-chart.tsx
   - No hay import en ningún archivo
   - Componente de ejemplo de V0

❌ components/date-filter-advanced.tsx
   - No hay import en ningún archivo
   - Filtro no utilizado

❌ components/date-filter.tsx
   - No hay import en ningún archivo
   - Filtro no utilizado

❌ components/theme-provider.tsx
   - No hay import en ningún archivo
   - No se usa sistema de temas
```

**Razón:** Estos son componentes placeholder generados por V0.dev que nunca se integraron al proyecto real.

---

### 📁 B. COMPONENTES UI NO USADOS (~60 archivos)

shadcn/ui genera muchos componentes. Solo se usan: `button`, `card`, `input`, `table`. El resto no se importa en ningún lado:

```
❌ components/ui/accordion.tsx
❌ components/ui/alert-dialog.tsx
❌ components/ui/alert.tsx
❌ components/ui/aspect-ratio.tsx
❌ components/ui/avatar.tsx
❌ components/ui/badge.tsx
❌ components/ui/breadcrumb.tsx
❌ components/ui/button-group.tsx
❌ components/ui/calendar.tsx
❌ components/ui/carousel.tsx
❌ components/ui/chart.tsx
❌ components/ui/checkbox.tsx
❌ components/ui/collapsible.tsx
❌ components/ui/command.tsx
❌ components/ui/context-menu.tsx
❌ components/ui/dialog.tsx
❌ components/ui/drawer.tsx
❌ components/ui/dropdown-menu.tsx
❌ components/ui/empty.tsx
❌ components/ui/field.tsx
❌ components/ui/form.tsx
❌ components/ui/hover-card.tsx
❌ components/ui/input-group.tsx
❌ components/ui/input-otp.tsx
❌ components/ui/item.tsx
❌ components/ui/kbd.tsx
❌ components/ui/label.tsx
❌ components/ui/menubar.tsx
❌ components/ui/navigation-menu.tsx
❌ components/ui/pagination.tsx
❌ components/ui/popover.tsx
❌ components/ui/progress.tsx
❌ components/ui/radio-group.tsx
❌ components/ui/resizable.tsx
❌ components/ui/scroll-area.tsx
❌ components/ui/select.tsx
❌ components/ui/separator.tsx
❌ components/ui/sheet.tsx
❌ components/ui/sidebar.tsx
❌ components/ui/skeleton.tsx
❌ components/ui/slider.tsx
❌ components/ui/sonner.tsx
❌ components/ui/spinner.tsx
❌ components/ui/switch.tsx
❌ components/ui/tabs.tsx
❌ components/ui/textarea.tsx
❌ components/ui/toast.tsx
❌ components/ui/toaster.tsx
❌ components/ui/toggle-group.tsx
❌ components/ui/toggle.tsx
❌ components/ui/tooltip.tsx
❌ components/ui/use-mobile.tsx
❌ components/ui/use-toast.ts
```

**Razón:** Solo se usan 4 componentes UI realmente: button, card, input, table. El resto son overhead de shadcn/ui.

---

### 📁 C. HOOKS NO USADOS (2 archivos)

```
❌ hooks/use-mobile.ts
   - Solo lo importa components/ui/sidebar.tsx (que no se usa)

❌ hooks/use-toast.ts
   - Solo lo importa components/ui/toaster.tsx (que no se usa)
```

**Razón:** Hooks que solo eran usados por componentes UI que tampoco se usan.

---

### 📁 D. UTILIDADES NO USADAS (2 archivos)

```
❌ lib/export-utils.tsx
   - No hay import en ningún archivo
   - Funciones de exportación no implementadas

❌ lib/csv-export.ts
   - No hay import en ningún archivo
   - Exportación CSV no se usa
```

**Razón:** Funcionalidades planificadas pero nunca implementadas.

---

### 📁 E. API ENDPOINTS NO USADOS (3 carpetas)

```
❌ app/api/kpi/cobranzas-por-dia/route.ts
   - No hay fetch a este endpoint en el frontend

❌ app/api/socios/top/route.ts
   - No hay fetch a este endpoint en el frontend

❌ app/api/cobradores/top/route.ts
   - No hay fetch a este endpoint en el frontend
```

**Razón:** Endpoints creados pero nunca consumidos por el frontend.

---

### 📁 F. IMÁGENES PLACEHOLDER NO USADAS (5 archivos)

```
❌ public/placeholder-logo.png
❌ public/placeholder-logo.svg
❌ public/placeholder-user.jpg
❌ public/placeholder.jpg
❌ public/placeholder.svg
```

**Razón:** Assets de ejemplo de V0 que nunca se importan. Solo se usan los íconos (icon.svg, apple-icon.png, etc).

---

### 📁 G. CARPETAS VACÍAS O INNECESARIAS (1 carpeta)

```
❌ context-dashboard/
   - Carpeta completamente vacía
   - No se usa en ningún lado
```

**Razón:** Directorio creado pero nunca usado.

---

### 📁 H. ARCHIVOS DE CONFIGURACIÓN INNECESARIOS (1 archivo)

```
❌ pnpm-lock.yaml
   - El proyecto usa npm (hay package-lock.json)
   - Archivo residual de V0
```

**Razón:** El proyecto usa npm, no pnpm.

---

## ✅ PARTE 2: ARCHIVOS A MANTENER

Estos archivos SON necesarios y están en uso:

### 📁 A. Páginas y Rutas (MANTENER TODO)
```
✅ app/page.tsx              - Dashboard principal
✅ app/layout.tsx            - Layout raíz
✅ app/globals.css           - Estilos globales
✅ app/login/page.tsx        - Página de login
✅ app/socios/page.tsx       - Búsqueda de socios
✅ app/socios/[numsocio]/page.tsx - Detalle de socio
```

### 📁 B. API Routes Activos (MANTENER)
```
✅ app/api/auth/*            - Autenticación (login, logout, check)
✅ app/api/kpi/general       - KPIs del dashboard
✅ app/api/kpi/deudas        - Gráfico de deudas
✅ app/api/kpi/deudores      - Detalle de deudores
✅ app/api/kpi/distribucion-mensual - Distribución mensual
✅ app/api/debug/*           - Endpoints de diagnóstico
✅ app/api/socios/[numsocio] - Detalle de socio
✅ app/api/socios/search     - Búsqueda de socios
```

### 📁 C. Componentes Usados (MANTENER)
```
✅ components/deudas-chart.tsx
✅ components/deudores-detalle.tsx
✅ components/deudores-resumen.tsx
✅ components/distribucion-mensual.tsx
✅ components/data-table.tsx
✅ components/kpi-card.tsx
✅ components/login-form.tsx
✅ components/navbar.tsx
✅ components/socio-search.tsx
```

### 📁 D. Componentes UI Necesarios (MANTENER SOLO 4)
```
✅ components/ui/button.tsx
✅ components/ui/card.tsx
✅ components/ui/input.tsx
✅ components/ui/table.tsx
```

### 📁 E. Librerías Core (MANTENER)
```
✅ lib/auth.ts              - Autenticación y usuarios
✅ lib/db.ts                - Conexión MySQL
✅ lib/types.ts             - Tipos TypeScript
✅ lib/format-utils.ts      - Formateo de moneda y fechas
✅ lib/session-utils.ts     - Manejo de cookies
✅ lib/utils.ts             - Utilidades generales (cn, etc)
```

### 📁 F. Configuración (MANTENER)
```
✅ package.json
✅ package-lock.json
✅ tsconfig.json
✅ next.config.mjs
✅ postcss.config.mjs
✅ components.json
✅ .gitignore
✅ .env
✅ .env.example
```

### 📁 G. Documentación (MANTENER)
```
✅ README.md
✅ context/logic-standard.md
```

### 📁 H. Assets Necesarios (MANTENER)
```
✅ public/icon.svg
✅ public/icon-dark-32x32.png
✅ public/icon-light-32x32.png
✅ public/apple-icon.png
```

---

## 🛠️ PARTE 3: ARCHIVOS A REFACTORIZAR/LIMPIAR

Estos archivos tienen código que se puede optimizar:

### 1. `app/layout.tsx`
**Problema:** Variables no usadas `_geist` y `_geistMono`
```typescript
// ❌ ELIMINAR (líneas 6-7):
const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

// ✅ MANTENER: Solo imports y metadata necesarios
```

### 2. `app/page.tsx`
**Problema:** Líneas en blanco innecesarias
```typescript
// ❌ LIMPIAR: Líneas 50-51 (doble espacio)
// ❌ LIMPIAR: Líneas 116-117 (doble espacio)
```

### 3. `components/deudores-resumen.tsx`
**Problema:** Console.log de debug
```typescript
// ❌ ELIMINAR línea 34:
console.log('Deudores data:', deudores);
```

### 4. `components/deudas-chart.tsx`
**Problema:** Console.log de debug
```typescript
// ❌ ELIMINAR línea ~30:
console.log('Deudas data:', deudas);
```

### 5. `components/distribucion-mensual.tsx`
**Problema:** Console.logs de debug
```typescript
// ❌ ELIMINAR líneas ~25-30:
console.log('Distribución mensual data:', data);
```

### 6. `app/api/kpi/distribucion-mensual/route.ts`
**Problema:** Console.logs de debug comentados o activos
```typescript
// ❌ ELIMINAR: Todos los console.log
```

### 7. `app/api/kpi/general/route.ts`
**Problema:** Console.logs de debug
```typescript
// ❌ ELIMINAR: Todos los console.log
```

### 8. `lib/db.ts`
**Problema:** Console.error puede cambiarse a logger
```typescript
// 🔄 MEJORAR: Implementar logger en vez de console.error
```

### 9. `.DS_Store`
**Archivo del sistema macOS**
```
❌ .DS_Store en la raíz
```

### 10. `package.json`
**Problema:** Dependencias no usadas después de eliminar componentes UI

Dependencias a ELIMINAR después de limpiar componentes UI:
```json
❌ "@hookform/resolvers": "^3.10.0"
❌ "@radix-ui/react-accordion": "1.2.2"
❌ "@radix-ui/react-alert-dialog": "1.1.4"
❌ "@radix-ui/react-aspect-ratio": "1.1.1"
❌ "@radix-ui/react-avatar": "1.1.2"
❌ "@radix-ui/react-checkbox": "1.1.3"
❌ "@radix-ui/react-collapsible": "1.1.2"
❌ "@radix-ui/react-context-menu": "2.2.4"
❌ "@radix-ui/react-dialog": "1.1.4"
❌ "@radix-ui/react-dropdown-menu": "2.1.4"
❌ "@radix-ui/react-hover-card": "1.1.4"
❌ "@radix-ui/react-menubar": "1.1.4"
❌ "@radix-ui/react-navigation-menu": "1.2.3"
❌ "@radix-ui/react-popover": "1.1.4"
❌ "@radix-ui/react-progress": "1.1.1"
❌ "@radix-ui/react-radio-group": "1.2.2"
❌ "@radix-ui/react-scroll-area": "1.2.2"
❌ "@radix-ui/react-select": "2.1.4"
❌ "@radix-ui/react-slider": "1.2.2"
❌ "@radix-ui/react-switch": "1.1.2"
❌ "@radix-ui/react-tabs": "1.1.2"
❌ "@radix-ui/react-toast": "1.2.4"
❌ "@radix-ui/react-toggle": "1.1.1"
❌ "@radix-ui/react-toggle-group": "1.1.1"
❌ "@radix-ui/react-tooltip": "1.1.6"
❌ "cmdk": "1.0.4"
❌ "embla-carousel-react": "8.5.1"
❌ "html2pdf.js": "latest"
❌ "input-otp": "1.4.1"
❌ "jspdf": "latest"
❌ "next-themes": "^0.4.6"
❌ "react-day-picker": "9.8.0"
❌ "react-hook-form": "^7.60.0"
❌ "react-resizable-panels": "^2.1.7"
❌ "sonner": "^1.7.4"
❌ "vaul": "^0.9.9"
❌ "zod": "3.25.76"
```

**Dependencias a MANTENER:**
```json
✅ "@radix-ui/react-label": "2.1.1"        - Usado por button/card
✅ "@radix-ui/react-separator": "1.1.1"    - Usado internamente
✅ "@radix-ui/react-slot": "1.1.1"         - Usado por button
✅ "@vercel/analytics": "latest"           - Analytics activo
✅ "autoprefixer": "^10.4.20"
✅ "bcryptjs": "latest"                    - Auth
✅ "class-variance-authority": "^0.7.1"    - CVA para variantes
✅ "clsx": "^2.1.1"                        - Utils
✅ "date-fns": "4.1.0"                     - Formateo fechas
✅ "lucide-react": "^0.454.0"              - Iconos
✅ "mysql2": "latest"                      - Database
✅ "next": "16.0.3"
✅ "react": "19.2.0"
✅ "react-dom": "19.2.0"
✅ "recharts": "latest"                    - Gráficos
✅ "tailwind-merge": "^2.5.5"
✅ "tailwindcss-animate": "^1.0.7"
```

---

## 📋 CHECKLIST DE EJECUCIÓN

### Fase 1: Backup
- [ ] Commit actual antes de empezar
- [ ] Crear branch `feature/cleanup`

### Fase 2: Eliminar Componentes (Orden de eliminación)
- [ ] Eliminar `components/analytics-dashboard.tsx`
- [ ] Eliminar `components/analytics-summary.tsx`
- [ ] Eliminar `components/collections-chart.tsx`
- [ ] Eliminar `components/date-filter-advanced.tsx`
- [ ] Eliminar `components/date-filter.tsx`
- [ ] Eliminar `components/theme-provider.tsx`

### Fase 3: Eliminar Componentes UI No Usados
- [ ] Eliminar todos los archivos listados en sección B (60 archivos)
- [ ] Mantener solo: button.tsx, card.tsx, input.tsx, table.tsx

### Fase 4: Eliminar Hooks, Utilidades y APIs
- [ ] Eliminar `hooks/use-mobile.ts`
- [ ] Eliminar `hooks/use-toast.ts`
- [ ] Eliminar `lib/export-utils.tsx`
- [ ] Eliminar `lib/csv-export.ts`
- [ ] Eliminar `app/api/kpi/cobranzas-por-dia/`
- [ ] Eliminar `app/api/socios/top/`
- [ ] Eliminar `app/api/cobradores/top/`

### Fase 5: Eliminar Assets y Carpetas
- [ ] Eliminar imágenes placeholder (5 archivos)
- [ ] Eliminar carpeta `context-dashboard/`
- [ ] Eliminar `pnpm-lock.yaml`
- [ ] Eliminar `.DS_Store`

### Fase 6: Limpiar Código
- [ ] Limpiar `app/layout.tsx` (eliminar variables no usadas)
- [ ] Limpiar `app/page.tsx` (eliminar líneas en blanco)
- [ ] Eliminar console.log de todos los componentes
- [ ] Eliminar console.log de todos los API routes

### Fase 7: Actualizar package.json
- [ ] Eliminar dependencias no usadas
- [ ] Ejecutar `npm install --legacy-peer-deps`
- [ ] Ejecutar `npm audit fix`

### Fase 8: Verificación
- [ ] `npm run build` debe pasar sin errores
- [ ] Probar login
- [ ] Probar dashboard principal
- [ ] Probar búsqueda de socios
- [ ] Probar detalle de socio
- [ ] Verificar que todos los gráficos funcionan

### Fase 9: Documentación
- [ ] Actualizar README.md con estructura simplificada
- [ ] Documentar componentes eliminados

---

## 📈 BENEFICIOS ESPERADOS

1. **Reducción de tamaño:**
   - ~90 archivos eliminados
   - ~30-40% menos dependencias en node_modules
   - Build más rápido (~20-30% más rápido)

2. **Mantenibilidad:**
   - Código más claro y fácil de entender
   - Menos archivos donde buscar bugs
   - Estructura más limpia

3. **Performance:**
   - Bundle size más pequeño
   - Menos imports innecesarios
   - Tiempo de compilación reducido

4. **Developer Experience:**
   - Navegación más rápida en el IDE
   - Autocomplete más rápido
   - Menos confusión sobre qué se usa

---

## ⚠️ PRECAUCIONES

1. **NO ELIMINAR sin confirmar:** Este plan debe ser aprobado antes de ejecutar
2. **Hacer backup:** Commit antes de empezar
3. **Probar después de cada fase:** No eliminar todo de una vez
4. **Verificar build:** Correr `npm run build` después de cada fase importante

---

## 🎯 RESULTADO FINAL

Después de esta limpieza, el proyecto quedará con:

```
cobranzas-dashboard/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   ├── debug/
│   │   ├── kpi/ (4 endpoints activos)
│   │   └── socios/
│   ├── login/
│   ├── socios/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/ (solo 4 archivos)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── table.tsx
│   ├── data-table.tsx
│   ├── deudas-chart.tsx
│   ├── deudores-detalle.tsx
│   ├── deudores-resumen.tsx
│   ├── distribucion-mensual.tsx
│   ├── kpi-card.tsx
│   ├── login-form.tsx
│   ├── navbar.tsx
│   └── socio-search.tsx
├── context/
│   └── logic-standard.md
├── lib/
│   ├── auth.ts
│   ├── db.ts
│   ├── format-utils.ts
│   ├── session-utils.ts
│   ├── types.ts
│   └── utils.ts
├── public/ (solo 4 íconos)
└── [archivos de config]
```

**Total:** ~40 archivos de código (vs ~130 actuales) = 69% de reducción ✨

---

**¿Aprobar este plan y proceder con la limpieza?**
