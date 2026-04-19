export type IsoDateTimeString = string;

export interface User {
  id: string;
  email: string;
  phone?: string | null;
  name: string;
  role: UserRole;
  tenantId: string;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
  deletedAt?: IsoDateTimeString | null;
}

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  locale: string;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
}

export interface Professional {
  id: string;
  userId: string;
  tenantId: string;
  specialty?: string | null;
  commissionPercent: number;
  active: boolean;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
  user?: User;
  serviceLinks?: ProfessionalServiceAssignment[];
}

export interface Client {
  id: string;
  userId: string;
  tenantId: string;
  loyaltyPoints: number;
  lifetimeValue: number;
  favoriteProfessionalId?: string | null;
  preferences?: Record<string, unknown> | null;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
  user?: User;
  favoriteProfessional?: Professional | null;
}

export interface Service {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  price: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  parallelAllowed: boolean;
  active: boolean;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
}

export interface ProfessionalServiceAssignment {
  id: string;
  tenantId: string;
  professionalId: string;
  serviceId: string;
  customPrice?: number | null;
  customDurationMinutes?: number | null;
  active: boolean;
  sortOrder: number;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
  service?: Service;
}

export interface Appointment {
  id: string;
  clientId: string;
  professionalId: string;
  serviceId: string;
  scheduledAt: IsoDateTimeString;
  durationMinutes: number;
  status: AppointmentStatus;
  price: number;
  discount: number;
  totalAmount: number;
  notes?: string | null;
  checkinAt?: IsoDateTimeString | null;
  startedAt?: IsoDateTimeString | null;
  finishedAt?: IsoDateTimeString | null;
  tenantId: string;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
  client?: Client;
  professional?: Professional;
  service?: Service;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  PROFESSIONAL = 'PROFESSIONAL',
  CLIENT = 'CLIENT',
  RECEPTION = 'RECEPTION',
}

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CHECKED_IN = 'CHECKED_IN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface LoginForm {
  tenantSubdomain: string;
  email: string;
  password: string;
}

export interface AdminRegisterForm {
  organizationName: string;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface CreateAppointmentForm {
  clientId: string;
  professionalId: string;
  serviceId: string;
  scheduledAt: IsoDateTimeString;
  notes?: string;
}

export interface UpdateAppointmentForm extends Partial<CreateAppointmentForm> {
  status?: AppointmentStatus;
}

export interface CreateAppointmentDto {
  clientId: string;
  professionalId: string;
  serviceId: string;
  scheduledAt: IsoDateTimeString;
  durationMinutes: number;
  price?: number;
  discount?: number;
  notes?: string;
  status?: AppointmentStatus;
}

export interface UpdateAppointmentDto extends Partial<CreateAppointmentDto> {
  status?: AppointmentStatus;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: string | number;
  refreshExpiresIn?: string | number;
  user: User;
}

export interface SyncProfessionalServiceInput {
  serviceId: string;
  customPrice?: number | null;
  customDurationMinutes?: number | null;
  active?: boolean;
  sortOrder?: number;
}

export interface DashboardStats {
  activeAppointments: number;
  totalClients: number;
  projectedRevenue: number;
  averageTicket: number;
  upcomingAppointments: Appointment[];
}

export interface ReportsSummary {
  activeAppointments: number;
  projectedRevenue: number;
  totalClients: number;
  newClients: number;
  totalCompletedAppointments: number;
  monthlyCompletedAppointments: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageTicket: number;
}

export interface MonthlyMetricPoint {
  monthKey: string;
  label: string;
  revenue: number;
  appointments: number;
}

export interface TopServiceMetric {
  serviceId: string;
  name: string;
  count: number;
  percentage: number;
  revenue: number;
}

export interface ProfessionalPerformanceMetric {
  professionalId: string;
  name: string;
  appointments: number;
  revenue: number;
}

export interface ReportsOverview {
  summary: ReportsSummary;
  monthlyData: MonthlyMetricPoint[];
  topServices: TopServiceMetric[];
  professionalPerformance: ProfessionalPerformanceMetric[];
  topService: TopServiceMetric | null;
  upcomingAppointments: Appointment[];
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DateRangeFilter {
  startDate: IsoDateTimeString;
  endDate: IsoDateTimeString;
}

export interface AppointmentsFilter
  extends PaginationParams,
    Partial<DateRangeFilter> {
  status?: AppointmentStatus;
  professionalId?: string;
  clientId?: string;
}
