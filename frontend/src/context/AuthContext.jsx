import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';
import notify from '../utils/notify.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  const cargarSesion = useCallback(async () => {
    setCargando(true);
    try {
      const respuesta = await api.get('/auth/me');
      if (respuesta.ok && respuesta.datos?.usuario) {
        setUsuario(respuesta.datos.usuario);
      } else {
        setUsuario(null);
      }
    } catch {
      setUsuario(null);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarSesion();
  }, [cargarSesion]);

  const iniciarSesion = async ({ username, password }) => {
    const respuesta = await api.post('/auth/login', { username, password });
    if (respuesta.ok && respuesta.datos?.usuario) {
      setUsuario(respuesta.datos.usuario);
      notify.success('Bienvenido a Kora');
      return true;
    }
    notify.error(respuesta.datos?.mensaje || 'Usuario o contraseña incorrectos.');
    return false;
  };

  const cerrarSesion = async () => {
    await api.post('/auth/logout');
    setUsuario(null);
    notify.info('Sesión cerrada.');
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
      return true;
    }
    notify.error(respuesta.datos?.mensaje || 'No se pudo actualizar la contraseña.');
    return false;
  };

  const puede = (rol) => Boolean(usuario && usuario.rol === rol);

  return (
    <AuthContext.Provider value={{
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
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth debe usarse dentro de AuthProvider.');
  }
  return contexto;
}
