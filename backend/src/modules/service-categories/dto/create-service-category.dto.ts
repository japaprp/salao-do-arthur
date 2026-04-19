import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateServiceCategoryDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export type CreateServiceCategoryInput = CreateServiceCategoryDto & {
  tenantId: string;
  slug: string;
};
