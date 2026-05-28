import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CreateSelfAppointmentDto } from './dto/create-self-appointment.dto';
import { GetAvailableSlotsDto } from './dto/get-available-slots.dto';
import { MessageClientDto } from './dto/message-client.dto';
import { OfferEarlierSlotDto } from './dto/offer-earlier-slot.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';

@ApiTags('appointments')
@Controller('appointments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo agendamento' })
  @ApiResponse({ status: 201, description: 'Agendamento criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou conflito de horário' })
  create(
    @Body() createAppointmentDto: CreateAppointmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.appointmentsService.create({
      ...createAppointmentDto,
      tenantId: user.tenantId,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os agendamentos com paginação' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Deslocamento (padrão: 0)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limite por página (padrão: 20, máximo: 100)' })
  @ApiResponse({ status: 200, description: 'Lista paginada de agendamentos retornada' })
  findAll(@Query() pagination: PaginationDto, @CurrentUser() user: AuthenticatedUser) {
    return this.appointmentsService.findAllByTenantPaginated(user.tenantId, pagination);
  }

  @Get('mine')
  @ApiOperation({ summary: 'Listar os agendamentos do cliente autenticado' })
  @ApiResponse({ status: 200, description: 'Lista de agendamentos do cliente retornada' })
  @ApiResponse({ status: 404, description: 'Cliente autenticado não encontrado' })
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.appointmentsService.findMine(user.userId, user.tenantId);
  }

  @Get('available-slots')
  @ApiOperation({ summary: 'Listar slots disponíveis para cliente autenticado' })
  @ApiQuery({ name: 'serviceId', description: 'ID do serviço' })
  @ApiQuery({ name: 'professionalId', description: 'ID do profissional' })
  @ApiQuery({ name: 'date', description: 'Data alvo no formato YYYY-MM-DD' })
  @ApiResponse({ status: 200, description: 'Lista de slots disponíveis retornada' })
  getAvailableSlots(@Query() query: GetAvailableSlotsDto, @CurrentUser() user: AuthenticatedUser) {
    return this.appointmentsService.getAvailableSlots(query, user.tenantId);
  }

  @Post('book')
  @ApiOperation({ summary: 'Criar agendamento para o cliente autenticado' })
  @ApiResponse({ status: 201, description: 'Agendamento criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou conflito de horário' })
  @ApiResponse({ status: 404, description: 'Cliente autenticado não encontrado' })
  book(
    @Body() createSelfAppointmentDto: CreateSelfAppointmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.appointmentsService.bookForAuthenticatedClient(
      user.userId,
      user.tenantId,
      createSelfAppointmentDto,
    );
  }

  @Get('professional/:professionalId')
  @ApiOperation({ summary: 'Buscar agendamentos por profissional e período' })
  @ApiParam({ name: 'professionalId', description: 'ID do profissional' })
  @ApiQuery({ name: 'startDate', description: 'Data inicial (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', description: 'Data final (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Agendamentos encontrados' })
  findByProfessional(
    @Param('professionalId') professionalId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.appointmentsService.findByProfessionalAndDateRange(
      professionalId,
      new Date(startDate),
      new Date(endDate),
      user.tenantId,
    );
  }

  @Get('client/:clientId')
  @ApiOperation({ summary: 'Buscar agendamentos por cliente com paginação' })
  @ApiParam({ name: 'clientId', description: 'ID do cliente' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Deslocamento (padrão: 0)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limite por página (padrão: 20, máximo: 100)' })
  @ApiResponse({ status: 200, description: 'Agendamentos encontrados' })
  findByClient(
    @Param('clientId') clientId: string,
    @Query() pagination: PaginationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.appointmentsService.findByClientAndTenantPaginated(
      clientId,
      user.tenantId,
      pagination,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar agendamento por ID' })
  @ApiParam({ name: 'id', description: 'ID do agendamento' })
  @ApiResponse({ status: 200, description: 'Agendamento encontrado' })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.appointmentsService.findByIdAndTenant(id, user.tenantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar agendamento' })
  @ApiParam({ name: 'id', description: 'ID do agendamento' })
  @ApiResponse({ status: 200, description: 'Agendamento atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado' })
  update(
    @Param('id') id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.appointmentsService.update(id, updateAppointmentDto, user.tenantId);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Atualizar status do agendamento' })
  @ApiParam({ name: 'id', description: 'ID do agendamento' })
  @ApiResponse({ status: 200, description: 'Status atualizado com sucesso' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateAppointmentStatusDto: UpdateAppointmentStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.appointmentsService.updateStatus(
      id,
      updateAppointmentStatusDto.status,
      user.tenantId,
    );
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirmar agendamento pelo Artur' })
  @ApiParam({ name: 'id', description: 'ID do agendamento' })
  @ApiResponse({ status: 200, description: 'Agendamento confirmado com nota operacional' })
  confirm(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.appointmentsService.confirmByOwner(id, user.tenantId);
  }

  @Post(':id/message-client')
  @ApiOperation({ summary: 'Preparar mensagem rápida para o cliente' })
  @ApiParam({ name: 'id', description: 'ID do agendamento' })
  @ApiResponse({ status: 200, description: 'Mensagem preparada com contexto do agendamento' })
  messageClient(
    @Param('id') id: string,
    @Body() messageClientDto: MessageClientDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.appointmentsService.messageClient(id, user.tenantId, messageClientDto);
  }

  @Post(':id/offer-earlier-slot')
  @ApiOperation({ summary: 'Oferecer horário vago mais cedo ao cliente' })
  @ApiParam({ name: 'id', description: 'ID do agendamento' })
  @ApiResponse({ status: 200, description: 'Mensagem de antecipação preparada' })
  offerEarlierSlot(
    @Param('id') id: string,
    @Body() offerEarlierSlotDto: OfferEarlierSlotDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.appointmentsService.offerEarlierSlot(id, user.tenantId, offerEarlierSlotDto);
  }

  @Post(':id/cancel-with-policy')
  @ApiOperation({ summary: 'Cancelar aplicando política de taxa de 1 hora' })
  @ApiParam({ name: 'id', description: 'ID do agendamento' })
  @ApiResponse({ status: 200, description: 'Agendamento cancelado com cálculo de taxa' })
  cancelWithPolicy(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.appointmentsService.cancelWithPolicy(id, user.tenantId);
  }

  @Post(':id/checkin')
  @ApiOperation({ summary: 'Fazer check-in do agendamento' })
  @ApiParam({ name: 'id', description: 'ID do agendamento' })
  @ApiResponse({ status: 200, description: 'Check-in realizado com sucesso' })
  checkin(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.appointmentsService.checkin(id, user.tenantId);
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Iniciar atendimento' })
  @ApiParam({ name: 'id', description: 'ID do agendamento' })
  @ApiResponse({ status: 200, description: 'Atendimento iniciado com sucesso' })
  start(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.appointmentsService.start(id, user.tenantId);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Completar atendimento' })
  @ApiParam({ name: 'id', description: 'ID do agendamento' })
  @ApiResponse({ status: 200, description: 'Atendimento completado com sucesso' })
  complete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.appointmentsService.complete(id, user.tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancelar agendamento' })
  @ApiParam({ name: 'id', description: 'ID do agendamento' })
  @ApiResponse({ status: 200, description: 'Agendamento cancelado com sucesso' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.appointmentsService.cancel(id, user.tenantId);
  }
}
