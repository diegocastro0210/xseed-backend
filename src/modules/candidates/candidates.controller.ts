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
import { Role } from '@prisma/client';
import { CandidatesService } from './candidates.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { Roles, CurrentUser } from '../../common/decorators';

@Controller('candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.RECRUITER)
  async create(@Body() createCandidateDto: CreateCandidateDto) {
    return this.candidatesService.create(createCandidateDto);
  }

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

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.candidatesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.RECRUITER)
  async update(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateCandidateDto>,
  ) {
    return this.candidatesService.update(id, updateData);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string) {
    return this.candidatesService.remove(id);
  }
}
