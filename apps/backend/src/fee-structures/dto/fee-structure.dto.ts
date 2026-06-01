import { IsString, IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';

export class CreateFeeStructureDto {
  @IsString()
  classId: string;

  @IsString()
  feeCategoryId: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsOptional()
  academicYearId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateFeeStructureDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
