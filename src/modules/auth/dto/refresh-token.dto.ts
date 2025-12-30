import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token received during login',
    example: '3f271f36-eb2e-4723-9649-1f17519b8480',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
