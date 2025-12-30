import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateClientDto {
  @ApiProperty({
    description: 'Client company name',
    example: 'Acme Corporation',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Company size range',
    example: '100-500',
  })
  @IsString()
  @IsOptional()
  companySize?: string;

  @ApiPropertyOptional({
    description: 'Team size for hiring',
    example: '10-20',
  })
  @IsString()
  @IsOptional()
  teamSize?: string;
}
