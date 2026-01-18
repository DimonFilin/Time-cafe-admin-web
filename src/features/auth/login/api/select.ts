export async function selectAccount(input: { accountId: string; lookupToken: string }) {
  const res = await fetch('/api/auth/select', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    try {
      const errorData = await res.json().catch(() => null);
      const message = errorData?.message || `Ошибка выбора аккаунта: ${res.status}`;
      throw new Error(message);
    } catch (e) {
      if (e instanceof Error) throw e;
      throw new Error(`Ошибка выбора аккаунта: ${res.status}`);
    }
  }

  return (await res.json()) as {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: {
      role: string;
    };
  };
}
