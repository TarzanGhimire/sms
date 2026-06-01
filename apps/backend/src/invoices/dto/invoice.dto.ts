import { Type } from 'class-transformer';
import {
  IsString, IsInt, IsNumber, IsOptional, IsArray, ValidateNested,
  IsEnum, IsDateString, Min, Max,
} from 'class-validator';
import { InvoiceStatus } from '@prisma/client';

export class InvoiceItemDto {
  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsOptional()
  discountId?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discountAmount?: number;
}

export class CreateInvoiceDto {
  @IsString()
  studentId: string;

  @IsString()
  @IsOptional()
  academicYearId?: string;

  @IsInt() @Min(1) @Max(12)
  billingMonth: number;

  @IsInt()
  billingYear: number;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];

  @IsNumber() @Min(0)
  @IsOptional()
  fineAmount?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateInvoiceDto {
  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsNumber() @Min(0)
  @IsOptional()
  fineAmount?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class GenerateMonthlyInvoicesDto {
  @IsString()
  @IsOptional()
  classId?: string;

  @IsString()
  @IsOptional()
  sectionId?: string;

  @IsInt() @Min(1) @Max(12)
  billingMonth: number;

  @IsInt()
  billingYear: number;

  @IsInt() @Min(1) @Max(31)
  @IsOptional()
  dueDay?: number;
}

export class QueryInvoicesDto {
  @IsString()
  @IsOptional()
  studentId?: string;

  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;

  @IsInt() @Min(1) @Max(12)
  @IsOptional()
  @Type(() => Number)
  billingMonth?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  billingYear?: number;

  @IsString()
  @IsOptional()
  search?: string;
}
