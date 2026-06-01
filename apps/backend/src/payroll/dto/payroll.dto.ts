import { Type } from 'class-transformer';
import { IsString, IsInt, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class GeneratePayrollDto {
  @IsInt() @Min(1) @Max(12)
  month: number;

  @IsInt()
  year: number;
}

export class CreatePayrollDto {
  @IsString()
  staffId: string;

  @IsInt() @Min(1) @Max(12)
  month: number;

  @IsInt()
  year: number;

  @IsNumber() @Min(0)
  @IsOptional()
  bonus?: number;

  @IsNumber() @Min(0)
  @IsOptional()
  extraDeductions?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdatePayrollDto {
  @IsNumber() @Min(0)
  @IsOptional()
  bonus?: number;

  @IsNumber() @Min(0)
  @IsOptional()
  deductions?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class QueryPayrollDto {
  @IsInt() @Min(1) @Max(12)
  @IsOptional()
  @Type(() => Number)
  month?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  year?: number;

  @IsString()
  @IsOptional()
  staffId?: string;
}
