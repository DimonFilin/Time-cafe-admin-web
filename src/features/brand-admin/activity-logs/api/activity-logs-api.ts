// Activity Logs API Client

export enum ActivityAction {
  // Auth
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  TOKEN_REFRESH = 'TOKEN_REFRESH',

  // Data operations
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  BULK_UPDATE = 'BULK_UPDATE',
  BULK_DELETE = 'BULK_DELETE',

  // Views
  VIEW_LIST = 'VIEW_LIST',
  VIEW_DETAIL = 'VIEW_DETAIL',
  VIEW_REPORT = 'VIEW_REPORT',
  EXPORT_DATA = 'EXPORT_DATA',

  // Navigation
  PAGE_VIEW = 'PAGE_VIEW',
  MODAL_OPEN = 'MODAL_OPEN',
  MODAL_CLOSE = 'MODAL_CLOSE',
  TAB_SWITCH = 'TAB_SWITCH',

  // Config
  UPDATE_SETTINGS = 'UPDATE_SETTINGS',
  UPDATE_PERMISSIONS = 'UPDATE_PERMISSIONS',

  // Special
  FILE_UPLOAD = 'FILE_UPLOAD',
  FILE_DELETE = 'FILE_DELETE',
  PAYMENT_PROCESS = 'PAYMENT_PROCESS',
}

export enum ActivityCategory {
  AUTH = 'AUTH',
  DATA = 'DATA',
  VIEW = 'VIEW',
  CONFIG = 'CONFIG',
  FINANCIAL = 'FINANCIAL',
  SECURITY = 'SECURITY',
}

export enum LogSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

export interface ActivityLog {
  id: string;
  workerId: string;
  workerEmail: string;
  workerRole: string;
  brandId?: string;
  cafeId?: string;
  action: ActivityAction;
  category: ActivityCategory;
  severity: LogSeverity;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  createdAt: string;
  worker?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  brand?: {
    id: string;
    name: string;
  };
  cafe?: {
    id: string;
    name: string;
  };
}

export interface ActivityLogsFilters {
  workerId?: string;
  action?: ActivityAction;
  category?: ActivityCategory;
  severity?: LogSeverity;
  resourceType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'action' | 'category' | 'workerEmail';
  sortOrder?: 'asc' | 'desc';
}

export interface ActivityLogsResponse {
  logs: ActivityLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ActivityLogsStatistics {
  byAction: Array<{ action: ActivityAction; _count: number }>;
  byCategory: Array<{ category: ActivityCategory; _count: number }>;
  bySeverity: Array<{ severity: LogSeverity; _count: number }>;
}

export interface CreateActivityLogDto {
  action: ActivityAction;
  category: ActivityCategory;
  severity?: LogSeverity;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Получить логи активности с фильтрацией
 */
export async function getActivityLogs(
  filters: ActivityLogsFilters = {},
): Promise<ActivityLogsResponse> {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value.toString());
    }
  });

  const response = await fetch(`/api/activity-logs?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch activity logs');
  }

  return response.json();
}

/**
 * Получить статистику по логам
 */
export async function getActivityLogsStatistics(
  filters: Pick<ActivityLogsFilters, 'startDate' | 'endDate'> = {},
): Promise<ActivityLogsStatistics> {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value.toString());
    }
  });

  const response = await fetch(`/api/activity-logs/statistics?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch activity logs statistics');
  }

  return response.json();
}

/**
 * Создать лог активности (для клиентских действий)
 */
export async function createActivityLog(data: CreateActivityLogDto): Promise<{ message: string }> {
  const response = await fetch('/api/activity-logs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to create activity log');
  }

  return response.json();
}
