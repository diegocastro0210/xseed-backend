export type SeniorityLevel = 'junior' | 'mid-level' | 'senior' | 'lead' | 'architect';
export type EvaluationStatus = 'pending' | 'in_queue' | 'evaluating' | 'done' | 'error';

export interface Candidate {
  id: string;
  name: string;
  email: string;
  role: string;
  seniorityLevel: SeniorityLevel;
  clientId: string;
  clientName?: string;
  mustHaveStack: string[];
  niceToHaveStack: string[];
  lastDateEvaluated?: string;
  technicalStatus?: EvaluationStatus;
  culturalStatus?: EvaluationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCandidateRequest {
  name: string;
  email: string;
  role: string;
  seniorityLevel: SeniorityLevel;
  clientId: string;
  mustHaveStack?: string[];
  niceToHaveStack?: string[];
}

export interface UpdateCandidateRequest {
  name?: string;
  email?: string;
  role?: string;
  seniorityLevel?: SeniorityLevel;
  mustHaveStack?: string[];
  niceToHaveStack?: string[];
}
