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
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  role: string;

  @IsEnum(SeniorityLevel)
  @IsNotEmpty()
  seniorityLevel: SeniorityLevel;

  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  mustHaveStack?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  niceToHaveStack?: string[];
}
