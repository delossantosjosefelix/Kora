const BASE = '/api';

async function request(ruta, { metodo = 'GET', cuerpo, headers = {} } = {}) {
  const respuesta = await fetch(`${BASE}${ruta}`, {
    method: metodo,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...headers,
      ...(cuerpo ? { 'Content-Type': 'application/json' } : {}),
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
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
}

export const api = {
  get: (ruta) => request(ruta),
  post: (ruta, cuerpo) => request(ruta, { metodo: 'POST', cuerpo }),
  patch: (ruta, cuerpo) => request(ruta, { metodo: 'PATCH', cuerpo }),
  delete: (ruta) => request(ruta, { metodo: 'DELETE' }),
  eliminar: (ruta) => request(ruta, { metodo: 'DELETE' }),
};
