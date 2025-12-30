import { SeniorityLevel } from './candidate';

export type QuestionType = 'text' | 'file';

export interface TechnicalQuestion {
  id: string;
  title: string;
  questionType: QuestionType;
  clientId?: string;
  clientName?: string;
  jobPosition: string;
  primaryTech: string;
  techTags: string[];
  questionFile?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TechnicalProfile {
  id: string;
  title: string;
  content: Record<SeniorityLevel, { content: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface TechnicalSkill {
  id: string;
  title: string;
  content: Record<SeniorityLevel, { content: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTechnicalQuestionRequest {
  title: string;
  questionType: QuestionType;
  clientId?: string;
  jobPosition: string;
  primaryTech: string;
  techTags?: string[];
  questionFile?: string;
}
