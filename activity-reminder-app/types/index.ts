/**
 * Core Note interface - the main data model for storing activity notes
 */
export interface Note {
  /** Unique identifier (UUID) */
  id: string;

  /** The actual note content (e.g., "Thermometer runs 3° hot") */
  content: string;

  /** Associated keywords for search and categorization (e.g., ["turkey", "thanksgiving", "cooking"]) */
  keywords: string[];

  /** Unix timestamp when the note was created */
  createdAt: number;

  /** Unix timestamp when the note was last updated */
  updatedAt: number;
}

/**
 * Input type for creating new notes
 * Does not include id and timestamps as these are generated automatically
 */
export interface CreateNoteInput {
  /** The actual note content */
  content: string;

  /** Associated keywords for search and categorization */
  keywords: string[];
}

/**
 * Input type for updating existing notes
 * All fields are optional to allow partial updates
 */
export interface UpdateNoteInput {
  /** Updated note content */
  content?: string;

  /** Updated keywords */
  keywords?: string[];
}

/**
 * Search result containing a note and its relevance score
 */
export interface SearchResult {
  /** The matching note */
  note: Note;

  /** Fuzzy match score (0-1, where lower values indicate better matches) */
  score: number;
}
