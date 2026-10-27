import { query } from '../config/db.js';
import { ErrorHttp } from '../utils/ErrorHttp.js';
import { registrarAuditoria } from './auditoria.service.js';

function validarTextoOpcional(valor, nombreCampo, maxLen) {
  if (valor === undefined || valor === null || (typeof valor === 'string' && !valor.trim())) {
    return null;
  }

  if (typeof valor !== 'string') {
    throw new ErrorHttp(400, `El campo ${nombreCampo} no es válido.`);
  }

  const limpio = valor.trim();
  if (limpio.length > maxLen) {
    throw new ErrorHttp(400, `El campo ${nombreCampo} no puede superar los ${maxLen} caracteres.`);
  }

  return limpio;
}

function validarNombre(nombre) {
  if (typeof nombre !== 'string' || !nombre.trim()) {
    throw new ErrorHttp(400, 'El nombre del suplidor o razón social es obligatorio.');
  }

  const limpio = nombre.trim();
  if (limpio.length > 120) {
    throw new ErrorHttp(400, 'El nombre del suplidor no puede superar los 120 caracteres.');
  }

  return limpio;
}

function validarEmail(email) {
  const limpio = validarTextoOpcional(email, 'correo electrónico', 100);
  if (!limpio) return null;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(limpio)) {
    throw new ErrorHttp(400, 'El formato del correo electrónico no es válido.');
  }

  return limpio.toLowerCase();
}

export async function listarSuplidores({
  busqueda = '',
  activo = 'TODOS',
} = {}) {
  const condiciones = [];
  const valores = [];
  let posicion = 1;

  const estadoLimpio = String(activo ?? '').trim().toUpperCase();
  if (estadoLimpio === 'ACTIVOS' || estadoLimpio === 'TRUE' || activo === true) {
    condiciones.push('s.activo = TRUE');
  } else if (estadoLimpio === 'INACTIVOS' || estadoLimpio === 'FALSE' || activo === false) {
    condiciones.push('s.activo = FALSE');
  }

  const textoBusqueda = String(busqueda ?? '').trim().toLowerCase();
  if (textoBusqueda) {
    condiciones.push(`
      (
        LOWER(s.nombre) ILIKE $${posicion}
        OR LOWER(COALESCE(s.rnc, '')) ILIKE $${posicion}
        OR LOWER(COALESCE(s.contacto, '')) ILIKE $${posicion}
        OR LOWER(COALESCE(s.telefono, '')) ILIKE $${posicion}
        OR LOWER(COALESCE(s.email, '')) ILIKE $${posicion}
      )
    `);
    valores.push(`%${textoBusqueda}%`);
    posicion++;
  }

  const whereClausula = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';

  const consulta = `
    SELECT
      s.id,
      s.nombre,
      s.rnc,
      s.contacto,
      s.telefono,
      s.email,
      s.direccion,
      s.activo,
      s.created_at,
      (SELECT COUNT(*)::int FROM compras c WHERE c.suplidor_id = s.id) AS compras_count
    FROM suplidores s
    ${whereClausula}
    ORDER BY s.activo DESC, LOWER(s.nombre) ASC
  `;

  const { rows } = await query(consulta, valores);

  return rows.map((fila) => ({
    id: fila.id,
    nombre: fila.nombre,
    rnc: fila.rnc,
    contacto: fila.contacto,
    telefono: fila.telefono,
    email: fila.email,
    direccion: fila.direccion,
    activo: Boolean(fila.activo),
    compras_count: Number(fila.compras_count || 0),
    created_at: fila.created_at,
  }));
}

export async function obtenerSuplidorPorId(id) {
  if (!id) {
    throw new ErrorHttp(400, 'Identificador de suplidor no válido.');
  }

  const consulta = `
    SELECT
      s.id,
      s.nombre,
      s.rnc,
      s.contacto,
      s.telefono,
      s.email,
      s.direccion,
      s.activo,
      s.created_at,
      (SELECT COUNT(*)::int FROM compras c WHERE c.suplidor_id = s.id) AS compras_count
    FROM suplidores s
    WHERE s.id = $1
  `;

  const { rows } = await query(consulta, [id]);
  const fila = rows[0];

  if (!fila) {
    return null;
  }

  return {
    id: fila.id,
    nombre: fila.nombre,
    rnc: fila.rnc,
    contacto: fila.contacto,
    telefono: fila.telefono,
    email: fila.email,
    direccion: fila.direccion,
    activo: Boolean(fila.activo),
    compras_count: Number(fila.compras_count || 0),
    created_at: fila.created_at,
  };
}

export async function crearSuplidor({
  nombre,
  rnc,
  contacto,
  telefono,
  email,
  direccion,
  usuarioId,
  ip = null,
}) {
  const nombreValido = validarNombre(nombre);
  const rncValido = validarTextoOpcional(rnc, 'RNC o cédula', 15);
  const contactoValido = validarTextoOpcional(contacto, 'contacto', 80);
  const telefonoValido = validarTextoOpcional(telefono, 'teléfono', 20);
  const emailValido = validarEmail(email);
  const direccionValida = validarTextoOpcional(direccion, 'dirección', 200);

  if (rncValido) {
    const { rows: existente } = await query(
      'SELECT id FROM suplidores WHERE LOWER(rnc) = LOWER($1)',
      [rncValido],
    );
    if (existente.length > 0) {
      throw new ErrorHttp(400, `Ya existe un suplidor registrado con el RNC/cédula "${rncValido}".`);
    }
  }

  const { rows } = await query(
    `
      INSERT INTO suplidores (
        nombre,
        rnc,
        contacto,
        telefono,
        email,
        direccion,
        activo
      ) VALUES ($1, $2, $3, $4, $5, $6, TRUE)
      RETURNING id, nombre, rnc, contacto, telefono, email, direccion, activo, created_at
    `,
    [
      nombreValido,
      rncValido,
      contactoValido,
      telefonoValido,
      emailValido,
      direccionValida,
    ],
  );

  const nuevo = rows[0];

  await registrarAuditoria({
    usuarioId,
    accion: 'SUPLIDOR_CREADO',
    entidad: 'suplidores',
    entidadId: nuevo.id,
    datosNuevos: {
      nombre: nuevo.nombre,
      rnc: nuevo.rnc,
      contacto: nuevo.contacto,
    },
    ip,
  });

  return nuevo;
}

export async function actualizarSuplidor(id, datos, usuarioId, ip = null) {
  const suplidorActual = await obtenerSuplidorPorId(id);

  if (!suplidorActual) {
    throw new ErrorHttp(404, 'El suplidor no existe.');
  }

  const sets = [];
  const valores = [];
  let posicion = 1;

  if (datos.nombre !== undefined) {
    const nombreValido = validarNombre(datos.nombre);
    sets.push(`nombre = $${posicion++}`);
    valores.push(nombreValido);
  }

  if (datos.rnc !== undefined) {
    const rncValido = validarTextoOpcional(datos.rnc, 'RNC o cédula', 15);
    if (rncValido && rncValido.toLowerCase() !== (suplidorActual.rnc || '').toLowerCase()) {
      const { rows: existente } = await query(
        'SELECT id FROM suplidores WHERE LOWER(rnc) = LOWER($1) AND id <> $2',
        [rncValido, id],
      );
      if (existente.length > 0) {
        throw new ErrorHttp(400, `Ya existe otro suplidor registrado con el RNC/cédula "${rncValido}".`);
      }
    }
    sets.push(`rnc = $${posicion++}`);
    valores.push(rncValido);
  }

  if (datos.contacto !== undefined) {
    const contactoValido = validarTextoOpcional(datos.contacto, 'contacto', 80);
    sets.push(`contacto = $${posicion++}`);
    valores.push(contactoValido);
  }

  if (datos.telefono !== undefined) {
    const telefonoValido = validarTextoOpcional(datos.telefono, 'teléfono', 20);
    sets.push(`telefono = $${posicion++}`);
    valores.push(telefonoValido);
  }

  if (datos.email !== undefined) {
    const emailValido = validarEmail(datos.email);
    sets.push(`email = $${posicion++}`);
    valores.push(emailValido);
  }

  if (datos.direccion !== undefined) {
    const direccionValida = validarTextoOpcional(datos.direccion, 'dirección', 200);
    sets.push(`direccion = $${posicion++}`);
    valores.push(direccionValida);
  }

  if (datos.activo !== undefined) {
    const esActivo =
      typeof datos.activo === 'boolean'
        ? datos.activo
        : ['1', 'true'].includes(String(datos.activo).toLowerCase());
    sets.push(`activo = $${posicion++}`);
    valores.push(esActivo);
  }

  if (sets.length === 0) {
    throw new ErrorHttp(400, 'No hay campos para actualizar.');
  }

  valores.push(id);
  const consulta = `
    UPDATE suplidores
    SET ${sets.join(', ')}
    WHERE id = $${posicion}
    RETURNING id, nombre, rnc, contacto, telefono, email, direccion, activo, created_at
  `;

  const { rows } = await query(consulta, valores);
  const actualizado = rows[0];

  await registrarAuditoria({
    usuarioId,
    accion: 'SUPLIDOR_ACTUALIZADO',
    entidad: 'suplidores',
    entidadId: id,
    datosAnteriores: {
      nombre: suplidorActual.nombre,
      rnc: suplidorActual.rnc,
      activo: suplidorActual.activo,
    },
    datosNuevos: {
      nombre: actualizado.nombre,
      rnc: actualizado.rnc,
      activo: actualizado.activo,
    },
    ip,
  });

  return actualizado;
}

export async function eliminarSuplidor(id, usuarioId, ip = null) {
  const suplidor = await obtenerSuplidorPorId(id);

  if (!suplidor) {
    throw new ErrorHttp(404, 'El suplidor no existe.');
  }

  if (suplidor.compras_count > 0) {
    throw new ErrorHttp(
      409,
      'No se puede eliminar el suplidor porque tiene facturas de compras registradas. Desactívalo para conservar el registro contable.',
    );
  }

  await query('DELETE FROM suplidores WHERE id = $1', [id]);

  await registrarAuditoria({
    usuarioId,
    accion: 'SUPLIDOR_ELIMINADO',
    entidad: 'suplidores',
    entidadId: id,
    datosAnteriores: {
      nombre: suplidor.nombre,
      rnc: suplidor.rnc,
    },
    ip,
  });

  return { id, nombre: suplidor.nombre };
}
