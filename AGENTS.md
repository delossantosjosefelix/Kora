# Kora - Reglas para agentes de IA

Este archivo es obligatorio para cualquier IA o persona que modifique el proyecto.

## 1. Cero emojis

- Prohibido usar emojis en codigo, interfaz, textos, documentacion, commits o comentarios.
- Prohibido usar glifos Unicode como sustituto de iconos (por ejemplo, el simbolo de menu de tres lineas o las marcas de verificacion).
- Antes de entregar cambios ejecuta:

```bash
cd frontend
npm run check:emojis
```

- `npm run build` ejecuta esa verificacion automaticamente mediante `prebuild`.
- Si el check falla, corrige el archivo; no desactives ni debilites la regla.

## 2. Todos los iconos vienen de Reicon

- Libreria oficial: `reicon-react` - https://github.com/dqev/reicon
- Importa componentes con nombre:

```jsx
import { Users, Key, LogOut } from 'reicon-react';
```

- Props disponibles: `size`, `weight` (`"Outline"` o `"Filled"`), `color`, `strokeWidth`.
- No uses `lucide-react`, `react-icons`, `heroicons`, Font Awesome ni SVG inline para iconos.
- No dibujes iconos con caracteres de texto.

## 3. Interfaz

- Todo el texto visible para el usuario va en espanol.
- Reutiliza las primitivas existentes en `frontend/src/styles/ui.css`:
  - Botones: `.button`, `.button--primary`, `.button--secondary`, `.button--ghost`, `.button--danger`, `.button--sm`, `.icon-button`.
  - Formularios: `.field`, `.input`, `.select`, `.textarea`, `.field-error`, `.field-hint`, `.field-grid`.
  - Tablas, badges, alertas, modales y estados vacios ya estan definidos ahi.
- No agregues estilos inline para resolver disenos; usa las clases del sistema.
- Todo formulario debe tener labels asociados, validacion visible, estado de carga y mensaje de error.
- Los botones nunca deben quedar sin estilo ni grises por defecto.

## 4. Autenticacion y roles

- `Administrador`: gestiona todos los usuarios.
- `Gerente`: solo puede listar, crear y editar usuarios con rol `Cajero`.
- `Cajero`: no accede a la gestion de usuarios.
- Cambiar contrasena es un flujo independiente en `/cambiar-password`.
- Nunca agregues "Cambiar contrasena" al sidebar; se accede desde el menu del usuario en la barra superior.
- Toda cuenta nueva o contrasena restablecida por otro usuario debe tener `debe_cambiar_password = TRUE`.
- Si `usuario.debe_cambiar_password` es verdadero, la aplicacion debe forzar el cambio antes de entrar al panel.
- La contrasena minima es de 8 caracteres.

## 5. Estructura relevante

```text
backend/src/
  controllers/        Controladores HTTP
  middleware/         Autenticacion y autorizacion por rol
  routes/             Rutas de la API
  services/           Logica de negocio
  scripts/            Preparacion de base de datos

frontend/src/
  components/ui/      Primitivas reutilizables (Modal, PasswordInput)
  context/            Sesion y autenticacion
  layouts/            AuthLayout y AppLayout
  pages/              Login, Dashboard, Usuarios, CambiarPassword
  styles/             variables, global, ui, layout, auth
  utils/              API, notificaciones y formato
```

## 6. Comandos

```bash
# Backend
cd backend
npm run dev
npm start
npm run db:setup

# Frontend
cd frontend
npm run dev
npm run check:emojis
npm run build
```

## 7. Calidad

- No dejes imports sin usar, botones sin accion ni enlaces con `preventDefault`.
- Verifica que el build de Vite termine sin errores antes de terminar.
- Mantiene el diseno consistente con las variables de `frontend/src/styles/variables.css`.
- No elimines archivos o cambios existentes sin revisar primero su contenido.
