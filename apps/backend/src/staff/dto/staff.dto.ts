import {
  IsString, IsEmail, IsEnum, IsOptional, IsDateString, IsNumber, Min, MinLength,
} from 'class-validator';
import { StaffType } from '@prisma/client';

export class CreateStaffDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEnum(StaffType)
  staffType: StaffType;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsDateString()
  @IsOptional()
  joinDate?: string;

  // Optional initial salary setup
  @IsNumber() @Min(0)
  @IsOptional()
  basicSalary?: number;

  @IsNumber() @Min(0)
  @IsOptional()
  allowances?: number;

  @IsNumber() @Min(0)
  @IsOptional()
  deductions?: number;
}

export class UpdateStaffDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEnum(StaffType)
  @IsOptional()
  staffType?: StaffType;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;
}

export class SetSalaryDto {
  @IsNumber() @Min(0)
  basicSalary: number;

  @IsNumber() @Min(0)
  @IsOptional()
  allowances?: number;

  @IsNumber() @Min(0)
  @IsOptional()
  deductions?: number;
}
