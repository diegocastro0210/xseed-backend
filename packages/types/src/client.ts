export interface Client {
  id: string;
  name: string;
  companySize?: string;
  teamSize?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
    jobOpenings: number;
    candidates: number;
  };
}

export interface CreateClientRequest {
  name: string;
  companySize?: string;
  teamSize?: string;
}

export interface UpdateClientRequest {
  name?: string;
  companySize?: string;
  teamSize?: string;
}
