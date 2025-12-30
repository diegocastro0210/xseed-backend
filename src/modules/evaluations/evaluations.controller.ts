import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { EvaluationsService } from './evaluations.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';
import { Roles } from '../../common/decorators';

@ApiTags('evaluations')
@ApiBearerAuth('JWT-auth')
@Controller('evaluations')
@Roles(Role.ADMIN, Role.RECRUITER)
export class EvaluationsController {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  @ApiOperation({
    summary: 'Create evaluation',
    description:
      'Start a new evaluation for a candidate. Admin and Recruiter access.',
  })
  @ApiBody({ type: CreateEvaluationDto })
  @ApiResponse({
    status: 201,
    description: 'Evaluation created successfully',
    schema: {
      example: {
        id: 'cleval123456',
        candidateId: 'clcandidate123456',
        technicalStatus: 'PENDING',
        culturalStatus: 'PENDING',
        technicalAudioFile: null,
        culturalAudioFile: null,
        createdAt: '2025-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or Recruiter access required',
  })
  @ApiResponse({ status: 404, description: 'Candidate not found' })
  @Post()
  async create(@Body() createEvaluationDto: CreateEvaluationDto) {
    return this.evaluationsService.create(createEvaluationDto);
  }

  @ApiOperation({
    summary: 'List evaluations',
    description:
      'Get paginated list of all evaluations. Admin and Recruiter access.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of evaluations',
    schema: {
      example: {
        data: [
          {
            id: 'cleval123456',
            candidateId: 'clcandidate123456',
            candidate: { id: 'clcandidate123456', name: 'John Doe' },
            technicalStatus: 'COMPLETED',
            culturalStatus: 'IN_PROGRESS',
            createdAt: '2025-01-01T00:00:00.000Z',
          },
        ],
        total: 50,
        page: 1,
        pageSize: 10,
        totalPages: 5,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or Recruiter access required',
  })
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.evaluationsService.findAll(
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 10,
    );
  }

  @ApiOperation({
    summary: 'Get evaluation by ID',
    description: 'Get a specific evaluation with full details.',
  })
  @ApiParam({
    name: 'id',
    description: 'Evaluation ID',
    example: 'cleval123456',
  })
  @ApiResponse({
    status: 200,
    description: 'Evaluation details',
    schema: {
      example: {
        id: 'cleval123456',
        candidateId: 'clcandidate123456',
        candidate: {
          id: 'clcandidate123456',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'Full Stack Developer',
        },
        technicalStatus: 'COMPLETED',
        technicalScore: 85,
        technicalFeedback: 'Strong technical skills...',
        technicalAudioFile: 'https://s3.amazonaws.com/bucket/technical.mp3',
        culturalStatus: 'IN_PROGRESS',
        culturalScore: null,
        culturalFeedback: null,
        culturalAudioFile: 'https://s3.amazonaws.com/bucket/cultural.mp3',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or Recruiter access required',
  })
  @ApiResponse({ status: 404, description: 'Evaluation not found' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.evaluationsService.findOne(id);
  }

  @ApiOperation({
    summary: 'Update evaluation',
    description: 'Update evaluation status. Admin and Recruiter access.',
  })
  @ApiParam({
    name: 'id',
    description: 'Evaluation ID',
    example: 'cleval123456',
  })
  @ApiBody({ type: UpdateEvaluationDto })
  @ApiResponse({
    status: 200,
    description: 'Evaluation updated successfully',
    schema: {
      example: {
        id: 'cleval123456',
        technicalStatus: 'COMPLETED',
        culturalStatus: 'COMPLETED',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or Recruiter access required',
  })
  @ApiResponse({ status: 404, description: 'Evaluation not found' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateEvaluationDto: UpdateEvaluationDto,
  ) {
    return this.evaluationsService.update(id, updateEvaluationDto);
  }

  @ApiOperation({
    summary: 'Trigger evaluation processing',
    description:
      'Trigger AI processing for the evaluation. Admin and Recruiter access.',
  })
  @ApiParam({
    name: 'id',
    description: 'Evaluation ID',
    example: 'cleval123456',
  })
  @ApiResponse({
    status: 201,
    description: 'Evaluation processing triggered',
    schema: {
      example: {
        message: 'Evaluation processing triggered',
        evaluationId: 'cleval123456',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or Recruiter access required',
  })
  @ApiResponse({ status: 404, description: 'Evaluation not found' })
  @Post(':id/trigger')
  async triggerEvaluation(@Param('id') id: string) {
    return this.evaluationsService.triggerEvaluation(id);
  }
}
