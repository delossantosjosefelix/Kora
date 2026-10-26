---
tags: [proyecto, tecnologia]
---
# Tecnologías

## Stack

| Capa | Tecnología |
|---|---|
| Interfaz | React con Vite, react-router-dom, react-hot-toast y sweetalert2 |
| Servidor | Node.js con Express en módulos ES |
| Dependencias del servidor | pg, dotenv, bcryptjs, jsonwebtoken, helmet, morgan, cors, multer, node-cron y nodemon en desarrollo |
| Base de datos | PostgreSQL 18, con 26 tablas e identificadores UUID en las tablas principales |
| Entorno | Windows, VS Code, PowerShell, Git, GitHub y Obsidian |
| Cliente de base de datos | pgAdmin o HeidiSQL |
| Opcional al final | Electron para empaquetar |

## Arquitectura

Un servidor local en el negocio con tres piezas: PostgreSQL, la API de Express y la interfaz de React compilada, servida por Express. La caja principal entra por localhost y las demás por la dirección IP de esa computadora. Sin hosting, sin nube y sin APIs externas de inteligencia artificial.

| Entorno | Servicio | Dirección |
|---|---|---|
| Desarrollo | API de Express | http://localhost:3000 |
| Desarrollo | Interfaz de Vite, con proxy de /api hacia la API | http://localhost:5173 |
| Uso en el negocio | Express sirve la interfaz compilada | http://localhost:3000 |

## Estructura de carpetas

```text
kora/
  backend/
    src/config, routes, controllers, middleware, services, utils
    uploads/
  frontend/
    src/components, pages, layouts, hooks, utils, styles
  database/
  docs/                  este vault de Obsidian
  .claude/skills/pos-minimarket/SKILL.md
```

## Variables de entorno

El archivo `backend/.env` no se sube a Git. Se sube `backend/.env.example` sin secretos.

```text
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kora
DB_USER=postgres
DB_PASSWORD=
JWT_SECRET=
```

## Marca

Nombre Kora. Logo: una gema de ámbar cuyas facetas forman una K.

| Color | Valor |
|---|---|
| Verde principal | #0F766E |
| Ámbar de acento | #F59E0B |
| Oscuro | #111827 |
| Menta | #F0FDFA |
| Fondo | #F9FAFB |

Ver [[Reglas de negocio]] y [[Pantallas]].
