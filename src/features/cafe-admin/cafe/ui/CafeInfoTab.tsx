'use client';

import { useState, useEffect } from 'react';
import { getMyCafe } from '../api/cafe-api';
import { Cafe } from '../types/cafe.types';
import { EditCafeModal } from './EditCafeModal';
import { EditScheduleModal } from './EditScheduleModal';

export function CafeInfoTab() {
  const [cafe, setCafe] = useState<Cafe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const loadCafe = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyCafe();
      setCafe(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cafe information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCafe();
  }, []);

  if (loading) {
    return (
      <div className="cafe-info-loading">
        <div className="spinner"></div>
        <p>Loading cafe information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cafe-info-error">
        <p className="error-message">{error}</p>
        <button onClick={loadCafe} className="btn-retry">
          Retry
        </button>
      </div>
    );
  }

  if (!cafe) {
    return (
      <div className="cafe-info-empty">
        <p>No cafe information found</p>
      </div>
    );
  }

  return (
    <div className="cafe-info-tab">
      <div className="cafe-info-header">
        <h2>Cafe Information</h2>
        <div className="header-actions">
          <button onClick={() => setIsScheduleModalOpen(true)} className="btn-secondary">
            Edit Schedule
          </button>
          <button onClick={() => setIsEditModalOpen(true)} className="btn-primary">
            Edit Information
          </button>
        </div>
      </div>

      <div className="cafe-info-content">
        <div className="info-section">
          <h3>Basic Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Name</label>
              <p>{cafe.name}</p>
            </div>
            <div className="info-item">
              <label>Status</label>
              <p>
                <span className={`status-badge ${cafe.isActive ? 'active' : 'inactive'}`}>
                  {cafe.isActive ? 'Active' : 'Inactive'}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="info-section">
          <h3>Contact Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Phone</label>
              <p>{cafe.phone}</p>
            </div>
            <div className="info-item">
              <label>Email</label>
              <p>{cafe.email}</p>
            </div>
          </div>
        </div>

        <div className="info-section">
          <h3>Address</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Street Address</label>
              <p>{cafe.address}</p>
            </div>
            <div className="info-item">
              <label>City</label>
              <p>{cafe.city}</p>
            </div>
            <div className="info-item">
              <label>Postal Code</label>
              <p>{cafe.postalCode}</p>
            </div>
            {cafe.latitude && cafe.longitude && (
              <div className="info-item">
                <label>Coordinates</label>
                <p>
                  {cafe.latitude.toFixed(6)}, {cafe.longitude.toFixed(6)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {isEditModalOpen && (
        <EditCafeModal
          cafe={cafe}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            setIsEditModalOpen(false);
            loadCafe();
          }}
        />
      )}

      {isScheduleModalOpen && (
        <EditScheduleModal
          cafeId={cafe.id}
          onClose={() => setIsScheduleModalOpen(false)}
          onSuccess={() => {
            setIsScheduleModalOpen(false);
            loadCafe();
          }}
        />
      )}

      <style jsx>{`
        .cafe-info-tab {
          padding: var(--tc-spacing-6);
        }

        .cafe-info-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--tc-spacing-6);
        }

        .cafe-info-header h2 {
          font-size: var(--tc-font-size-2xl);
          font-weight: var(--tc-font-weight-semibold);
          color: var(--tc-text-primary);
          margin: 0;
        }

        .header-actions {
          display: flex;
          gap: var(--tc-spacing-3);
        }

        .cafe-info-content {
          display: flex;
          flex-direction: column;
          gap: var(--tc-spacing-6);
        }

        .info-section {
          background: var(--tc-bg-secondary);
          border: 1px solid var(--tc-border-primary);
          border-radius: var(--tc-radius-lg);
          padding: var(--tc-spacing-5);
        }

        .info-section h3 {
          font-size: var(--tc-font-size-lg);
          font-weight: var(--tc-font-weight-semibold);
          color: var(--tc-text-primary);
          margin: 0 0 var(--tc-spacing-4) 0;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--tc-spacing-4);
        }

        .info-item label {
          display: block;
          font-size: var(--tc-font-size-sm);
          font-weight: var(--tc-font-weight-medium);
          color: var(--tc-text-secondary);
          margin-bottom: var(--tc-spacing-1);
        }

        .info-item p {
          font-size: var(--tc-font-size-base);
          color: var(--tc-text-primary);
          margin: 0;
        }

        .status-badge {
          display: inline-block;
          padding: var(--tc-spacing-1) var(--tc-spacing-3);
          border-radius: var(--tc-radius-full);
          font-size: var(--tc-font-size-sm);
          font-weight: var(--tc-font-weight-medium);
        }

        .status-badge.active {
          background: var(--tc-success-bg);
          color: var(--tc-success-text);
        }

        .status-badge.inactive {
          background: var(--tc-error-bg);
          color: var(--tc-error-text);
        }

        .cafe-info-loading,
        .cafe-info-error,
        .cafe-info-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--tc-spacing-12);
          text-align: center;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--tc-border-primary);
          border-top-color: var(--tc-primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: var(--tc-spacing-4);
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .error-message {
          color: var(--tc-error-text);
          margin-bottom: var(--tc-spacing-4);
        }

        .btn-primary,
        .btn-secondary,
        .btn-retry {
          padding: var(--tc-spacing-2) var(--tc-spacing-4);
          border-radius: var(--tc-radius-md);
          font-size: var(--tc-font-size-sm);
          font-weight: var(--tc-font-weight-medium);
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .btn-primary {
          background: var(--tc-primary);
          color: white;
        }

        .btn-primary:hover {
          background: var(--tc-primary-hover);
        }

        .btn-secondary {
          background: var(--tc-bg-tertiary);
          color: var(--tc-text-primary);
          border: 1px solid var(--tc-border-primary);
        }

        .btn-secondary:hover {
          background: var(--tc-bg-hover);
        }

        .btn-retry {
          background: var(--tc-primary);
          color: white;
        }

        .btn-retry:hover {
          background: var(--tc-primary-hover);
        }
      `}</style>
    </div>
  );
}
