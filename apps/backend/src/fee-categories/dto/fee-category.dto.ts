import { IsString, IsEnum, IsOptional } from 'class-validator';
import { FeeType } from '@prisma/client';

export class CreateFeeCategoryDto {
  @IsString()
  name: string;

  @IsEnum(FeeType)
  feeType: FeeType;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateFeeCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(FeeType)
  @IsOptional()
  feeType?: FeeType;

  @IsString()
  @IsOptional()
  description?: string;
}
