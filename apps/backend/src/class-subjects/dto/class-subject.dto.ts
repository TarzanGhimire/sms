import { IsString, IsInt, IsOptional, Min } from 'class-validator';

export class CreateClassSubjectDto {
  @IsString()
  classId: string;

  @IsString()
  subjectId: string;

  @IsString()
  @IsOptional()
  teacherId?: string;

  @IsInt() @Min(1)
  @IsOptional()
  fullMarks?: number;

  @IsInt() @Min(0)
  @IsOptional()
  passMarks?: number;

  @IsInt() @Min(0)
  @IsOptional()
  theoryMarks?: number;

  @IsInt() @Min(0)
  @IsOptional()
  practicalMarks?: number;
}

export class UpdateClassSubjectDto {
  @IsString()
  @IsOptional()
  teacherId?: string;

  @IsInt() @Min(1)
  @IsOptional()
  fullMarks?: number;

  @IsInt() @Min(0)
  @IsOptional()
  passMarks?: number;

  @IsInt() @Min(0)
  @IsOptional()
  theoryMarks?: number;

  @IsInt() @Min(0)
  @IsOptional()
  practicalMarks?: number;
}
