import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  IsEnum,
  Min,
} from 'class-validator';
import { AppointmentStatus } from '@prisma/client';

export class CreateAppointmentDto {
  @IsNotEmpty()
  @IsString()
  clientId!: string;

  @IsNotEmpty()
  @IsString()
  professionalId!: string;

  @IsNotEmpty()
  @IsString()
  serviceId!: string;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsNotEmpty()
  @IsDateString()
  scheduledAt!: Date;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  durationMinutes!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export type CreateAppointmentInput = CreateAppointmentDto & {
  tenantId: string;
};
