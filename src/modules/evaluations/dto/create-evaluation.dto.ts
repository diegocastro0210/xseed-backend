import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateEvaluationDto {
  @ApiProperty({
    description: 'Candidate ID to evaluate',
    example: 'clcandidate123456',
  })
  @IsString()
  @IsNotEmpty()
  candidateId: string;

  @ApiPropertyOptional({
    description: 'URL or path to technical interview audio file',
    example: 'https://s3.amazonaws.com/bucket/technical-interview.mp3',
  })
  @IsString()
  @IsOptional()
  technicalAudioFile?: string;

  @ApiPropertyOptional({
    description: 'URL or path to cultural interview audio file',
    example: 'https://s3.amazonaws.com/bucket/cultural-interview.mp3',
  })
  @IsString()
  @IsOptional()
  culturalAudioFile?: string;
}
