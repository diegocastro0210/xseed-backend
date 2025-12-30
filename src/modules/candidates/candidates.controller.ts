import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { Role, SeniorityLevel } from '@prisma/client';
import { CandidatesService } from './candidates.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { Roles, CurrentUser } from '../../common/decorators';

@ApiTags('candidates')
@ApiBearerAuth('JWT-auth')
@Controller('candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @ApiOperation({
    summary: 'Create candidate',
    description:
      'Create a new candidate in the talent pool. Admin and Recruiter access.',
  })
  @ApiBody({ type: CreateCandidateDto })
  @ApiResponse({
    status: 201,
    description: 'Candidate created successfully',
    schema: {
      example: {
        id: 'clcandidate123456',
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'Full Stack Developer',
        seniorityLevel: 'SENIOR',
        clientId: 'clclient123456',
        mustHaveStack: ['TypeScript', 'React', 'Node.js'],
        niceToHaveStack: ['AWS', 'Docker'],
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
  @Post()
  @Roles(Role.ADMIN, Role.RECRUITER)
  async create(@Body() createCandidateDto: CreateCandidateDto) {
    return this.candidatesService.create(createCandidateDto);
  }

  @ApiOperation({
    summary: 'List candidates',
    description:
      'Get paginated list of candidates with optional filters. Clients only see their own candidates.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'clientId',
    required: false,
    type: String,
    description: 'Filter by client ID',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    type: String,
    description: 'Filter by job role',
  })
  @ApiQuery({
    name: 'seniorityLevel',
    required: false,
    enum: SeniorityLevel,
    description: 'Filter by seniority level',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by name or email',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of candidates',
    schema: {
      example: {
        data: [
          {
            id: 'clcandidate123456',
            name: 'John Doe',
            email: 'john.doe@example.com',
            role: 'Full Stack Developer',
            seniorityLevel: 'SENIOR',
            clientId: 'clclient123456',
            client: { id: 'clclient123456', name: 'Acme Corp' },
            mustHaveStack: ['TypeScript', 'React'],
            createdAt: '2025-01-01T00:00:00.000Z',
          },
        ],
        total: 100,
        page: 1,
        pageSize: 10,
        totalPages: 10,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get()
  async findAll(
    @CurrentUser() user: { role: Role; clientId?: string },
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('clientId') clientId?: string,
    @Query('role') role?: string,
    @Query('seniorityLevel') seniorityLevel?: string,
    @Query('search') search?: string,
  ) {
    return this.candidatesService.findAll(
      {
        page: page ? parseInt(page, 10) : 1,
        pageSize: pageSize ? parseInt(pageSize, 10) : 10,
        clientId,
        role,
        seniorityLevel,
        search,
      },
      user.role,
      user.clientId,
    );
  }

  @ApiOperation({
    summary: 'Get candidate by ID',
    description: 'Get a specific candidate by ID with full details.',
  })
  @ApiParam({
    name: 'id',
    description: 'Candidate ID',
    example: 'clcandidate123456',
  })
  @ApiResponse({
    status: 200,
    description: 'Candidate details',
    schema: {
      example: {
        id: 'clcandidate123456',
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'Full Stack Developer',
        seniorityLevel: 'SENIOR',
        clientId: 'clclient123456',
        client: { id: 'clclient123456', name: 'Acme Corp' },
        mustHaveStack: ['TypeScript', 'React', 'Node.js'],
        niceToHaveStack: ['AWS', 'Docker', 'GraphQL'],
        evaluations: [{ id: 'cleval123', technicalStatus: 'COMPLETED' }],
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Candidate not found' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.candidatesService.findOne(id);
  }

  @ApiOperation({
    summary: 'Update candidate',
    description: 'Update candidate details. Admin and Recruiter access.',
  })
  @ApiParam({
    name: 'id',
    description: 'Candidate ID',
    example: 'clcandidate123456',
  })
  @ApiResponse({
    status: 200,
    description: 'Candidate updated successfully',
    schema: {
      example: {
        id: 'clcandidate123456',
        name: 'John Doe Updated',
        role: 'Senior Full Stack Developer',
        seniorityLevel: 'LEAD',
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
  @ApiResponse({ status: 404, description: 'Candidate not found' })
  @Patch(':id')
  @Roles(Role.ADMIN, Role.RECRUITER)
  async update(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateCandidateDto>,
  ) {
    return this.candidatesService.update(id, updateData);
  }

  @ApiOperation({
    summary: 'Delete candidate',
    description: 'Permanently delete a candidate. Admin only.',
  })
  @ApiParam({
    name: 'id',
    description: 'Candidate ID',
    example: 'clcandidate123456',
  })
  @ApiResponse({ status: 200, description: 'Candidate deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'Candidate not found' })
  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string) {
    return this.candidatesService.remove(id);
  }
}
