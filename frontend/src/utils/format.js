export function iniciales(nombre = '', apellido = '') {
  const primera = String(nombre).trim().charAt(0);
  const segunda = String(apellido).trim().charAt(0);
  return `${primera}${segunda}`.toUpperCase() || '?';
}

export function claseRol(rol) {
  if (rol === 'Administrador') return 'badge--administrador';
  if (rol === 'Gerente') return 'badge--gerente';
  return 'badge--cajero';
}

export function formatearFecha(valor) {
  if (!valor) return 'Nunca';

  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return 'Sin registro';

  return new Intl.DateTimeFormat('es-DO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(fecha);
}

export function formatearFechaHora(valor) {
  if (!valor) return 'Nunca';

  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return 'Sin registro';

  return new Intl.DateTimeFormat('es-DO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(fecha);
}

export function formatearMoneda(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return 'RD$0.00';

  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numero);
}

export function formatearNumero(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return '0';

  return new Intl.NumberFormat('es-DO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numero);
}

export function formatearEntero(valor) {
  const numero = Math.round(Number(valor));
  if (!Number.isFinite(numero)) return '0';

  return new Intl.NumberFormat('es-DO', {
    maximumFractionDigits: 0,
  }).format(numero);
}
