---
tags: [proyecto, kora-ai]
---
# Kora AI

Asistente local basado en reglas y búsqueda en PostgreSQL. No usa APIs externas ni un modelo de lenguaje. Se construye al final del proyecto.

## Qué hace
- Responde sobre productos: precio, existencias y categoría.
- Explica procesos del sistema paso a paso, como abrir caja o anular una venta, desde la tabla `kora_ai_conocimiento`.
- Lo usa el personal para atender a los clientes, porque el sistema no tiene acceso de clientes.

## Qué no hace
- No genera respuestas libres ni aprende de las conversaciones.
- No modifica datos: solo lee.
- No registra ventas ni ejecuta acciones por su cuenta.

## Ejemplos de preguntas
- ¿Cuánto cuesta el arroz?
- ¿Cuántas unidades quedan de leche?
- ¿Cómo abro la caja?
- ¿Cómo anulo una venta?

Ver [[Alcances y límites]].
