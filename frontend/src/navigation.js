import { ArchiveBox, Category, Home, ShoppingCart, Users } from 'reicon-react';

/*
 * Elementos de navegación del menú lateral.
 * Cada elemento puede ser directo con `path` o tener `hijos` desplegables.
 * Solo pantallas existentes.
 */
export const NAV_ITEMS = [
  {
    path: '/dashboard',
    label: 'Panel',
    icon: Home,
    roles: ['Administrador', 'Gerente', 'Cajero'],
  },
  {
    path: '/catalogo',
    label: 'Catálogo',
    icon: Category,
    roles: ['Administrador', 'Gerente', 'Cajero'],
  },
  {
    path: '/inventario',
    label: 'Inventario',
    icon: ArchiveBox,
    roles: ['Administrador', 'Gerente', 'Cajero'],
  },
  {
    path: '/compras',
    label: 'Compras',
    icon: ShoppingCart,
    roles: ['Administrador', 'Gerente'],
  },
  {
    path: '/usuarios',
    label: 'Usuarios',
    icon: Users,
    roles: ['Administrador', 'Gerente'],
  },
];
