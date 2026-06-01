import { Type } from 'class-transformer';
import { IsString, IsNumber, IsEnum, IsDateString, IsOptional, Min, IsInt } from 'class-validator';
import { ExpenseCategory } from '@prisma/client';

export class CreateExpenseDto {
  @IsString()
  title: string;

  @IsEnum(ExpenseCategory)
  category: ExpenseCategory;

  @IsNumber() @Min(0)
  amount: number;

  @IsDateString()
  date: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  receiptUrl?: string;
}

export class UpdateExpenseDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsEnum(ExpenseCategory)
  @IsOptional()
  category?: ExpenseCategory;

  @IsNumber() @Min(0)
  @IsOptional()
  amount?: number;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class QueryExpensesDto {
  @IsEnum(ExpenseCategory)
  @IsOptional()
  category?: ExpenseCategory;

  @IsInt() @Min(1)
  @IsOptional()
  @Type(() => Number)
  month?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  year?: number;
}
