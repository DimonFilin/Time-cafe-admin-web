'use client';

interface TasksTabProps {
  workerId: string;
}

export function TasksTab({ workerId }: TasksTabProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Задачи</h2>
          <p className="text-sm text-[rgb(var(--tc-muted))]">Чек-листы и задачи на смену</p>
        </div>
      </div>

      {/* Content placeholder */}
      <div className="rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] p-8 text-center">
        <div className="text-4xl mb-4">✅</div>
        <h3 className="text-lg font-medium mb-2">Задачи</h3>
        <p className="text-sm text-[rgb(var(--tc-muted))]">
          Здесь будут задачи на открытие/закрытие смены и текущие задачи
        </p>
        <p className="text-xs text-[rgb(var(--tc-muted))] mt-2">Worker ID: {workerId}</p>
      </div>
    </div>
  );
}
