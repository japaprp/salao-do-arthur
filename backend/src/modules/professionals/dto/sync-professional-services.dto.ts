import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class SyncProfessionalServiceItemDto {
  @IsString()
  serviceId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  customPrice?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  customDurationMinutes?: number | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class SyncProfessionalServicesDto {
  @IsArray()
  @ArrayUnique((item: SyncProfessionalServiceItemDto) => item.serviceId)
  @ValidateNested({ each: true })
  @Type(() => SyncProfessionalServiceItemDto)
  services!: SyncProfessionalServiceItemDto[];
}
