import { IsNotEmpty, IsString, IsOptional, IsNumber, IsBoolean, Min, Max } from 'class-validator';

export class CreateProfessionalDto {
  @IsNotEmpty()
  @IsString()
  userId!: string;

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionPercent?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export type CreateProfessionalInput = CreateProfessionalDto & {
  tenantId: string;
};
