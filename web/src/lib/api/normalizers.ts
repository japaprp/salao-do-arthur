import {
  Appointment,
  AppointmentStatus,
  Client,
  MonthlyMetricPoint,
  Professional,
  ProfessionalPerformanceMetric,
  ProfessionalServiceAssignment,
  Product,
  ProductInventory,
  ReportsOverview,
  ReportsSummary,
  Service,
  TopServiceMetric,
  User,
  UserRole,
} from '@/types';

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null;

const toStringValue = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return fallback;
};

const toNullableStringValue = (value: unknown): string | null => {
  if (value == null) {
    return null;
  }

  return toStringValue(value);
};

const toNumberValue = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
};

const toBooleanValue = (value: unknown, fallback = false): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    if (value === 'true') {
      return true;
    }
    if (value === 'false') {
      return false;
    }
  }

  return fallback;
};

const toIsoDateTimeValue = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return '';
};

const toNullableIsoDateTimeValue = (value: unknown): string | null => {
  if (value == null) {
    return null;
  }

  return toIsoDateTimeValue(value);
};

const toEnumValue = <T extends string>(
  value: unknown,
  values: readonly T[],
  fallback: T,
): T => {
  if (typeof value === 'string' && values.includes(value as T)) {
    return value as T;
  }

  return fallback;
};

export const normalizeUser = (value: unknown): User => {
  const raw = isRecord(value) ? value : {};

  return {
    id: toStringValue(raw.id),
    email: toStringValue(raw.email),
    phone: toNullableStringValue(raw.phone),
    name: toStringValue(raw.name, 'Usuário da barbearia'),
    role: toEnumValue(raw.role, Object.values(UserRole), UserRole.OWNER),
    tenantId: toStringValue(raw.tenantId),
    createdAt: toIsoDateTimeValue(raw.createdAt),
    updatedAt: toIsoDateTimeValue(raw.updatedAt),
    deletedAt: toNullableIsoDateTimeValue(raw.deletedAt),
  };
};

export const normalizeProfessional = (value: unknown): Professional => {
  const raw = isRecord(value) ? value : {};

  return {
    id: toStringValue(raw.id),
    userId: toStringValue(raw.userId),
    tenantId: toStringValue(raw.tenantId),
    specialty: toNullableStringValue(raw.specialty),
    commissionPercent: toNumberValue(raw.commissionPercent),
    active: toBooleanValue(raw.active, true),
    createdAt: toIsoDateTimeValue(raw.createdAt),
    updatedAt: toIsoDateTimeValue(raw.updatedAt),
    user: isRecord(raw.user) ? normalizeUser(raw.user) : undefined,
    serviceLinks: Array.isArray(raw.services)
      ? raw.services
          .filter(isRecord)
          .map(link => normalizeProfessionalServiceAssignment(link))
      : [],
  };
};

export const normalizeProfessionalServiceAssignment = (
  value: unknown,
): ProfessionalServiceAssignment => {
  const raw = isRecord(value) ? value : {};

  return {
    id: toStringValue(raw.id),
    tenantId: toStringValue(raw.tenantId),
    professionalId: toStringValue(raw.professionalId),
    serviceId: toStringValue(raw.serviceId),
    customPrice:
      raw.customPrice == null || raw.customPrice === '' ? null : toNumberValue(raw.customPrice),
    customDurationMinutes:
      raw.customDurationMinutes == null || raw.customDurationMinutes === ''
        ? null
        : toNumberValue(raw.customDurationMinutes),
    active: toBooleanValue(raw.active, true),
    sortOrder: toNumberValue(raw.sortOrder),
    createdAt: toIsoDateTimeValue(raw.createdAt),
    updatedAt: toIsoDateTimeValue(raw.updatedAt),
    service: isRecord(raw.service) ? normalizeService(raw.service) : undefined,
  };
};

export const normalizeService = (value: unknown): Service => {
  const raw = isRecord(value) ? value : {};

  return {
    id: toStringValue(raw.id),
    tenantId: toStringValue(raw.tenantId),
    name: toStringValue(raw.name),
    description: toNullableStringValue(raw.description),
    durationMinutes: toNumberValue(raw.durationMinutes),
    price: toNumberValue(raw.price),
    bufferBeforeMinutes: toNumberValue(raw.bufferBeforeMinutes),
    bufferAfterMinutes: toNumberValue(raw.bufferAfterMinutes),
    parallelAllowed: toBooleanValue(raw.parallelAllowed),
    active: toBooleanValue(raw.active, true),
    createdAt: toIsoDateTimeValue(raw.createdAt),
    updatedAt: toIsoDateTimeValue(raw.updatedAt),
  };
};

export const normalizeProductInventory = (value: unknown): ProductInventory => {
  const raw = isRecord(value) ? value : {};

  return {
    id: toStringValue(raw.id),
    productId: toStringValue(raw.productId),
    availableQty: toNumberValue(raw.availableQty),
    reservedQty: toNumberValue(raw.reservedQty),
    reorderPoint: toNumberValue(raw.reorderPoint),
    safetyStock: toNumberValue(raw.safetyStock),
  };
};

export const normalizeProduct = (value: unknown): Product => {
  const raw = isRecord(value) ? value : {};

  return {
    id: toStringValue(raw.id),
    tenantId: toStringValue(raw.tenantId),
    categoryId: toNullableStringValue(raw.categoryId),
    name: toStringValue(raw.name),
    slug: toStringValue(raw.slug),
    sku: toNullableStringValue(raw.sku),
    description: toNullableStringValue(raw.description),
    shortDescription: toNullableStringValue(raw.shortDescription),
    price: toNumberValue(raw.price),
    compareAtPrice:
      raw.compareAtPrice == null || raw.compareAtPrice === ''
        ? null
        : toNumberValue(raw.compareAtPrice),
    featured: toBooleanValue(raw.featured),
    active: toBooleanValue(raw.active, true),
    shippable: toBooleanValue(raw.shippable, true),
    trackInventory: toBooleanValue(raw.trackInventory, true),
    inventory: isRecord(raw.inventory) ? normalizeProductInventory(raw.inventory) : null,
    createdAt: toIsoDateTimeValue(raw.createdAt),
    updatedAt: toIsoDateTimeValue(raw.updatedAt),
  };
};

export const normalizeClient = (value: unknown): Client => {
  const raw = isRecord(value) ? value : {};

  return {
    id: toStringValue(raw.id),
    userId: toStringValue(raw.userId),
    tenantId: toStringValue(raw.tenantId),
    loyaltyPoints: toNumberValue(raw.loyaltyPoints),
    loyaltyLevel: toNullableStringValue(raw.loyaltyLevel) ?? 'BRONZE',
    lifetimeValue: toNumberValue(raw.lifetimeValue),
    loyaltyWallet: isRecord(raw.loyaltyWallet)
      ? {
          id: toStringValue(raw.loyaltyWallet.id),
          pointsBalance: toNumberValue(raw.loyaltyWallet.pointsBalance),
          cashbackBalance: toNumberValue(raw.loyaltyWallet.cashbackBalance),
          currentLevel: toStringValue(raw.loyaltyWallet.currentLevel || raw.loyaltyLevel),
        }
      : null,
    favoriteProfessionalId: toNullableStringValue(raw.favoriteProfessionalId),
    preferences: isRecord(raw.preferences) ? raw.preferences : null,
    createdAt: toIsoDateTimeValue(raw.createdAt),
    updatedAt: toIsoDateTimeValue(raw.updatedAt),
    user: isRecord(raw.user) ? normalizeUser(raw.user) : undefined,
    favoriteProfessional: isRecord(raw.favoriteProfessional)
      ? normalizeProfessional(raw.favoriteProfessional)
      : null,
  };
};

export const normalizeAppointment = (value: unknown): Appointment => {
  const raw = isRecord(value) ? value : {};

  return {
    id: toStringValue(raw.id),
    clientId: toStringValue(raw.clientId),
    professionalId: toStringValue(raw.professionalId),
    serviceId: toStringValue(raw.serviceId),
    scheduledAt: toIsoDateTimeValue(raw.scheduledAt),
    durationMinutes: toNumberValue(raw.durationMinutes),
    status: toEnumValue(
      raw.status,
      Object.values(AppointmentStatus),
      AppointmentStatus.SCHEDULED,
    ),
    price: toNumberValue(raw.price),
    discount: toNumberValue(raw.discount),
    totalAmount: toNumberValue(raw.totalAmount),
    notes: toNullableStringValue(raw.notes),
    checkinAt: toNullableIsoDateTimeValue(raw.checkinAt),
    startedAt: toNullableIsoDateTimeValue(raw.startedAt),
    finishedAt: toNullableIsoDateTimeValue(raw.finishedAt),
    tenantId: toStringValue(raw.tenantId),
    createdAt: toIsoDateTimeValue(raw.createdAt),
    updatedAt: toIsoDateTimeValue(raw.updatedAt),
    client: isRecord(raw.client) ? normalizeClient(raw.client) : undefined,
    professional: isRecord(raw.professional)
      ? normalizeProfessional(raw.professional)
      : undefined,
    service: isRecord(raw.service) ? normalizeService(raw.service) : undefined,
  };
};

export const normalizeReportsSummary = (value: unknown): ReportsSummary => {
  const raw = isRecord(value) ? value : {};

  return {
    activeAppointments: toNumberValue(raw.activeAppointments),
    projectedRevenue: toNumberValue(raw.projectedRevenue),
    totalClients: toNumberValue(raw.totalClients),
    newClients: toNumberValue(raw.newClients),
    totalCompletedAppointments: toNumberValue(raw.totalCompletedAppointments),
    monthlyCompletedAppointments: toNumberValue(raw.monthlyCompletedAppointments),
    totalRevenue: toNumberValue(raw.totalRevenue),
    monthlyRevenue: toNumberValue(raw.monthlyRevenue),
    averageTicket: toNumberValue(raw.averageTicket),
  };
};

export const normalizeMonthlyMetricPoint = (value: unknown): MonthlyMetricPoint => {
  const raw = isRecord(value) ? value : {};

  return {
    monthKey: toStringValue(raw.monthKey),
    label: toStringValue(raw.label),
    revenue: toNumberValue(raw.revenue),
    appointments: toNumberValue(raw.appointments),
  };
};

export const normalizeTopServiceMetric = (value: unknown): TopServiceMetric => {
  const raw = isRecord(value) ? value : {};

  return {
    serviceId: toStringValue(raw.serviceId),
    name: toStringValue(raw.name, 'Serviço'),
    count: toNumberValue(raw.count),
    percentage: toNumberValue(raw.percentage),
    revenue: toNumberValue(raw.revenue),
  };
};

export const normalizeProfessionalPerformanceMetric = (
  value: unknown,
): ProfessionalPerformanceMetric => {
  const raw = isRecord(value) ? value : {};

  return {
    professionalId: toStringValue(raw.professionalId),
    name: toStringValue(raw.name, 'Profissional'),
    appointments: toNumberValue(raw.appointments),
    revenue: toNumberValue(raw.revenue),
  };
};

export const normalizeReportsOverview = (value: unknown): ReportsOverview => {
  const raw = isRecord(value) ? value : {};

  return {
    summary: normalizeReportsSummary(raw.summary),
    monthlyData: Array.isArray(raw.monthlyData)
      ? raw.monthlyData.filter(isRecord).map(point => normalizeMonthlyMetricPoint(point))
      : [],
    topServices: Array.isArray(raw.topServices)
      ? raw.topServices.filter(isRecord).map(metric => normalizeTopServiceMetric(metric))
      : [],
    professionalPerformance: Array.isArray(raw.professionalPerformance)
      ? raw.professionalPerformance
          .filter(isRecord)
          .map(metric => normalizeProfessionalPerformanceMetric(metric))
      : [],
    topService: isRecord(raw.topService) ? normalizeTopServiceMetric(raw.topService) : null,
    upcomingAppointments: Array.isArray(raw.upcomingAppointments)
      ? raw.upcomingAppointments
          .filter(isRecord)
          .map(appointment => normalizeAppointment(appointment))
      : [],
  };
};
