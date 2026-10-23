BEGIN;

INSERT INTO roles (nombre, descripcion) VALUES
  ('Administrador', 'Acceso total al sistema, usuarios, respaldos y configuración.'),
  ('Gerente', 'Operación diaria, catálogo, inventario, compras, caja y reportes.'),
  ('Cajero', 'Ventas, apertura y cierre de su caja y consulta de productos.')
ON CONFLICT (nombre) DO UPDATE SET
  descripcion = EXCLUDED.descripcion;

INSERT INTO unidades_medida (nombre, abreviatura) VALUES
  ('Unidad', 'und'),
  ('Libra', 'lb'),
  ('Litro', 'lt')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO categorias (nombre, descripcion) VALUES
  ('General', 'Categoría por defecto para productos sin clasificar.')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO cajas (nombre) VALUES
  ('Caja 1')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO metodos_pago (nombre, es_efectivo) VALUES
  ('Efectivo', TRUE),
  ('Tarjeta', FALSE),
  ('Transferencia', FALSE)
ON CONFLICT (nombre) DO UPDATE SET
  es_efectivo = EXCLUDED.es_efectivo;

INSERT INTO categorias_gasto (nombre) VALUES
  ('Transporte'),
  ('Limpieza'),
  ('Mantenimiento'),
  ('Otros')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO configuracion (
  id,
  nombre_negocio,
  rnc,
  direccion,
  telefono,
  tasa_itbis,
  moneda,
  prefijo_recibo,
  leyenda_recibo
) VALUES (
  1,
  'Minimarket Kora',
  NULL,
  NULL,
  NULL,
  18.00,
  'DOP',
  'R',
  'Recibo interno, no válido como comprobante fiscal'
)
ON CONFLICT (id) DO NOTHING;

COMMIT;
