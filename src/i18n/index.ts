import ru from './ru.json';

type Dict = Record<string, unknown>;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

// Используем русский язык по умолчанию
const dict: Dict = ru as Dict;

export function t(key: string): string {
  const parts = key.split('.');
  let cur: unknown = dict;
  for (const part of parts) {
    if (!isRecord(cur) || !(part in cur)) return key;
    cur = cur[part];
  }
  return typeof cur === 'string' ? cur : key;
}
