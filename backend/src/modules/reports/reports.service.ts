import { Injectable } from '@nestjs/common';
import { AppointmentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const ACTIVE_APPOINTMENT_STATUSES = [
  AppointmentStatus.SCHEDULED,
  AppointmentStatus.CHECKED_IN,
  AppointmentStatus.IN_PROGRESS,
] as const;

const appointmentCardInclude = Prisma.validator<Prisma.AppointmentDefaultArgs>()({
  include: {
    client: {
      include: {
        user: true,
      },
    },
    professional: {
      include: {
        user: true,
      },
    },
    service: true,
  },
});

type AppointmentCard = Prisma.AppointmentGetPayload<typeof appointmentCardInclude>;

type MonthlyMetricPoint = {
  monthKey: string;
  label: string;
  revenue: number;
  appointments: number;
};

type TopServiceMetric = {
  serviceId: string;
  name: string;
  count: number;
  percentage: number;
  revenue: number;
};

type ProfessionalPerformanceMetric = {
  professionalId: string;
  name: string;
  appointments: number;
  revenue: number;
};

type ReportsOverview = {
  summary: {
    activeAppointments: number;
    projectedRevenue: number;
    totalClients: number;
    newClients: number;
    totalCompletedAppointments: number;
    monthlyCompletedAppointments: number;
    totalRevenue: number;
    monthlyRevenue: number;
    averageTicket: number;
  };
  monthlyData: MonthlyMetricPoint[];
  topServices: TopServiceMetric[];
  professionalPerformance: ProfessionalPerformanceMetric[];
  topService: TopServiceMetric | null;
  upcomingAppointments: AppointmentCard[];
};

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(tenantId: string): Promise<ReportsOverview> {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const nextMonthStart = addMonths(monthStart, 1);
    const monthlySeriesStart = addMonths(monthStart, -3);
    const rankingStart = startOfDay(subtractDays(now, 89));

    return this.prisma.withTenant(tenantId, async transaction => {
      const [
        activeAppointments,
        projectedRevenueAggregate,
        totalClients,
        newClients,
        totalCompletedAppointments,
        monthlyCompletedAppointments,
        totalRevenueAggregate,
        monthlyRevenueAggregate,
        upcomingAppointments,
        monthlySeriesAppointments,
        rankingAppointments,
      ] = await Promise.all([
        transaction.appointment.count({
          where: {
            tenantId,
            status: {
              in: [...ACTIVE_APPOINTMENT_STATUSES],
            },
          },
        }),
        transaction.appointment.aggregate({
          where: {
            tenantId,
            status: {
              in: [...ACTIVE_APPOINTMENT_STATUSES],
            },
          },
          _sum: {
            totalAmount: true,
          },
        }),
        transaction.client.count({
          where: {
            tenantId,
          },
        }),
        transaction.client.count({
          where: {
            tenantId,
            createdAt: {
              gte: monthStart,
              lt: nextMonthStart,
            },
          },
        }),
        transaction.appointment.count({
          where: {
            tenantId,
            status: AppointmentStatus.COMPLETED,
          },
        }),
        transaction.appointment.count({
          where: {
            tenantId,
            status: AppointmentStatus.COMPLETED,
            scheduledAt: {
              gte: monthStart,
              lt: nextMonthStart,
            },
          },
        }),
        transaction.appointment.aggregate({
          where: {
            tenantId,
            status: AppointmentStatus.COMPLETED,
          },
          _sum: {
            totalAmount: true,
          },
        }),
        transaction.appointment.aggregate({
          where: {
            tenantId,
            status: AppointmentStatus.COMPLETED,
            scheduledAt: {
              gte: monthStart,
              lt: nextMonthStart,
            },
          },
          _sum: {
            totalAmount: true,
          },
        }),
        transaction.appointment.findMany({
          where: {
            tenantId,
            status: {
              in: [...ACTIVE_APPOINTMENT_STATUSES],
            },
            scheduledAt: {
              gte: now,
            },
          },
          include: appointmentCardInclude.include,
          orderBy: {
            scheduledAt: 'asc',
          },
          take: 5,
        }),
        transaction.appointment.findMany({
          where: {
            tenantId,
            status: AppointmentStatus.COMPLETED,
            scheduledAt: {
              gte: monthlySeriesStart,
              lt: nextMonthStart,
            },
          },
          select: {
            scheduledAt: true,
            totalAmount: true,
          },
        }),
        transaction.appointment.findMany({
          where: {
            tenantId,
            status: AppointmentStatus.COMPLETED,
            scheduledAt: {
              gte: rankingStart,
              lte: now,
            },
          },
          include: {
            service: true,
            professional: {
              include: {
                user: true,
              },
            },
          },
        }),
      ]);

      const totalRevenue = decimalToNumber(totalRevenueAggregate._sum.totalAmount);
      const monthlyRevenue = decimalToNumber(monthlyRevenueAggregate._sum.totalAmount);
      const projectedRevenue = decimalToNumber(projectedRevenueAggregate._sum.totalAmount);
      const averageTicket =
        monthlyCompletedAppointments > 0 ? monthlyRevenue / monthlyCompletedAppointments : 0;
      const monthlyData = buildMonthlyData(monthlySeriesAppointments, monthlySeriesStart, 4);
      const topServices = buildTopServices(rankingAppointments);
      const professionalPerformance = buildProfessionalPerformance(rankingAppointments);

      return {
        summary: {
          activeAppointments,
          projectedRevenue,
          totalClients,
          newClients,
          totalCompletedAppointments,
          monthlyCompletedAppointments,
          totalRevenue,
          monthlyRevenue,
          averageTicket,
        },
        monthlyData,
        topServices,
        professionalPerformance,
        topService: topServices[0] ?? null,
        upcomingAppointments,
      };
    });
  }
}

function buildMonthlyData(
  appointments: Array<{ scheduledAt: Date; totalAmount: Prisma.Decimal | number | string | null }>,
  startMonth: Date,
  totalMonths: number,
): MonthlyMetricPoint[] {
  const buckets = new Map<string, MonthlyMetricPoint>();

  for (let monthOffset = 0; monthOffset < totalMonths; monthOffset += 1) {
    const currentMonth = addMonths(startMonth, monthOffset);
    const monthKey = getMonthKey(currentMonth);

    buckets.set(monthKey, {
      monthKey,
      label: formatMonthLabel(currentMonth),
      revenue: 0,
      appointments: 0,
    });
  }

  for (const appointment of appointments) {
    const monthKey = getMonthKey(appointment.scheduledAt);
    const bucket = buckets.get(monthKey);
    if (!bucket) {
      continue;
    }

    bucket.appointments += 1;
    bucket.revenue += decimalToNumber(appointment.totalAmount);
  }

  return Array.from(buckets.values());
}

function buildTopServices(
  appointments: Array<{
    serviceId: string;
    totalAmount: Prisma.Decimal | number | string;
    service: {
      name: string;
    };
  }>,
): TopServiceMetric[] {
  const totalsByService = new Map<string, TopServiceMetric>();

  for (const appointment of appointments) {
    const currentMetric = totalsByService.get(appointment.serviceId) ?? {
      serviceId: appointment.serviceId,
      name: appointment.service.name,
      count: 0,
      percentage: 0,
      revenue: 0,
    };

    currentMetric.count += 1;
    currentMetric.revenue += decimalToNumber(appointment.totalAmount);
    totalsByService.set(appointment.serviceId, currentMetric);
  }

  const totalAppointments = Array.from(totalsByService.values()).reduce(
    (sum, currentMetric) => sum + currentMetric.count,
    0,
  );

  return Array.from(totalsByService.values())
    .map(currentMetric => ({
      ...currentMetric,
      percentage:
        totalAppointments > 0
          ? Math.round((currentMetric.count / totalAppointments) * 100)
          : 0,
    }))
    .sort((left, right) => right.count - left.count || right.revenue - left.revenue)
    .slice(0, 4);
}

function buildProfessionalPerformance(
  appointments: Array<{
    professionalId: string;
    totalAmount: Prisma.Decimal | number | string;
    professional: {
      user: {
        name: string;
      };
    };
  }>,
): ProfessionalPerformanceMetric[] {
  const totalsByProfessional = new Map<string, ProfessionalPerformanceMetric>();

  for (const appointment of appointments) {
    const currentMetric = totalsByProfessional.get(appointment.professionalId) ?? {
      professionalId: appointment.professionalId,
      name: appointment.professional.user.name,
      appointments: 0,
      revenue: 0,
    };

    currentMetric.appointments += 1;
    currentMetric.revenue += decimalToNumber(appointment.totalAmount);
    totalsByProfessional.set(appointment.professionalId, currentMetric);
  }

  return Array.from(totalsByProfessional.values())
    .sort((left, right) => right.revenue - left.revenue || right.appointments - left.appointments)
    .slice(0, 4);
}

function decimalToNumber(value: Prisma.Decimal | number | string | null | undefined): number {
  if (value == null) {
    return 0;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return value.toNumber();
}

function startOfMonth(referenceDate: Date): Date {
  return new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1, 0, 0, 0, 0);
}

function addMonths(referenceDate: Date, months: number): Date {
  return new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth() + months,
    1,
    0,
    0,
    0,
    0,
  );
}

function subtractDays(referenceDate: Date, days: number): Date {
  return new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate() - days,
    referenceDate.getHours(),
    referenceDate.getMinutes(),
    referenceDate.getSeconds(),
    referenceDate.getMilliseconds(),
  );
}

function startOfDay(referenceDate: Date): Date {
  return new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
    0,
    0,
    0,
    0,
  );
}

function getMonthKey(referenceDate: Date): string {
  return `${referenceDate.getFullYear()}-${`${referenceDate.getMonth() + 1}`.padStart(2, '0')}`;
}

function formatMonthLabel(referenceDate: Date): string {
  const formatted = new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
  })
    .format(referenceDate)
    .replace('.', '');

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}
