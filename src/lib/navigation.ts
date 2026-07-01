import {
  LayoutDashboard,
  FileText,
  Leaf,
  ShieldCheck,
  GraduationCap,
  BarChart3,
  Users,
  Building2,
  LucideIcon,
} from 'lucide-react';

export enum Role {
  USER = 'USER',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
  AUDITOR = 'AUDITOR',
}

export interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  roles: Role[];
  section: 'modules' | 'admin';
}

export const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: [Role.USER, Role.MANAGER, Role.ADMIN, Role.AUDITOR], section: 'modules' },
  { name: 'Documentos', href: '/documents', icon: FileText, roles: [Role.USER, Role.MANAGER, Role.ADMIN, Role.AUDITOR], section: 'modules' },
  { name: 'Ambiental', href: '/environmental', icon: Leaf, roles: [Role.USER, Role.MANAGER, Role.ADMIN, Role.AUDITOR], section: 'modules' },
  { name: 'Calidad', href: '/quality', icon: ShieldCheck, roles: [Role.MANAGER, Role.ADMIN, Role.AUDITOR], section: 'modules' },
  { name: 'Educativo', href: '/education', icon: GraduationCap, roles: [Role.MANAGER, Role.ADMIN, Role.AUDITOR], section: 'modules' },
  { name: 'Indicadores', href: '/indicators', icon: BarChart3, roles: [Role.MANAGER, Role.ADMIN, Role.AUDITOR], section: 'modules' },
  { name: 'Usuarios', href: '/admin/usuarios', icon: Users, roles: [Role.ADMIN], section: 'admin' },
  { name: 'Organizaciones', href: '/admin/organizaciones', icon: Building2, roles: [Role.ADMIN], section: 'admin' },
];

export function filterNavigationByRole(items: NavigationItem[], role?: Role): NavigationItem[] {
  if (!role) return [];
  return items.filter((item) => item.roles.includes(role));
}
