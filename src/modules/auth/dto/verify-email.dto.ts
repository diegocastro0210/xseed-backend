import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    description: 'Email verification token received via email',
    example: 'acdcd77cd0a293548a8201ed609e5c0aaf5cfc8dff9f4754e0f3e562d8dbb05f',
  })
  @IsString({ message: 'Token must be a string' })
  @IsNotEmpty({ message: 'Verification token is required' })
  token: string;
}
