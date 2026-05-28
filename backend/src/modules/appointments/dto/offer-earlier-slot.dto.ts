import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class OfferEarlierSlotDto {
  @IsDateString()
  proposedAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  message?: string;
}
