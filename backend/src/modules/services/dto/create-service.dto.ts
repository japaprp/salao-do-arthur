import { IsNotEmpty, IsString, IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';

export class CreateServiceDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  durationMinutes!: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price!: number;

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

export type CreateServiceInput = CreateServiceDto & {
  tenantId: string;
};
