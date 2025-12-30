import { SeniorityLevel } from './candidate';

export type JobStatus = 'open' | 'closed' | 'on-hold';
export type EmploymentType = 'full-time' | 'part-time' | 'contract';
export type SalaryPeriod = 'hourly' | 'monthly' | 'yearly';

export interface SalaryRange {
  min: number;
  max: number;
  period: SalaryPeriod;
}

export interface JobOpening {
  id: string;
  title: string;
  description?: string;
  descriptionFile?: string;
  clientId: string;
  clientName?: string;
  seniorityLevel: SeniorityLevel;
  requiredSkills: string[];
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryPeriod?: SalaryPeriod;
  employmentType: EmploymentType;
  status: JobStatus;
  applicantsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobOpeningRequest {
  title: string;
  description?: string;
  descriptionFile?: string;
  clientId: string;
  seniorityLevel: SeniorityLevel;
  requiredSkills: string[];
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryPeriod?: SalaryPeriod;
  employmentType: EmploymentType;
}

export interface UpdateJobOpeningRequest {
  title?: string;
  description?: string;
  descriptionFile?: string;
  seniorityLevel?: SeniorityLevel;
  requiredSkills?: string[];
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryPeriod?: SalaryPeriod;
  employmentType?: EmploymentType;
  status?: JobStatus;
}
