import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateEvaluationDto {
  @IsString()
  @IsNotEmpty()
  candidateId: string;

  @IsString()
  @IsOptional()
  technicalAudioFile?: string;

  @IsString()
  @IsOptional()
  culturalAudioFile?: string;
}
