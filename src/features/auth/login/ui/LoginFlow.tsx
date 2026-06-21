'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { lookupAccounts } from '@/features/auth/login/api/lookup';
import { fetchMe } from '@/features/auth/login/api/me';
import { selectAccount } from '@/features/auth/login/api/select';
import type { LoginStep } from '@/features/auth/login/model/types';
import type { AccountSummary } from '@/shared/types/account';
import { Button } from '@/shared/ui/button/Button';
import { Card } from '@/shared/ui/card/Card';
import { Input } from '@/shared/ui/input/Input';
import { t } from '@/i18n';

function stepTitle(step: LoginStep) {
  if (step === 'email') return t('auth.login.title');
  if (step === 'password') return t('auth.login.password');
  if (step === 'chooseAccount') return 'Выберите аккаунт';
  return 'Готово';
}

function roleLabel(role: AccountSummary['role']) {
  if (role === 'USER') return 'Пользователь';
  if (role === 'SYSTEM_ADMIN') return t('workers.roles.systemAdmin');
  if (role === 'BRAND_ADMIN') return t('workers.roles.brandAdmin');
  if (role === 'CAFE_ADMIN') return t('workers.roles.cafeAdmin');
  return t('workers.roles.worker');
}

function roleRoute(role: AccountSummary['role']) {
  if (role === 'USER') return '/user';
  if (role === 'SYSTEM_ADMIN') return '/system-admin';
  if (role === 'BRAND_ADMIN') return '/brand-admin';
  if (role === 'CAFE_ADMIN') return '/cafe-admin';
  return '/worker';
}

export function LoginFlow() {
  const router = useRouter();
  const [step, setStep] = useState<LoginStep>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [lookupToken, setLookupToken] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const canGoNext = useMemo(() => {
    if (step === 'email') return email.trim().length > 3;
    if (step === 'password') return password.length > 0;
    if (step === 'chooseAccount') return accounts.length > 0;
    return false;
  }, [accounts.length, email, password, step]);

  async function handleNext() {
    if (isProcessing) return; // Prevent double execution
    setError(null);

    if (step === 'email') {
      setStep('password');
      return;
    }

    if (step === 'password') {
      setIsProcessing(true);
      setPending(true);
      try {
        const result = await lookupAccounts({ email: email.trim(), password });
        setAccounts(result.accounts);
        setLookupToken(result.lookupToken);

        // If only one account, auto-select it
        if (result.accounts.length === 1) {
          const acc = result.accounts[0];
          try {
            const selectResult = await selectAccount({
              accountId: acc.id,
              lookupToken: result.lookupToken,
            });
            const roleFromSelect = (selectResult.user?.role ?? acc.role) as AccountSummary['role'];

            // Optional safety: verify selected account via /me
            const me = await fetchMe().catch(() => null);
            const role = (me?.role ?? roleFromSelect) as AccountSummary['role'];

            router.push(roleRoute(role));
          } catch (selectError) {
            setError(selectError instanceof Error ? selectError.message : String(selectError));
            setIsProcessing(false);
          }
        } else {
          // Multiple accounts - show selection
          setStep('chooseAccount');
          setIsProcessing(false);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setIsProcessing(false);
      } finally {
        setPending(false);
      }
      return;
    }
  }

  function handleBack() {
    setError(null);
    if (step === 'password') setStep('email');
    if (step === 'chooseAccount') setStep('password');
  }

  async function handleSelect(acc: AccountSummary) {
    if (isProcessing) return; // Prevent double execution

    const token = lookupToken;
    if (!token) {
      setError('lookupToken отсутствует — повторите ввод пароля');
      setStep('password');
      return;
    }

    setIsProcessing(true);
    setPending(true);
    setError(null);
    try {
      const result = await selectAccount({ accountId: acc.id, lookupToken: token });
      const roleFromSelect = (result.user?.role ?? acc.role) as AccountSummary['role'];

      // Optional safety: verify selected account via /me (uses tc_account_id + tc_access).
      const me = await fetchMe().catch(() => null);
      const role = (me?.role ?? roleFromSelect) as AccountSummary['role'];

      router.push(roleRoute(role));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setIsProcessing(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-md gap-6">
      <div className="text-center">
        <div className="text-2xl font-semibold tracking-tight text-[rgb(var(--tc-fg))]">
          {stepTitle(step)}
        </div>
      </div>

      <Card className="overflow-hidden bg-[rgb(var(--tc-surface))]">
        <div className="border-b border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface-2))] px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">TimeCaffe</div>
            <div className="text-xs text-[rgb(var(--tc-muted))]">
              {step === 'email'
                ? '1/3'
                : step === 'password'
                  ? '2/3'
                  : step === 'chooseAccount'
                    ? '3/3'
                    : ''}
            </div>
          </div>
        </div>

        <div className="relative px-5 py-5">
          <AnimatePresence mode="wait" initial={false}>
            {step === 'email' && (
              <motion.div
                key="email"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.18 }}
                className="grid gap-4"
              >
                <label className="grid gap-2">
                  <span className="text-xs font-medium text-[rgb(var(--tc-muted))]">
                    {t('auth.login.email')}
                  </span>
                  <Input
                    autoComplete="email"
                    inputMode="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
              </motion.div>
            )}

            {step === 'password' && (
              <motion.div
                key="password"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.18 }}
                className="grid gap-4"
              >
                <div className="text-xs text-[rgb(var(--tc-muted))]">
                  {t('auth.login.email')}: {email || '—'}
                </div>
                <label className="grid gap-2">
                  <span className="text-xs font-medium text-[rgb(var(--tc-muted))]">
                    {t('auth.login.password')}
                  </span>
                  <Input
                    autoComplete="current-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
                {error && (
                  <div className="rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface-2))] px-3 py-2 text-xs text-[rgb(var(--tc-danger))]">
                    {error}
                  </div>
                )}
              </motion.div>
            )}

            {step === 'chooseAccount' && (
              <motion.div
                key="chooseAccount"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.18 }}
                className="grid gap-3"
              >
                <div className="text-xs text-[rgb(var(--tc-muted))]">
                  Найдено аккаунтов: {accounts.length}
                </div>
                <div className="grid gap-2">
                  {accounts.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      disabled={pending}
                      onClick={() => handleSelect(acc)}
                      className="group rounded-2xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface-2))] px-4 py-3 text-left transition-colors hover:bg-[rgb(var(--tc-surface))] disabled:opacity-70"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold">{acc.displayName}</div>
                          <div className="mt-1 truncate text-xs text-[rgb(var(--tc-muted))]">
                            {acc.email}
                          </div>
                        </div>
                        <div className="shrink-0 rounded-lg bg-[rgb(var(--tc-accent))] px-2 py-1 text-[10px] font-semibold text-[rgb(var(--tc-accent-contrast))]">
                          {roleLabel(acc.role)}
                        </div>
                      </div>
                      <div className="mt-2 text-[11px] text-[rgb(var(--tc-muted))] group-hover:text-[rgb(var(--tc-fg))]">
                        Выбрать →
                      </div>
                    </button>
                  ))}
                </div>
                {error && (
                  <div className="rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface-2))] px-3 py-2 text-xs text-[rgb(var(--tc-danger))]">
                    {error}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface-2))] px-5 py-4">
          <Button variant="ghost" onClick={handleBack} disabled={pending || step === 'email'}>
            {t('common.back')}
          </Button>
          <Button onClick={handleNext} disabled={pending || !canGoNext || step === 'chooseAccount'}>
            {pending
              ? t('common.loading')
              : step === 'password'
                ? t('common.next')
                : step === 'email'
                  ? t('common.next')
                  : t('common.next')}
          </Button>
        </div>
      </Card>
    </div>
  );
}
