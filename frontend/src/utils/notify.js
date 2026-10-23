import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const leerVariable = (nombre, respaldo) => {
  if (typeof window === 'undefined') return respaldo;

  const valor = getComputedStyle(document.documentElement)
    .getPropertyValue(nombre)
    .trim();

  return valor || respaldo;
};

const opcionesBase = {
  duration: 4000,
};

export const notify = {
  success(mensaje, opciones = {}) {
    return toast.success(mensaje, { ...opcionesBase, ...opciones });
  },

  error(mensaje, opciones = {}) {
    return toast.error(mensaje, { ...opcionesBase, duration: 5000, ...opciones });
  },

  info(mensaje, opciones = {}) {
    return toast(mensaje, { ...opcionesBase, ...opciones });
  },

  warning(mensaje, opciones = {}) {
    return toast(mensaje, { ...opcionesBase, duration: 5000, ...opciones });
  },

  loading(mensaje, opciones = {}) {
    return toast.loading(mensaje, opciones);
  },

  dismiss(id) {
    toast.dismiss(id);
  },

  async confirm({
    titulo = '¿Confirmar acción?',
    texto = '',
    confirmar = 'Sí, continuar',
    cancelar = 'Cancelar',
    peligro = false,
  } = {}) {
    const resultado = await Swal.fire({
      title: titulo,
      text: texto,
      icon: peligro ? 'warning' : 'question',
      showCancelButton: true,
      confirmButtonText: confirmar,
      cancelButtonText: cancelar,
      confirmButtonColor: peligro
        ? leerVariable('--color-error', '#DC2626')
        : leerVariable('--color-primary', '#0F766E'),
      cancelButtonColor: leerVariable('--color-text-muted', '#6B7280'),
      reverseButtons: true,
      focusCancel: true,
      customClass: { popup: 'kora-modal' },
    });

    return resultado.isConfirmed;
  },

  async alert({
    titulo = 'Aviso',
    texto = '',
    boton = 'Entendido',
    icono = 'info',
  } = {}) {
    return Swal.fire({
      title: titulo,
      text: texto,
      icon: icono,
      confirmButtonText: boton,
      confirmButtonColor: leerVariable('--color-primary', '#0F766E'),
      customClass: { popup: 'kora-modal' },
    });
  },
};

export default notify;
