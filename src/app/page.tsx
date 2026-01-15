export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 p-8 text-zinc-900">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-2xl font-semibold">TimeCaffe Admin Web</h1>
        <p className="text-sm text-zinc-600">
          Dev-страница. Перейдите в{' '}
          <a className="text-blue-600 hover:underline" href="/admin">
            /admin
          </a>{' '}
          для проверки связи с backend-shared.
        </p>
      </div>
    </div>
  );
}
