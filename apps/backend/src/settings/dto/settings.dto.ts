import { IsString, IsOptional, IsNumber, IsInt, Min } from 'class-validator';

export class UpdateSettingsDto {
  @IsString()
  @IsOptional()
  schoolName?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  website?: string;

  @IsString()
  @IsOptional()
  registrationNumber?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  stampUrl?: string;

  @IsString()
  @IsOptional()
  principalSignatureUrl?: string;

  @IsString()
  @IsOptional()
  primaryColor?: string;

  @IsString()
  @IsOptional()
  accentColor?: string;

  @IsString()
  @IsOptional()
  invoiceFooter?: string;

  @IsString()
  @IsOptional()
  receiptFooter?: string;

  @IsNumber() @Min(0)
  @IsOptional()
  finePerDay?: number;

  @IsInt() @Min(0)
  @IsOptional()
  fineGraceDays?: number;
}
