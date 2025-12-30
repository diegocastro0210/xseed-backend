import { EvaluationStatus, SeniorityLevel } from './candidate';

export interface Evaluation {
  id: string;
  candidateId: string;
  technicalStatus: EvaluationStatus;
  culturalStatus: EvaluationStatus;
  technicalAudioFile?: string;
  culturalAudioFile?: string;
  technicalResult?: Record<string, unknown>;
  culturalResult?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// This is the format returned by the evaluations list endpoint
export interface EvaluationListItem {
  id: string;
  candidateName: string;
  appliedRole: string;
  seniorityLevel: SeniorityLevel;
  clientName: string;
  technicalStatus: EvaluationStatus;
  culturalStatus: EvaluationStatus;
  lastUpdated: string;
}

export interface CreateEvaluationRequest {
  candidateId: string;
  technicalAudioFile?: string;
  culturalAudioFile?: string;
}

export interface UpdateEvaluationRequest {
  technicalStatus?: EvaluationStatus;
  culturalStatus?: EvaluationStatus;
}
