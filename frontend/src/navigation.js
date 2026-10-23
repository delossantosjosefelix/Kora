import {
  LayoutDashboard,
  Users,
  Key,
  ShieldAlert,
  LogOut,
} from 'lucide-react';

export const NAV_ITEMS = [
  {
    path: '/dashboard',
    label: 'Panel',
    icon: LayoutDashboard,
    roles: ['Administrador', 'Gerente', 'Cajero'],
  },
  {
    path: '/usuarios',
    label: 'Usuarios',
    icon: Users,
    roles: ['Administrador'],
  },
  {
    path: '/cambiar-password',
    label: 'Cambiar contraseña',
    icon: Key,
    roles: ['Administrador', 'Gerente', 'Cajero'],
  },
];

export const ITEM_SALIDA = {
  label: 'Cerrar sesión',
  icon: LogOut,
};
