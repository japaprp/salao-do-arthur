import { IsDateString, IsIn, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateFinanceTransactionDto {
  @IsIn(['INCOME', 'EXPENSE'])
  type!: 'INCOME' | 'EXPENSE';

  @IsString()
  @MaxLength(80)
  category!: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  description?: string;

  @IsOptional()
  @IsDateString()
  recordedAt?: string;
}
