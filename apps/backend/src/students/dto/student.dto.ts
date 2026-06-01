import { Type } from 'class-transformer';
import {
  IsString, IsOptional, IsDateString, IsEnum, IsBoolean,
  IsArray, ValidateNested, IsEmail,
} from 'class-validator';
import { Gender, BloodGroup, StudentStatus } from '@prisma/client';

export class GuardianDto {
  @IsString()
  fullName: string;

  @IsString()
  relationship: string;

  @IsString()
  phone: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  occupation?: string;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}

export class CreateStudentDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  @IsOptional()
  photoUrl?: string;

  @IsDateString()
  @IsOptional()
  dob?: string;

  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @IsEnum(BloodGroup)
  @IsOptional()
  bloodGroup?: BloodGroup;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsDateString()
  @IsOptional()
  admissionDate?: string;

  @IsString()
  @IsOptional()
  sectionId?: string;

  @IsBoolean()
  @IsOptional()
  transportationStatus?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuardianDto)
  @IsOptional()
  guardians?: GuardianDto[];
}

export class UpdateStudentDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  photoUrl?: string;

  @IsDateString()
  @IsOptional()
  dob?: string;

  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @IsEnum(BloodGroup)
  @IsOptional()
  bloodGroup?: BloodGroup;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  sectionId?: string;

  @IsBoolean()
  @IsOptional()
  transportationStatus?: boolean;

  @IsEnum(StudentStatus)
  @IsOptional()
  status?: StudentStatus;
}

export class QueryStudentsDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  sectionId?: string;

  @IsString()
  @IsOptional()
  classId?: string;

  @IsEnum(StudentStatus)
  @IsOptional()
  status?: StudentStatus;
}
