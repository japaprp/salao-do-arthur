import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateServiceDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  durationMinutes?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bufferBeforeMinutes?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bufferAfterMinutes?: number;

  @IsOptional()
  @IsBoolean()
  parallelAllowed?: boolean;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
