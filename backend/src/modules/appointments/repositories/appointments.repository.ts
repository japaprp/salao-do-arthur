import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService, TenantPrismaClient } from '../../../prisma/prisma.service';
import { Appointment, AppointmentStatus, TimeOff } from '@prisma/client';
import { CreateAppointmentInput } from '../dto/create-appointment.dto';

type CreateAppointmentPayload = CreateAppointmentInput & {
  price: number;
  totalAmount: number;
};

type UpdateAppointmentPayload = Partial<{
  clientId: string;
  professionalId: string;
  serviceId: string;
  status: AppointmentStatus;
  scheduledAt: Date;
  durationMinutes: number;
  price: number;
  discount: number;
  totalAmount: number;
  notes: string;
  checkinAt: Date;
  startedAt: Date;
  finishedAt: Date;
}>;

type CreateTimeOffPayload = {
  tenantId: string;
  professionalId?: string;
  title: string;
  reason?: string;
  startAt: Date;
  endAt: Date;
};

const appointmentInclude = {
  client: { include: { user: true } },
  professional: { include: { user: true } },
  service: true,
} as const;

@Injectable()
export class AppointmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(createAppointmentDto: CreateAppointmentPayload): Promise<Appointment> {
    return this.prisma.withTenant(createAppointmentDto.tenantId, async transaction => {
      await this.assertScheduleAvailable(transaction, createAppointmentDto);
      return transaction.appointment.create({
        data: {
          tenantId: createAppointmentDto.tenantId,
          clientId: createAppointmentDto.clientId,
          professionalId: createAppointmentDto.professionalId,
          serviceId: createAppointmentDto.serviceId,
          status: createAppointmentDto.status ?? AppointmentStatus.SCHEDULED,
          scheduledAt: createAppointmentDto.scheduledAt,
          durationMinutes: createAppointmentDto.durationMinutes,
          price: createAppointmentDto.price,
          discount: createAppointmentDto.discount ?? 0,
          totalAmount: createAppointmentDto.totalAmount,
          notes: createAppointmentDto.notes,
        },
        include: appointmentInclude,
      });
    });
  }

  async findAllByTenant(tenantId: string): Promise<Appointment[]> {
    return this.prisma.withTenant(tenantId, transaction =>
      transaction.appointment.findMany({
        where: { tenantId },
        include: appointmentInclude,
        orderBy: { scheduledAt: 'desc' },
      }),
    );
  }

  async findByIdAndTenant(id: string, tenantId: string): Promise<Appointment | null> {
    return this.prisma.withTenant(tenantId, transaction =>
      transaction.appointment.findFirst({
        where: { id, tenantId },
        include: appointmentInclude,
      }),
    );
  }

  async findByProfessionalAndDateRange(
    professionalId: string,
    startDate: Date,
    endDate: Date,
    tenantId: string,
  ): Promise<Appointment[]> {
    return this.prisma.withTenant(tenantId, transaction =>
      transaction.appointment.findMany({
        where: {
          professionalId,
          tenantId,
          scheduledAt: {
            gte: startDate,
            lte: endDate,
          },
          status: {
            notIn: [AppointmentStatus.CANCELLED],
          },
        },
        include: {
          client: { include: { user: true } },
          service: true,
        },
        orderBy: { scheduledAt: 'asc' },
      }),
    );
  }

  async findByClientAndTenant(clientId: string, tenantId: string): Promise<Appointment[]> {
    return this.prisma.withTenant(tenantId, transaction =>
      transaction.appointment.findMany({
        where: { clientId, tenantId },
        include: {
          professional: { include: { user: true } },
          service: true,
        },
        orderBy: { scheduledAt: 'desc' },
      }),
    );
  }

  private async assertScheduleAvailable(
    transaction: TenantPrismaClient,
    schedule: Pick<Appointment, 'tenantId' | 'professionalId' | 'scheduledAt' | 'durationMinutes'>,
    excludeId = '',
  ): Promise<void> {
    const { tenantId, professionalId, scheduledAt, durationMinutes } = schedule;
    const professionals = await transaction.$queryRaw<{ id: string }[]>`
      SELECT id FROM Professional
      WHERE id = ${professionalId} AND tenantId = ${tenantId} AND deletedAt IS NULL
      FOR UPDATE
    `;
    if (professionals.length === 0) {
      throw new NotFoundException('Profissional não encontrado.');
    }

    const endAt = new Date(scheduledAt.getTime() + durationMinutes * 60_000);
    const conflicts = await transaction.$queryRaw<{ id: string }[]>`
      SELECT id FROM Appointment
      WHERE tenantId = ${tenantId} AND professionalId = ${professionalId}
        AND deletedAt IS NULL AND status <> ${AppointmentStatus.CANCELLED} AND id <> ${excludeId}
        AND scheduledAt < ${endAt}
        AND TIMESTAMPADD(MINUTE, durationMinutes, scheduledAt) > ${scheduledAt}
      LIMIT 1
    `;
    if (conflicts.length > 0) {
      throw new ConflictException('Horário não disponível para este profissional.');
    }
  }

  async update(
    id: string,
    tenantId: string,
    updateAppointmentDto: UpdateAppointmentPayload,
  ): Promise<Appointment> {
    return this.prisma.withTenant(tenantId, async transaction => {
      const appointments = await transaction.$queryRaw<
        Pick<Appointment, 'professionalId' | 'scheduledAt' | 'durationMinutes' | 'status'>[]
      >`
        SELECT professionalId, scheduledAt, durationMinutes, status FROM Appointment
        WHERE id = ${id} AND tenantId = ${tenantId} AND deletedAt IS NULL
        FOR UPDATE
      `;
      const [current] = appointments;
      if (!current) {
        throw new NotFoundException('Agendamento não encontrado.');
      }

      if ((updateAppointmentDto.status ?? current.status) !== AppointmentStatus.CANCELLED
          && (updateAppointmentDto.professionalId != null
              || updateAppointmentDto.scheduledAt != null
              || updateAppointmentDto.durationMinutes != null
              || current.status === AppointmentStatus.CANCELLED)) {
        await this.assertScheduleAvailable(transaction, {
          tenantId,
          professionalId: updateAppointmentDto.professionalId ?? current.professionalId,
          scheduledAt: updateAppointmentDto.scheduledAt ?? current.scheduledAt,
          durationMinutes: updateAppointmentDto.durationMinutes ?? current.durationMinutes,
        }, id);
      }

      return transaction.appointment.update({
        where: { id },
        data: updateAppointmentDto,
        include: appointmentInclude,
      });
    });
  }

  async updateStatus(
    id: string,
    tenantId: string,
    status: AppointmentStatus,
  ): Promise<Appointment> {
    return this.prisma.withTenant(tenantId, async transaction => {
      await transaction.appointment.findFirstOrThrow({
        where: { id, tenantId },
        select: { id: true },
      });

      return transaction.appointment.update({
        where: { id },
        data: { status },
        include: appointmentInclude,
      });
    });
  }

  async remove(id: string, tenantId: string): Promise<Appointment> {
    return this.prisma.withTenant(tenantId, async transaction => {
      await transaction.appointment.findFirstOrThrow({
        where: { id, tenantId },
        select: { id: true },
      });

      return transaction.appointment.update({
        where: { id },
        data: { status: AppointmentStatus.CANCELLED },
        include: appointmentInclude,
      });
    });
  }

  async findAllByTenantPaginated(
    tenantId: string,
    offset: number,
    limit: number,
  ): Promise<Appointment[]> {
    return this.prisma.withTenant(tenantId, transaction =>
      transaction.appointment.findMany({
        where: { tenantId },
        include: appointmentInclude,
        orderBy: { scheduledAt: 'desc' },
        skip: offset,
        take: limit,
      }),
    );
  }

  async countByTenant(tenantId: string): Promise<number> {
    return this.prisma.withTenant(tenantId, transaction =>
      transaction.appointment.count({ where: { tenantId } }),
    );
  }

  async findByClientAndTenantPaginated(
    clientId: string,
    tenantId: string,
    offset: number,
    limit: number,
  ): Promise<Appointment[]> {
    return this.prisma.withTenant(tenantId, transaction =>
      transaction.appointment.findMany({
        where: { clientId, tenantId },
        include: {
          professional: { include: { user: true } },
          service: true,
        },
        orderBy: { scheduledAt: 'desc' },
        skip: offset,
        take: limit,
      }),
    );
  }

  async countByClientAndTenant(clientId: string, tenantId: string): Promise<number> {
    return this.prisma.withTenant(tenantId, transaction =>
      transaction.appointment.count({ where: { clientId, tenantId } }),
    );
  }

  async createTimeOff(payload: CreateTimeOffPayload): Promise<TimeOff> {
    return this.prisma.withTenant(payload.tenantId, transaction =>
      transaction.timeOff.create({
        data: {
          tenantId: payload.tenantId,
          professionalId: payload.professionalId,
          title: payload.title,
          reason: payload.reason,
          startAt: payload.startAt,
          endAt: payload.endAt,
        },
      }),
    );
  }

  async findTimeOffsByProfessionalAndDateRange(
    professionalId: string,
    startDate: Date,
    endDate: Date,
    tenantId: string,
  ): Promise<TimeOff[]> {
    return this.prisma.withTenant(tenantId, transaction =>
      transaction.timeOff.findMany({
        where: {
          tenantId,
          OR: [{ professionalId }, { professionalId: null }],
          startAt: { lt: endDate },
          endAt: { gt: startDate },
          deletedAt: null,
        },
        orderBy: { startAt: 'asc' },
      }),
    );
  }

  async findTimeOffsByTenant(tenantId: string): Promise<TimeOff[]> {
    return this.prisma.withTenant(tenantId, transaction =>
      transaction.timeOff.findMany({
        where: { tenantId, deletedAt: null },
        orderBy: { startAt: 'desc' },
      }),
    );
  }

  async removeTimeOff(id: string, tenantId: string): Promise<TimeOff> {
    return this.prisma.withTenant(tenantId, async transaction => {
      const timeOff = await transaction.timeOff.findFirst({
        where: { id, tenantId, deletedAt: null },
        select: { id: true },
      });
      if (!timeOff) {
        throw new NotFoundException('Bloqueio de agenda não encontrado.');
      }

      return transaction.timeOff.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    });
  }
}
