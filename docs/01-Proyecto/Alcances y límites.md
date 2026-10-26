---
tags: [proyecto]
---
# Alcances y límites

## Alcances

### Alcance general
El sistema está dirigido a un solo minimarket, con un servidor local instalado en el establecimiento y acceso desde varias cajas o dispositivos de la misma red. Sus usuarios son el administrador, el gerente y los cajeros.

### Primera fase: funcionalidades esenciales
- Inicio de sesión, gestión de usuarios y permisos por rol.
- Categorías, unidades de medida y catálogo de productos con imagen.
- Existencias y movimientos de inventario.
- Suplidores y compras.
- Apertura y cierre de caja por turno.
- Pantalla de ventas, cobro, cambio y recibo interno imprimible.
- Historial de ventas, reimpresión de recibos y anulación con autorización.
- Panel principal y reporte de ventas.
- Copias de seguridad y restauración.
- Configuración de los datos del negocio y de la tasa de ITBIS por defecto.

### Segunda fase: administración del negocio
- Devoluciones.
- Ajustes de inventario, mermas y alertas de existencias mínimas.
- Gastos operativos y sus categorías.
- Reportes de ganancias y de inventario.
- Historial de precios y de cierres de caja.
- Auditoría de las acciones sensibles.

### Etapa final
- [[Kora AI]]: asistente integrado que consulta precios y existencias y explica paso a paso los procesos del sistema.
- Operación en red local: uso simultáneo desde varias cajas conectadas al servidor del negocio, sin necesidad de internet.

## Límites

### Naturaleza del proyecto y aspectos fiscales
- Kora es un prototipo académico. Sus recibos son internos y no sustituyen los comprobantes fiscales exigidos por la Dirección General de Impuestos Internos.
- La facturación electrónica y la emisión de comprobantes fiscales quedan fuera del alcance. Un uso comercial real requeriría incorporar ese proceso y verificar las obligaciones vigentes del contribuyente.
- El tratamiento del ITBIS de cada producto lo define el usuario al registrarlo. El sistema calcula con la tasa indicada, pero no determina cuál corresponde.

### Límites funcionales
- No se incluyen ventas a crédito ni cuentas por cobrar.
- No se incluyen descuentos ni la conversión entre presentaciones, como comprar por cartón y vender por unidad.
- No se incluye el control de pagos pendientes a suplidores.
- No se incluye el control de lotes ni de fechas de vencimiento.
- Los pagos con tarjeta o por transferencia se registran de forma manual; el sistema no se conecta a terminales ni a pasarelas de pago.
- No se contemplan varias sucursales, acceso remoto desde fuera del negocio ni aplicación móvil nativa.
- La impresión de recibos se realiza mediante el navegador, sin integración específica con impresoras térmicas.

### Límites técnicos
- Al operar con un servidor local, si el equipo principal se apaga o falla, las cajas no pueden registrar ventas hasta que se restablezca. Por esta razón se establece como requisito el almacenamiento de copias de seguridad en un medio externo.
- Quedan fuera la sincronización con la nube y el empaquetado como programa de escritorio instalable, que se consideran mejoras futuras.

### Límites de Kora AI
- Funciona con reglas y búsqueda en la base de datos local, sin conexión a servicios externos de inteligencia artificial.
- Responde únicamente sobre los temas para los que fue configurado; no genera respuestas libres ni aprende de las conversaciones.
- No ejecuta acciones por su cuenta, como registrar ventas o modificar datos.
