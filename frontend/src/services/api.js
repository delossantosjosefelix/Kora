const BASE = '/api';

async function request(ruta, { metodo = 'GET', cuerpo, headers = {} } = {}) {
  const esFormData = typeof FormData !== 'undefined' && cuerpo instanceof FormData;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const respuesta = await fetch(`${BASE}${ruta}`, {
      method: metodo,
      credentials: 'include',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...headers,
        ...(cuerpo && !esFormData ? { 'Content-Type': 'application/json' } : {}),
      },
      body: cuerpo ? (esFormData ? cuerpo : JSON.stringify(cuerpo)) : undefined,
    });

    let datos = null;
    const texto = await respuesta.text();
    if (texto) {
      try {
        datos = JSON.parse(texto);
      } catch {
        datos = texto;
      }
    }

    return { ok: respuesta.ok, status: respuesta.status, datos };
  } catch (error) {
    return { ok: false, status: 0, datos: null, error: error.message };
  } finally {
    clearTimeout(timeoutId);
  }
}

export const api = {
  get: (ruta) => request(ruta),
  post: (ruta, cuerpo) => request(ruta, { metodo: 'POST', cuerpo }),
  patch: (ruta, cuerpo) => request(ruta, { metodo: 'PATCH', cuerpo }),
  put: (ruta, cuerpo) => request(ruta, { metodo: 'PUT', cuerpo }),
  delete: (ruta) => request(ruta, { metodo: 'DELETE' }),
  eliminar: (ruta) => request(ruta, { metodo: 'DELETE' }),
};
