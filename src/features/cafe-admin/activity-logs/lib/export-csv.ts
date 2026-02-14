import type { ActivityLog } from '../api/activity-logs-api';

/**
 * Конвертирует массив логов в CSV формат
 */
export function convertLogsToCSV(logs: ActivityLog[]): string {
  if (logs.length === 0) {
    return '';
  }

  // Заголовки CSV
  const headers = [
    'Timestamp',
    'Worker Name',
    'Worker Email',
    'Worker Role',
    'Action',
    'Category',
    'Severity',
    'Resource Type',
    'Resource ID',
    'Brand',
    'Cafe',
    'IP Address',
    'Endpoint',
    'Method',
    'Status Code',
    'Duration (ms)',
    'Details',
  ];

  // Escape CSV values
  const escapeCSV = (value: unknown): string => {
    if (value === null || value === undefined) {
      return '';
    }
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  // Формируем строки данных
  const rows = logs.map((log) => {
    const workerName = log.worker ? `${log.worker.firstName} ${log.worker.lastName}` : '';
    const details = log.details ? JSON.stringify(log.details) : '';

    return [
      escapeCSV(new Date(log.createdAt).toLocaleString()),
      escapeCSV(workerName),
      escapeCSV(log.worker?.email || log.workerEmail),
      escapeCSV(log.workerRole),
      escapeCSV(log.action),
      escapeCSV(log.category),
      escapeCSV(log.severity),
      escapeCSV(log.resourceType || ''),
      escapeCSV(log.resourceId || ''),
      escapeCSV(log.brand?.name || ''),
      escapeCSV(log.cafe?.name || ''),
      escapeCSV(log.ipAddress || ''),
      escapeCSV(log.endpoint || ''),
      escapeCSV(log.method || ''),
      escapeCSV(log.statusCode || ''),
      escapeCSV(log.duration || ''),
      escapeCSV(details),
    ].join(',');
  });

  // Объединяем заголовки и строки
  return [headers.join(','), ...rows].join('\n');
}

/**
 * Скачивает CSV файл
 */
export function downloadCSV(csvContent: string, filename: string = 'activity-logs.csv'): void {
  // Создаем Blob с BOM для корректного отображения UTF-8 в Excel
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });

  // Создаем ссылку для скачивания
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Освобождаем URL
  URL.revokeObjectURL(url);
}

/**
 * Экспортирует логи в CSV и скачивает файл
 */
export function exportLogsToCSV(logs: ActivityLog[], filename?: string): void {
  const csvContent = convertLogsToCSV(logs);

  if (!csvContent) {
    throw new Error('No logs to export');
  }

  const defaultFilename = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(csvContent, filename || defaultFilename);
}
