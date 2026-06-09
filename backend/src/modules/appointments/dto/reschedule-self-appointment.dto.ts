import { IsDateString } from 'class-validator';

export class RescheduleSelfAppointmentDto {
  @IsDateString()
  scheduledAt!: string;
}
