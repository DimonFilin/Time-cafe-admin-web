'use client';

interface AppointmentsTabProps {
  cafeId: string;
}

export function AppointmentsTab({ cafeId }: AppointmentsTabProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Бронирования</h2>
          <p className="text-sm text-[rgb(var(--tc-muted))]">Управление бронированиями столов</p>
        </div>
      </div>

      {/* Content placeholder */}
      <div className="rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] p-8 text-center">
        <div className="text-4xl mb-4">📅</div>
        <h3 className="text-lg font-medium mb-2">Бронирования</h3>
        <p className="text-sm text-[rgb(var(--tc-muted))]">
          Здесь будет календарь и список бронирований
        </p>
        <p className="text-xs text-[rgb(var(--tc-muted))] mt-2">Cafe ID: {cafeId}</p>
      </div>
    </div>
  );
}
