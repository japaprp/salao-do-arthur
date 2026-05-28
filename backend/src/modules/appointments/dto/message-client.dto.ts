import { IsOptional, IsString, MaxLength } from 'class-validator';

export class MessageClientDto {
  @IsOptional()
  @IsString()
  @MaxLength(240)
  message?: string;
}
