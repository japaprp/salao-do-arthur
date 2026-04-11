import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSelfAppointmentDto {
  @IsNotEmpty()
  @IsString()
  serviceId!: string;

  @IsNotEmpty()
  @IsString()
  professionalId!: string;

  @IsNotEmpty()
  @IsDateString()
  scheduledAt!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
