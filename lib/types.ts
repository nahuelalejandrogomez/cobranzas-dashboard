// Estados de liquidación
export type EstadoLiquidacion = 'CA' | 'DE' | 'AD' | 'BO';

export interface KPIData {
  totalCurrentMonth: number;
  totalPreviousMonth: number;
  variation: number;
  totalLiquidations: number;
  // Nuevos campos para deudas
  totalCobrado: number;          // Total efectivamente cobrado (ABOLIQUIDA)
  totalDeuda: number;            // Total adeudado (IMPLIQUIDA - ABOLIQUIDA)
  deudaCompleta: number;         // Solo liquidaciones con estado "AD"
  deudaParcial: number;          // Solo liquidaciones con estado "DE"
  pagadoCompleto: number;        // Solo liquidaciones con estado "CA"
  bonificado: number;            // Solo liquidaciones con estado "BO"
}

export interface DeudaDetalle {
  estado: EstadoLiquidacion;
  cantidad: number;
  montoTotal: number;
  deuda: number;
}


export interface TopSocio {
  numsocio: string;
  nomsocio: string;
  liquidaciones: number;
  monto: number;
  deudaPendiente: number;        // Deuda total pendiente del socio
}

export interface Socio {
  numsocio: string;
  nomsocio: string;
  subsocio: number;
  impsocio: number;
  baja: number;
  comsocio: string;
  deudaTotal?: number;           // Deuda acumulada del socio
}

export interface Liquidacion {
  cupliquida: string;
  fecliquida: string;
  impliquida: number;
  aboliquida: number;
  nomcob: string;
  estliquida?: EstadoLiquidacion; // Estado de la liquidación
  deuda?: number;                 // IMPLIQUIDA - ABOLIQUIDA
}

export interface Comentario {
  idcomment: number;
  numsocio: string;
  comment: string;
  fecha: string;
}

export interface DeudorDetalle {
  numsocio: string;
  nomsocio: string;
  estado: 'AD' | 'DE';
  cantidadCuponesPeriodo: number;
  montoTotalPeriodo: number;
  montoCobradoPeriodo: number;
  deudaPendientePeriodo: number;
  deudaTotalHistorica: number;
  cuponesTotalHistorica: number;
  nombreCobrador: string;
  numCobrador: number | null;
  estadoDescripcion: string;
}

export interface DistribucionMensual {
  mes: string;
  año: number;
  cuponesCobrados: number;
  montoCobrado: number;
  cuponesAdeudados: number;
  montoAdeudado: number;
  cuponesBonificados: number;
  montoBonificado: number;
}
