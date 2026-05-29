export interface Snippet {
  id: string;
  title: string;
  code: string;
  language: string;
  tags: string[]; // Decoded from database string JSON
  is_favorite: boolean; // Managed as boolean in JS, 0/1 in SQLite
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  id: string;
  snippet_id: string;
  file_path: string;
  file_name: string;
  file_type: 'screenshot' | 'code_file';
  file_size: number;
  created_at: string;
}

export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modificationTime?: number;
  fileExtension?: string;
}

export interface AppPreferences {
  theme: 'dark' | 'light' | 'amoled';
}
