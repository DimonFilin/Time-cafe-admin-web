export enum TaskCategory {
  OPENING = 'OPENING',
  SHIFT = 'SHIFT',
  CLOSING = 'CLOSING',
  GENERAL = 'GENERAL',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum TaskAssignmentType {
  ALL_WORKERS = 'ALL_WORKERS',
  SPECIFIC_WORKERS = 'SPECIFIC_WORKERS',
  ROLE_BASED = 'ROLE_BASED',
}

import type { WorkerRole } from '@/shared/types/worker-role';

export interface TaskTemplate {
  id: string;
  cafeId: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  estimatedMinutes?: number;
  requiresPhoto: boolean;
  requiresComment: boolean;
  assignmentType: TaskAssignmentType;
  assignedWorkerIds: string[];
  assignedRoles: WorkerRole[];
  daysOfWeek: number[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskTemplateDto {
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  estimatedMinutes?: number;
  requiresPhoto: boolean;
  requiresComment: boolean;
  assignmentType: TaskAssignmentType;
  assignedWorkerIds?: string[];
  assignedRoles?: WorkerRole[];
  daysOfWeek?: number[];
}

export interface UpdateTaskTemplateDto {
  title?: string;
  description?: string;
  category?: TaskCategory;
  priority?: TaskPriority;
  estimatedMinutes?: number;
  requiresPhoto?: boolean;
  requiresComment?: boolean;
  assignmentType?: TaskAssignmentType;
  assignedWorkerIds?: string[];
  assignedRoles?: WorkerRole[];
  daysOfWeek?: number[];
}

export interface TaskTemplatesResponse {
  templates: TaskTemplate[];
}

export interface TaskStatistics {
  totalTemplates: number;
  activeTemplates: number;
  totalCompletions: number;
  completionRate: number;
  byCategory: Array<{
    category: TaskCategory;
    count: number;
    completionRate: number;
  }>;
  byPriority: Array<{
    priority: TaskPriority;
    count: number;
    completionRate: number;
  }>;
  byWorker: Array<{
    workerId: string;
    workerName: string;
    completions: number;
    avgDuration: number;
  }>;
}

export interface TaskCompletion {
  id: string;
  templateId: string;
  workerId: string;
  completedAt: string;
  photoUrl?: string;
  comment?: string;
  durationMinutes?: number;
  worker?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface TaskCompletionsResponse {
  completions: TaskCompletion[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}
