# 📊 LÓGICA ESTÁNDAR DE CÁLCULOS - COBRANZAS DASHBOARD

## 🎯 CONCEPTO GLOBAL IMPLEMENTADO

**DECISIÓN**: Todos los cálculos del dashboard siguen el **CONCEPTO GLOBAL** para consistencia total.

## 📐 FÓRMULAS ESTÁNDAR

### **💰 Total Cobrado**
```sql
SUM(ABOLIQUIDA) de TODAS las liquidaciones del período
```
- **Qué es**: Todo el dinero efectivamente cobrado sin importar el estado
- **Incluye**: CA (completo), DE (parcial), AD (parcial si hay)

### **⚠️ Total Deuda** 
```sql
SUM(IMPLIQUIDA - ABOLIQUIDA) de TODAS las liquidaciones del período
```
- **Qué es**: Todo el dinero pendiente de cobro sin importar el estado  
- **Incluye**: AD (deuda completa), DE (deuda parcial)

### **🎁 Total Bonificado**
```sql
SUM(IMPLIQUIDA) solo de liquidaciones con ESTLIQUIDA = 'BO'
```
- **Qué es**: Monto total de cupones que la empresa bonifica (no se cobran)
- **Solo incluye**: BO (bonificados)

### **📈 Total Importe** 
```sql
SUM(IMPLIQUIDA) de TODAS las liquidaciones del período
```
- **Qué es**: Valor total de todas las liquidaciones emitidas
- **Incluye**: CA + DE + AD + BO

## 🏷️ ESTADOS DE LIQUIDACIÓN

| Estado | Descripción | Cálculo Deuda | Cálculo Cobrado |
|--------|-------------|---------------|-----------------|
| **CA** | Pagado 100% | `0` | `ABOLIQUIDA` |
| **DE** | Deuda Parcial | `IMPLIQUIDA - ABOLIQUIDA` | `ABOLIQUIDA` |
| **AD** | Adeuda Total | `IMPLIQUIDA - ABOLIQUIDA` | `ABOLIQUIDA` |
| **BO** | Bonificado | `0` | `0` |

## 🔍 APLICACIÓN EN ENDPOINTS

### `/api/kpi/general`
- ✅ **Total Cobrado**: `SUM(ABOLIQUIDA)` global
- ✅ **Total Deuda**: `SUM(IMPLIQUIDA - ABOLIQUIDA)` global  
- ✅ **Bonificado**: `SUM(IMPLIQUIDA)` solo BO
- ✅ **Por Estado**: Desglose individual pero totales globales

### `/api/kpi/distribucion-mensual`
- ✅ **montoCobrado**: `SUM(ABOLIQUIDA)` global por mes
- ✅ **montoAdeudado**: `SUM(IMPLIQUIDA - ABOLIQUIDA)` global por mes
- ✅ **montoBonificado**: `SUM(IMPLIQUIDA)` solo BO por mes
- ✅ **Cupones**: Count por estado (CA, AD+DE, BO)

### `/api/kpi/deudas`  
- ✅ **montoCobrado**: Subconsulta global del período
- ✅ **deuda**: Subconsulta global del período
- ✅ **montoTotal**: Por estado individual (para desglose)

### `/api/kpi/deudores`
- ✅ **deudaTotalHistorica**: Suma global de deuda del socio
- ✅ **deudaPendientePeriodo**: Suma global del período
- ✅ **montoCobradoPeriodo**: Suma global del período

## 🎨 COLORES ESTÁNDAR

```typescript
const COLORES_STANDARD = {
  cobrado: '#10B981',    // Verde esmeralda
  adeudado: '#F59E0B',   // Ámbar  
  bonificado: '#8B5CF6', // Violeta
  total: '#6B7280'       // Gris
};
```

## 📊 VISUALIZACIÓN CONSISTENTE

### **KPI Cards**
1. **Total Cobrado**: Formato moneda, color verde
2. **Total Deuda**: Formato moneda, color ámbar
3. **Total Bonificado**: Formato moneda, color violeta  
4. **Total Liquidaciones**: Cantidad, color gris

### **Gráficos** 
- **Barras**: Comparación mensual con colores estándar
- **Tooltips**: Mostrar cantidad + monto formateado
- **Leyendas**: Nombres consistentes

### **Tablas**
- **Montos**: Formato peso argentino sin decimales
- **Cantidades**: Formato con separadores de miles
- **Estados**: Descripciones estándar

## 🔄 VALIDACIÓN

**Regla de oro**: 
```
Total Cobrado + Total Deuda + Total Bonificado = Total Importe
```

Esta ecuación debe cumplirse en todos los endpoints y componentes.

---
**Fecha de implementación**: 19 de noviembre de 2025  
**Versión**: 1.0  
**Estado**: ✅ IMPLEMENTADO