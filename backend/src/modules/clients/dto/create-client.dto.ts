import { IsNotEmpty, IsString, IsOptional, IsNumber, IsObject } from 'class-validator';

export class CreateClientDto {
  @IsNotEmpty()
  @IsString()
  userId!: string;

  @IsOptional()
  @IsNumber()
  loyaltyPoints?: number;

  @IsOptional()
  @IsNumber()
  lifetimeValue?: number;

  @IsOptional()
  @IsString()
  favoriteProfessionalId?: string;

  @IsOptional()
  @IsObject()
  preferences?: Record<string, unknown>;
}

export type CreateClientInput = CreateClientDto & {
  tenantId: string;
};
