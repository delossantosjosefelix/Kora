---
tags: [proyecto, seguridad]
---
# Roles y permisos

No existe registro público. Las cuentas las crea personal autorizado, y el primer administrador se crea con un script de instalación y cambia su contraseña en el primer ingreso. Las cuentas se desactivan, nunca se borran.

| Acción | Administrador | Gerente | Cajero |
|---|---|---|---|
| Crear cuentas de administrador o gerente | Sí | No | No |
| Crear cuentas de cajero | Sí | Sí | No |
| Desactivar usuarios y restablecer contraseñas | Sí | Solo cajeros | No |
| Ver y editar productos | Sí | Sí | Solo ver nombre y precio |
| Ver costos y ganancias | Sí | Sí | No |
| Registrar compras y suplidores | Sí | Sí | No |
| Ajustes de inventario y mermas | Sí | Sí | No |
| Abrir y cerrar su propia caja | Sí | Sí | Sí |
| Registrar ventas | Sí | Sí | Sí |
| Anular ventas | Sí | Sí | No, requiere autorización |
| Procesar devoluciones | Sí | Sí | Con autorización |
| Registrar gastos | Sí | Sí | No |
| Ver reportes y panel completo | Sí | Sí | Solo su turno |
| Copias de seguridad y restauración | Sí | Sí | No |
| Configuración del negocio | Sí | Sí | No |
| Auditoría | Sí | Sí | No |
| Consultar Kora AI | Sí | Sí | Sí |

## Por confirmar
- Si el gerente puede restaurar copias de seguridad o solo el administrador. Restaurar siempre exige la contraseña de quien lo hace.

Ver también [[Reglas de negocio]].
