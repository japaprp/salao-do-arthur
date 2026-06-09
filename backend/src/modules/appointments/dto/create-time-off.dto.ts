import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateTimeOffDto {
  @IsOptional()
  @IsString()
  professionalId?: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsDateString()
  startAt!: string;

  @IsDateString()
  endAt!: string;
}
