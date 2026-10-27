# ADR 001: Sistema estético, diseño de interfaz y reglas de animación

- Fecha: 2026-10-27
- Estado: Aceptado
- Ámbito: Frontend (Kora Web)

---

## 1. Contexto

Kora es una plataforma web para la operación diaria de minimarkets y colmados (caja, inventario, compras, catálogo y administración de usuarios). Los usuarios interactúan con el sistema durante jornadas completas, alternando rápidamente entre módulos.

En este tipo de herramientas, el software sobrecargado con transiciones lentas, efectos de carrusel móvil o micro-movimientos involuntarios genera fatiga visual, lentitud percibida y frustración operativa. Se requiere una experiencia con estética moderna, sobria, con tipografía nítida y velocidad de respuesta instantánea.

---

## 2. Paleta de colores e identidad visual

La identidad visual de Kora se basa en dos tonos dominantes definidos en `frontend/src/styles/variables.css`:

1. **Ámbar principal (`--color-primary`)**:
   - Base: `#f59e0b`
   - Interacción (hover): `#d97706`
   - Superficies suaves: `#fef3c7`
   - Uso: Botones primarios, pestañas activas, estados de advertencia y acentos de marca.

2. **Tinta Slate / Verde oscuro profundo (`--color-ink`)**:
   - Base: `#0b1f1c`
   - Suave: `#12312c`
   - Uso: Títulos principales, navegación lateral (Sidebar) y textos de alto contraste.

3. **Superficies neutras y limpias**:
   - Fondo general: `#fafafa` (`--color-bg`)
   - Tarjetas y contenedores: `#ffffff` (`--color-surface`)
   - Fondos secundarios y chips: `#f5f5f4` (`--color-surface-muted`)

4. **Formas y esquinas**:
   - Radios pequeños y severos: `--radius-xs: 4px`, `--radius-sm: 8px`, `--radius-md: 10px`.
   - Se evitan bordes excesivamente redondeados que resten profesionalismo al software empresarial.

---

## 3. Cero emojis e iconografía oficial

- **Prohibición estricta de emojis**: No se permiten emojis ni caracteres Unicode sustitutos en ningún archivo del proyecto.
- **Librería de iconos**: Únicamente `reicon-react`. No se permite el uso de otras librerías ni SVG en línea manuales para iconos.
- **Verificación**: Todo cambio debe pasar `npm run check:emojis`.

---

## 4. Filosofía de navegación y animaciones

### A. Cambio de páginas globales (Rutas) -> 100% Estático e instantáneo

- Al navegar entre páginas distintas mediante el sidebar o la barra superior (por ejemplo, del Dashboard a Inventario, Catálogo o Usuarios):
  - **No hay ninguna animación de entrada ni salida**.
  - En `AppLayout.jsx`, `<Outlet />` se renderiza de forma directa dentro de `<main className="app-content">`.
  - Queda terminantemente prohibido envolver `<Outlet />` con claves dinámicas como `key={location.pathname}` o clases con animaciones (`pageFadeIn`, `pageSlideIn`), ya que provocan parpadeos y retrasos innecesarios.

### B. Cambio de secciones internas (Pestañas / Tabs) -> Deslizamiento direccional

- Al alternar entre subsecciones dentro de una misma pantalla (por ejemplo, en Catálogo: *Productos* -> *Categorías* -> *Unidades*; o en Inventario: *Existencias* -> *Movimientos* -> *Suplidores*):
  - **Carga inicial estática**: Al entrar a la página por primera vez, el contenido debe cargar totalmente inmóvil, sin animaciones de entrada. Para lograrlo, el estado `direccion` se inicializa en `null`:
    ```jsx
    const [tab, setTab] = useState('productos');
    const [direccion, setDireccion] = useState(null);
    ```
  - **Clase direccional condicional**: La clase de animación `.tab-panel--slide-${direccion}` solo se aplica cuando `direccion` no es nulo:
    ```jsx
    className={`users-page-panel${tab === 'productos' && direccion ? ` tab-panel--slide-${direccion}` : ''}`}
    ```
  - **Interacción entre pestañas**: Cuando el usuario hace clic en una pestaña distinta, se calcula si se avanza o retrocede en el arreglo de pestañas y se asigna `'adelante'` o `'atras'`.
  - **Curva y duración**: Se utilizan las clases `.tab-panel--slide-adelante` y `.tab-panel--slide-atras` en `ui.css`, con duración `var(--duration-normal)` (200ms) y curva `var(--ease-out)` (`cubic-bezier(0.23, 1, 0.32, 1)`).
  - **Sin micro-movimientos por defecto**: No debe aplicarse ninguna animación por defecto (`tabFadeIn`, `translateY(3px)`) en `.users-page-panel:not([hidden])` para que la carga inicial no dé saltos.
  - **Subrayado de pestaña activa estático**: El pseudoelemento `.users-tab--active::after` no tiene animación de escalado al montar (`tabUnderlineIn`), evitando parpadeos al abrir la página.

---

## 5. Estructura estándar de las pantallas operativas

Todas las páginas con pestañas y tablas de gestión (Catálogo, Inventario, Usuarios, Compras) siguen la misma arquitectura:

1. **Cabecera de página (`.users-header`)**:
   - Título principal a la izquierda (`.users-title`).
   - Botón de acción principal a la derecha (`.button--primary` o `.button--kora-primary` con icono de Reicon).

2. **Barra de pestañas fija a nivel de página (`.users-bar` con `.users-tabs`)**:
   - La barra de pestañas **siempre se coloca fuera y por encima de los paneles que se deslizan**.
   - Cada pestaña (`.users-tab`) muestra su etiqueta y un chip numérico (`.users-tab-count`) con la cantidad total de registros.
   - De esta forma, al cambiar de sección, la barra de pestañas permanece inmóvil y solo el panel de datos inferior realiza la transición.

3. **Barra de controles de datos (por cada panel)**:
   - Se ubica dentro del panel de contenido.
   - A la izquierda: `.search-box` con `style={{ flex: 1, minWidth: '220px' }}` y campo de búsqueda con icono.
   - A la derecha: `.users-controls` con los filtros específicos (selectores de estado, botón de drawer `.filter-trigger-btn` y selector de modo de vista).

4. **Visualización de datos**:
   - Modo tabla por defecto (`.users-table`).
   - Modo cuadrícula de tarjetas (`.products-card-grid` y `.product-grid-card`) en Catálogo e Inventario para ver imágenes, precio final desglosado y puntos de estado (`.product-status-dot`).
