import { IsString, IsInt, IsOptional, Min } from 'class-validator';

export class CreateClassDto {
  @IsString()
  name: string;

  @IsString()
  academicYearId: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  orderIndex?: number;
}

export class UpdateClassDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  orderIndex?: number;
}
