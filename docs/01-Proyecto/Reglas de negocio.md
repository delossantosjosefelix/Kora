---
tags: [proyecto, reglas]
---
# Reglas de negocio

1. **ITBIS.** El precio guardado es el precio final con ITBIS incluido. La tasa va por producto: 0, 16 o 18. La tasa se copia en cada línea de venta. Verificar con la DGII el tratamiento de cada producto real.
2. **Recibo.** Muestra el desglose del ITBIS y la leyenda: Recibo interno, no válido como comprobante fiscal.
3. **Inventario.** Cambia solo mediante movimientos, siempre dentro de una transacción y con motivo en ajustes y mermas. Nunca se edita la existencia a mano.
4. **Anulaciones.** Las ventas y compras terminadas no se editan ni se borran. Se anulan con motivo, usuario y autorización del gerente o del administrador.
5. **Caja.** No hay venta sin turno de caja abierto. Un cajero no puede tener dos turnos abiertos.
6. **Cierre de caja.** Tarjeta y transferencia no suman al efectivo físico. La diferencia se registra siempre.
7. **Copias en detalle de venta.** Se guardan el nombre, el precio, el costo y la tasa al momento de vender.
8. **Pagos.** Se permiten pagos combinados.
9. **Auditoría.** Las acciones sensibles se registran: anular ventas, cambiar precios, ajustar inventario, crear usuarios.
10. **Seguridad.** Contraseñas con hash y bloqueo tras intentos fallidos. Restaurar una copia exige la contraseña del usuario.
11. **Imágenes.** Son archivos en la carpeta uploads. En la base de datos solo va la ruta.
12. **Borrado.** Nada se borra físicamente en usuarios, productos, suplidores ni categorías. Se usa el campo activo.

## Cálculo del ITBIS

```text
base = precio_final / (1 + tasa / 100)
itbis = precio_final - base
```

| Precio final | Tasa | Base | ITBIS |
|---|---|---|---|
| RD$118.00 | 18 % | RD$100.00 | RD$18.00 |
| RD$120.00 | 16 % | RD$103.45 | RD$16.55 |
| RD$90.00 | Exento | RD$90.00 | RD$0.00 |

Se redondea a 2 decimales con una sola regla en todo el sistema. La base más el ITBIS debe dar siempre el precio final.

## Cálculo del cierre de caja

```text
efectivo esperado = efectivo inicial + ventas en efectivo + entradas - salidas
diferencia = efectivo contado - efectivo esperado
```

Ejemplo:

| Concepto | Monto |
|---|---|
| Efectivo inicial | RD$2,000 |
| Ventas en efectivo | RD$8,500 |
| Gastos pagados desde la caja | RD$500 |
| Retiros de efectivo | RD$1,000 |
| Efectivo esperado | RD$9,000 |
| Efectivo contado | RD$8,900 |
| Diferencia | RD$-100 |

Ver también [[Roles y permisos]] y [[Alcances y límites]].
