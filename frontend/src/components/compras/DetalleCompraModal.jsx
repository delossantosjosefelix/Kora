import { useEffect, useState } from 'react';
import { AlertCircle, Loader, Package } from 'reicon-react';
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
    : 'Detalle De Compra';

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={tituloModal}
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
            Cargando Detalles De La Compra...
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
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Suplidor</span>
              <span className="detail-value" style={{ fontWeight: 600 }}>
                {compra.suplidor_nombre || 'Sin nombre'}
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">No. Factura Suplidor</span>
              <span className="detail-value" style={{ fontFamily: 'var(--font-mono)' }}>
                {compra.numero_factura_suplidor || 'No especificado'}
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Fecha De Factura</span>
              <span className="detail-value">
                {formatearFecha(compra.fecha)}
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Estado</span>
              <div className="detail-value">
                <span
                  className={`user-status-text ${
                    compra.estado === 'COMPLETADA'
                      ? 'user-status-text--active'
                      : 'user-status-text--inactive'
                  }`}
                >
                  {compra.estado === 'COMPLETADA' ? 'Completada' : 'Anulada'}
                </span>
              </div>
            </div>

            {compra.observacion ? (
              <div className="detail-item detail-item--full">
                <span className="detail-label">Observación</span>
                <div className="detail-value detail-value--box">
                  {compra.observacion}
                </div>
              </div>
            ) : null}
          </div>

          <div>
            <h3
              style={{
                fontSize: '0.92rem',
                fontWeight: 600,
                color: 'var(--color-ink)',
                margin: '0 0 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Package size={16} />
              Productos Recibidos ({compra.detalles?.length || 0})
            </h3>

            <div className="users-card" style={{ border: '1px solid var(--color-border)', borderRadius: '6px', overflow: 'hidden' }}>
              <div className="users-table-wrap">
                <table className="users-table users-table--compact">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th style={{ textAlign: 'right' }}>Cantidad</th>
                      <th style={{ textAlign: 'right' }}>Costo Unitario</th>
                      <th style={{ textAlign: 'right' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compra.detalles?.map((linea) => (
                      <tr key={linea.id}>
                        <td style={{ fontWeight: 600 }}>{linea.producto_nombre}</td>
                        <td style={{ textAlign: 'right' }}>
                          {formatearNumero(linea.cantidad)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {formatearMoneda(linea.costo_unitario)}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          {formatearMoneda(linea.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: 'var(--color-surface-muted)', fontWeight: 600 }}>
                      <td colSpan={3} style={{ textAlign: 'right', fontSize: '0.92rem' }}>
                        Total Pagado:
                      </td>
                      <td style={{ textAlign: 'right', fontSize: '1rem', color: 'var(--color-ink)' }}>
                        {formatearMoneda(compra.total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
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
