import { IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateClientDto {
  @IsOptional()
  @IsString()
  favoriteProfessionalId?: string | null;

  @IsOptional()
  @IsObject()
  preferences?: Record<string, unknown>;
}
