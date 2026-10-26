---
tags: [plan]
---
# Plan diario

Del jueves 22 de octubre al sábado 28 de noviembre, con el domingo 29 de reserva. Cada día tiene dos casillas: la tarea y su criterio de listo. Las fechas enlazan con la nota del día en la carpeta Diario.

Antes de empezar un día, revisa la [[Rutina diaria]]. Si te atrasas, mira [[Si te atrasas]]. Los hitos están en [[Hitos]].

## Semana 1 · Base, usuarios, productos y compras

### [[2026-10-22|Jue 22 oct]]
- [x] Proyecto base: carpetas, Vite y React, Express, conexión a PostgreSQL, .env, notify.js y variables de color, repositorio Git y primer commit en GitHub
- [x] Listo cuando: /api/health responde, React muestra una pantalla de prueba y el commit está en GitHub

### [[2026-10-23|Vie 23 oct]]
- [x] Ejecutar el script SQL y cargar los datos iniciales: roles, métodos de pago, configuración y primer administrador
- [x] Listo cuando: Las tablas existen y puedes consultarlas

### [[2026-10-24|Sáb 24 oct]]
- [x] Login en el backend: hash, bloqueo por intentos, sesión y permisos por rol
- [x] Listo cuando: Un cajero recibe error al pedir algo de administrador

### [[2026-10-25|Dom 25 oct]]
- [x] Pantalla de login, barra lateral por rol, rutas protegidas y módulo de usuarios
- [x] Listo cuando: El administrador crea un gerente y el gerente crea un cajero

### [[2026-10-26|Lun 26 oct]]
- [x] Categorías y unidades de medida, API y pantallas
- [x] Listo cuando: CRUD completo funcionando

### [[2026-10-27|Mar 27 oct]]
- [x] API de productos: tasa de ITBIS e imagen
- [x] Listo cuando: Crear y editar un producto por API con foto

### [[2026-10-28|Mié 28 oct]]
- [x] Pantalla Catálogo: lista, búsqueda y formulario
- [x] Listo cuando: El cajero no ve el costo y el administrador sí

### [[2026-10-29|Jue 29 oct]]
- [ ] Inventario: existencias y función central de movimientos en transacción
- [ ] Listo cuando: Un movimiento actualiza el stock y deja registro

### [[2026-10-30|Vie 30 oct]]
- [ ] Suplidores y pantallas de Existencias y Movimientos
- [ ] Listo cuando: Se ve el historial con filtros

### [[2026-10-31|Sáb 31 oct]]
- [ ] API de compras: compra, detalle y movimientos en una sola transacción
- [ ] Listo cuando: Una compra sube el stock

### [[2026-11-01|Dom 1 nov]]
**Hito 1.** Al terminar, etiqueta de Git v0.1. Ver [[Hitos]].

- [ ] Pantalla Nueva compra e historial de compras
- [ ] Listo cuando: Registras productos y recibes mercancía

## Semana 2 · Caja y ventas

### [[2026-11-02|Lun 2 nov]]
- [ ] Cajas y turnos: abrir caja, API y pantalla
- [ ] Listo cuando: No se puede abrir dos veces

### [[2026-11-03|Mar 3 nov]]
- [ ] Movimientos de caja y lógica de cierre
- [ ] Listo cuando: El cálculo coincide con el ejemplo de RD$2,000

### [[2026-11-04|Mié 4 nov]]
- [ ] Pantalla Cerrar caja e historial de cierres
- [ ] Listo cuando: Cierre imprimible con la diferencia registrada

### [[2026-11-05|Jue 5 nov]]
- [ ] API de ventas: validar turno, calcular ITBIS y guardar pagos
- [ ] Listo cuando: Una venta de prueba cuadra: base más ITBIS igual al total

### [[2026-11-06|Vie 6 nov]]
- [ ] Pantalla Nueva venta: búsqueda, carrito y escáner
- [ ] Listo cuando: Agregas y quitas productos y el total es correcto

### [[2026-11-07|Sáb 7 nov]]
- [ ] Cobro con efectivo, tarjeta, transferencia y pago mixto, cambio y recibo con imprimir y PDF
- [ ] Listo cuando: Recibo con desglose y leyenda de recibo interno

### [[2026-11-08|Dom 8 nov]]
**Hito 2.** Al terminar, etiqueta de Git v0.2. Ver [[Hitos]].

- [ ] Ventas realizadas, reimprimir y anular con autorización del gerente
- [ ] Listo cuando: Venta completa de principio a fin

## Semana 3 · Cierre de la Fase 1

### [[2026-11-09|Lun 9 nov]]
- [ ] Dashboard: tarjetas, más vendidos y alertas
- [ ] Listo cuando: Los datos son reales, no de ejemplo

### [[2026-11-10|Mar 10 nov]]
- [ ] Reporte de ventas con filtros
- [ ] Listo cuando: Por día, cajero, categoría y método de pago

### [[2026-11-11|Mié 11 nov]]
- [ ] Copias de seguridad en el backend: base de datos y carpeta de imágenes
- [ ] Listo cuando: Genera un archivo y queda en el historial

### [[2026-11-12|Jue 12 nov]]
- [ ] Pantalla de copias, restaurar con contraseña, copia automática y ruta para USB
- [ ] Listo cuando: Restauras en una base vacía y todo reaparece

### [[2026-11-13|Vie 13 nov]]
- [ ] Configuración del negocio y revisión de permisos
- [ ] Listo cuando: Cambiar el nombre o la tasa se refleja en el recibo

### [[2026-11-14|Sáb 14 nov]]
- [ ] Día de errores: recorrer todo con la lista de pruebas
- [ ] Listo cuando: Lista de fallos corregidos

### [[2026-11-15|Dom 15 nov]]
**Hito 3.** Al terminar, etiqueta de Git v1.0. Ver [[Hitos]].

- [ ] Prueba completa de la Fase 1 con tu compañero
- [ ] Listo cuando: Fase 1 terminada

## Semana 4 · Fase 2

### [[2026-11-16|Lun 16 nov]]
- [ ] Devoluciones, API y pantalla
- [ ] Listo cuando: Devuelve stock o registra merma según el caso

### [[2026-11-17|Mar 17 nov]]
- [ ] Ajustes de inventario, mermas y alertas de stock
- [ ] Listo cuando: Motivo obligatorio en cada ajuste

### [[2026-11-18|Mié 18 nov]]
- [ ] Gastos y sus categorías
- [ ] Listo cuando: Los gastos se descuentan en el reporte

### [[2026-11-19|Jue 19 nov]]
- [ ] Reporte de ganancias
- [ ] Listo cuando: Ventas menos costo menos gastos coincide con un cálculo a mano

### [[2026-11-20|Vie 20 nov]]
- [ ] Historial de precios, reporte de inventario e historial de cierres
- [ ] Listo cuando: Todo se consulta por fechas

### [[2026-11-21|Sáb 21 nov]]
- [ ] Auditoría: registro automático y pantalla
- [ ] Listo cuando: Anular una venta queda registrado con quién y cuándo

### [[2026-11-22|Dom 22 nov]]
**Hito 4.** Al terminar, etiqueta de Git v2.0. Ver [[Hitos]].

- [ ] Pruebas de integración de la Fase 2
- [ ] Listo cuando: Fase 2 terminada

## Semana 5 · Pruebas, Kora AI y acabado

### [[2026-11-23|Lun 23 nov]]
- [ ] Pruebas con datos de ejemplo junto a tu compañero
- [ ] Listo cuando: Lista priorizada de errores

### [[2026-11-24|Mar 24 nov]]
- [ ] Corregir errores críticos y probar la matriz de permisos por rol
- [ ] Listo cuando: Cada rol ve y hace solo lo suyo

### [[2026-11-25|Mié 25 nov]]
- [ ] Kora AI v1: base de conocimiento y búsqueda de productos
- [ ] Listo cuando: Responde «¿cuánto cuesta X?» y «¿cómo abro caja?»

### [[2026-11-26|Jue 26 nov]]
- [ ] Kora AI v1: panel de chat y pruebas
- [ ] Listo cuando: Responde bien 15 preguntas de prueba

### [[2026-11-27|Vie 27 nov]]
- [ ] Rediseño final y pulido: logo, estilos y alertas
- [ ] Listo cuando: Se ve con identidad propia

### [[2026-11-28|Sáb 28 nov]]
- [ ] Congelar la versión: copia de seguridad final, README y guion de demostración
- [ ] Listo cuando: Versión estable y probada

### [[2026-11-29|Dom 29 nov]]
- [ ] Reserva y demostración, sin código nuevo
- [ ] Listo cuando: Demostración lista
