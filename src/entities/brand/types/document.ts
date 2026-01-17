export type DocumentType =
  | 'REGISTRATION'
  | 'LICENSE'
  | 'CONTRACT'
  | 'TAX_CERTIFICATE'
  | 'BANK_STATEMENT'
  | 'OTHER';

export type BrandDocument = {
  id: string;
  type: DocumentType;
  name: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
  uploadedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  isVerified: boolean;
  verificationNote?: string;
  createdAt: string;
  updatedAt: string;
};
