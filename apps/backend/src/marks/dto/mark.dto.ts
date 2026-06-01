import { Type } from 'class-transformer';
import {
  IsString, IsNumber, IsBoolean, IsOptional, IsArray, ValidateNested, Min,
} from 'class-validator';

export class MarkEntryDto {
  @IsString()
  studentId: string;

  @IsString()
  subjectId: string;

  @IsNumber() @Min(0)
  @IsOptional()
  theoryMarks?: number;

  @IsNumber() @Min(0)
  @IsOptional()
  practicalMarks?: number;

  @IsNumber() @Min(0)
  @IsOptional()
  totalMarks?: number;

  @IsBoolean()
  @IsOptional()
  isAbsent?: boolean;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class BulkMarksDto {
  @IsString()
  examId: string;

  @IsString()
  classId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MarkEntryDto)
  marks: MarkEntryDto[];
}
