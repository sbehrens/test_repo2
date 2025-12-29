import Fuse from 'fuse.js';
import { Note, SearchResult } from '../types';

/**
 * Search notes by query string (fuzzy matching on keywords and content)
 * @param notes - Array of notes to search
 * @param query - Search query string
 * @returns Array of search results sorted by relevance
 */
export function searchNotes(notes: Note[], query: string): SearchResult[] {
  // Return empty array if notes is empty or query is empty
  if (!notes || notes.length === 0 || !query || query.trim() === '') {
    return [];
  }

  // Configure Fuse.js for fuzzy search
  const fuse = new Fuse(notes, {
    keys: ['keywords', 'content'],
    includeScore: true,
    threshold: 0.4, // 0 = exact match, 1 = match anything
    ignoreLocation: true, // Don't care where in the string the match is
    minMatchCharLength: 1,
  });

  // Perform the search
  const fuseResults = fuse.search(query);

  // Transform Fuse results to SearchResult format
  const results: SearchResult[] = fuseResults.map(result => ({
    note: result.item,
    score: result.score ?? 0, // Fuse score is 0-1, lower is better
  }));

  // Results are already sorted by Fuse (best match first)
  return results;
}

/**
 * Search configuration options
 */
export interface SearchOptions {
  threshold?: number;
  includeScore?: boolean;
  keys?: string[];
}

/**
 * Configure search options
 * @param options - Search configuration options
 */
export function configureSearch(options: SearchOptions): void {
  // TODO: Implement configuration
}
