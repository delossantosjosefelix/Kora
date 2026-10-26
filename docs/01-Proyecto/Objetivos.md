---
tags: [proyecto]
---
# Objetivos

## Objetivo general

Desarrollar un sistema web local de punto de venta para minimarkets dominicanos, denominado Kora, que permita administrar ventas, inventario, compras, caja y reportes, con control de acceso por roles y respaldo de la información, para reducir errores operativos, mantener el control de las existencias y del efectivo, y determinar la ganancia real del negocio.

## Objetivos específicos

1. Diseñar una base de datos relacional en PostgreSQL que preserve la integridad de la información, de modo que las ventas y las compras registradas no se modifiquen y solo puedan anularse, y que el inventario se controle mediante movimientos.
2. Implementar la autenticación y el control de acceso por roles de Administrador, Gerente y Cajero, con cuentas creadas únicamente por personal autorizado, contraseñas almacenadas mediante hash y registro de las acciones sensibles.
3. Desarrollar la gestión del catálogo de productos, con categorías, unidades de medida, imágenes, costo y precio final con ITBIS configurable por producto.
4. Implementar el control de inventario a partir de movimientos, ajustes y mermas, con alertas cuando las existencias lleguen al mínimo establecido.
5. Desarrollar los módulos de compras y suplidores, de forma que cada compra registrada actualice automáticamente las existencias.
6. Construir la pantalla de ventas con búsqueda de productos y lectura de códigos de barras, pagos en efectivo, con tarjeta, por transferencia o combinados, cálculo del cambio y emisión de un recibo interno con el desglose del ITBIS, que pueda imprimirse o descargarse en formato PDF.
7. Implementar el control de caja por turnos, con apertura, movimientos de efectivo, cierre y registro de diferencias, además de la anulación de ventas con autorización y el registro de devoluciones.
8. Generar un panel principal y reportes de ventas, ganancias, gastos e inventario que permitan distinguir los ingresos por ventas de la ganancia real.
9. Implementar copias de seguridad manuales y automáticas de la base de datos y de las imágenes, con restauración protegida y posibilidad de almacenarlas en un medio externo.
10. Definir una interfaz con identidad visual propia, que sustituya las alertas nativas del navegador por notificaciones y cuadros de confirmación personalizados.
11. Incorporar Kora AI, un asistente local basado en reglas y búsqueda en la base de datos, que responda consultas sobre productos y oriente en los procesos del sistema.

Volver a [[Descripción]].
