'use client';

import { useState } from 'react';
import { updateMyCafe } from '../api/cafe-api';
import { Cafe, UpdateCafeDto } from '../types/cafe.types';

interface EditCafeModalProps {
  cafe: Cafe;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditCafeModal({ cafe, onClose, onSuccess }: EditCafeModalProps) {
  const [formData, setFormData] = useState<UpdateCafeDto>({
    name: cafe.name,
    address: cafe.address,
    city: cafe.city,
    postalCode: cafe.postalCode,
    phone: cafe.phone,
    email: cafe.email,
    latitude: cafe.latitude,
    longitude: cafe.longitude,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);
      await updateMyCafe(formData);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update cafe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Cafe Information</h2>
          <button onClick={onClose} className="close-button">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-banner">{error}</div>}

            <div className="form-section">
              <h3>Basic Information</h3>
              <div className="form-group">
                <label htmlFor="name">Cafe Name *</label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Contact Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Phone *</label>
                  <input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Address</h3>
              <div className="form-group">
                <label htmlFor="address">Street Address *</label>
                <input
                  id="address"
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city">City *</label>
                  <input
                    id="city"
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="postalCode">Postal Code *</label>
                  <input
                    id="postalCode"
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Coordinates (Optional)</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="latitude">Latitude</label>
                  <input
                    id="latitude"
                    type="number"
                    step="0.000001"
                    value={formData.latitude || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        latitude: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    placeholder="e.g., 40.712776"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="longitude">Longitude</label>
                  <input
                    id="longitude"
                    type="number"
                    step="0.000001"
                    value={formData.longitude || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        longitude: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    placeholder="e.g., -74.005974"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-cancel" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: var(--tc-spacing-4);
        }

        .modal-content {
          background: var(--tc-bg-primary);
          border-radius: var(--tc-radius-lg);
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--tc-spacing-5);
          border-bottom: 1px solid var(--tc-border-primary);
        }

        .modal-header h2 {
          font-size: var(--tc-font-size-xl);
          font-weight: var(--tc-font-weight-semibold);
          color: var(--tc-text-primary);
          margin: 0;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 28px;
          color: var(--tc-text-secondary);
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--tc-radius-md);
          transition: all 0.2s;
        }

        .close-button:hover {
          background: var(--tc-bg-hover);
          color: var(--tc-text-primary);
        }

        .modal-body {
          padding: var(--tc-spacing-5);
          overflow-y: auto;
          flex: 1;
        }

        .error-banner {
          background: var(--tc-error-bg);
          color: var(--tc-error-text);
          padding: var(--tc-spacing-3);
          border-radius: var(--tc-radius-md);
          margin-bottom: var(--tc-spacing-4);
          font-size: var(--tc-font-size-sm);
        }

        .form-section {
          margin-bottom: var(--tc-spacing-5);
        }

        .form-section:last-child {
          margin-bottom: 0;
        }

        .form-section h3 {
          font-size: var(--tc-font-size-base);
          font-weight: var(--tc-font-weight-semibold);
          color: var(--tc-text-primary);
          margin: 0 0 var(--tc-spacing-3) 0;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--tc-spacing-3);
        }

        .form-group {
          margin-bottom: var(--tc-spacing-3);
        }

        .form-group label {
          display: block;
          font-size: var(--tc-font-size-sm);
          font-weight: var(--tc-font-weight-medium);
          color: var(--tc-text-secondary);
          margin-bottom: var(--tc-spacing-1);
        }

        .form-group input {
          width: 100%;
          padding: var(--tc-spacing-2) var(--tc-spacing-3);
          border: 1px solid var(--tc-border-primary);
          border-radius: var(--tc-radius-md);
          font-size: var(--tc-font-size-base);
          color: var(--tc-text-primary);
          background: var(--tc-bg-secondary);
          transition: all 0.2s;
        }

        .form-group input:focus {
          outline: none;
          border-color: var(--tc-primary);
          box-shadow: 0 0 0 3px var(--tc-primary-light);
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: var(--tc-spacing-3);
          padding: var(--tc-spacing-5);
          border-top: 1px solid var(--tc-border-primary);
        }

        .btn-cancel,
        .btn-submit {
          padding: var(--tc-spacing-2) var(--tc-spacing-4);
          border-radius: var(--tc-radius-md);
          font-size: var(--tc-font-size-sm);
          font-weight: var(--tc-font-weight-medium);
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .btn-cancel {
          background: var(--tc-bg-tertiary);
          color: var(--tc-text-primary);
          border: 1px solid var(--tc-border-primary);
        }

        .btn-cancel:hover:not(:disabled) {
          background: var(--tc-bg-hover);
        }

        .btn-submit {
          background: var(--tc-primary);
          color: white;
        }

        .btn-submit:hover:not(:disabled) {
          background: var(--tc-primary-hover);
        }

        .btn-cancel:disabled,
        .btn-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
