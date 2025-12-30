import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { EvaluationStatus } from '@prisma/client';

export class UpdateEvaluationDto {
  @ApiPropertyOptional({
    description: 'Technical evaluation status',
    enum: EvaluationStatus,
    example: 'COMPLETED',
  })
  @IsEnum(EvaluationStatus)
  @IsOptional()
  technicalStatus?: EvaluationStatus;

  @ApiPropertyOptional({
    description: 'Cultural evaluation status',
    enum: EvaluationStatus,
    example: 'IN_PROGRESS',
  })
  @IsEnum(EvaluationStatus)
  @IsOptional()
  culturalStatus?: EvaluationStatus;
}
