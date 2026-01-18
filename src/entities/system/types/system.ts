export interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  checks: {
    database: {
      status: 'ok' | 'error';
      message?: string;
      responseTime?: number;
    };
    storage?: {
      status: 'ok' | 'error';
      message?: string;
      responseTime?: number;
    };
    [key: string]:
      | {
          status: 'ok' | 'error';
          message?: string;
          responseTime?: number;
        }
      | undefined;
  };
}

export interface SystemMetrics {
  uptime: number;
  memory: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
    external: number;
  };
  database: {
    activeConnections: number;
  };
  requests: {
    total: number;
    successful: number;
    errors: number;
    avgResponseTime: number;
  };
  timestamp: string;
}
