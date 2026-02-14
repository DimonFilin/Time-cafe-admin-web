// Task enums
export type TaskCategory = 'OPENING' | 'SHIFT' | 'CLOSING' | 'GENERAL';

export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export type TaskAssignmentType = 'ALL_WORKERS' | 'SPECIFIC_WORKERS' | 'ROLE_BASED';

// Task Template interface
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
  assignedWorkerIds?: string[];
  assignedRoles?: string[];
  isActive: boolean;
  daysOfWeek: number[]; // 1=Mon, 7=Sun, empty=every day
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

// Task Completion interface
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

// Worker Task (template + completion status)
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

// Worker Tasks Response
export interface WorkerTasksResponse {
  tasks: WorkerTask[];
  completedCount: number;
  totalCount: number;
  date: string;
}

// Complete Task DTO
export interface CompleteTaskDto {
  completionDate: string;
  photoUrl?: string;
  comment?: string;
  durationMinutes?: number;
}
