export interface Project {
  id: string;
  name: string;
  type: string;
  location: string | null;
  legalEntity: string | null;
  legalForm: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  constructionStartDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectCreateInput {
  name: string;
  type: string;
  location?: string;
  legalEntity?: string;
  legalForm?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  constructionStartDate?: string;
  notes?: string;
}
