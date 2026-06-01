import { IsString, IsNumber, IsBoolean, IsOptional, IsIn, Min } from 'class-validator';

export class CreateDiscountDto {
  @IsString()
  name: string;

  @IsIn(['PERCENTAGE', 'FIXED'])
  @IsOptional()
  type?: 'PERCENTAGE' | 'FIXED';

  @IsNumber()
  @Min(0)
  value: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateDiscountDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsIn(['PERCENTAGE', 'FIXED'])
  @IsOptional()
  type?: 'PERCENTAGE' | 'FIXED';

  @IsNumber()
  @Min(0)
  @IsOptional()
  value?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
