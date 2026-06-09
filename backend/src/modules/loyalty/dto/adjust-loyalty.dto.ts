import { IsInt, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class AdjustLoyaltyDto {
  @IsInt()
  points!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsString()
  @MaxLength(160)
  reason!: string;
}
