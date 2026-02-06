'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/shared/ui/card/Card';
import { Badge } from '@/shared/ui/badge/Badge';
import { Button } from '@/shared/ui/button/Button';
import { BrandEditModal } from './BrandEditModal';

interface Brand {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  description?: string;
  logo?: string;
  primaryColor?: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';
  isVerified: boolean;
}

interface BrandStats {
  cafesCount: number;
  workersCount: number;
  apiKeysCount: number;
  ordersCount: number;
  reviewsAverage: number;
}

export function BrandOverviewTab() {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [stats, setStats] = useState<BrandStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    fetchBrandData();
  }, []);

  const fetchBrandData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch brand info from API proxy
      const brandRes = await fetch('/api/brand');
      if (!brandRes.ok) throw new Error('Failed to fetch brand data');
      const brandData = await brandRes.json();
      setBrand(brandData);

      // Fetch stats from API proxy
      const statsRes = await fetch('/api/brand/stats');
      if (!statsRes.ok) throw new Error('Failed to fetch brand stats');
      const statsData = await statsRes.json();
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBrand = async (updatedData: Partial<Brand>) => {
    try {
      const response = await fetch(`/api/brand`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('[BrandOverviewTab] Update error:', {
          status: response.status,
          error: errorData,
        });
        throw new Error(errorData.message || errorData.details || 'Failed to update brand');
      }

      const updatedBrand = await response.json();
      setBrand(updatedBrand);
      setEditOpen(false);
    } catch (err) {
      console.error('[BrandOverviewTab] Save error:', err);
      throw err;
    }
  };

  const getStatusColor = (
    status: string,
  ): 'bg-green-500' | 'bg-yellow-500' | 'bg-red-500' | 'bg-gray-500' => {
    const colors: {
      [key: string]: 'bg-green-500' | 'bg-yellow-500' | 'bg-red-500' | 'bg-gray-500';
    } = {
      ACTIVE: 'bg-green-500',
      PENDING: 'bg-yellow-500',
      SUSPENDED: 'bg-red-500',
      REJECTED: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-[rgb(var(--tc-border))]" />
        <div className="h-48 animate-pulse rounded bg-[rgb(var(--tc-border))]" />
      </div>
    );
  }

  // Error state
  if (error || !brand) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Brand Overview</h2>
        </div>
        <Card className="p-6">
          <div className="text-center">
            <p className="text-red-500">{error || 'Failed to load brand data'}</p>
            <Button onClick={fetchBrandData} className="mt-4">
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Success state
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Brand Overview</h2>
          <p className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
            Manage your brand profile, contact information, and view key statistics.
          </p>
        </div>
        <Button onClick={() => setEditOpen(true)} variant="secondary">
          Edit Profile
        </Button>
      </div>

      {/* Brand Profile Card */}
      <Card className="p-6">
        <div className="space-y-6">
          {/* Header with Logo and Name */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {brand.logo ? (
                <img
                  src={brand.logo}
                  alt={brand.name}
                  className="h-16 w-16 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[rgb(var(--tc-accent))]">
                  <span className="text-2xl font-bold text-white">{brand.name[0]}</span>
                </div>
              )}
              <div>
                <h3 className="text-2xl font-bold">{brand.name}</h3>
                <div className="mt-2 flex items-center gap-2">
                  <Badge className={`${getStatusColor(brand.status)} text-white`}>
                    {brand.status}
                  </Badge>
                  {brand.isVerified && <Badge className="bg-blue-500 text-white">Verified</Badge>}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {brand.description && (
            <div>
              <h4 className="text-sm font-medium text-[rgb(var(--tc-muted))]">Description</h4>
              <p className="mt-1 text-sm">{brand.description}</p>
            </div>
          )}

          {/* Contact Information Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {brand.email && (
              <div>
                <h4 className="text-sm font-medium text-[rgb(var(--tc-muted))]">Email</h4>
                <p className="mt-1 text-sm">
                  <a
                    href={`mailto:${brand.email}`}
                    className="text-[rgb(var(--tc-accent))] hover:underline"
                  >
                    {brand.email}
                  </a>
                </p>
              </div>
            )}
            {brand.phone && (
              <div>
                <h4 className="text-sm font-medium text-[rgb(var(--tc-muted))]">Phone</h4>
                <p className="mt-1 text-sm">
                  <a
                    href={`tel:${brand.phone}`}
                    className="text-[rgb(var(--tc-accent))] hover:underline"
                  >
                    {brand.phone}
                  </a>
                </p>
              </div>
            )}
            {brand.website && (
              <div>
                <h4 className="text-sm font-medium text-[rgb(var(--tc-muted))]">Website</h4>
                <p className="mt-1 text-sm">
                  <a
                    href={brand.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[rgb(var(--tc-accent))] hover:underline"
                  >
                    {brand.website}
                  </a>
                </p>
              </div>
            )}
            {brand.address && (
              <div>
                <h4 className="text-sm font-medium text-[rgb(var(--tc-muted))]">Address</h4>
                <p className="mt-1 text-sm">{brand.address}</p>
              </div>
            )}
            {brand.primaryColor && (
              <div>
                <h4 className="text-sm font-medium text-[rgb(var(--tc-muted))]">Primary Color</h4>
                <div className="mt-1 flex items-center gap-2">
                  <div
                    className="h-6 w-6 rounded border border-[rgb(var(--tc-border))]"
                    style={{ backgroundColor: brand.primaryColor }}
                  />
                  <code className="text-xs text-[rgb(var(--tc-muted))]">{brand.primaryColor}</code>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-[rgb(var(--tc-accent))]">
                {stats.cafesCount}
              </div>
              <p className="mt-1 text-sm text-[rgb(var(--tc-muted))]">Cafes</p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-[rgb(var(--tc-accent))]">
                {stats.workersCount}
              </div>
              <p className="mt-1 text-sm text-[rgb(var(--tc-muted))]">Workers</p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-[rgb(var(--tc-accent))]">
                {stats.apiKeysCount}
              </div>
              <p className="mt-1 text-sm text-[rgb(var(--tc-muted))]">API Keys</p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-[rgb(var(--tc-accent))]">
                {stats.ordersCount}
              </div>
              <p className="mt-1 text-sm text-[rgb(var(--tc-muted))]">Total Orders</p>
            </div>
          </Card>
        </div>
      )}

      {/* Edit Modal */}
      {brand && (
        <BrandEditModal
          brand={brand}
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          onSave={handleSaveBrand}
        />
      )}
    </div>
  );
}
