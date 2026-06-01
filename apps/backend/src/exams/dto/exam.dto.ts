import { IsString, IsEnum, IsDateString, IsOptional, IsBoolean } from 'class-validator';
import { ExamType } from '@prisma/client';

export class CreateExamDto {
  @IsString()
  name: string;

  @IsEnum(ExamType)
  examType: ExamType;

  @IsString()
  @IsOptional()
  academicYearId?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}

export class UpdateExamDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(ExamType)
  @IsOptional()
  examType?: ExamType;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}
