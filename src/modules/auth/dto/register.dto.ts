import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Role } from '@prisma/client';

// Password must contain at least:
// - 8 characters minimum
// - 1 uppercase letter
// - 1 lowercase letter
// - 1 number
// - 1 special character (@$!%*?&)
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const PASSWORD_MESSAGE =
  'Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)';

export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'admin@example.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description:
      'Password (min 8 chars, must include uppercase, lowercase, number, and special character)',
    example: 'SecurePass1!',
    minLength: 8,
    maxLength: 128,
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  password: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  @MinLength(1)
  @MaxLength(100, { message: 'First name must not exceed 100 characters' })
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  @MinLength(1)
  @MaxLength(100, { message: 'Last name must not exceed 100 characters' })
  lastName: string;

  @ApiProperty({
    description: 'User role',
    enum: ['ADMIN', 'RECRUITER', 'CLIENT'],
    example: 'RECRUITER',
  })
  @IsEnum(Role, { message: 'Role must be ADMIN, RECRUITER, or CLIENT' })
  @IsNotEmpty({ message: 'Role is required' })
  role: Role;

  @ApiPropertyOptional({
    description: 'Client ID (required for CLIENT role)',
    example: 'clxyz123456',
  })
  @IsString()
  @IsOptional()
  clientId?: string;
}
