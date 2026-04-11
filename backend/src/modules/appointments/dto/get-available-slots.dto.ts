import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class GetAvailableSlotsDto {
  @IsString()
  @IsNotEmpty()
  serviceId!: string;

  @IsString()
  @IsNotEmpty()
  professionalId!: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date!: string;
}
