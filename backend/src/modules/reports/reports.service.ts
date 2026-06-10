import { Injectable } from '@nestjs/common';
import { AppointmentStatus, OrderStatus, Prisma } from '@prisma/client';
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

type TopProductMetric = {
  productId: string;
  name: string;
  quantity: number;
  revenue: number;
};

type RecurringClientMetric = {
  clientId: string;
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
    returnRate: number;
  };
  monthlyData: MonthlyMetricPoint[];
  topServices: TopServiceMetric[];
  professionalPerformance: ProfessionalPerformanceMetric[];
  topProducts: TopProductMetric[];
  recurringClients: RecurringClientMetric[];
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
        rankingOrderItems,
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
            client: {
              include: {
                user: true,
              },
            },
            service: true,
            professional: {
              include: {
                user: true,
              },
            },
          },
        }),
        transaction.orderItem.findMany({
          where: {
            tenantId,
            order: {
              status: {
                in: [
                  OrderStatus.PAID,
                  OrderStatus.PREPARING,
                  OrderStatus.READY_FOR_PICKUP,
                  OrderStatus.SHIPPED,
                  OrderStatus.DELIVERED,
                ],
              },
              paidAt: {
                gte: rankingStart,
                lte: now,
              },
              deletedAt: null,
            },
          },
          include: {
            order: true,
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
      const topProducts = buildTopProducts(rankingOrderItems);
      const recurringClients = buildRecurringClients(rankingAppointments);
      const returnRate = buildReturnRate(rankingAppointments);

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
          returnRate,
        },
        monthlyData,
        topServices,
        professionalPerformance,
        topProducts,
        recurringClients,
        topService: topServices[0] ?? null,
        upcomingAppointments,
      };
    });
  }

  async exportOverview(tenantId: string, format: 'excel' | 'pdf') {
    const overview = await this.getOverview(tenantId);

    if (format === 'pdf') {
      return {
        contentType: 'application/pdf',
        filename: 'relatorio-barbearia-do-artur.pdf',
        body: buildSimplePdf([
          'Relatorio - Barbearia do Artur',
          `Receita total: ${formatMoney(overview.summary.totalRevenue)}`,
          `Receita do mes: ${formatMoney(overview.summary.monthlyRevenue)}`,
          `Ticket medio: ${formatMoney(overview.summary.averageTicket)}`,
          `Taxa de retorno: ${overview.summary.returnRate}%`,
          `Servico lider: ${overview.topService?.name ?? 'Sem dados'}`,
        ]),
      };
    }

    return {
      contentType: 'application/vnd.ms-excel; charset=utf-8',
      filename: 'relatorio-barbearia-do-artur.xls',
      body: buildExcelTable(overview),
    };
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

function buildTopProducts(
  items: Array<{
    productId: string | null;
    productName: string;
    quantity: number;
    totalAmount: Prisma.Decimal | number | string;
  }>,
): TopProductMetric[] {
  const totalsByProduct = new Map<string, TopProductMetric>();

  for (const item of items) {
    const productId = item.productId ?? item.productName;
    const currentMetric = totalsByProduct.get(productId) ?? {
      productId,
      name: item.productName,
      quantity: 0,
      revenue: 0,
    };

    currentMetric.quantity += item.quantity;
    currentMetric.revenue += decimalToNumber(item.totalAmount);
    totalsByProduct.set(productId, currentMetric);
  }

  return Array.from(totalsByProduct.values())
    .sort((left, right) => right.quantity - left.quantity || right.revenue - left.revenue)
    .slice(0, 5);
}

function buildRecurringClients(
  appointments: Array<{
    clientId: string;
    totalAmount: Prisma.Decimal | number | string;
    client?: { user?: { name: string } | null } | null;
  }>,
): RecurringClientMetric[] {
  const totalsByClient = new Map<string, RecurringClientMetric>();

  for (const appointment of appointments) {
    const currentMetric = totalsByClient.get(appointment.clientId) ?? {
      clientId: appointment.clientId,
      name: appointment.client?.user?.name ?? 'Cliente',
      appointments: 0,
      revenue: 0,
    };

    currentMetric.appointments += 1;
    currentMetric.revenue += decimalToNumber(appointment.totalAmount);
    totalsByClient.set(appointment.clientId, currentMetric);
  }

  return Array.from(totalsByClient.values())
    .filter(client => client.appointments >= 2)
    .sort((left, right) => right.appointments - left.appointments || right.revenue - left.revenue)
    .slice(0, 5);
}

function buildReturnRate(appointments: Array<{ clientId: string }>): number {
  const visitsByClient = new Map<string, number>();

  for (const appointment of appointments) {
    visitsByClient.set(appointment.clientId, (visitsByClient.get(appointment.clientId) ?? 0) + 1);
  }

  const totalReturningBase = visitsByClient.size;
  if (totalReturningBase === 0) {
    return 0;
  }

  const returningClients = Array.from(visitsByClient.values()).filter(total => total >= 2).length;
  return Math.round((returningClients / totalReturningBase) * 100);
}

function buildExcelTable(overview: ReportsOverview): string {
  const rows = [
    ['Metrica', 'Valor'],
    ['Receita total', overview.summary.totalRevenue],
    ['Receita mensal', overview.summary.monthlyRevenue],
    ['Ticket medio', overview.summary.averageTicket],
    ['Taxa de retorno', `${overview.summary.returnRate}%`],
    [],
    ['Servicos mais vendidos', 'Atendimentos', 'Receita'],
    ...overview.topServices.map(service => [service.name, service.count, service.revenue]),
    [],
    ['Produtos mais vendidos', 'Quantidade', 'Receita'],
    ...overview.topProducts.map(product => [product.name, product.quantity, product.revenue]),
    [],
    ['Clientes recorrentes', 'Atendimentos', 'Receita'],
    ...overview.recurringClients.map(client => [client.name, client.appointments, client.revenue]),
  ];

  return rows.map(row => row.map(value => String(value ?? '')).join('\t')).join('\n');
}

function buildSimplePdf(lines: string[]): Buffer {
  const content = lines
    .map((line, index) => `BT /F1 12 Tf 50 ${760 - index * 22} Td (${escapePdfText(line)}) Tj ET`)
    .join('\n');
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    `5 0 obj << /Length ${Buffer.byteLength(content)} >> stream\n${content}\nendstream endobj`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${object}\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets
    .slice(1)
    .map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`)
    .join('');
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf);
}

function escapePdfText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function formatMoney(value: number): string {
  return `R$ ${value.toFixed(2)}`;
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
