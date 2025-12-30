import { IsEnum, IsOptional } from 'class-validator';
import { EvaluationStatus } from '@prisma/client';

export class UpdateEvaluationDto {
  @IsEnum(EvaluationStatus)
  @IsOptional()
  technicalStatus?: EvaluationStatus;

  @IsEnum(EvaluationStatus)
  @IsOptional()
  culturalStatus?: EvaluationStatus;
}
