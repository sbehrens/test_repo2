import { searchNotes } from '../../lib/search';
import { Note, SearchResult } from '../../types';

describe('Search Service', () => {
  // Helper function to create test notes
  const createNote = (
    id: string,
    content: string,
    keywords: string[],
    createdAt: number = Date.now()
  ): Note => ({
    id,
    content,
    keywords,
    createdAt,
    updatedAt: createdAt,
  });

  describe('Basic Search', () => {
    it('should return empty array when notes array is empty', () => {
      const results = searchNotes([], 'turkey');
      expect(results).toEqual([]);
      expect(results).toHaveLength(0);
    });

    it('should return empty array when query is empty', () => {
      const notes: Note[] = [
        createNote('1', 'Thermometer runs 3° hot', ['turkey', 'thanksgiving', 'cooking']),
      ];
      const results = searchNotes(notes, '');
      expect(results).toEqual([]);
      expect(results).toHaveLength(0);
    });

    it('should find exact keyword match', () => {
      const note = createNote('1', 'Thermometer runs 3° hot', ['turkey', 'thanksgiving', 'cooking']);
      const notes: Note[] = [note];

      const results = searchNotes(notes, 'turkey');

      expect(results).toHaveLength(1);
      expect(results[0].note).toEqual(note);
      expect(results[0].score).toBeDefined();
    });

    it('should find partial keyword match (fuzzy)', () => {
      const note = createNote('1', 'Thermometer runs 3° hot', ['cooking', 'thanksgiving']);
      const notes: Note[] = [note];

      const results = searchNotes(notes, 'cook');

      expect(results).toHaveLength(1);
      expect(results[0].note).toEqual(note);
    });

    it('should find match in content', () => {
      const note = createNote('1', 'Thermometer runs 3° hot', ['tools', 'measurement']);
      const notes: Note[] = [note];

      const results = searchNotes(notes, 'thermometer');

      expect(results).toHaveLength(1);
      expect(results[0].note).toEqual(note);
    });

    it('should search both keywords and content', () => {
      const note1 = createNote('1', 'Thermometer runs 3° hot', ['turkey']);
      const note2 = createNote('2', 'Use a meat thermometer', ['cooking']);
      const note3 = createNote('3', 'Set timer for turkey', ['timer', 'thanksgiving']);
      const notes: Note[] = [note1, note2, note3];

      const results = searchNotes(notes, 'thermometer');

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(r => r.note.id === '1' || r.note.id === '2')).toBe(true);
    });
  });

  describe('Fuzzy Matching', () => {
    it('should match with typos (e.g., "turkee" matches "turkey")', () => {
      const note = createNote('1', 'Cook the turkey at 350°F', ['turkey', 'cooking']);
      const notes: Note[] = [note];

      const results = searchNotes(notes, 'turkee');

      expect(results).toHaveLength(1);
      expect(results[0].note).toEqual(note);
    });

    it('should match partial words (e.g., "cook" matches "cooking")', () => {
      const note = createNote('1', 'Follow the recipe', ['cooking', 'recipe']);
      const notes: Note[] = [note];

      const results = searchNotes(notes, 'cook');

      expect(results).toHaveLength(1);
      expect(results[0].note).toEqual(note);
    });

    it('should be case insensitive', () => {
      const note = createNote('1', 'Turkey cooking tips', ['Turkey', 'Cooking']);
      const notes: Note[] = [note];

      const resultsLower = searchNotes(notes, 'turkey');
      const resultsUpper = searchNotes(notes, 'TURKEY');
      const resultsMixed = searchNotes(notes, 'TuRkEy');

      expect(resultsLower).toHaveLength(1);
      expect(resultsUpper).toHaveLength(1);
      expect(resultsMixed).toHaveLength(1);
      expect(resultsLower[0].note).toEqual(note);
      expect(resultsUpper[0].note).toEqual(note);
      expect(resultsMixed[0].note).toEqual(note);
    });
  });

  describe('Scoring', () => {
    it('should return results sorted by relevance (best match first)', () => {
      const note1 = createNote('1', 'Turkey is delicious', ['turkey', 'food']);
      const note2 = createNote('2', 'The turkee was undercooked', ['cooking']);
      const note3 = createNote('3', 'How to cook a bird', ['cooking', 'poultry']);
      const notes: Note[] = [note1, note2, note3];

      const results = searchNotes(notes, 'turkey');

      // Results should be sorted with best match first
      expect(results.length).toBeGreaterThan(0);

      // Verify scores are in ascending order (lower is better)
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].score).toBeLessThanOrEqual(results[i + 1].score);
      }

      // Exact match should be first
      expect(results[0].note.id).toBe('1');
    });

    it('should return score between 0 and 1', () => {
      const note = createNote('1', 'Turkey cooking guide', ['turkey', 'cooking']);
      const notes: Note[] = [note];

      const results = searchNotes(notes, 'turkey');

      expect(results).toHaveLength(1);
      expect(results[0].score).toBeGreaterThanOrEqual(0);
      expect(results[0].score).toBeLessThanOrEqual(1);
    });

    it('lower score should indicate better match', () => {
      const exactMatch = createNote('1', 'Turkey recipe', ['turkey']);
      const partialMatch = createNote('2', 'Turkee recipee', ['cooking']);
      const notes: Note[] = [exactMatch, partialMatch];

      const results = searchNotes(notes, 'turkey');

      expect(results.length).toBeGreaterThanOrEqual(1);

      // Find exact match and partial match in results
      const exactResult = results.find(r => r.note.id === '1');
      const partialResult = results.find(r => r.note.id === '2');

      if (exactResult && partialResult) {
        expect(exactResult.score).toBeLessThan(partialResult.score);
      }
    });

    it('exact match should have lowest score', () => {
      const exactMatch = createNote('1', 'Turkey roasting tips', ['turkey', 'roasting']);
      const fuzzyMatch1 = createNote('2', 'Turkee cooking', ['cooking']);
      const fuzzyMatch2 = createNote('3', 'Thanksgiving dinner', ['thanksgiving']);
      const notes: Note[] = [exactMatch, fuzzyMatch1, fuzzyMatch2];

      const results = searchNotes(notes, 'turkey');

      expect(results.length).toBeGreaterThan(0);

      const exactResult = results.find(r => r.note.id === '1');
      expect(exactResult).toBeDefined();

      if (exactResult) {
        // Exact match should have the lowest score
        results.forEach(result => {
          if (result.note.id !== '1') {
            expect(exactResult.score).toBeLessThanOrEqual(result.score);
          }
        });
      }
    });
  });

  describe('Multiple Results', () => {
    it('should return multiple matching notes', () => {
      const note1 = createNote('1', 'Turkey cooking time', ['turkey', 'cooking']);
      const note2 = createNote('2', 'Turkey temperature', ['turkey', 'temperature']);
      const note3 = createNote('3', 'Turkey seasoning', ['turkey', 'seasoning']);
      const note4 = createNote('4', 'Chicken recipe', ['chicken', 'cooking']);
      const notes: Note[] = [note1, note2, note3, note4];

      const results = searchNotes(notes, 'turkey');

      expect(results.length).toBeGreaterThanOrEqual(3);
      expect(results.some(r => r.note.id === '1')).toBe(true);
      expect(results.some(r => r.note.id === '2')).toBe(true);
      expect(results.some(r => r.note.id === '3')).toBe(true);
    });

    it('should return all notes matching the query', () => {
      const note1 = createNote('1', 'Oven temperature 350°F', ['cooking', 'oven']);
      const note2 = createNote('2', 'Cooking time 4 hours', ['cooking', 'time']);
      const note3 = createNote('3', 'Cooking tips and tricks', ['cooking', 'tips']);
      const note4 = createNote('4', 'Grocery list', ['shopping']);
      const notes: Note[] = [note1, note2, note3, note4];

      const results = searchNotes(notes, 'cooking');

      // Should return at least 3 notes that have 'cooking' keyword or content
      expect(results.length).toBeGreaterThanOrEqual(3);

      // Should not include the grocery list note unless it fuzzy matches
      const groceryNote = results.find(r => r.note.id === '4');
      if (groceryNote) {
        // If included, it should have a high score (worse match)
        expect(groceryNote.score).toBeGreaterThan(0.5);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in query', () => {
      const note = createNote('1', 'Temperature is 350°F', ['temperature', 'cooking']);
      const notes: Note[] = [note];

      const results1 = searchNotes(notes, '350°F');
      const results2 = searchNotes(notes, 'temperature');
      const results3 = searchNotes(notes, '350');

      // Should handle queries with special characters
      expect(() => searchNotes(notes, '350°F')).not.toThrow();
      expect(() => searchNotes(notes, '@#$%')).not.toThrow();

      // At least one of these should return results
      expect(results1.length + results2.length + results3.length).toBeGreaterThan(0);
    });

    it('should handle notes with empty keywords array', () => {
      const note1 = createNote('1', 'Note with keywords', ['keyword1', 'keyword2']);
      const note2 = createNote('2', 'Note without keywords', []);
      const notes: Note[] = [note1, note2];

      const results = searchNotes(notes, 'keywords');

      // Should not throw error and should handle empty arrays gracefully
      expect(() => searchNotes(notes, 'keywords')).not.toThrow();
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].note.id).toBe('1');
    });

    it('should handle very long queries', () => {
      const note = createNote('1', 'Short note', ['cooking', 'turkey']);
      const notes: Note[] = [note];

      const longQuery = 'This is a very long query with many words that goes on and on and includes terms like turkey and cooking and many other words that might or might not match';

      // Should not throw error with long queries
      expect(() => searchNotes(notes, longQuery)).not.toThrow();

      const results = searchNotes(notes, longQuery);

      // Should still return results if there are matching terms
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('SearchResult Interface', () => {
    it('should return results with correct SearchResult interface', () => {
      const note = createNote('1', 'Test note', ['test']);
      const notes: Note[] = [note];

      const results = searchNotes(notes, 'test');

      expect(results.length).toBeGreaterThan(0);

      results.forEach((result: SearchResult) => {
        expect(result).toHaveProperty('note');
        expect(result).toHaveProperty('score');
        expect(result.note).toHaveProperty('id');
        expect(result.note).toHaveProperty('content');
        expect(result.note).toHaveProperty('keywords');
        expect(result.note).toHaveProperty('createdAt');
        expect(result.note).toHaveProperty('updatedAt');
        expect(typeof result.score).toBe('number');
      });
    });
  });
});
