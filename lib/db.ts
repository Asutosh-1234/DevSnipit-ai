import * as SQLite from 'expo-sqlite';
import { Snippet, Attachment } from './types';

let db: SQLite.SQLiteDatabase | null = null;

export const getDb = (): SQLite.SQLiteDatabase => {
  if (!db) {
    db = SQLite.openDatabaseSync('devsnippets.db');
  }
  return db;
};

// Initialize schema
export const initDb = async (): Promise<void> => {
  const database = getDb();
  
  // Enable foreign keys
  await database.execAsync('PRAGMA foreign_keys = ON;');
  
  // Create snippets and attachments tables
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS snippets (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      code TEXT NOT NULL,
      language TEXT NOT NULL,
      tags TEXT NOT NULL,
      is_favorite INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      snippet_id TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER,
      created_at TEXT NOT NULL,
      FOREIGN KEY(snippet_id) REFERENCES snippets(id) ON DELETE CASCADE
    );
  `);
};

// CRUD Snippets
export const getSnippets = async (): Promise<Snippet[]> => {
  const database = getDb();
  try {
    const rows = await database.getAllAsync<any>('SELECT * FROM snippets ORDER BY created_at DESC');
    return rows.map(row => ({
      id: row.id,
      title: row.title,
      code: row.code,
      language: row.language,
      tags: JSON.parse(row.tags),
      is_favorite: row.is_favorite === 1,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
  } catch (error) {
    console.error('Error fetching snippets:', error);
    return [];
  }
};

export const getSnippetById = async (id: string): Promise<Snippet | null> => {
  const database = getDb();
  try {
    const row = await database.getFirstAsync<any>('SELECT * FROM snippets WHERE id = ?', [id]);
    if (!row) return null;
    return {
      id: row.id,
      title: row.title,
      code: row.code,
      language: row.language,
      tags: JSON.parse(row.tags),
      is_favorite: row.is_favorite === 1,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  } catch (error) {
    console.error(`Error fetching snippet ${id}:`, error);
    return null;
  }
};

export const insertSnippet = async (snippet: Snippet): Promise<void> => {
  const database = getDb();
  await database.runAsync(
    'INSERT INTO snippets (id, title, code, language, tags, is_favorite, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [
      snippet.id,
      snippet.title,
      snippet.code,
      snippet.language,
      JSON.stringify(snippet.tags),
      snippet.is_favorite ? 1 : 0,
      snippet.created_at,
      snippet.updated_at
    ]
  );
};

export const updateSnippet = async (snippet: Snippet): Promise<void> => {
  const database = getDb();
  await database.runAsync(
    'UPDATE snippets SET title = ?, code = ?, language = ?, tags = ?, is_favorite = ?, updated_at = ? WHERE id = ?',
    [
      snippet.title,
      snippet.code,
      snippet.language,
      JSON.stringify(snippet.tags),
      snippet.is_favorite ? 1 : 0,
      snippet.updated_at,
      snippet.id
    ]
  );
};

export const toggleFavoriteSnippet = async (id: string, isFavorite: boolean): Promise<void> => {
  const database = getDb();
  await database.runAsync(
    'UPDATE snippets SET is_favorite = ?, updated_at = ? WHERE id = ?',
    [
      isFavorite ? 1 : 0,
      new Date().toISOString(),
      id
    ]
  );
};

export const deleteSnippet = async (id: string): Promise<void> => {
  const database = getDb();
  await database.runAsync('DELETE FROM snippets WHERE id = ?', [id]);
};

// CRUD Attachments
export const getAttachments = async (snippetId: string): Promise<Attachment[]> => {
  const database = getDb();
  try {
    const rows = await database.getAllAsync<any>('SELECT * FROM attachments WHERE snippet_id = ?', [snippetId]);
    return rows.map(row => ({
      id: row.id,
      snippet_id: row.snippet_id,
      file_path: row.file_path,
      file_name: row.file_name,
      file_type: row.file_type as 'screenshot' | 'code_file',
      file_size: row.file_size,
      created_at: row.created_at
    }));
  } catch (error) {
    console.error(`Error fetching attachments for snippet ${snippetId}:`, error);
    return [];
  }
};

export const insertAttachment = async (attachment: Attachment): Promise<void> => {
  const database = getDb();
  await database.runAsync(
    'INSERT INTO attachments (id, snippet_id, file_path, file_name, file_type, file_size, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      attachment.id,
      attachment.snippet_id,
      attachment.file_path,
      attachment.file_name,
      attachment.file_type,
      attachment.file_size,
      attachment.created_at
    ]
  );
};

export const deleteAttachment = async (id: string): Promise<void> => {
  const database = getDb();
  await database.runAsync('DELETE FROM attachments WHERE id = ?', [id]);
};

export const getDbFileStats = async (): Promise<{ count: number; totalSize: number }> => {
  const database = getDb();
  try {
    const row = await database.getFirstAsync<any>('SELECT COUNT(*) as count, SUM(file_size) as totalSize FROM attachments');
    return {
      count: row?.count || 0,
      totalSize: row?.totalSize || 0
    };
  } catch {
    return { count: 0, totalSize: 0 };
  }
};
