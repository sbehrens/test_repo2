/**
 * Database Layer Tests (TDD Approach)
 *
 * These tests are written BEFORE implementation to define expected behavior.
 * Tests should initially fail until the database.ts implementation is complete.
 */

import { openDatabaseAsync } from 'expo-sqlite';
import {
  initDatabase,
  createNote,
  getNoteById,
  getAllNotes,
  updateNote,
  deleteNote,
} from '../../lib/database';
import { Note, CreateNoteInput, UpdateNoteInput } from '../../types';

// Mock database instance
const mockDb = {
  execAsync: jest.fn(),
  runAsync: jest.fn(),
  getFirstAsync: jest.fn(),
  getAllAsync: jest.fn(),
};

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  (openDatabaseAsync as jest.Mock).mockResolvedValue(mockDb);
});

describe('Database Layer', () => {
  describe('initDatabase', () => {
    it('should create tables without error', async () => {
      // Arrange
      mockDb.execAsync.mockResolvedValue(undefined);

      // Act
      await initDatabase();

      // Assert
      expect(openDatabaseAsync).toHaveBeenCalledWith('notes.db');
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS notes')
      );
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('id TEXT PRIMARY KEY')
      );
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('content TEXT NOT NULL')
      );
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('keywords TEXT NOT NULL')
      );
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('createdAt INTEGER NOT NULL')
      );
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('updatedAt INTEGER NOT NULL')
      );
    });

    it('should handle database initialization errors gracefully', async () => {
      // Arrange
      const error = new Error('Database initialization failed');
      mockDb.execAsync.mockRejectedValue(error);

      // Act & Assert
      await expect(initDatabase()).rejects.toThrow('Database initialization failed');
    });
  });

  describe('createNote', () => {
    it('should create note with generated id and timestamps', async () => {
      // Arrange
      const input: CreateNoteInput = {
        content: 'Thermometer runs 3° hot',
        keywords: ['turkey', 'thanksgiving', 'cooking'],
      };

      const mockTimestamp = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(mockTimestamp);

      mockDb.runAsync.mockResolvedValue({
        lastInsertRowid: 1,
        changes: 1,
      });

      mockDb.getFirstAsync.mockResolvedValue({
        id: 'test-uuid-123',
        content: input.content,
        keywords: JSON.stringify(input.keywords),
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
      });

      // Act
      const result = await createNote(input);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('string');
      expect(result.id.length).toBeGreaterThan(0);
      expect(result.content).toBe(input.content);
      expect(result.keywords).toEqual(input.keywords);
      expect(result.createdAt).toBe(mockTimestamp);
      expect(result.updatedAt).toBe(mockTimestamp);
      expect(result.createdAt).toBe(result.updatedAt); // Initially, both timestamps should be equal
    });

    it('should store keywords as array', async () => {
      // Arrange
      const input: CreateNoteInput = {
        content: 'Test note',
        keywords: ['keyword1', 'keyword2', 'keyword3'],
      };

      mockDb.runAsync.mockResolvedValue({
        lastInsertRowid: 1,
        changes: 1,
      });

      mockDb.getFirstAsync.mockResolvedValue({
        id: 'test-uuid-456',
        content: input.content,
        keywords: JSON.stringify(input.keywords),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Act
      const result = await createNote(input);

      // Assert
      expect(Array.isArray(result.keywords)).toBe(true);
      expect(result.keywords).toEqual(['keyword1', 'keyword2', 'keyword3']);
      expect(result.keywords.length).toBe(3);

      // Verify that keywords were stored as JSON string in database
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          expect.any(String), // id
          input.content,
          JSON.stringify(input.keywords), // keywords as JSON string
          expect.any(Number), // createdAt
          expect.any(Number), // updatedAt
        ])
      );
    });

    it('should handle empty keywords array', async () => {
      // Arrange
      const input: CreateNoteInput = {
        content: 'Note without keywords',
        keywords: [],
      };

      mockDb.runAsync.mockResolvedValue({
        lastInsertRowid: 1,
        changes: 1,
      });

      mockDb.getFirstAsync.mockResolvedValue({
        id: 'test-uuid-789',
        content: input.content,
        keywords: JSON.stringify([]),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Act
      const result = await createNote(input);

      // Assert
      expect(result.keywords).toEqual([]);
      expect(Array.isArray(result.keywords)).toBe(true);
    });
  });

  describe('getNoteById', () => {
    it('should return note if exists', async () => {
      // Arrange
      const mockNote = {
        id: 'existing-note-id',
        content: 'Existing note content',
        keywords: JSON.stringify(['test', 'keywords']),
        createdAt: 1640000000000,
        updatedAt: 1640000000000,
      };

      mockDb.getFirstAsync.mockResolvedValue(mockNote);

      // Act
      const result = await getNoteById('existing-note-id');

      // Assert
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result!.id).toBe('existing-note-id');
      expect(result!.content).toBe('Existing note content');
      expect(result!.keywords).toEqual(['test', 'keywords']);
      expect(result!.createdAt).toBe(1640000000000);
      expect(result!.updatedAt).toBe(1640000000000);

      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM notes WHERE id = ?'),
        ['existing-note-id']
      );
    });

    it('should return null if not exists', async () => {
      // Arrange
      mockDb.getFirstAsync.mockResolvedValue(null);

      // Act
      const result = await getNoteById('non-existent-id');

      // Assert
      expect(result).toBeNull();
      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM notes WHERE id = ?'),
        ['non-existent-id']
      );
    });

    it('should parse keywords from JSON string to array', async () => {
      // Arrange
      const mockNote = {
        id: 'note-with-keywords',
        content: 'Test content',
        keywords: JSON.stringify(['apple', 'banana', 'cherry']),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockDb.getFirstAsync.mockResolvedValue(mockNote);

      // Act
      const result = await getNoteById('note-with-keywords');

      // Assert
      expect(result).not.toBeNull();
      expect(Array.isArray(result!.keywords)).toBe(true);
      expect(result!.keywords).toEqual(['apple', 'banana', 'cherry']);
    });
  });

  describe('getAllNotes', () => {
    it('should return empty array initially', async () => {
      // Arrange
      mockDb.getAllAsync.mockResolvedValue([]);

      // Act
      const result = await getAllNotes();

      // Assert
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM notes')
      );
    });

    it('should return all created notes', async () => {
      // Arrange
      const mockNotes = [
        {
          id: 'note-1',
          content: 'First note',
          keywords: JSON.stringify(['first']),
          createdAt: 1640000000000,
          updatedAt: 1640000000000,
        },
        {
          id: 'note-2',
          content: 'Second note',
          keywords: JSON.stringify(['second', 'test']),
          createdAt: 1640001000000,
          updatedAt: 1640001000000,
        },
        {
          id: 'note-3',
          content: 'Third note',
          keywords: JSON.stringify(['third']),
          createdAt: 1640002000000,
          updatedAt: 1640002000000,
        },
      ];

      mockDb.getAllAsync.mockResolvedValue(mockNotes);

      // Act
      const result = await getAllNotes();

      // Assert
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);

      // Check first note
      expect(result[0].id).toBe('note-1');
      expect(result[0].content).toBe('First note');
      expect(result[0].keywords).toEqual(['first']);

      // Check second note
      expect(result[1].id).toBe('note-2');
      expect(result[1].content).toBe('Second note');
      expect(result[1].keywords).toEqual(['second', 'test']);

      // Check third note
      expect(result[2].id).toBe('note-3');
      expect(result[2].content).toBe('Third note');
      expect(result[2].keywords).toEqual(['third']);
    });

    it('should parse all keywords from JSON strings to arrays', async () => {
      // Arrange
      const mockNotes = [
        {
          id: 'note-1',
          content: 'Note 1',
          keywords: JSON.stringify(['tag1', 'tag2']),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'note-2',
          content: 'Note 2',
          keywords: JSON.stringify([]),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      mockDb.getAllAsync.mockResolvedValue(mockNotes);

      // Act
      const result = await getAllNotes();

      // Assert
      expect(Array.isArray(result[0].keywords)).toBe(true);
      expect(result[0].keywords).toEqual(['tag1', 'tag2']);
      expect(Array.isArray(result[1].keywords)).toBe(true);
      expect(result[1].keywords).toEqual([]);
    });

    it('should order notes by creation date (newest first)', async () => {
      // Arrange
      const mockNotes = [
        {
          id: 'note-3',
          content: 'Newest note',
          keywords: JSON.stringify([]),
          createdAt: 1640003000000,
          updatedAt: 1640003000000,
        },
        {
          id: 'note-2',
          content: 'Middle note',
          keywords: JSON.stringify([]),
          createdAt: 1640002000000,
          updatedAt: 1640002000000,
        },
        {
          id: 'note-1',
          content: 'Oldest note',
          keywords: JSON.stringify([]),
          createdAt: 1640001000000,
          updatedAt: 1640001000000,
        },
      ];

      mockDb.getAllAsync.mockResolvedValue(mockNotes);

      // Act
      const result = await getAllNotes();

      // Assert
      expect(result[0].createdAt).toBeGreaterThan(result[1].createdAt);
      expect(result[1].createdAt).toBeGreaterThan(result[2].createdAt);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY createdAt DESC')
      );
    });
  });

  describe('updateNote', () => {
    it('should update content', async () => {
      // Arrange
      const noteId = 'update-note-1';
      const updateInput: UpdateNoteInput = {
        content: 'Updated content',
      };

      const originalNote = {
        id: noteId,
        content: 'Original content',
        keywords: JSON.stringify(['original']),
        createdAt: 1640000000000,
        updatedAt: 1640000000000,
      };

      const updatedTimestamp = 1640005000000;
      jest.spyOn(Date, 'now').mockReturnValue(updatedTimestamp);

      mockDb.runAsync.mockResolvedValue({
        changes: 1,
      });

      mockDb.getFirstAsync.mockResolvedValue({
        ...originalNote,
        content: updateInput.content,
        updatedAt: updatedTimestamp,
      });

      // Act
      const result = await updateNote(noteId, updateInput);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.id).toBe(noteId);
      expect(result!.content).toBe('Updated content');
      expect(result!.keywords).toEqual(['original']); // Keywords unchanged
      expect(result!.createdAt).toBe(1640000000000); // createdAt unchanged
      expect(result!.updatedAt).toBe(updatedTimestamp); // updatedAt changed
    });

    it('should update keywords', async () => {
      // Arrange
      const noteId = 'update-note-2';
      const updateInput: UpdateNoteInput = {
        keywords: ['new', 'keywords', 'list'],
      };

      const originalNote = {
        id: noteId,
        content: 'Original content',
        keywords: JSON.stringify(['old']),
        createdAt: 1640000000000,
        updatedAt: 1640000000000,
      };

      const updatedTimestamp = 1640006000000;
      jest.spyOn(Date, 'now').mockReturnValue(updatedTimestamp);

      mockDb.runAsync.mockResolvedValue({
        changes: 1,
      });

      mockDb.getFirstAsync.mockResolvedValue({
        ...originalNote,
        keywords: JSON.stringify(updateInput.keywords),
        updatedAt: updatedTimestamp,
      });

      // Act
      const result = await updateNote(noteId, updateInput);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.id).toBe(noteId);
      expect(result!.content).toBe('Original content'); // Content unchanged
      expect(result!.keywords).toEqual(['new', 'keywords', 'list']);
      expect(result!.updatedAt).toBe(updatedTimestamp);

      // Verify keywords were stored as JSON
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE notes SET'),
        expect.arrayContaining([
          JSON.stringify(updateInput.keywords),
          expect.any(Number),
          noteId,
        ])
      );
    });

    it('should update both content and keywords', async () => {
      // Arrange
      const noteId = 'update-note-3';
      const updateInput: UpdateNoteInput = {
        content: 'Brand new content',
        keywords: ['brand', 'new', 'keywords'],
      };

      const updatedTimestamp = 1640007000000;
      jest.spyOn(Date, 'now').mockReturnValue(updatedTimestamp);

      mockDb.runAsync.mockResolvedValue({
        changes: 1,
      });

      mockDb.getFirstAsync.mockResolvedValue({
        id: noteId,
        content: updateInput.content,
        keywords: JSON.stringify(updateInput.keywords),
        createdAt: 1640000000000,
        updatedAt: updatedTimestamp,
      });

      // Act
      const result = await updateNote(noteId, updateInput);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.content).toBe('Brand new content');
      expect(result!.keywords).toEqual(['brand', 'new', 'keywords']);
    });

    it('should update updatedAt timestamp', async () => {
      // Arrange
      const noteId = 'update-note-4';
      const updateInput: UpdateNoteInput = {
        content: 'Any update',
      };

      const originalTimestamp = 1640000000000;
      const updatedTimestamp = 1640010000000;

      jest.spyOn(Date, 'now').mockReturnValue(updatedTimestamp);

      mockDb.runAsync.mockResolvedValue({
        changes: 1,
      });

      mockDb.getFirstAsync.mockResolvedValue({
        id: noteId,
        content: updateInput.content,
        keywords: JSON.stringify([]),
        createdAt: originalTimestamp,
        updatedAt: updatedTimestamp,
      });

      // Act
      const result = await updateNote(noteId, updateInput);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.createdAt).toBe(originalTimestamp); // createdAt should NOT change
      expect(result!.updatedAt).toBe(updatedTimestamp); // updatedAt should change
      expect(result!.updatedAt).toBeGreaterThan(result!.createdAt);

      // Verify updatedAt was passed to the database
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          updatedTimestamp,
        ])
      );
    });

    it('should return null for non-existent id', async () => {
      // Arrange
      const nonExistentId = 'does-not-exist';
      const updateInput: UpdateNoteInput = {
        content: 'Some content',
      };

      mockDb.runAsync.mockResolvedValue({
        changes: 0, // No rows affected
      });

      mockDb.getFirstAsync.mockResolvedValue(null);

      // Act
      const result = await updateNote(nonExistentId, updateInput);

      // Assert
      expect(result).toBeNull();
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE notes SET'),
        expect.arrayContaining([nonExistentId])
      );
    });

    it('should not update createdAt timestamp', async () => {
      // Arrange
      const noteId = 'update-note-5';
      const updateInput: UpdateNoteInput = {
        content: 'Updated content',
      };

      const originalCreatedAt = 1640000000000;
      const currentTime = 1650000000000; // Much later time

      jest.spyOn(Date, 'now').mockReturnValue(currentTime);

      mockDb.runAsync.mockResolvedValue({
        changes: 1,
      });

      mockDb.getFirstAsync.mockResolvedValue({
        id: noteId,
        content: updateInput.content,
        keywords: JSON.stringify([]),
        createdAt: originalCreatedAt, // Should remain unchanged
        updatedAt: currentTime,
      });

      // Act
      const result = await updateNote(noteId, updateInput);

      // Assert
      expect(result!.createdAt).toBe(originalCreatedAt);
      expect(result!.createdAt).not.toBe(currentTime);

      // Verify the SQL doesn't include createdAt in the UPDATE
      const updateCall = mockDb.runAsync.mock.calls[0];
      const sqlQuery = updateCall[0] as string;
      expect(sqlQuery).not.toContain('createdAt');
    });
  });

  describe('deleteNote', () => {
    it('should delete existing note and return true', async () => {
      // Arrange
      const noteId = 'delete-note-1';

      mockDb.runAsync.mockResolvedValue({
        changes: 1, // One row deleted
      });

      // Act
      const result = await deleteNote(noteId);

      // Assert
      expect(result).toBe(true);
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM notes WHERE id = ?'),
        [noteId]
      );
    });

    it('should return false for non-existent id', async () => {
      // Arrange
      const nonExistentId = 'does-not-exist';

      mockDb.runAsync.mockResolvedValue({
        changes: 0, // No rows deleted
      });

      // Act
      const result = await deleteNote(nonExistentId);

      // Assert
      expect(result).toBe(false);
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM notes WHERE id = ?'),
        [nonExistentId]
      );
    });

    it('should permanently remove note from database', async () => {
      // Arrange
      const noteId = 'delete-note-2';

      mockDb.runAsync.mockResolvedValue({
        changes: 1,
      });

      // Simulate getting the note before and after deletion
      mockDb.getFirstAsync
        .mockResolvedValueOnce({ // Before deletion
          id: noteId,
          content: 'To be deleted',
          keywords: JSON.stringify([]),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
        .mockResolvedValueOnce(null); // After deletion

      // Act
      const beforeDelete = await getNoteById(noteId);
      const deleteResult = await deleteNote(noteId);
      const afterDelete = await getNoteById(noteId);

      // Assert
      expect(beforeDelete).not.toBeNull();
      expect(deleteResult).toBe(true);
      expect(afterDelete).toBeNull();
    });

    it('should handle multiple delete attempts on same id', async () => {
      // Arrange
      const noteId = 'delete-note-3';

      mockDb.runAsync
        .mockResolvedValueOnce({ changes: 1 }) // First delete succeeds
        .mockResolvedValueOnce({ changes: 0 }); // Second delete fails (already deleted)

      // Act
      const firstDelete = await deleteNote(noteId);
      const secondDelete = await deleteNote(noteId);

      // Assert
      expect(firstDelete).toBe(true);
      expect(secondDelete).toBe(false);
      expect(mockDb.runAsync).toHaveBeenCalledTimes(2);
    });
  });

  describe('Integration scenarios', () => {
    it('should support full CRUD lifecycle', async () => {
      // This test verifies a complete create -> read -> update -> delete cycle

      const createInput: CreateNoteInput = {
        content: 'Test note for CRUD',
        keywords: ['test', 'crud'],
      };

      const noteId = 'crud-test-note';
      const createdTimestamp = 1640000000000;
      const updatedTimestamp = 1640005000000;

      // CREATE
      mockDb.runAsync.mockResolvedValueOnce({ changes: 1 });
      mockDb.getFirstAsync.mockResolvedValueOnce({
        id: noteId,
        content: createInput.content,
        keywords: JSON.stringify(createInput.keywords),
        createdAt: createdTimestamp,
        updatedAt: createdTimestamp,
      });

      const created = await createNote(createInput);
      expect(created.id).toBe(noteId);
      expect(created.content).toBe('Test note for CRUD');

      // READ
      mockDb.getFirstAsync.mockResolvedValueOnce({
        id: noteId,
        content: createInput.content,
        keywords: JSON.stringify(createInput.keywords),
        createdAt: createdTimestamp,
        updatedAt: createdTimestamp,
      });

      const read = await getNoteById(noteId);
      expect(read).not.toBeNull();
      expect(read!.id).toBe(noteId);

      // UPDATE
      jest.spyOn(Date, 'now').mockReturnValue(updatedTimestamp);
      mockDb.runAsync.mockResolvedValueOnce({ changes: 1 });
      mockDb.getFirstAsync.mockResolvedValueOnce({
        id: noteId,
        content: 'Updated CRUD note',
        keywords: JSON.stringify(['updated']),
        createdAt: createdTimestamp,
        updatedAt: updatedTimestamp,
      });

      const updated = await updateNote(noteId, { content: 'Updated CRUD note', keywords: ['updated'] });
      expect(updated).not.toBeNull();
      expect(updated!.content).toBe('Updated CRUD note');
      expect(updated!.updatedAt).toBeGreaterThan(updated!.createdAt);

      // DELETE
      mockDb.runAsync.mockResolvedValueOnce({ changes: 1 });
      const deleted = await deleteNote(noteId);
      expect(deleted).toBe(true);

      // VERIFY DELETED
      mockDb.getFirstAsync.mockResolvedValueOnce(null);
      const afterDelete = await getNoteById(noteId);
      expect(afterDelete).toBeNull();
    });

    it('should handle concurrent note operations', async () => {
      // Create multiple notes
      const inputs: CreateNoteInput[] = [
        { content: 'Note 1', keywords: ['one'] },
        { content: 'Note 2', keywords: ['two'] },
        { content: 'Note 3', keywords: ['three'] },
      ];

      // Mock successful creation for all notes
      mockDb.runAsync.mockResolvedValue({ changes: 1 });

      inputs.forEach((input, index) => {
        mockDb.getFirstAsync.mockResolvedValueOnce({
          id: `note-${index + 1}`,
          content: input.content,
          keywords: JSON.stringify(input.keywords),
          createdAt: Date.now() + index,
          updatedAt: Date.now() + index,
        });
      });

      // Act - Create all notes
      const notes = await Promise.all(inputs.map(input => createNote(input)));

      // Assert
      expect(notes.length).toBe(3);
      expect(notes[0].content).toBe('Note 1');
      expect(notes[1].content).toBe('Note 2');
      expect(notes[2].content).toBe('Note 3');
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle empty content string', async () => {
      // Arrange
      const input: CreateNoteInput = {
        content: '',
        keywords: [],
      };

      mockDb.runAsync.mockResolvedValue({ changes: 1 });
      mockDb.getFirstAsync.mockResolvedValue({
        id: 'empty-content-note',
        content: '',
        keywords: JSON.stringify([]),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Act
      const result = await createNote(input);

      // Assert
      expect(result.content).toBe('');
    });

    it('should handle special characters in content', async () => {
      // Arrange
      const specialContent = "Test with 'quotes', \"double quotes\", and symbols: @#$%^&*()";
      const input: CreateNoteInput = {
        content: specialContent,
        keywords: ['special'],
      };

      mockDb.runAsync.mockResolvedValue({ changes: 1 });
      mockDb.getFirstAsync.mockResolvedValue({
        id: 'special-chars-note',
        content: specialContent,
        keywords: JSON.stringify(input.keywords),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Act
      const result = await createNote(input);

      // Assert
      expect(result.content).toBe(specialContent);
    });

    it('should handle unicode characters in keywords', async () => {
      // Arrange
      const input: CreateNoteInput = {
        content: 'Test note',
        keywords: ['日本語', 'émojis', '🎉', 'Ελληνικά'],
      };

      mockDb.runAsync.mockResolvedValue({ changes: 1 });
      mockDb.getFirstAsync.mockResolvedValue({
        id: 'unicode-note',
        content: input.content,
        keywords: JSON.stringify(input.keywords),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Act
      const result = await createNote(input);

      // Assert
      expect(result.keywords).toEqual(['日本語', 'émojis', '🎉', 'Ελληνικά']);
    });

    it('should handle very long content strings', async () => {
      // Arrange
      const longContent = 'A'.repeat(10000); // 10,000 character string
      const input: CreateNoteInput = {
        content: longContent,
        keywords: ['long'],
      };

      mockDb.runAsync.mockResolvedValue({ changes: 1 });
      mockDb.getFirstAsync.mockResolvedValue({
        id: 'long-content-note',
        content: longContent,
        keywords: JSON.stringify(input.keywords),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Act
      const result = await createNote(input);

      // Assert
      expect(result.content.length).toBe(10000);
      expect(result.content).toBe(longContent);
    });

    it('should handle large number of keywords', async () => {
      // Arrange
      const manyKeywords = Array.from({ length: 100 }, (_, i) => `keyword${i}`);
      const input: CreateNoteInput = {
        content: 'Note with many keywords',
        keywords: manyKeywords,
      };

      mockDb.runAsync.mockResolvedValue({ changes: 1 });
      mockDb.getFirstAsync.mockResolvedValue({
        id: 'many-keywords-note',
        content: input.content,
        keywords: JSON.stringify(manyKeywords),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Act
      const result = await createNote(input);

      // Assert
      expect(result.keywords.length).toBe(100);
      expect(result.keywords).toEqual(manyKeywords);
    });
  });
});
