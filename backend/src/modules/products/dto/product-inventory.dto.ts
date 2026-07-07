import { IsInt, IsOptional, Min } from 'class-validator';

export class ProductInventoryDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  availableQty?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  reorderPoint?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  safetyStock?: number;
}
