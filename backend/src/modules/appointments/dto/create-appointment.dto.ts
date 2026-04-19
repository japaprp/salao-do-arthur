import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  IsEnum,
  Min,
  Max,
  IsPositive,
} from 'class-validator';
import { AppointmentStatus } from '@prisma/client';
import { IsFutureDate, IsValidUuid } from '../../../common/validators/custom-validators';

export class CreateAppointmentDto {
  @IsNotEmpty()
  @IsString()
  @IsValidUuid()
  clientId!: string;

  @IsNotEmpty()
  @IsString()
  @IsValidUuid()
  professionalId!: string;

  @IsNotEmpty()
  @IsString()
  @IsValidUuid()
  serviceId!: string;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsNotEmpty()
  @IsDateString()
  @IsFutureDate()
  scheduledAt!: Date;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @Min(15)
  @Max(480) // 8 horas máximo
  durationMinutes!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999999.99)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999999.99)
  discount?: number;

  @IsOptional()
  @IsString()
  @Max(500)
  notes?: string;
}

export type CreateAppointmentInput = CreateAppointmentDto & {
  tenantId: string;
};
