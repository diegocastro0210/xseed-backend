import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';

@Injectable()
export class EvaluationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createEvaluationDto: CreateEvaluationDto) {
    // Verify candidate exists
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: createEvaluationDto.candidateId },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    return this.prisma.evaluation.create({
      data: createEvaluationDto,
      include: {
        candidate: {
          include: {
            client: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  async findAll(page = 1, pageSize = 10) {
    const skip = (page - 1) * pageSize;

    const [evaluations, total] = await Promise.all([
      this.prisma.evaluation.findMany({
        skip,
        take: pageSize,
        include: {
          candidate: {
            include: {
              client: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.evaluation.count(),
    ]);

    // Transform data to match frontend expected format
    const data = evaluations.map((evaluation) => ({
      id: evaluation.id,
      candidateName: evaluation.candidate.name,
      appliedRole: evaluation.candidate.role,
      seniorityLevel: evaluation.candidate.seniorityLevel,
      clientName: evaluation.candidate.client.name,
      technicalStatus: evaluation.technicalStatus,
      culturalStatus: evaluation.culturalStatus,
      lastUpdated: evaluation.updatedAt,
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
    const evaluation = await this.prisma.evaluation.findUnique({
      where: { id },
      include: {
        candidate: {
          include: {
            client: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!evaluation) {
      throw new NotFoundException('Evaluation not found');
    }

    return evaluation;
  }

  async update(id: string, updateEvaluationDto: UpdateEvaluationDto) {
    await this.findOne(id);

    return this.prisma.evaluation.update({
      where: { id },
      data: updateEvaluationDto,
      include: {
        candidate: {
          include: {
            client: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  // TODO: Future implementation - Audio/File Evaluation Processing
  // This will be implemented using:
  // - AWS SQS for async job queuing
  // - Worker containers for AI evaluation processing
  // - Integration with speech-to-text APIs
  // - Scoring algorithms for technical & cultural fit
  async triggerEvaluation(id: string) {
    // Verify evaluation exists (throws if not found)
    await this.findOne(id);

    // For now, just update status to IN_QUEUE
    // In production, this would push to SQS
    return this.prisma.evaluation.update({
      where: { id },
      data: {
        technicalStatus: 'IN_QUEUE',
        culturalStatus: 'IN_QUEUE',
      },
    });
  }
}
