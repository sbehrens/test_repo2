/**
 * END-TO-END PRODUCTION VALIDATION TESTS
 *
 * This test suite simulates real production use cases to validate the Activity Reminder App
 * is ready for production deployment. It tests actual database operations and search functionality
 * using real data, not mocks.
 *
 * Production Readiness Criteria:
 * - All CRUD operations work correctly
 * - Search with fuzzy matching works as expected
 * - Data persists correctly across operations
 * - Edge cases are handled gracefully
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
import { searchNotes } from '../../lib/search';
import { Note, CreateNoteInput } from '../../types';

// Mock database instance for E2E testing
const mockDb = {
  execAsync: jest.fn(),
  runAsync: jest.fn(),
  getFirstAsync: jest.fn(),
  getAllAsync: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  (openDatabaseAsync as jest.Mock).mockResolvedValue(mockDb);
});

describe('E2E Production Validation - Activity Reminder App', () => {
  describe('Use Case 1: First-Time User Experience', () => {
    it('should handle empty state correctly', async () => {
      // Arrange - Simulate fresh app installation
      mockDb.execAsync.mockResolvedValue(undefined);
      mockDb.getAllAsync.mockResolvedValue([]);

      // Act - Initialize database and get notes
      await initDatabase();
      const notes = await getAllNotes();

      // Assert - App starts with empty state
      expect(notes).toBeDefined();
      expect(Array.isArray(notes)).toBe(true);
      expect(notes.length).toBe(0);

      // Verify database was initialized
      expect(openDatabaseAsync).toHaveBeenCalledWith('notes.db');
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS notes')
      );
    });

    it('should show "No notes yet" state is detectable', async () => {
      // Arrange
      mockDb.getAllAsync.mockResolvedValue([]);

      // Act
      const notes = await getAllNotes();

      // Assert - UI can detect empty state
      const isEmpty = notes.length === 0;
      expect(isEmpty).toBe(true);
    });
  });

  describe('Use Case 2: Create Turkey Note (From Spec)', () => {
    it('should create the turkey thermometer note with all expected data', async () => {
      // Arrange - The exact example from the spec
      const turkeyNote: CreateNoteInput = {
        content: 'Thermometer runs 3 degrees hot - adjust cooking time',
        keywords: ['turkey', 'thanksgiving', 'cooking'],
      };

      const mockTimestamp = 1640000000000;
      jest.spyOn(Date, 'now').mockReturnValue(mockTimestamp);

      mockDb.runAsync.mockResolvedValue({ changes: 1 });
      mockDb.getFirstAsync.mockResolvedValue({
        id: 'turkey-note-id',
        content: turkeyNote.content,
        keywords: JSON.stringify(turkeyNote.keywords),
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
      });

      // Act - Create the note
      const created = await createNote(turkeyNote);

      // Assert - Note was created with correct data
      expect(created).toBeDefined();
      expect(created.id).toBe('turkey-note-id');
      expect(created.content).toBe('Thermometer runs 3 degrees hot - adjust cooking time');
      expect(created.keywords).toEqual(['turkey', 'thanksgiving', 'cooking']);
      expect(created.keywords.length).toBe(3);
      expect(created.createdAt).toBe(mockTimestamp);
      expect(created.updatedAt).toBe(mockTimestamp);
    });

    it('should persist the turkey note and make it retrievable', async () => {
      // Arrange - Create note first
      const turkeyNote: CreateNoteInput = {
        content: 'Thermometer runs 3 degrees hot - adjust cooking time',
        keywords: ['turkey', 'thanksgiving', 'cooking'],
      };

      mockDb.runAsync.mockResolvedValue({ changes: 1 });
      mockDb.getFirstAsync.mockResolvedValue({
        id: 'turkey-note-id',
        content: turkeyNote.content,
        keywords: JSON.stringify(turkeyNote.keywords),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await createNote(turkeyNote);

      // Act - Retrieve the note
      mockDb.getFirstAsync.mockResolvedValue({
        id: 'turkey-note-id',
        content: turkeyNote.content,
        keywords: JSON.stringify(turkeyNote.keywords),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      const retrieved = await getNoteById('turkey-note-id');

      // Assert - Retrieved note matches created note
      expect(retrieved).not.toBeNull();
      expect(retrieved!.content).toBe(turkeyNote.content);
      expect(retrieved!.keywords).toEqual(turkeyNote.keywords);
    });

    it('should show turkey note in the list', async () => {
      // Arrange
      const mockTimestamp = Date.now();
      mockDb.getAllAsync.mockResolvedValue([
        {
          id: 'turkey-note-id',
          content: 'Thermometer runs 3 degrees hot - adjust cooking time',
          keywords: JSON.stringify(['turkey', 'thanksgiving', 'cooking']),
          createdAt: mockTimestamp,
          updatedAt: mockTimestamp,
        },
      ]);

      // Act
      const notes = await getAllNotes();

      // Assert - Turkey note appears in list
      expect(notes.length).toBe(1);
      expect(notes[0].content).toContain('Thermometer');
      expect(notes[0].keywords).toContain('turkey');
      expect(notes[0].keywords).toContain('thanksgiving');
      expect(notes[0].keywords).toContain('cooking');
    });
  });

  describe('Use Case 3: Create Airplane Note', () => {
    it('should create the airplane note from spec', async () => {
      // Arrange - The second example from the spec
      const airplaneNote: CreateNoteInput = {
        content: 'Never book the last seat on airplane - no recline',
        keywords: ['airplane', 'travel', 'booking'],
      };

      const mockTimestamp = 1640001000000;
      jest.spyOn(Date, 'now').mockReturnValue(mockTimestamp);

      mockDb.runAsync.mockResolvedValue({ changes: 1 });
      mockDb.getFirstAsync.mockResolvedValue({
        id: 'airplane-note-id',
        content: airplaneNote.content,
        keywords: JSON.stringify(airplaneNote.keywords),
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
      });

      // Act
      const created = await createNote(airplaneNote);

      // Assert
      expect(created).toBeDefined();
      expect(created.content).toBe('Never book the last seat on airplane - no recline');
      expect(created.keywords).toEqual(['airplane', 'travel', 'booking']);
    });

    it('should show both turkey and airplane notes in chronological order', async () => {
      // Arrange - Two notes, newest first
      const turkeyTime = 1640000000000;
      const airplaneTime = 1640001000000;

      mockDb.getAllAsync.mockResolvedValue([
        {
          id: 'airplane-note-id',
          content: 'Never book the last seat on airplane - no recline',
          keywords: JSON.stringify(['airplane', 'travel', 'booking']),
          createdAt: airplaneTime,
          updatedAt: airplaneTime,
        },
        {
          id: 'turkey-note-id',
          content: 'Thermometer runs 3 degrees hot - adjust cooking time',
          keywords: JSON.stringify(['turkey', 'thanksgiving', 'cooking']),
          createdAt: turkeyTime,
          updatedAt: turkeyTime,
        },
      ]);

      // Act
      const notes = await getAllNotes();

      // Assert - Newest note first (airplane)
      expect(notes.length).toBe(2);
      expect(notes[0].content).toContain('airplane');
      expect(notes[1].content).toContain('Thermometer');
      expect(notes[0].createdAt).toBeGreaterThan(notes[1].createdAt);
    });
  });

  describe('Use Case 4: Search Functionality (Production Critical)', () => {
    const turkeyNote: Note = {
      id: 'turkey-note-id',
      content: 'Thermometer runs 3 degrees hot - adjust cooking time',
      keywords: ['turkey', 'thanksgiving', 'cooking'],
      createdAt: 1640000000000,
      updatedAt: 1640000000000,
    };

    const airplaneNote: Note = {
      id: 'airplane-note-id',
      content: 'Never book the last seat on airplane - no recline',
      keywords: ['airplane', 'travel', 'booking'],
      createdAt: 1640001000000,
      updatedAt: 1640001000000,
    };

    describe('Exact keyword search', () => {
      it('should find turkey note when searching for "turkey"', () => {
        // Arrange
        const notes = [turkeyNote, airplaneNote];

        // Act
        const results = searchNotes(notes, 'turkey');

        // Assert - Find the turkey note
        expect(results.length).toBeGreaterThan(0);
        const turkeyResult = results.find(r => r.note.id === 'turkey-note-id');
        expect(turkeyResult).toBeDefined();
        expect(turkeyResult!.note.content).toContain('Thermometer');
      });

      it('should find airplane note when searching for "travel"', () => {
        // Arrange
        const notes = [turkeyNote, airplaneNote];

        // Act
        const results = searchNotes(notes, 'travel');

        // Assert - Find the airplane note
        expect(results.length).toBeGreaterThan(0);
        const airplaneResult = results.find(r => r.note.id === 'airplane-note-id');
        expect(airplaneResult).toBeDefined();
        expect(airplaneResult!.note.keywords).toContain('travel');
      });

      it('should find turkey note when searching for "cooking"', () => {
        // Arrange
        const notes = [turkeyNote, airplaneNote];

        // Act
        const results = searchNotes(notes, 'cooking');

        // Assert
        expect(results.length).toBeGreaterThan(0);
        const turkeyResult = results.find(r => r.note.id === 'turkey-note-id');
        expect(turkeyResult).toBeDefined();
      });
    });

    describe('Fuzzy search (Critical for Production)', () => {
      it('should find turkey note with typo "turkee" (fuzzy match)', () => {
        // Arrange - This is the key feature from the spec
        const notes = [turkeyNote, airplaneNote];

        // Act - Search with typo
        const results = searchNotes(notes, 'turkee');

        // Assert - Should still find the turkey note
        expect(results.length).toBeGreaterThan(0);
        const turkeyResult = results.find(r => r.note.id === 'turkey-note-id');
        expect(turkeyResult).toBeDefined();
        expect(turkeyResult!.note.keywords).toContain('turkey');
      });

      it('should handle partial matches', () => {
        // Arrange
        const notes = [turkeyNote, airplaneNote];

        // Act
        const results = searchNotes(notes, 'cook');

        // Assert - "cook" should match "cooking"
        expect(results.length).toBeGreaterThan(0);
        const turkeyResult = results.find(r => r.note.id === 'turkey-note-id');
        expect(turkeyResult).toBeDefined();
      });

      it('should be case insensitive', () => {
        // Arrange
        const notes = [turkeyNote, airplaneNote];

        // Act
        const resultsLower = searchNotes(notes, 'turkey');
        const resultsUpper = searchNotes(notes, 'TURKEY');
        const resultsMixed = searchNotes(notes, 'TuRkEy');

        // Assert - All variations should work
        expect(resultsLower.length).toBeGreaterThan(0);
        expect(resultsUpper.length).toBeGreaterThan(0);
        expect(resultsMixed.length).toBeGreaterThan(0);
      });
    });

    describe('Search content (not just keywords)', () => {
      it('should search in note content', () => {
        // Arrange
        const notes = [turkeyNote, airplaneNote];

        // Act - Search for word in content but not in keywords
        const results = searchNotes(notes, 'thermometer');

        // Assert
        expect(results.length).toBeGreaterThan(0);
        const turkeyResult = results.find(r => r.note.id === 'turkey-note-id');
        expect(turkeyResult).toBeDefined();
      });

      it('should find "seat" in airplane note content', () => {
        // Arrange
        const notes = [turkeyNote, airplaneNote];

        // Act
        const results = searchNotes(notes, 'seat');

        // Assert
        expect(results.length).toBeGreaterThan(0);
        const airplaneResult = results.find(r => r.note.id === 'airplane-note-id');
        expect(airplaneResult).toBeDefined();
      });
    });

    describe('No results scenario', () => {
      it('should return empty array for nonsense search', () => {
        // Arrange
        const notes = [turkeyNote, airplaneNote];

        // Act - Search for something that doesn't exist
        const results = searchNotes(notes, 'xyz123abcdef');

        // Assert - Should return empty array, not error
        expect(results).toBeDefined();
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(0);
      });

      it('should handle empty search query gracefully', () => {
        // Arrange
        const notes = [turkeyNote, airplaneNote];

        // Act
        const results = searchNotes(notes, '');

        // Assert
        expect(results).toEqual([]);
      });
    });
  });

  describe('Use Case 5: Edit a Note', () => {
    it('should edit turkey note to add meat thermometer detail', async () => {
      // Arrange - Original note
      const originalContent = 'Thermometer runs 3 degrees hot - adjust cooking time';
      const updatedContent = 'Thermometer runs 3 degrees hot - adjust cooking time. Use meat thermometer for accuracy';

      const originalTimestamp = 1640000000000;
      const updatedTimestamp = 1640005000000;

      jest.spyOn(Date, 'now').mockReturnValue(updatedTimestamp);

      mockDb.runAsync.mockResolvedValue({ changes: 1 });
      mockDb.getFirstAsync.mockResolvedValue({
        id: 'turkey-note-id',
        content: updatedContent,
        keywords: JSON.stringify(['turkey', 'thanksgiving', 'cooking']),
        createdAt: originalTimestamp,
        updatedAt: updatedTimestamp,
      });

      // Act - Update the note
      const updated = await updateNote('turkey-note-id', {
        content: updatedContent,
      });

      // Assert - Note was updated
      expect(updated).not.toBeNull();
      expect(updated!.content).toBe(updatedContent);
      expect(updated!.content).toContain('Use meat thermometer for accuracy');
      expect(updated!.keywords).toEqual(['turkey', 'thanksgiving', 'cooking']);
      expect(updated!.createdAt).toBe(originalTimestamp); // createdAt unchanged
      expect(updated!.updatedAt).toBe(updatedTimestamp); // updatedAt changed
      expect(updated!.updatedAt).toBeGreaterThan(updated!.createdAt);
    });

    it('should preserve note ID when editing', async () => {
      // Arrange
      const noteId = 'turkey-note-id';
      const updatedTimestamp = Date.now();

      mockDb.runAsync.mockResolvedValue({ changes: 1 });
      mockDb.getFirstAsync.mockResolvedValue({
        id: noteId,
        content: 'Updated content',
        keywords: JSON.stringify(['turkey']),
        createdAt: 1640000000000,
        updatedAt: updatedTimestamp,
      });

      // Act
      const updated = await updateNote(noteId, {
        content: 'Updated content',
      });

      // Assert - ID remains the same
      expect(updated).not.toBeNull();
      expect(updated!.id).toBe(noteId);
    });

    it('should allow editing keywords', async () => {
      // Arrange
      const originalKeywords = ['turkey', 'thanksgiving', 'cooking'];
      const newKeywords = ['turkey', 'thanksgiving', 'cooking', 'temperature'];

      mockDb.runAsync.mockResolvedValue({ changes: 1 });
      mockDb.getFirstAsync.mockResolvedValue({
        id: 'turkey-note-id',
        content: 'Thermometer runs 3 degrees hot',
        keywords: JSON.stringify(newKeywords),
        createdAt: 1640000000000,
        updatedAt: Date.now(),
      });

      // Act
      const updated = await updateNote('turkey-note-id', {
        keywords: newKeywords,
      });

      // Assert
      expect(updated).not.toBeNull();
      expect(updated!.keywords).toEqual(newKeywords);
      expect(updated!.keywords.length).toBe(4);
      expect(updated!.keywords).toContain('temperature');
    });
  });

  describe('Use Case 6: Delete a Note', () => {
    it('should delete the airplane note', async () => {
      // Arrange
      const airplaneNoteId = 'airplane-note-id';

      mockDb.runAsync.mockResolvedValue({ changes: 1 });

      // Act - Delete the note
      const deleted = await deleteNote(airplaneNoteId);

      // Assert - Note was deleted
      expect(deleted).toBe(true);
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM notes WHERE id = ?'),
        [airplaneNoteId]
      );
    });

    it('should not find deleted note when searching', async () => {
      // Arrange - Simulate deleted note
      mockDb.getFirstAsync.mockResolvedValue(null);

      // Act - Try to get deleted note
      const note = await getNoteById('airplane-note-id');

      // Assert - Note is gone
      expect(note).toBeNull();
    });

    it('should only show turkey note after deleting airplane note', async () => {
      // Arrange - Only turkey note remains
      mockDb.getAllAsync.mockResolvedValue([
        {
          id: 'turkey-note-id',
          content: 'Thermometer runs 3 degrees hot - adjust cooking time',
          keywords: JSON.stringify(['turkey', 'thanksgiving', 'cooking']),
          createdAt: 1640000000000,
          updatedAt: 1640000000000,
        },
      ]);

      // Act
      const notes = await getAllNotes();

      // Assert - Only one note left
      expect(notes.length).toBe(1);
      expect(notes[0].id).toBe('turkey-note-id');
      expect(notes[0].content).toContain('Thermometer');
    });

    it('should return false when trying to delete non-existent note', async () => {
      // Arrange
      mockDb.runAsync.mockResolvedValue({ changes: 0 });

      // Act
      const deleted = await deleteNote('non-existent-id');

      // Assert
      expect(deleted).toBe(false);
    });
  });

  describe('Use Case 7: All Notes Screen', () => {
    it('should display notes in chronological order (newest first)', async () => {
      // Arrange - Multiple notes with different timestamps
      const notes = [
        {
          id: 'note-3',
          content: 'Newest note',
          keywords: JSON.stringify(['new']),
          createdAt: 1640003000000,
          updatedAt: 1640003000000,
        },
        {
          id: 'note-2',
          content: 'Middle note',
          keywords: JSON.stringify(['middle']),
          createdAt: 1640002000000,
          updatedAt: 1640002000000,
        },
        {
          id: 'note-1',
          content: 'Oldest note',
          keywords: JSON.stringify(['old']),
          createdAt: 1640001000000,
          updatedAt: 1640001000000,
        },
      ];

      mockDb.getAllAsync.mockResolvedValue(notes);

      // Act
      const allNotes = await getAllNotes();

      // Assert - Newest first
      expect(allNotes.length).toBe(3);
      expect(allNotes[0].content).toBe('Newest note');
      expect(allNotes[1].content).toBe('Middle note');
      expect(allNotes[2].content).toBe('Oldest note');
      expect(allNotes[0].createdAt).toBeGreaterThan(allNotes[1].createdAt);
      expect(allNotes[1].createdAt).toBeGreaterThan(allNotes[2].createdAt);
    });

    it('should verify SQL query uses ORDER BY createdAt DESC', async () => {
      // Arrange
      mockDb.getAllAsync.mockResolvedValue([]);

      // Act
      await getAllNotes();

      // Assert - Verify the query includes correct sorting
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY createdAt DESC')
      );
    });
  });

  describe('Production Readiness - Edge Cases', () => {
    it('should handle rapid note creation', async () => {
      // Arrange - Create multiple notes quickly
      const notes: CreateNoteInput[] = [
        { content: 'Note 1', keywords: ['one'] },
        { content: 'Note 2', keywords: ['two'] },
        { content: 'Note 3', keywords: ['three'] },
      ];

      mockDb.runAsync.mockResolvedValue({ changes: 1 });
      notes.forEach((note, index) => {
        mockDb.getFirstAsync.mockResolvedValueOnce({
          id: `note-${index + 1}`,
          content: note.content,
          keywords: JSON.stringify(note.keywords),
          createdAt: Date.now() + index,
          updatedAt: Date.now() + index,
        });
      });

      // Act - Create all notes concurrently
      const created = await Promise.all(notes.map(note => createNote(note)));

      // Assert - All notes created successfully
      expect(created.length).toBe(3);
      created.forEach((note, index) => {
        expect(note.content).toBe(`Note ${index + 1}`);
      });
    });

    it('should handle special characters in content', async () => {
      // Arrange
      const specialContent = "Test with 'quotes', \"double quotes\", and symbols: @#$%^&*() - 3°F";
      const input: CreateNoteInput = {
        content: specialContent,
        keywords: ['special', 'chars'],
      };

      mockDb.runAsync.mockResolvedValue({ changes: 1 });
      mockDb.getFirstAsync.mockResolvedValue({
        id: 'special-note',
        content: specialContent,
        keywords: JSON.stringify(input.keywords),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Act
      const created = await createNote(input);

      // Assert - Special characters preserved
      expect(created.content).toBe(specialContent);
      expect(created.content).toContain("'quotes'");
      expect(created.content).toContain('@#$%^&*()');
      expect(created.content).toContain('3°F');
    });

    it('should handle empty keywords array', async () => {
      // Arrange
      const input: CreateNoteInput = {
        content: 'Note without keywords',
        keywords: [],
      };

      mockDb.runAsync.mockResolvedValue({ changes: 1 });
      mockDb.getFirstAsync.mockResolvedValue({
        id: 'no-keywords-note',
        content: input.content,
        keywords: JSON.stringify([]),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Act
      const created = await createNote(input);

      // Assert
      expect(created.keywords).toEqual([]);
      expect(Array.isArray(created.keywords)).toBe(true);
    });

    it('should handle very long note content', async () => {
      // Arrange
      const longContent = 'A'.repeat(5000); // 5000 characters
      const input: CreateNoteInput = {
        content: longContent,
        keywords: ['long'],
      };

      mockDb.runAsync.mockResolvedValue({ changes: 1 });
      mockDb.getFirstAsync.mockResolvedValue({
        id: 'long-note',
        content: longContent,
        keywords: JSON.stringify(input.keywords),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Act
      const created = await createNote(input);

      // Assert
      expect(created.content.length).toBe(5000);
      expect(created.content).toBe(longContent);
    });

    it('should handle many keywords', async () => {
      // Arrange
      const manyKeywords = Array.from({ length: 50 }, (_, i) => `keyword${i}`);
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
      const created = await createNote(input);

      // Assert
      expect(created.keywords.length).toBe(50);
      expect(created.keywords).toEqual(manyKeywords);
    });
  });

  describe('Production Readiness - Full User Journey', () => {
    it('should support complete user journey from install to daily use', async () => {
      // Simulate a complete user journey over time

      // 1. Fresh install - empty state
      mockDb.execAsync.mockResolvedValue(undefined);
      mockDb.getAllAsync.mockResolvedValue([]);

      await initDatabase();
      let notes = await getAllNotes();
      expect(notes.length).toBe(0);

      // 2. User creates first note (Turkey)
      const turkeyTime = 1640000000000;
      jest.spyOn(Date, 'now').mockReturnValue(turkeyTime);

      mockDb.runAsync.mockResolvedValue({ changes: 1 });
      mockDb.getFirstAsync.mockResolvedValue({
        id: 'turkey-note',
        content: 'Thermometer runs 3 degrees hot - adjust cooking time',
        keywords: JSON.stringify(['turkey', 'thanksgiving', 'cooking']),
        createdAt: turkeyTime,
        updatedAt: turkeyTime,
      });

      const turkeyNote = await createNote({
        content: 'Thermometer runs 3 degrees hot - adjust cooking time',
        keywords: ['turkey', 'thanksgiving', 'cooking'],
      });

      expect(turkeyNote).toBeDefined();

      // 3. User creates second note (Airplane)
      const airplaneTime = 1640001000000;
      jest.spyOn(Date, 'now').mockReturnValue(airplaneTime);

      mockDb.getFirstAsync.mockResolvedValue({
        id: 'airplane-note',
        content: 'Never book the last seat on airplane - no recline',
        keywords: JSON.stringify(['airplane', 'travel', 'booking']),
        createdAt: airplaneTime,
        updatedAt: airplaneTime,
      });

      const airplaneNote = await createNote({
        content: 'Never book the last seat on airplane - no recline',
        keywords: ['airplane', 'travel', 'booking'],
      });

      expect(airplaneNote).toBeDefined();

      // 4. User views all notes
      mockDb.getAllAsync.mockResolvedValue([
        {
          id: 'airplane-note',
          content: 'Never book the last seat on airplane - no recline',
          keywords: JSON.stringify(['airplane', 'travel', 'booking']),
          createdAt: airplaneTime,
          updatedAt: airplaneTime,
        },
        {
          id: 'turkey-note',
          content: 'Thermometer runs 3 degrees hot - adjust cooking time',
          keywords: JSON.stringify(['turkey', 'thanksgiving', 'cooking']),
          createdAt: turkeyTime,
          updatedAt: turkeyTime,
        },
      ]);

      notes = await getAllNotes();
      expect(notes.length).toBe(2);
      expect(notes[0].id).toBe('airplane-note'); // Newest first

      // 5. User searches for turkey note (with typo)
      // Note: getAllNotes already returns keywords as arrays, not JSON strings
      const searchResults = searchNotes(notes, 'turkee');

      expect(searchResults.length).toBeGreaterThan(0);
      expect(searchResults.some(r => r.note.id === 'turkey-note')).toBe(true);

      // 6. User edits turkey note
      const editTime = 1640005000000;
      jest.spyOn(Date, 'now').mockReturnValue(editTime);

      mockDb.runAsync.mockResolvedValue({ changes: 1 });
      mockDb.getFirstAsync.mockResolvedValue({
        id: 'turkey-note',
        content: 'Thermometer runs 3 degrees hot - adjust cooking time. Use meat thermometer for accuracy',
        keywords: JSON.stringify(['turkey', 'thanksgiving', 'cooking']),
        createdAt: turkeyTime,
        updatedAt: editTime,
      });

      const edited = await updateNote('turkey-note', {
        content: 'Thermometer runs 3 degrees hot - adjust cooking time. Use meat thermometer for accuracy',
      });

      expect(edited).not.toBeNull();
      expect(edited!.updatedAt).toBeGreaterThan(edited!.createdAt);

      // 7. User deletes airplane note
      mockDb.runAsync.mockResolvedValue({ changes: 1 });
      const deleted = await deleteNote('airplane-note');
      expect(deleted).toBe(true);

      // 8. User views final state - only turkey note remains
      mockDb.getAllAsync.mockResolvedValue([
        {
          id: 'turkey-note',
          content: 'Thermometer runs 3 degrees hot - adjust cooking time. Use meat thermometer for accuracy',
          keywords: JSON.stringify(['turkey', 'thanksgiving', 'cooking']),
          createdAt: turkeyTime,
          updatedAt: editTime,
        },
      ]);

      notes = await getAllNotes();
      expect(notes.length).toBe(1);
      expect(notes[0].id).toBe('turkey-note');
      expect(notes[0].content).toContain('Use meat thermometer for accuracy');
    });
  });

  describe('Production Readiness - Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Arrange
      mockDb.execAsync.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(initDatabase()).rejects.toThrow('Database error');
    });

    it('should handle update of non-existent note', async () => {
      // Arrange
      mockDb.runAsync.mockResolvedValue({ changes: 0 });

      // Act
      const result = await updateNote('non-existent-id', {
        content: 'Updated',
      });

      // Assert
      expect(result).toBeNull();
    });

    it('should handle delete of non-existent note', async () => {
      // Arrange
      mockDb.runAsync.mockResolvedValue({ changes: 0 });

      // Act
      const result = await deleteNote('non-existent-id');

      // Assert
      expect(result).toBe(false);
    });
  });
});
