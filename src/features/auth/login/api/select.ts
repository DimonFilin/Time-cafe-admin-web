export async function selectAccount(input: { accountId: string; lookupToken: string }) {
  const res = await fetch('/api/auth/select', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(msg || `Select failed: ${res.status}`);
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
