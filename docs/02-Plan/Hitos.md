---
tags: [plan]
---
# Hitos

| Hito | Fecha | Qué debe funcionar | Etiqueta de Git |
|---|---|---|---|
| 1 | Dom 1 nov | Registras productos y recibes mercancía | v0.1 |
| 2 | Dom 8 nov | Una venta completa de principio a fin | v0.2 |
| 3 | Dom 15 nov | Fase 1 terminada | v1.0 |
| 4 | Dom 22 nov | Fase 2 terminada | v2.0 |
| Cierre | Sáb 28 nov | Versión estable y probada | v2.1 |

## Cómo marcar una etiqueta

Cambia el nombre y el mensaje según el hito:

```powershell
git switch main
git tag v0.1 -m "Hito 1: compras y productos"
git push origin v0.1
```

## Regla de decisión

Si el 8 de noviembre la venta no funciona de punta a punta, ese día se decide qué cortar de la segunda fase. Ver [[Si te atrasas]].

Volver al [[Plan diario]].
