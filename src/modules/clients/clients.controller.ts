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
import { Role } from '@prisma/client';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Roles } from '../../common/decorators';

@ApiTags('clients')
@ApiBearerAuth('JWT-auth')
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @ApiOperation({
    summary: 'Create client',
    description: 'Create a new client company. Admin only.',
  })
  @ApiBody({ type: CreateClientDto })
  @ApiResponse({
    status: 201,
    description: 'Client created successfully',
    schema: {
      example: {
        id: 'clclient123456',
        name: 'Acme Corporation',
        companySize: '100-500',
        teamSize: '10-20',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @Post()
  @Roles(Role.ADMIN)
  async create(@Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(createClientDto);
  }

  @ApiOperation({
    summary: 'List all clients',
    description: 'Get paginated list of all clients. Admin and Recruiter access.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of clients',
    schema: {
      example: {
        data: [
          {
            id: 'clclient123456',
            name: 'Acme Corporation',
            companySize: '100-500',
            teamSize: '10-20',
            createdAt: '2025-01-01T00:00:00.000Z',
          },
        ],
        total: 25,
        page: 1,
        pageSize: 10,
        totalPages: 3,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin or Recruiter access required' })
  @Get()
  @Roles(Role.ADMIN, Role.RECRUITER)
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.clientsService.findAll(
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 10,
    );
  }

  @ApiOperation({
    summary: 'Get client by ID',
    description: 'Get a specific client by ID. All authenticated users.',
  })
  @ApiParam({ name: 'id', description: 'Client ID', example: 'clclient123456' })
  @ApiResponse({
    status: 200,
    description: 'Client details',
    schema: {
      example: {
        id: 'clclient123456',
        name: 'Acme Corporation',
        companySize: '100-500',
        teamSize: '10-20',
        users: [{ id: 'cluser123', email: 'user@acme.com' }],
        candidates: [{ id: 'clcandidate123', name: 'John Doe' }],
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @ApiOperation({
    summary: 'Update client',
    description: 'Update client details. Admin only.',
  })
  @ApiParam({ name: 'id', description: 'Client ID', example: 'clclient123456' })
  @ApiBody({ type: UpdateClientDto })
  @ApiResponse({
    status: 200,
    description: 'Client updated successfully',
    schema: {
      example: {
        id: 'clclient123456',
        name: 'Acme Corp Updated',
        companySize: '500-1000',
        teamSize: '20-50',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  @Patch(':id')
  @Roles(Role.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    return this.clientsService.update(id, updateClientDto);
  }

  @ApiOperation({
    summary: 'Delete client',
    description: 'Permanently delete a client. Admin only.',
  })
  @ApiParam({ name: 'id', description: 'Client ID', example: 'clclient123456' })
  @ApiResponse({ status: 200, description: 'Client deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string) {
    return this.clientsService.remove(id);
  }
}
