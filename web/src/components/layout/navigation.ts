import AssessmentIcon from '@mui/icons-material/Assessment';
import BusinessIcon from '@mui/icons-material/Business';
import CalendarIcon from '@mui/icons-material/CalendarToday';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory2';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';

export interface NavigationItem {
  label: string;
  icon: typeof DashboardIcon;
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
    label: 'Lojinha',
    icon: InventoryIcon,
    path: '/products',
  },
  {
    label: 'Relatórios',
    icon: AssessmentIcon,
    path: '/reports',
  },
];
