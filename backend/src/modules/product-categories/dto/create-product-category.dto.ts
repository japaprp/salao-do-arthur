import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateProductCategoryDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export type CreateProductCategoryInput = CreateProductCategoryDto & {
  tenantId: string;
  slug: string;
};
