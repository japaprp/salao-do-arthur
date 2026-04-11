import type { SvgIconComponent } from '@mui/icons-material';
import {
  Assessment as AssessmentIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

export interface NavigationItem {
  label: string;
  icon: SvgIconComponent;
  path: string;
}

export const navigationItems: NavigationItem[] = [
  {
    label: 'Dashboard',
    icon: DashboardIcon,
    path: '/dashboard',
  },
  {
    label: 'Agendamentos',
    icon: CalendarIcon,
    path: '/appointments',
  },
  {
    label: 'Clientes',
    icon: PeopleIcon,
    path: '/clients',
  },
  {
    label: 'Profissionais',
    icon: PersonIcon,
    path: '/professionals',
  },
  {
    label: 'Serviços',
    icon: BusinessIcon,
    path: '/services',
  },
  {
    label: 'Relatórios',
    icon: AssessmentIcon,
    path: '/reports',
  },
];
