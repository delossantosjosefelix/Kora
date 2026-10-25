import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';
import notify from '../utils/notify.js';

export const AuthContext = createContext(null);

function mensajeDeRespuesta(respuesta, respaldo) {
  return respuesta?.datos?.mensaje || respaldo;
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  const cargarSesion = useCallback(async () => {
    setCargando(true);
    try {
      const respuesta = await api.get('/auth/me');
      setUsuario(respuesta.ok && respuesta.datos?.usuario ? respuesta.datos.usuario : null);
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
    let respuesta;

    try {
      respuesta = await api.post('/auth/login', { username, password });
    } catch {
      throw new Error('No se pudo conectar con el servidor. Intenta de nuevo.');
    }

    if (!respuesta.ok || !respuesta.datos?.usuario) {
      throw new Error(mensajeDeRespuesta(respuesta, 'Usuario o contraseña incorrectos.'));
    }

    setUsuario(respuesta.datos.usuario);
    notify.success(`Bienvenido, ${respuesta.datos.usuario.nombre}.`);
    return respuesta.datos.usuario;
  };

  const cerrarSesion = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // La sesión local se cierra aunque el servidor no responda.
    } finally {
      setUsuario(null);
      notify.info('Sesión cerrada.');
    }
  };

  const cambiarPassword = async ({ actual, nueva, confirmar }) => {
    let respuesta;

    try {
      respuesta = await api.post('/auth/cambiar-password', {
        passwordActual: actual,
        passwordNueva: nueva,
        confirmarPassword: confirmar,
      });
    } catch {
      throw new Error('No se pudo conectar con el servidor. Intenta de nuevo.');
    }

    if (!respuesta.ok) {
      throw new Error(mensajeDeRespuesta(respuesta, 'No se pudo actualizar la contraseña.'));
    }

    setUsuario((anterior) =>
      anterior ? { ...anterior, debe_cambiar_password: false } : anterior,
    );
    notify.success(mensajeDeRespuesta(respuesta, 'Contraseña actualizada.'));
    return true;
  };

  const puede = (rol) => Boolean(usuario && usuario.rol === rol);

  return (
    <AuthContext.Provider
      value={{
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
      }}
    >
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
