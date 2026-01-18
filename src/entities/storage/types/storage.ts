export interface StorageFile {
  path: string;
  bucket: string;
  size: number;
  mimeType: string;
  lastModified: string;
  entityType?: string;
  entityId?: string;
  category?: string;
  relationship?: string;
}

export interface StorageBucket {
  brands: string;
  cafes: string;
  users: string;
  public: string;
}

export interface StorageFileList {
  items: StorageFile[];
  total: number;
  bucket: string;
  prefix?: string;
}
