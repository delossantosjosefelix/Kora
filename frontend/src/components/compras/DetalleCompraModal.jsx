import { useEffect, useState } from 'react';
import { AlertCircle, Calendar, FileText, Loader, Package, Users } from 'reicon-react';
import Modal from '../ui/Modal.jsx';
import { api } from '../../services/api.js';
import { mensajeError } from '../../utils/apiError.js';
import { formatearFecha, formatearFechaHora, formatearMoneda, formatearNumero } from '../../utils/format.js';

export default function DetalleCompraModal({ abierto, onCerrar, compraId }) {
  const [compra, setCompra] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [errorCarga, setErrorCarga] = useState('');

  useEffect(() => {
    if (!abierto || !compraId) {
      setCompra(null);
      setErrorCarga('');
      return;
    }

    let cancelado = false;
    setCargando(true);
    setErrorCarga('');

    async function cargarDetalle() {
      try {
        const respuesta = await api.get(`/compras/${compraId}`);
        if (cancelado) return;

        if (!respuesta.ok) {
          throw new Error(
            mensajeError(respuesta, 'No se pudo cargar el detalle de la compra.'),
          );
        }

        setCompra(respuesta.datos?.compra ?? null);
      } catch (err) {
        if (!cancelado) setErrorCarga(err.message);
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargarDetalle();

    return () => {
      cancelado = true;
    };
  }, [abierto, compraId]);

  const tituloModal = compra
    ? `Compra ${compra.numero_factura_suplidor ? `#${compra.numero_factura_suplidor}` : ''}`
    : 'Detalle de compra';

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={tituloModal}
      descripcion="Información de la factura y mercancía recibida en inventario."
      tamano="lg"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
          <button type="button" className="button button--secondary" onClick={onCerrar}>
            Cerrar
          </button>
        </div>
      }
    >
      {cargando ? (
        <div className="empty-state" style={{ padding: '40px 0' }}>
          <Loader size={28} className="spin" />
          <p className="empty-state__title" style={{ marginTop: '12px' }}>
            Cargando detalles de la compra...
          </p>
        </div>
      ) : errorCarga ? (
        <div className="alert alert--error">
          <AlertCircle size={20} />
          <div>
            <strong>Error:</strong> {errorCarga}
          </div>
        </div>
      ) : compra ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '14px',
              padding: '16px',
              background: 'var(--color-surface-muted)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                Suplidor
              </span>
              <p style={{ margin: '4px 0 0', fontWeight: 650, color: 'var(--color-ink)' }}>
                {compra.suplidor_nombre || 'Sin nombre'}
              </p>
            </div>

            <div>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                No. Factura suplidor
              </span>
              <p style={{ margin: '4px 0 0', fontWeight: 600, color: 'var(--color-ink)' }}>
                {compra.numero_factura_suplidor || 'No especificado'}
              </p>
            </div>

            <div>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                Fecha de factura
              </span>
              <p style={{ margin: '4px 0 0', fontWeight: 600, color: 'var(--color-ink)' }}>
                {formatearFecha(compra.fecha)}
              </p>
            </div>

            <div>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                Estado
              </span>
              <div style={{ marginTop: '4px' }}>
                <span
                  className={`compra-status-badge compra-status-badge--${
                    compra.estado === 'COMPLETADA' ? 'completada' : 'anulada'
                  }`}
                >
                  {compra.estado}
                </span>
              </div>
            </div>
          </div>

          {compra.observacion ? (
            <div style={{ fontSize: '0.86rem', color: 'var(--color-text-muted)' }}>
              <strong>Observación:</strong> {compra.observacion}
            </div>
          ) : null}

          <div>
            <h3
              style={{
                fontSize: '0.94rem',
                fontWeight: 700,
                color: 'var(--color-ink)',
                margin: '0 0 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Package size={16} />
              Productos recibidos ({compra.detalles?.length || 0})
            </h3>

            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th style={{ textAlign: 'right' }}>Cantidad</th>
                    <th style={{ textAlign: 'right' }}>Costo unitario</th>
                    <th style={{ textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {compra.detalles?.map((linea) => (
                    <tr key={linea.id}>
                      <td style={{ fontWeight: 600 }}>{linea.producto_nombre}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        {formatearNumero(linea.cantidad)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {formatearMoneda(linea.costo_unitario)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>
                        {formatearMoneda(linea.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'var(--color-surface-muted)', fontWeight: 750 }}>
                    <td colSpan={3} style={{ textAlign: 'right', fontSize: '0.95rem' }}>
                      Total pagado:
                    </td>
                    <td style={{ textAlign: 'right', fontSize: '1.05rem', color: 'var(--color-ink)' }}>
                      {formatearMoneda(compra.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)', textAlign: 'right' }}>
            Registrado en el sistema el {formatearFechaHora(compra.created_at)}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
