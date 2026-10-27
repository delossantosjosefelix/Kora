import { pool, query } from '../config/db.js';
import { ErrorHttp } from '../utils/ErrorHttp.js';
import { registrarAuditoria } from './auditoria.service.js';

const EFECTIVO_INICIAL_MAXIMO = 9999999.99;

function validarCajaId(valor) {
  if (typeof valor !== 'number' && typeof valor !== 'string') {
    throw new ErrorHttp(400, 'Debe seleccionar una caja válida.');
  }

  const numero = Number(valor);

  if (!Number.isInteger(numero) || numero <= 0) {
    throw new ErrorHttp(400, 'Debe seleccionar una caja válida.');
  }

  return numero;
}

function validarEfectivoInicial(valor) {
  if (valor === undefined || valor === null || valor === '') {
    return 0;
  }

  if (typeof valor !== 'number' && typeof valor !== 'string') {
    throw new ErrorHttp(400, 'El efectivo inicial debe ser un número válido.');
  }

  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    throw new ErrorHttp(400, 'El efectivo inicial debe ser un número válido.');
  }

  if (numero < 0) {
    throw new ErrorHttp(400, 'El efectivo inicial no puede ser negativo.');
  }

  if (numero > EFECTIVO_INICIAL_MAXIMO) {
    throw new ErrorHttp(400, 'El efectivo inicial supera el máximo permitido.');
  }

  return Number(numero.toFixed(2));
}

function validarObservacion(valor) {
  if (valor === undefined || valor === null) {
    return null;
  }

  if (typeof valor !== 'string') {
    throw new ErrorHttp(400, 'La observación no es válida.');
  }

  const limpio = valor.trim();

  if (!limpio) {
    return null;
  }

  if (limpio.length > 255) {
    throw new ErrorHttp(400, 'La observación no puede superar los 255 caracteres.');
  }

  return limpio;
}

function mapearTurno(fila) {
  if (!fila) {
    return null;
  }

  return {
    id: fila.id,
    caja_id: fila.caja_id,
    caja_nombre: fila.caja_nombre,
    usuario_id: fila.usuario_id,
    usuario_nombre: fila.usuario_nombre,
    fecha_apertura: fila.fecha_apertura,
    efectivo_inicial: Number(fila.efectivo_inicial),
    observacion: fila.observacion ?? null,
    estado: fila.estado,
  };
}

function traducirErrorTurno(error) {
  if (error instanceof ErrorHttp) {
    return error;
  }

  if (error?.code === '23505') {
    if (error.constraint === 'turnos_caja_abierta_por_usuario') {
      return new ErrorHttp(
        409,
        'Ya tienes un turno de caja abierto. Debes cerrarlo antes de abrir otro.',
      );
    }

    if (error.constraint === 'turnos_caja_abierta_por_caja') {
      return new ErrorHttp(409, 'La caja seleccionada ya está abierta por otro usuario.');
    }

    return new ErrorHttp(409, 'Ya existe un turno de caja abierto para esta caja o usuario.');
  }

  return error;
}

export async function listarCajasConEstado() {
  const { rows } = await query(`
    SELECT
      c.id,
      c.nombre,
      c.activa,
      t.id AS turno_id,
      t.fecha_apertura,
      t.efectivo_inicial,
      t.usuario_id AS turno_usuario_id,
      u.nombre || ' ' || u.apellido AS turno_usuario_nombre
    FROM cajas c
    LEFT JOIN turnos_caja t ON t.caja_id = c.id AND t.estado = 'ABIERTA'
    LEFT JOIN usuarios u ON u.id = t.usuario_id
    ORDER BY c.id ASC
  `);

  return rows.map((fila) => ({
    id: fila.id,
    nombre: fila.nombre,
    activa: fila.activa,
    estado: !fila.activa ? 'INACTIVA' : fila.turno_id ? 'OCUPADA' : 'DISPONIBLE',
    turno: fila.turno_id
      ? {
          id: fila.turno_id,
          fecha_apertura: fila.fecha_apertura,
          efectivo_inicial: Number(fila.efectivo_inicial),
          usuario_id: fila.turno_usuario_id,
          usuario_nombre: fila.turno_usuario_nombre,
        }
      : null,
  }));
}

export async function obtenerTurnoAbierto(usuarioId) {
  const { rows } = await query(
    `
      SELECT
        t.id,
        t.caja_id,
        c.nombre AS caja_nombre,
        t.usuario_id,
        u.nombre || ' ' || u.apellido AS usuario_nombre,
        t.fecha_apertura,
        t.efectivo_inicial,
        t.observacion,
        t.estado
      FROM turnos_caja t
      INNER JOIN cajas c ON c.id = t.caja_id
      INNER JOIN usuarios u ON u.id = t.usuario_id
      WHERE t.usuario_id = $1 AND t.estado = 'ABIERTA'
      LIMIT 1
    `,
    [usuarioId],
  );

  return mapearTurno(rows[0]);
}

export async function abrirTurno({
  cajaId,
  efectivoInicial = 0,
  observacion = null,
  usuarioId,
  ip = null,
}) {
  const cajaIdValido = validarCajaId(cajaId);
  const efectivo = validarEfectivoInicial(efectivoInicial);
  const observacionLimpia = validarObservacion(observacion);

  if (!usuarioId) {
    throw new ErrorHttp(401, 'La sesión no es válida.');
  }

  const client = await pool.connect();
  let turno = null;
  let caja = null;

  try {
    await client.query('BEGIN');

    const { rows: usuarioRows } = await client.query(
      'SELECT id, nombre, apellido FROM usuarios WHERE id = $1 AND activo = TRUE FOR UPDATE',
      [usuarioId],
    );
    const usuario = usuarioRows[0];

    if (!usuario) {
      throw new ErrorHttp(401, 'La sesión no es válida o el usuario está inactivo.');
    }

    const { rows: cajaRows } = await client.query(
      'SELECT id, nombre, activa FROM cajas WHERE id = $1 FOR UPDATE',
      [cajaIdValido],
    );
    caja = cajaRows[0];

    if (!caja) {
      throw new ErrorHttp(404, 'La caja seleccionada no existe.');
    }

    if (!caja.activa) {
      throw new ErrorHttp(400, 'La caja seleccionada está inactiva.');
    }

    const { rows: turnoUsuarioRows } = await client.query(
      `
        SELECT t.id, c.nombre AS caja_nombre
        FROM turnos_caja t
        INNER JOIN cajas c ON c.id = t.caja_id
        WHERE t.usuario_id = $1 AND t.estado = 'ABIERTA'
        LIMIT 1
      `,
      [usuarioId],
    );

    if (turnoUsuarioRows[0]) {
      throw new ErrorHttp(
        409,
        `Ya tienes un turno abierto en ${turnoUsuarioRows[0].caja_nombre}. Debes cerrarlo antes de abrir otro.`,
      );
    }

    const { rows: turnoCajaRows } = await client.query(
      `
        SELECT t.id, u.nombre || ' ' || u.apellido AS usuario_nombre
        FROM turnos_caja t
        INNER JOIN usuarios u ON u.id = t.usuario_id
        WHERE t.caja_id = $1 AND t.estado = 'ABIERTA'
        LIMIT 1
      `,
      [cajaIdValido],
    );

    if (turnoCajaRows[0]) {
      throw new ErrorHttp(
        409,
        `La caja ${caja.nombre} ya está abierta por ${turnoCajaRows[0].usuario_nombre}.`,
      );
    }

    const { rows: turnoRows } = await client.query(
      `
        INSERT INTO turnos_caja (caja_id, usuario_id, efectivo_inicial, observacion)
        VALUES ($1, $2, $3, $4)
        RETURNING id, caja_id, usuario_id, fecha_apertura, efectivo_inicial, observacion, estado
      `,
      [cajaIdValido, usuarioId, efectivo, observacionLimpia],
    );

    turno = mapearTurno({
      ...turnoRows[0],
      caja_nombre: caja.nombre,
      usuario_nombre: `${usuario.nombre} ${usuario.apellido}`,
    });

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw traducirErrorTurno(error);
  } finally {
    client.release();
  }

  await registrarAuditoria({
    usuarioId,
    accion: 'CAJA_ABRIR',
    entidad: 'turnos_caja',
    entidadId: turno.id,
    datosNuevos: {
      caja_id: caja.id,
      caja_nombre: caja.nombre,
      efectivo_inicial: efectivo,
      observacion: observacionLimpia,
    },
    ip,
  });

  return turno;
}
