import { IsString, IsOptional } from 'class-validator';

export class CreateSectionDto {
  @IsString()
  name: string;

  @IsString()
  classId: string;

  @IsString()
  @IsOptional()
  teacherId?: string;
}

export class UpdateSectionDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  teacherId?: string;
}
