import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { SeniorityLevel } from '@prisma/client';

export class CreateCandidateDto {
  @ApiProperty({
    description: 'Candidate full name',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Candidate email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Job role/position',
    example: 'Full Stack Developer',
  })
  @IsString()
  @IsNotEmpty()
  role: string;

  @ApiProperty({
    description: 'Seniority level',
    enum: SeniorityLevel,
    example: 'SENIOR',
  })
  @IsEnum(SeniorityLevel)
  @IsNotEmpty()
  seniorityLevel: SeniorityLevel;

  @ApiProperty({
    description: 'Client company ID',
    example: 'clclient123456',
  })
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ApiPropertyOptional({
    description: 'Required technical skills',
    example: ['TypeScript', 'React', 'Node.js'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  mustHaveStack?: string[];

  @ApiPropertyOptional({
    description: 'Nice-to-have technical skills',
    example: ['AWS', 'Docker', 'GraphQL'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  niceToHaveStack?: string[];
}
