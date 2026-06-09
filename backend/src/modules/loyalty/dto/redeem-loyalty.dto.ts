import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class RedeemLoyaltyDto {
  @IsInt()
  @Min(1)
  points!: number;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  reason?: string;
}
