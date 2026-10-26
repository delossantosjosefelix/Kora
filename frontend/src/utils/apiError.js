export function mensajeError(respuesta, respaldo) {
  return respuesta?.datos?.mensaje || respaldo;
}
