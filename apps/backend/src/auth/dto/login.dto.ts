import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  // No min-length here: any wrong password (short or long) should fall through
  // to the auth check and return a uniform 401, never a 400 that leaks which
  // field was malformed. Password strength is enforced at account creation.
  @IsString()
  @IsNotEmpty()
  password: string;
}
