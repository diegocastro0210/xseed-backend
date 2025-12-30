import { Role } from './user';

export type Permission =
  | 'canViewDashboard'
  | 'canViewCandidatePool'
  | 'canViewEvaluations'
  | 'canViewCandidatesUnderEvaluation'
  | 'canViewAssessments'
  | 'canViewAnalytics'
  | 'canViewSettings'
  | 'canViewMyUser'
  | 'canAccessClientOnboarding';

export const PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'canViewDashboard',
    'canViewCandidatePool',
    'canViewEvaluations',
    'canViewCandidatesUnderEvaluation',
    'canViewAssessments',
    'canViewAnalytics',
    'canViewSettings',
    'canViewMyUser',
    'canAccessClientOnboarding',
  ],
  recruiter: [
    'canViewDashboard',
    'canViewCandidatePool',
    'canViewEvaluations',
    'canViewCandidatesUnderEvaluation',
    'canViewAssessments',
    'canViewSettings',
    'canViewMyUser',
  ],
  client: [
    'canViewCandidatePool',
    'canViewMyUser',
    'canAccessClientOnboarding',
  ],
};

export function can(role: Role, permission: Permission): boolean {
  return PERMISSIONS[role]?.includes(permission) ?? false;
}
