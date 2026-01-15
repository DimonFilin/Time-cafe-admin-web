import Link from 'next/link';
import { fetchBackendPing } from '@/shared/api/backend';

export default async function AdminPage() {
  const ping = await fetchBackendPing();

  return (
    <div className="min-h-screen bg-zinc-50 p-8 text-zinc-900">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">TimeCaffe Admin (dev)</h1>
          <p className="text-sm text-zinc-600">
            Проверка связи с backend-shared:{' '}
            <span className="font-mono">
              {ping.status} / {ping.message}
            </span>
          </p>
        </header>

        <section className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-lg font-medium">Навигация</h2>
          <ul className="mt-3 list-disc pl-5 text-sm text-zinc-700">
            <li>
              <Link className="text-blue-600 hover:underline" href="/">
                Главная
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
