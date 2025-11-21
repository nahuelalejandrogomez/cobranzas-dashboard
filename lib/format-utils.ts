/**
 * Utilidades de formateo para el dashboard
 */

/**
 * Formatea un número como moneda argentina
 * @param amount - El monto a formatear
 * @returns String formateado como moneda argentina (ej: $1.234.567)
 */
export const formatCurrency = (amount: number | string): string => {
  const numericAmount = typeof amount === 'string' ? Number(amount) : amount;
  
  if (isNaN(numericAmount)) {
    return '$0';
  }

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.round(numericAmount));
};

/**
 * Formatea un número como cantidad (sin decimales)
 * @param amount - La cantidad a formatear
 * @returns String formateado con separadores de miles
 */
export const formatNumber = (amount: number | string): string => {
  const numericAmount = typeof amount === 'string' ? Number(amount) : amount;
  
  if (isNaN(numericAmount)) {
    return '0';
  }

  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.round(numericAmount));
};

/**
 * Formatea una fecha al formato argentino
 * @param date - La fecha a formatear (Date, string o timestamp)
 * @returns String formateado como fecha argentina (DD/MM/AAAA)
 */
export const formatDate = (date: Date | string | number): string => {
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return 'Fecha inválida';
  }

  return dateObj.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Formatea una fecha y hora al formato argentino
 * @param date - La fecha y hora a formatear
 * @returns String formateado como fecha y hora argentina
 */
export const formatDateTime = (date: Date | string | number): string => {
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return 'Fecha inválida';
  }

  return dateObj.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};