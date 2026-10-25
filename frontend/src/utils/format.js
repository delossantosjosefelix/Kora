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
