import { openDatabaseAsync, SQLiteDatabase } from 'expo-sqlite';
import { v4 as uuidv4 } from 'uuid';
import { Note, CreateNoteInput, UpdateNoteInput } from '../types';

let db: SQLiteDatabase | null = null;

/**
 * Initialize the database and create tables
 */
export async function initDatabase(): Promise<void> {
  db = await openDatabaseAsync('notes.db');

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      keywords TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    )
  `);
}

/**
 * Create a new note
 */
export async function createNote(input: CreateNoteInput): Promise<Note> {
  if (!db) {
    await initDatabase();
  }

  const id = uuidv4();
  const now = Date.now();
  const keywordsJson = JSON.stringify(input.keywords);

  await db!.runAsync(
    'INSERT INTO notes (id, content, keywords, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
    [id, input.content, keywordsJson, now, now]
  );

  const row = await db!.getFirstAsync<{
    id: string;
    content: string;
    keywords: string;
    createdAt: number;
    updatedAt: number;
  }>('SELECT * FROM notes WHERE id = ?', [id]);

  if (!row) {
    throw new Error('Failed to create note');
  }

  return {
    id: row.id,
    content: row.content,
    keywords: JSON.parse(row.keywords),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Get a note by its ID
 */
export async function getNoteById(id: string): Promise<Note | null> {
  if (!db) {
    await initDatabase();
  }

  const row = await db!.getFirstAsync<{
    id: string;
    content: string;
    keywords: string;
    createdAt: number;
    updatedAt: number;
  }>('SELECT * FROM notes WHERE id = ?', [id]);

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    content: row.content,
    keywords: JSON.parse(row.keywords),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Get all notes, ordered by creation date (newest first)
 */
export async function getAllNotes(): Promise<Note[]> {
  if (!db) {
    await initDatabase();
  }

  const rows = await db!.getAllAsync<{
    id: string;
    content: string;
    keywords: string;
    createdAt: number;
    updatedAt: number;
  }>('SELECT * FROM notes ORDER BY createdAt DESC');

  return rows.map(row => ({
    id: row.id,
    content: row.content,
    keywords: JSON.parse(row.keywords),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

/**
 * Update a note by its ID
 */
export async function updateNote(
  id: string,
  input: UpdateNoteInput
): Promise<Note | null> {
  if (!db) {
    await initDatabase();
  }

  const now = Date.now();
  const updates: string[] = [];
  const params: any[] = [];

  if (input.content !== undefined) {
    updates.push('content = ?');
    params.push(input.content);
  }

  if (input.keywords !== undefined) {
    updates.push('keywords = ?');
    params.push(JSON.stringify(input.keywords));
  }

  // Always update the updatedAt timestamp
  updates.push('updatedAt = ?');
  params.push(now);

  // Add the id parameter for the WHERE clause
  params.push(id);

  const sql = `UPDATE notes SET ${updates.join(', ')} WHERE id = ?`;

  const result = await db!.runAsync(sql, params);

  if (result.changes === 0) {
    return null;
  }

  return await getNoteById(id);
}

/**
 * Delete a note by its ID
 */
export async function deleteNote(id: string): Promise<boolean> {
  if (!db) {
    await initDatabase();
  }

  const result = await db!.runAsync('DELETE FROM notes WHERE id = ?', [id]);

  return result.changes > 0;
}
