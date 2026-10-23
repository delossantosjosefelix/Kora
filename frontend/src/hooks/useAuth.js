import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import notify from '../utils/notify.js';

export function useAuth() {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const cargarSesion = useCallback(async () => {
    setCargando(true);
    try {
      const respuesta = await api.get('/auth/me');
      if (respuesta.ok && respuesta.datos?.usuario) {
        setUsuario(respuesta.datos.usuario);

        if (
          respuesta.datos.usuario.debe_cambiar_password &&
          location.pathname !== '/cambiar-password' &&
          location.pathname !== '/login'
        ) {
          navigate('/cambiar-password', { replace: true });
        } else if (!respuesta.datos.usuario.debe_cambiar_password && location.pathname === '/login') {
          navigate('/dashboard', { replace: true });
        }
      } else {
        setUsuario(null);
        if (location.pathname !== '/login') {
          navigate('/login', { replace: true });
        }
      }
    } catch {
      setUsuario(null);
      if (location.pathname !== '/login') {
        navigate('/login', { replace: true });
      }
    } finally {
      setCargando(false);
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    cargarSesion();
  }, [cargarSesion]);

  const iniciarSesion = async ({ username, password }) => {
    const respuesta = await api.post('/auth/login', { username, password });
    if (respuesta.ok && respuesta.datos?.usuario) {
      setUsuario(respuesta.datos.usuario);
      notify.success('Bienvenido a Kora');
      if (respuesta.datos.usuario.debe_cambiar_password) {
        navigate('/cambiar-password', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
      return true;
    }
    notify.error(respuesta.datos?.mensaje || 'Usuario o contraseña incorrectos.');
    return false;
  };

  const cerrarSesion = async () => {
    await api.post('/auth/logout');
    setUsuario(null);
    notify.info('Sesión cerrada.');
    navigate('/login', { replace: true });
  };

  const cambiarPassword = async ({ actual, nueva, confirmar }) => {
    const respuesta = await api.post('/auth/cambiar-password', {
      passwordActual: actual,
      passwordNueva: nueva,
      confirmarPassword: confirmar,
    });

    if (respuesta.ok) {
      notify.success(respuesta.datos?.mensaje || 'Contraseña actualizada.');
      setUsuario((anterior) => (anterior ? { ...anterior, debe_cambiar_password: false } : anterior));
      navigate('/dashboard', { replace: true });
      return true;
    }
    notify.error(respuesta.datos?.mensaje || 'No se pudo actualizar la contraseña.');
    return false;
  };

  const puede = (rol) => Boolean(usuario && usuario.rol === rol);

  return {
    usuario,
    cargando,
    estaAutenticado: Boolean(usuario),
    iniciarSesion,
    cerrarSesion,
    cambiarPassword,
    puede,
    esAdministrador: puede('Administrador'),
    esGerente: puede('Gerente'),
    esCajero: puede('Cajero'),
  };
}
