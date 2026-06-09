import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { AppointmentsRepository } from './repositories/appointments.repository';
import { ClientsService } from '../clients/clients.service';
import { ProfessionalsService } from '../professionals/professionals.service';
import { ServicesService } from '../services/services.service';
import { CreateAppointmentInput } from './dto/create-appointment.dto';
import { CreateSelfAppointmentDto } from './dto/create-self-appointment.dto';
import { CreateTimeOffDto } from './dto/create-time-off.dto';
import { GetAvailableSlotsDto } from './dto/get-available-slots.dto';
import { MessageClientDto } from './dto/message-client.dto';
import { OfferEarlierSlotDto } from './dto/offer-earlier-slot.dto';
import { RescheduleSelfAppointmentDto } from './dto/reschedule-self-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { PaginationDto, PaginatedResponse } from '../../common/dtos/pagination.dto';
import { Appointment, AppointmentStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

const BUSINESS_DAY_START_MINUTES = 9 * 60;
const BUSINESS_DAY_END_MINUTES = 19 * 60;
const SLOT_STEP_MINUTES = 30;
const CLIENT_FREE_CANCEL_WINDOW_MINUTES = 60;
const LATE_CANCELLATION_MIN_FEE = 20;
const LATE_CANCELLATION_PERCENT = 0.3;

type BusyAppointmentWindow = {
  id: string;
  scheduledAt: Date;
  durationMinutes: number;
};

type AvailableAppointmentSlot = {
  startAt: string;
  endAt: string;
  label: string;
};

type AppointmentWithRelations = {
  client?: { user?: { name?: string | null } | null } | null;
  service?: { name?: string | null } | null;
};

type AppointmentUpdatePayload = Parameters<AppointmentsRepository['update']>[2];

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly clientsService: ClientsService,
    private readonly professionalsService: ProfessionalsService,
    private readonly servicesService: ServicesService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(createAppointmentDto: CreateAppointmentInput) {
    const scheduledAt = this.normalizeScheduledAt(createAppointmentDto.scheduledAt);

    // Validar se cliente existe no tenant
    await this.clientsService.findByIdAndTenant(
      createAppointmentDto.clientId,
      createAppointmentDto.tenantId,
    );

    // Validar se profissional existe no tenant
    await this.professionalsService.findByIdAndTenant(
      createAppointmentDto.professionalId,
      createAppointmentDto.tenantId,
    );

    // Validar se serviço existe no tenant
    const service = await this.servicesService.findByIdAndTenant(
      createAppointmentDto.serviceId,
      createAppointmentDto.tenantId,
    );

    // Verificar disponibilidade
    const isAvailable = await this.isProfessionalAvailable(
      createAppointmentDto.professionalId,
      scheduledAt,
      createAppointmentDto.durationMinutes,
      createAppointmentDto.tenantId,
    );

    if (!isAvailable) {
      throw new ConflictException('Horário não disponível para este profissional.');
    }

    // Calcular valores se não foram fornecidos
    const servicePrice = Number(service.price);
    const price = createAppointmentDto.price ?? servicePrice;
    const totalAmount = price - (createAppointmentDto.discount ?? 0);

    const appointment = await this.appointmentsRepository.create({
      ...createAppointmentDto,
      scheduledAt,
      price,
      totalAmount,
    });
    await this.notifyAppointmentClient(
      appointment.id,
      createAppointmentDto.tenantId,
      'Agendamento criado',
      'Seu agendamento foi criado na Barbearia do Artur.',
    );
    await this.scheduleAppointmentReminders(appointment.id, createAppointmentDto.tenantId);
    return appointment;
  }

  async findAllByTenant(tenantId: string) {
    return this.appointmentsRepository.findAllByTenant(tenantId);
  }

  async findByIdAndTenant(id: string, tenantId: string) {
    const appointment = await this.appointmentsRepository.findByIdAndTenant(id, tenantId);
    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado.');
    }
    return appointment;
  }

  async findByProfessionalAndDateRange(
    professionalId: string,
    startDate: Date,
    endDate: Date,
    tenantId: string,
  ) {
    // Verificar se profissional existe no tenant
    await this.professionalsService.findByIdAndTenant(professionalId, tenantId);

    return this.appointmentsRepository.findByProfessionalAndDateRange(
      professionalId,
      startDate,
      endDate,
      tenantId,
    );
  }

  async findByClientAndTenant(clientId: string, tenantId: string) {
    // Verificar se cliente existe no tenant
    await this.clientsService.findByIdAndTenant(clientId, tenantId);

    return this.appointmentsRepository.findByClientAndTenant(clientId, tenantId);
  }

  async findMine(userId: string, tenantId: string) {
    const client = await this.clientsService.findByUserIdAndTenant(userId, tenantId);
    return this.appointmentsRepository.findByClientAndTenant(client.id, tenantId);
  }

  async findAllByTenantPaginated(
    tenantId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponse<Appointment>> {
    const [data, total] = await Promise.all([
      this.appointmentsRepository.findAllByTenantPaginated(
        tenantId,
        pagination.offset,
        pagination.limit,
      ),
      this.appointmentsRepository.countByTenant(tenantId),
    ]);

    return {
      data,
      total,
      offset: pagination.offset,
      limit: pagination.limit,
      hasMore: pagination.offset + pagination.limit < total,
    };
  }

  async findByClientAndTenantPaginated(
    clientId: string,
    tenantId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponse<Appointment>> {
    // Verificar se cliente existe no tenant
    await this.clientsService.findByIdAndTenant(clientId, tenantId);

    const [data, total] = await Promise.all([
      this.appointmentsRepository.findByClientAndTenantPaginated(
        clientId,
        tenantId,
        pagination.offset,
        pagination.limit,
      ),
      this.appointmentsRepository.countByClientAndTenant(clientId, tenantId),
    ]);

    return {
      data,
      total,
      offset: pagination.offset,
      limit: pagination.limit,
      hasMore: pagination.offset + pagination.limit < total,
    };
  }

  async getAvailableSlots(query: GetAvailableSlotsDto, tenantId: string) {
    await this.professionalsService.findByIdAndTenant(query.professionalId, tenantId);
    const service = await this.servicesService.findByIdAndTenant(query.serviceId, tenantId);
    const selectedDate = this.normalizeDateOnly(query.date);
    const busyAppointments = await this.loadBusyAppointmentsForDay(
      query.professionalId,
      selectedDate,
      tenantId,
    );

    return this.buildAvailableSlots(selectedDate, service.durationMinutes, busyAppointments);
  }

  async bookForAuthenticatedClient(
    userId: string,
    tenantId: string,
    createSelfAppointmentDto: CreateSelfAppointmentDto,
  ) {
    const client = await this.clientsService.findByUserIdAndTenant(userId, tenantId);
    const service = await this.servicesService.findByIdAndTenant(
      createSelfAppointmentDto.serviceId,
      tenantId,
    );
    const scheduledAt = this.normalizeScheduledAt(createSelfAppointmentDto.scheduledAt);
    const durationMinutes = service.durationMinutes;
    const price = Number(service.price);

    await this.professionalsService.findByIdAndTenant(
      createSelfAppointmentDto.professionalId,
      tenantId,
    );

    const isAvailable = await this.isProfessionalAvailable(
      createSelfAppointmentDto.professionalId,
      scheduledAt,
      durationMinutes,
      tenantId,
    );

    if (!isAvailable) {
      throw new ConflictException('Horário não disponível para este profissional.');
    }

    const appointment = await this.appointmentsRepository.create({
      tenantId,
      clientId: client.id,
      professionalId: createSelfAppointmentDto.professionalId,
      serviceId: createSelfAppointmentDto.serviceId,
      scheduledAt,
      durationMinutes,
      price,
      totalAmount: price,
      notes: createSelfAppointmentDto.notes,
    });
    await this.notifyAppointmentClient(
      appointment.id,
      tenantId,
      'Agendamento criado',
      'Seu horário foi reservado na Barbearia do Artur.',
    );
    await this.scheduleAppointmentReminders(appointment.id, tenantId);
    return appointment;
  }

  async rescheduleMine(
    userId: string,
    tenantId: string,
    appointmentId: string,
    dto: RescheduleSelfAppointmentDto,
  ) {
    const client = await this.clientsService.findByUserIdAndTenant(userId, tenantId);
    const appointment = await this.findByIdAndTenant(appointmentId, tenantId);
    if (appointment.clientId !== client.id) {
      throw new ForbiddenException('Agendamento não pertence ao cliente autenticado.');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Agendamento concluído não pode ser reagendado.');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Agendamento cancelado não pode ser reagendado.');
    }

    return this.update(
      appointmentId,
      {
        scheduledAt: dto.scheduledAt,
      },
      tenantId,
    );
  }

  async cancelMine(userId: string, tenantId: string, appointmentId: string) {
    const client = await this.clientsService.findByUserIdAndTenant(userId, tenantId);
    const appointment = await this.findByIdAndTenant(appointmentId, tenantId);
    if (appointment.clientId !== client.id) {
      throw new ForbiddenException('Agendamento não pertence ao cliente autenticado.');
    }

    return this.cancelWithPolicy(appointmentId, tenantId);
  }

  async createTimeOff(tenantId: string, dto: CreateTimeOffDto) {
    const startAt = this.normalizeScheduledAt(dto.startAt);
    const endAt = this.normalizeScheduledAt(dto.endAt);
    if (endAt <= startAt) {
      throw new BadRequestException('Fim do bloqueio deve ser depois do início.');
    }

    if (dto.professionalId) {
      await this.professionalsService.findByIdAndTenant(dto.professionalId, tenantId);
    }

    return this.appointmentsRepository.createTimeOff({
      tenantId,
      professionalId: dto.professionalId,
      title: dto.title,
      reason: dto.reason,
      startAt,
      endAt,
    });
  }

  async findTimeOffsByTenant(tenantId: string) {
    return this.appointmentsRepository.findTimeOffsByTenant(tenantId);
  }

  async removeTimeOff(id: string, tenantId: string) {
    return this.appointmentsRepository.removeTimeOff(id, tenantId);
  }

  async update(id: string, updateAppointmentDto: UpdateAppointmentDto, tenantId: string) {
    // Verificar se agendamento existe no tenant
    const appointment = await this.findByIdAndTenant(id, tenantId);
    const normalizedScheduledAt =
      updateAppointmentDto.scheduledAt != null
        ? this.normalizeScheduledAt(updateAppointmentDto.scheduledAt)
        : null;

    // Se está alterando horário ou profissional, verificar disponibilidade
    if (normalizedScheduledAt != null || updateAppointmentDto.professionalId) {
      const professionalId = updateAppointmentDto.professionalId ?? appointment.professionalId;
      const scheduledAt = normalizedScheduledAt ?? appointment.scheduledAt;
      const durationMinutes = updateAppointmentDto.durationMinutes ?? appointment.durationMinutes;

      const isAvailable = await this.isProfessionalAvailable(
        professionalId,
        scheduledAt,
        durationMinutes,
        tenantId,
        id,
      );

      if (!isAvailable) {
        throw new ConflictException('Horário não disponível para este profissional.');
      }
    }

    // Recalcular valores se preço ou desconto foram alterados
    const { scheduledAt: _scheduledAt, ...updateFields } = updateAppointmentDto;
    void _scheduledAt;

    const repositoryPayload: AppointmentUpdatePayload = {
      ...updateFields,
      ...(normalizedScheduledAt != null ? { scheduledAt: normalizedScheduledAt } : {}),
    };
    if (updateAppointmentDto.price !== undefined || updateAppointmentDto.discount !== undefined) {
      const price = updateAppointmentDto.price ?? Number(appointment.price);
      const discount = updateAppointmentDto.discount ?? Number(appointment.discount);
      repositoryPayload.price = price;
      repositoryPayload.discount = discount;
      Object.assign(repositoryPayload, {
        totalAmount: price - discount,
      });
    }

    const updatedAppointment = await this.appointmentsRepository.update(id, tenantId, repositoryPayload);
    if (normalizedScheduledAt != null) {
      await this.notifyAppointmentClient(
        id,
        tenantId,
        'Agendamento reagendado',
        'Seu horário na Barbearia do Artur foi atualizado.',
      );
      await this.scheduleAppointmentReminders(id, tenantId);
    }

    return updatedAppointment;
  }

  async updateStatus(id: string, status: AppointmentStatus, tenantId: string) {
    const appointment = await this.findByIdAndTenant(id, tenantId);

    this.validateStatusTransition(appointment.status, status);

    return this.appointmentsRepository.updateStatus(id, tenantId, status);
  }

  async confirmByOwner(id: string, tenantId: string) {
    const appointment = await this.findByIdAndTenant(id, tenantId);
    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException('Apenas agendamentos marcados podem ser confirmados.');
    }

    const updatedAppointment = await this.appointmentsRepository.update(id, tenantId, {
      notes: this.appendOperationalNote(
        appointment.notes,
        'Confirmado pelo Artur. Cliente deve chegar 10 minutos antes.',
      ),
    });
    await this.notifyAppointmentClient(
      id,
      tenantId,
      'Agendamento confirmado',
      'Seu horário foi confirmado pela Barbearia do Artur.',
    );
    return updatedAppointment;
  }

  async messageClient(id: string, tenantId: string, dto: MessageClientDto) {
    const appointment = await this.findByIdAndTenant(id, tenantId);
    const appointmentView = appointment as typeof appointment & AppointmentWithRelations;
    const clientName = appointmentView.client?.user?.name ?? 'cliente';
    const serviceName = appointmentView.service?.name ?? 'seu atendimento';
    const scheduledLabel = this.formatHumanDateTime(appointment.scheduledAt);
    const message =
      dto.message ??
      `Oi ${clientName}, aqui é o Artur da Barbearia do Artur. Seu horário de ${serviceName} está marcado para ${scheduledLabel}. Se precisar ajustar, me avise. Cancelamentos com menos de 1 hora podem gerar taxa.`;

    const updatedAppointment = await this.appointmentsRepository.update(id, tenantId, {
      notes: this.appendOperationalNote(appointment.notes, `Mensagem preparada: ${message}`),
    });

    return { appointment: updatedAppointment, message };
  }

  async offerEarlierSlot(id: string, tenantId: string, dto: OfferEarlierSlotDto) {
    const appointment = await this.findByIdAndTenant(id, tenantId);
    const appointmentView = appointment as typeof appointment & AppointmentWithRelations;
    const proposedAt = this.normalizeScheduledAt(dto.proposedAt);
    const isAvailable = await this.isProfessionalAvailable(
      appointment.professionalId,
      proposedAt,
      appointment.durationMinutes,
      tenantId,
      id,
    );

    if (!isAvailable) {
      throw new ConflictException('O horário sugerido não está livre para este profissional.');
    }

    const clientName = appointmentView.client?.user?.name ?? 'cliente';
    const message =
      dto.message ??
      `Oi ${clientName}, abriu um horário mais cedo na Barbearia do Artur: ${this.formatHumanDateTime(
        proposedAt,
      )}. Você quer antecipar?`;

    const updatedAppointment = await this.appointmentsRepository.update(id, tenantId, {
      notes: this.appendOperationalNote(
        appointment.notes,
        `Horário mais cedo oferecido: ${this.formatHumanDateTime(proposedAt)}. Mensagem: ${message}`,
      ),
    });

    return {
      appointment: updatedAppointment,
      proposedAt: this.formatLocalDateTime(proposedAt),
      message,
    };
  }

  async checkin(id: string, tenantId: string) {
    const appointment = await this.findByIdAndTenant(id, tenantId);

    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException('Agendamento não pode ser check-in neste status.');
    }

    return this.appointmentsRepository.update(id, tenantId, {
      status: AppointmentStatus.CHECKED_IN,
      checkinAt: new Date(),
    });
  }

  async start(id: string, tenantId: string) {
    const appointment = await this.findByIdAndTenant(id, tenantId);

    if (appointment.status !== AppointmentStatus.CHECKED_IN) {
      throw new BadRequestException('Agendamento deve estar check-in para iniciar.');
    }

    return this.appointmentsRepository.update(id, tenantId, {
      status: AppointmentStatus.IN_PROGRESS,
      startedAt: new Date(),
    });
  }

  async complete(id: string, tenantId: string) {
    const appointment = await this.findByIdAndTenant(id, tenantId);

    if (appointment.status !== AppointmentStatus.IN_PROGRESS) {
      throw new BadRequestException('Agendamento deve estar em andamento para finalizar.');
    }

    return this.appointmentsRepository.update(id, tenantId, {
      status: AppointmentStatus.COMPLETED,
      finishedAt: new Date(),
    });
  }

  async cancel(id: string, tenantId: string) {
    const appointment = await this.findByIdAndTenant(id, tenantId);

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Agendamento concluído não pode ser cancelado.');
    }

    await this.cancelAppointmentReminders(id, tenantId);
    return this.appointmentsRepository.remove(id, tenantId);
  }

  async cancelWithPolicy(id: string, tenantId: string) {
    const appointment = await this.findByIdAndTenant(id, tenantId);

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Agendamento concluído não pode ser cancelado.');
    }

    const minutesUntilAppointment = Math.floor(
      (appointment.scheduledAt.getTime() - Date.now()) / 60000,
    );
    const feeApplies = minutesUntilAppointment < CLIENT_FREE_CANCEL_WINDOW_MINUTES;
    const cancellationFee = feeApplies
      ? Math.max(LATE_CANCELLATION_MIN_FEE, Number(appointment.totalAmount) * LATE_CANCELLATION_PERCENT)
      : 0;

    const updatedAppointment = await this.appointmentsRepository.update(id, tenantId, {
      status: AppointmentStatus.CANCELLED,
      notes: this.appendOperationalNote(
        appointment.notes,
        feeApplies
          ? `Cancelado com menos de 1 hora. Taxa sugerida: R$ ${cancellationFee.toFixed(2)}.`
          : 'Cancelado dentro da política sem taxa.',
      ),
    });
    await this.cancelAppointmentReminders(id, tenantId);
    await this.notifyAppointmentClient(
      id,
      tenantId,
      'Agendamento cancelado',
      'Seu agendamento foi cancelado na Barbearia do Artur.',
    );

    return {
      appointment: updatedAppointment,
      feeApplies,
      cancellationFee,
      policy: 'Cliente pode cancelar sem taxa até 1 hora antes. Depois disso, aplicar taxa mínima de R$ 20 ou 30% do serviço.',
    };
  }

  private validateStatusTransition(currentStatus: AppointmentStatus, newStatus: AppointmentStatus) {
    const validTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
      [AppointmentStatus.SCHEDULED]: [AppointmentStatus.CHECKED_IN, AppointmentStatus.CANCELLED],
      [AppointmentStatus.CHECKED_IN]: [AppointmentStatus.IN_PROGRESS, AppointmentStatus.CANCELLED],
      [AppointmentStatus.IN_PROGRESS]: [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED],
      [AppointmentStatus.COMPLETED]: [],
      [AppointmentStatus.CANCELLED]: [],
    };

    if (currentStatus === newStatus) {
      return;
    }

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `Transição de status inválida: ${currentStatus} -> ${newStatus}.`,
      );
    }
  }

  private normalizeScheduledAt(value: Date | string) {
    const normalized = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(normalized.getTime())) {
      throw new BadRequestException('Data de agendamento inválida.');
    }

    return normalized;
  }

  private normalizeDateOnly(value: string) {
    const normalized = new Date(`${value}T00:00:00`);
    if (Number.isNaN(normalized.getTime())) {
      throw new BadRequestException('Data para consulta de slots inválida.');
    }

    return normalized;
  }

  private async isProfessionalAvailable(
    professionalId: string,
    scheduledAt: Date,
    durationMinutes: number,
    tenantId: string,
    excludeAppointmentId?: string,
  ) {
    const busyAppointments = await this.loadBusyAppointmentsForDay(
      professionalId,
      scheduledAt,
      tenantId,
      excludeAppointmentId,
    );
    const requestedEndAt = new Date(scheduledAt.getTime() + durationMinutes * 60000);

    return !busyAppointments.some(appointment =>
      this.hasTimeOverlap(
        scheduledAt,
        requestedEndAt,
        appointment.scheduledAt,
        new Date(appointment.scheduledAt.getTime() + appointment.durationMinutes * 60000),
      ),
    );
  }

  private async loadBusyAppointmentsForDay(
    professionalId: string,
    referenceDate: Date,
    tenantId: string,
    excludeAppointmentId?: string,
  ): Promise<BusyAppointmentWindow[]> {
    const { startOfDay, endOfDay } = this.getDayWindow(referenceDate);
    const [appointments, timeOffs] = await Promise.all([
      this.appointmentsRepository.findByProfessionalAndDateRange(
        professionalId,
        startOfDay,
        endOfDay,
        tenantId,
      ),
      this.appointmentsRepository.findTimeOffsByProfessionalAndDateRange(
        professionalId,
        startOfDay,
        endOfDay,
        tenantId,
      ),
    ]);

    const appointmentWindows = appointments
      .filter(appointment => appointment.id !== excludeAppointmentId)
      .map(appointment => ({
        id: appointment.id,
        scheduledAt: appointment.scheduledAt,
        durationMinutes: appointment.durationMinutes,
      }));

    const timeOffWindows = timeOffs.map(timeOff => ({
      id: timeOff.id,
      scheduledAt: timeOff.startAt,
      durationMinutes: Math.ceil((timeOff.endAt.getTime() - timeOff.startAt.getTime()) / 60000),
    }));

    return [...appointmentWindows, ...timeOffWindows];
  }

  private buildAvailableSlots(
    selectedDate: Date,
    durationMinutes: number,
    busyAppointments: BusyAppointmentWindow[],
  ): AvailableAppointmentSlot[] {
    const now = new Date();
    const slots: AvailableAppointmentSlot[] = [];

    for (
      let currentMinute = BUSINESS_DAY_START_MINUTES;
      currentMinute + durationMinutes <= BUSINESS_DAY_END_MINUTES;
      currentMinute += SLOT_STEP_MINUTES
    ) {
      const startAt = this.withClockMinutes(selectedDate, currentMinute);
      const endAt = new Date(startAt.getTime() + durationMinutes * 60000);

      if (startAt <= now) {
        continue;
      }

      const hasConflict = busyAppointments.some(appointment =>
        this.hasTimeOverlap(
          startAt,
          endAt,
          appointment.scheduledAt,
          new Date(appointment.scheduledAt.getTime() + appointment.durationMinutes * 60000),
        ),
      );

      if (hasConflict) {
        continue;
      }

      slots.push({
        startAt: this.formatLocalDateTime(startAt),
        endAt: this.formatLocalDateTime(endAt),
        label: this.formatSlotLabel(startAt, endAt),
      });
    }

    return slots;
  }

  private hasTimeOverlap(leftStart: Date, leftEnd: Date, rightStart: Date, rightEnd: Date) {
    return leftStart < rightEnd && leftEnd > rightStart;
  }

  private withClockMinutes(baseDate: Date, totalMinutes: number) {
    const date = new Date(baseDate);
    date.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);
    return date;
  }

  private getDayWindow(referenceDate: Date) {
    const startOfDay = new Date(referenceDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(referenceDate);
    endOfDay.setHours(23, 59, 59, 999);

    return { startOfDay, endOfDay };
  }

  private formatSlotLabel(startAt: Date, endAt: Date) {
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return `${formatter.format(startAt)} - ${formatter.format(endAt)}`;
  }

  private formatHumanDateTime(value: Date) {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(value);
  }

  private appendOperationalNote(currentNotes: string | null | undefined, note: string) {
    const timestamp = this.formatHumanDateTime(new Date());
    const nextNote = `[op ${timestamp}] ${note}`;
    return currentNotes ? `${currentNotes}\n${nextNote}` : nextNote;
  }

  private formatLocalDateTime(value: Date) {
    const year = `${value.getFullYear()}`;
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    const hour = `${value.getHours()}`.padStart(2, '0');
    const minute = `${value.getMinutes()}`.padStart(2, '0');

    return `${year}-${month}-${day}T${hour}:${minute}:00`;
  }

  private async notifyAppointmentClient(
    appointmentId: string,
    tenantId: string,
    title: string,
    body: string,
  ): Promise<void> {
    const appointment = await this.findByIdAndTenant(appointmentId, tenantId);
    const client = await this.clientsService.findByIdAndTenant(appointment.clientId, tenantId);
    await this.notificationsService.notifyUser({
      tenantId,
      userId: client.userId,
      title,
      body,
      payload: {
        appointmentId,
        type: 'appointment',
      },
    });
  }

  private async scheduleAppointmentReminders(appointmentId: string, tenantId: string): Promise<void> {
    const appointment = await this.findByIdAndTenant(appointmentId, tenantId);
    if (
      appointment.status === AppointmentStatus.CANCELLED ||
      appointment.status === AppointmentStatus.COMPLETED
    ) {
      return;
    }

    const client = await this.clientsService.findByIdAndTenant(appointment.clientId, tenantId);
    await this.notificationsService.scheduleAppointmentReminders({
      tenantId,
      userId: client.userId,
      appointmentId,
      scheduledAt: appointment.scheduledAt,
    });
  }

  private async cancelAppointmentReminders(appointmentId: string, tenantId: string): Promise<void> {
    const appointment = await this.findByIdAndTenant(appointmentId, tenantId);
    const client = await this.clientsService.findByIdAndTenant(appointment.clientId, tenantId);
    await this.notificationsService.cancelAppointmentReminders({
      tenantId,
      userId: client.userId,
      appointmentId,
      scheduledAt: appointment.scheduledAt,
    });
  }
}
