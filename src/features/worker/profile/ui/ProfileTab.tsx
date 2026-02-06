'use client';

interface WorkerInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface ProfileTabProps {
  worker: WorkerInfo;
}

export function ProfileTab({ worker }: ProfileTabProps) {
  return (
    <div className="rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-card))] p-6">
      <h2 className="mb-4 text-xl font-semibold">Profile</h2>
      <div className="space-y-2">
        <p>
          <span className="font-medium">Name:</span> {worker.firstName} {worker.lastName}
        </p>
        <p>
          <span className="font-medium">Email:</span> {worker.email}
        </p>
        <p>
          <span className="font-medium">Role:</span> {worker.role}
        </p>
      </div>
    </div>
  );
}
