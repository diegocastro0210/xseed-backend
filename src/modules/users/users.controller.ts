import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto';
import { Roles } from '../../common/decorators';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({
    summary: 'List all users',
    description: 'Get paginated list of all users. Admin only.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of users',
    schema: {
      example: {
        data: [
          {
            id: 'cluser123456',
            email: 'user@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'RECRUITER',
            clientId: null,
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
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @Get()
  @Roles(Role.ADMIN)
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.usersService.findAll(
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 10,
    );
  }

  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Get a specific user by their ID. Admin only.',
  })
  @ApiParam({ name: 'id', description: 'User ID', example: 'cluser123456' })
  @ApiResponse({
    status: 200,
    description: 'User details',
    schema: {
      example: {
        id: 'cluser123456',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'RECRUITER',
        clientId: 'clclient123',
        client: { id: 'clclient123', name: 'Acme Corp' },
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Get(':id')
  @Roles(Role.ADMIN)
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @ApiOperation({
    summary: 'Update user',
    description: 'Update user first name and/or last name. Admin only.',
  })
  @ApiParam({ name: 'id', description: 'User ID', example: 'cluser123456' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    schema: {
      example: {
        id: 'cluser123456',
        email: 'user@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'RECRUITER',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Patch(':id')
  @Roles(Role.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateData: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateData);
  }

  @ApiOperation({
    summary: 'Delete user',
    description: 'Permanently delete a user. Admin only.',
  })
  @ApiParam({ name: 'id', description: 'User ID', example: 'cluser123456' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
