'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/shared/ui/modal/Modal';
import { MoneyAmount } from '@/shared/ui/currency/MoneyAmount';

interface MenuItem {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  price: string;
  currency: string;
  sortOrder: number;
  isActive: boolean;
}

interface MenuCategory {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
  items: MenuItem[];
}

interface CafeMenuResponse {
  cafeId: string;
  categories: MenuCategory[];
}

interface CafeMenuModalProps {
  cafeId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CafeMenuModal({ cafeId, isOpen, onClose }: CafeMenuModalProps) {
  const [menu, setMenu] = useState<CafeMenuResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !cafeId) return;
    const controller = new AbortController();
    fetch(`/api/cafes/${cafeId}/menu`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load menu');
        return res.json();
      })
      .then((data) => {
        setError(null);
        setMenu(data);
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : 'Failed to load menu');
        setMenu(null);
      });
    return () => controller.abort();
  }, [cafeId, isOpen]);

  return (
    <Modal open={isOpen} onClose={onClose} title="Меню кафе" size="lg">
      {!menu && !error ? (
        <div className="py-8 text-center text-[rgb(var(--tc-muted))]">Загрузка меню...</div>
      ) : error ? (
        <div className="py-4 text-red-600">{error}</div>
      ) : menu && menu.categories.length === 0 ? (
        <div className="py-4 text-[rgb(var(--tc-muted))]">Меню пустое</div>
      ) : menu ? (
        <div className="max-h-[70vh] overflow-y-auto space-y-6">
          {menu.categories.map((cat) => (
            <div
              key={cat.id}
              className="border-b border-[rgb(var(--tc-border))] pb-4 last:border-0"
            >
              <h3 className="text-base font-semibold">{cat.name}</h3>
              {cat.description ? (
                <p className="text-sm text-[rgb(var(--tc-muted))]">{cat.description}</p>
              ) : null}
              <ul className="mt-2 space-y-2">
                {cat.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex justify-between gap-4 rounded-lg border border-[rgb(var(--tc-border))] p-2 text-sm"
                  >
                    <div>
                      <span className="font-medium">{item.name}</span>
                      {item.description ? (
                        <span className="ml-2 text-[rgb(var(--tc-muted))]">
                          — {item.description}
                        </span>
                      ) : null}
                    </div>
                    <span className="shrink-0 font-medium">
                      <MoneyAmount value={item.price} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}
    </Modal>
  );
}
