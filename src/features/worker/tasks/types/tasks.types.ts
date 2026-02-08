// Task types matching backend DTOs

export type TaskCategory = 'OPENING' | 'SHIFT' | 'CLOSING' | 'GENERAL';

export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export type TaskAssignmentType = 'ALL_WORKERS' | 'SPECIFIC_WORKERS' | 'ROLE_BASED';

export interface TaskTemplate {
  id: string;
  cafeId: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  requiresPhoto: boolean;
  requiresComment: boolean;
  estimatedMinutes?: number;
  assignmentType: TaskAssignmentType;
  assignedWorkerIds: string[];
  assignedRoles: string[];
  isActive: boolean;
  daysOfWeek: number[]; // 1=Monday, 7=Sunday, empty=every day
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskCompletion {
  id: string;
  templateId: string;
  workerId: string;
  completedAt: string;
  completionDate: string;
  photoUrl?: string;
  comment?: string;
  durationMinutes?: number;
}

export interface WorkerTask {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  requiresPhoto: boolean;
  requiresComment: boolean;
  estimatedMinutes?: number;
  completed: boolean;
  completedAt?: string;
  photoUrl?: string;
  comment?: string;
  durationMinutes?: number;
}

export interface WorkerTasksResponse {
  tasks: WorkerTask[];
  completedCount: number;
  totalCount: number;
  date: string;
}

export interface CompleteTaskRequest {
  completionDate: string;
  photoUrl?: string;
  comment?: string;
  durationMinutes?: number;
}
