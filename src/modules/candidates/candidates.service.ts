import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { Role } from '@prisma/client';

interface FindAllOptions {
  page?: number;
  pageSize?: number;
  clientId?: string;
  role?: string;
  seniorityLevel?: string;
  search?: string;
}

@Injectable()
export class CandidatesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCandidateDto: CreateCandidateDto) {
    return this.prisma.candidate.create({
      data: createCandidateDto,
      include: {
        client: { select: { id: true, name: true } },
        evaluations: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
  }

  async findAll(options: FindAllOptions, userRole: Role, userClientId?: string) {
    const { page = 1, pageSize = 10, clientId, role, seniorityLevel, search } = options;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};

    // Clients can only see their own candidates
    if (userRole === Role.CLIENT && userClientId) {
      where.clientId = userClientId;
    } else if (clientId) {
      where.clientId = clientId;
    }

    if (role) {
      where.role = { contains: role, mode: 'insensitive' };
    }

    if (seniorityLevel) {
      where.seniorityLevel = seniorityLevel;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [candidates, total] = await Promise.all([
      this.prisma.candidate.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          client: { select: { id: true, name: true } },
          evaluations: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.candidate.count({ where }),
    ]);

    // Transform to include latest evaluation status
    const data = candidates.map((candidate) => ({
      ...candidate,
      technicalStatus: candidate.evaluations[0]?.technicalStatus ?? null,
      culturalStatus: candidate.evaluations[0]?.culturalStatus ?? null,
      lastDateEvaluated: candidate.evaluations[0]?.updatedAt ?? null,
    }));

    return {
      data,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true } },
        evaluations: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    return candidate;
  }

  async update(id: string, updateData: Partial<CreateCandidateDto>) {
    await this.findOne(id);

    return this.prisma.candidate.update({
      where: { id },
      data: updateData,
      include: {
        client: { select: { id: true, name: true } },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.candidate.delete({
      where: { id },
    });

    return { message: 'Candidate deleted successfully' };
  }
}
