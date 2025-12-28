# API Reference

This document provides detailed API documentation for all internal modules in the Activity Reminder App.

## Table of Contents
- [Database API](#database-api)
- [Search API](#search-api)
- [Speech Recognition Hook](#speech-recognition-hook)
- [Type Definitions](#type-definitions)
- [Error Handling](#error-handling)
- [Usage Examples](#usage-examples)

---

## Database API

**Module**: `lib/database.ts`

The Database API provides CRUD operations for managing notes in the local SQLite database.

### initDatabase()

Initialize the SQLite database and create the notes table if it doesn't exist.

**Signature**:
```typescript
function initDatabase(): Promise<void>
```

**Returns**: `Promise<void>` - Resolves when database is initialized

**Throws**: Error if database initialization fails

**Example**:
```typescript
import { initDatabase } from '@/lib/database';

await initDatabase();
```

**Notes**:
- Must be called before any database operations
- Safe to call multiple times (idempotent)
- Creates table with `IF NOT EXISTS` clause
- Automatically called by other database functions if not initialized

**Database Schema**:
```sql
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  keywords TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
)
```

---

### createNote()

Create a new note in the database.

**Signature**:
```typescript
function createNote(input: CreateNoteInput): Promise<Note>
```

**Parameters**:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `input` | `CreateNoteInput` | Yes | Note creation data |
| `input.content` | `string` | Yes | Note content/description |
| `input.keywords` | `string[]` | Yes | Array of keyword strings |

**Returns**: `Promise<Note>` - The created note with generated ID and timestamps

**Throws**:
- Error if database operation fails
- Error if note creation is unsuccessful

**Example**:
```typescript
import { createNote } from '@/lib/database';

const newNote = await createNote({
  content: 'Thermometer runs 3° hot when cooking turkey',
  keywords: ['turkey', 'thanksgiving', 'cooking']
});

console.log(newNote);
// {
//   id: '550e8400-e29b-41d4-a716-446655440000',
//   content: 'Thermometer runs 3° hot when cooking turkey',
//   keywords: ['turkey', 'thanksgiving', 'cooking'],
//   createdAt: 1703001234567,
//   updatedAt: 1703001234567
// }
```

**Implementation Details**:
- Generates UUID v4 for note ID
- Sets `createdAt` and `updatedAt` to current timestamp
- Serializes keywords array to JSON string for storage
- Retrieves and deserializes the created note
- Returns fully-formed Note object

---

### getNoteById()

Retrieve a single note by its ID.

**Signature**:
```typescript
function getNoteById(id: string): Promise<Note | null>
```

**Parameters**:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `id` | `string` | Yes | UUID of the note to retrieve |

**Returns**:
- `Promise<Note>` - The note if found
- `Promise<null>` - If note doesn't exist

**Throws**: Error if database operation fails

**Example**:
```typescript
import { getNoteById } from '@/lib/database';

const note = await getNoteById('550e8400-e29b-41d4-a716-446655440000');

if (note) {
  console.log('Found note:', note.content);
} else {
  console.log('Note not found');
}
```

**Use Cases**:
- Loading a note for editing
- Verifying note existence
- Retrieving note details

---

### getAllNotes()

Retrieve all notes from the database, sorted by creation date (newest first).

**Signature**:
```typescript
function getAllNotes(): Promise<Note[]>
```

**Returns**: `Promise<Note[]>` - Array of all notes, sorted by `createdAt` DESC

**Throws**: Error if database operation fails

**Example**:
```typescript
import { getAllNotes } from '@/lib/database';

const notes = await getAllNotes();

console.log(`Found ${notes.length} notes`);
notes.forEach(note => {
  console.log(`- ${note.content}`);
});
```

**Sorting**:
- Notes are sorted by `createdAt` in descending order
- Most recently created notes appear first
- SQL: `ORDER BY createdAt DESC`

**Performance**:
- Loads all notes into memory
- Efficient for < 1000 notes
- Consider pagination for larger datasets

---

### updateNote()

Update an existing note's content and/or keywords.

**Signature**:
```typescript
function updateNote(id: string, input: UpdateNoteInput): Promise<Note | null>
```

**Parameters**:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `id` | `string` | Yes | UUID of the note to update |
| `input` | `UpdateNoteInput` | Yes | Update data |
| `input.content` | `string` | No | New note content |
| `input.keywords` | `string[]` | No | New keywords array |

**Returns**:
- `Promise<Note>` - The updated note
- `Promise<null>` - If note doesn't exist

**Throws**: Error if database operation fails

**Example**:
```typescript
import { updateNote } from '@/lib/database';

// Update content only
const updatedNote = await updateNote('550e8400-...', {
  content: 'Thermometer runs 5° hot (updated)'
});

// Update keywords only
const updatedNote2 = await updateNote('550e8400-...', {
  keywords: ['turkey', 'oven', 'temperature']
});

// Update both
const updatedNote3 = await updateNote('550e8400-...', {
  content: 'New content',
  keywords: ['new', 'keywords']
});
```

**Implementation Details**:
- Supports partial updates (content, keywords, or both)
- Automatically updates `updatedAt` timestamp
- Preserves fields that aren't updated
- Returns null if note with given ID doesn't exist
- Returns full note object after update

---

### deleteNote()

Delete a note from the database.

**Signature**:
```typescript
function deleteNote(id: string): Promise<boolean>
```

**Parameters**:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `id` | `string` | Yes | UUID of the note to delete |

**Returns**:
- `Promise<true>` - If note was deleted successfully
- `Promise<false>` - If note doesn't exist

**Throws**: Error if database operation fails

**Example**:
```typescript
import { deleteNote } from '@/lib/database';

const deleted = await deleteNote('550e8400-e29b-41d4-a716-446655440000');

if (deleted) {
  console.log('Note deleted successfully');
} else {
  console.log('Note not found');
}
```

**Notes**:
- Operation is permanent (no soft delete)
- Returns false if note doesn't exist (not an error)
- Check return value to confirm deletion

---

## Search API

**Module**: `lib/search.ts`

The Search API provides fuzzy search functionality for finding notes by content and keywords.

### searchNotes()

Search notes using fuzzy matching on content and keywords.

**Signature**:
```typescript
function searchNotes(notes: Note[], query: string): SearchResult[]
```

**Parameters**:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `notes` | `Note[]` | Yes | Array of notes to search |
| `query` | `string` | Yes | Search query string |

**Returns**: `SearchResult[]` - Array of search results sorted by relevance (best match first)

**Example**:
```typescript
import { searchNotes } from '@/lib/search';
import { getAllNotes } from '@/lib/database';

const allNotes = await getAllNotes();
const results = searchNotes(allNotes, 'turkey');

results.forEach(result => {
  console.log(`Score: ${result.score}`);
  console.log(`Content: ${result.note.content}`);
  console.log('---');
});
```

**Search Configuration**:
- **Keys**: Searches in `keywords` and `content` fields
- **Threshold**: 0.4 (0 = exact match, 1 = match anything)
- **Ignore Location**: True (matches anywhere in the text)
- **Min Match Length**: 1 character

**Algorithm**:
Uses Fuse.js fuzzy search algorithm:
1. Tokenizes search query
2. Compares against note content and keywords
3. Calculates relevance score for each match
4. Sorts results by score (lower = better match)
5. Returns array of SearchResult objects

**Score Interpretation**:
- `0.0` - Perfect match
- `0.1-0.2` - Very good match
- `0.3-0.4` - Good match
- `> 0.4` - Not returned (exceeds threshold)

**Edge Cases**:
```typescript
// Empty notes array
searchNotes([], 'query');  // Returns []

// Empty query
searchNotes(notes, '');    // Returns []

// Query with only whitespace
searchNotes(notes, '   '); // Returns []
```

**Performance**:
- O(n) where n = number of notes
- Efficient for < 10,000 notes
- Runs on client-side (no server needed)

---

### configureSearch()

Configure search options (currently a placeholder for future implementation).

**Signature**:
```typescript
function configureSearch(options: SearchOptions): void
```

**Parameters**:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `SearchOptions` | Yes | Search configuration |
| `options.threshold` | `number` | No | Match threshold (0-1) |
| `options.includeScore` | `boolean` | No | Include score in results |
| `options.keys` | `string[]` | No | Fields to search |

**Status**: Not yet implemented (TODO)

---

## Speech Recognition Hook

**Module**: `lib/speech.ts`

The Speech Recognition API provides a React hook for voice input functionality.

### useSpeechRecognition()

React hook that manages speech recognition state and provides voice input functionality.

**Signature**:
```typescript
function useSpeechRecognition(): UseSpeechRecognitionResult
```

**Returns**: `UseSpeechRecognitionResult` object with the following properties:

| Property | Type | Description |
|----------|------|-------------|
| `isListening` | `boolean` | Whether speech recognition is currently active |
| `transcript` | `string` | Current transcribed text from speech input |
| `error` | `string \| null` | Error message if speech recognition failed |
| `isAvailable` | `boolean` | Whether speech recognition is available on device |
| `startListening` | `() => Promise<void>` | Function to start speech recognition |
| `stopListening` | `() => Promise<void>` | Function to stop speech recognition |
| `resetTranscript` | `() => void` | Function to clear transcript |

**Example**:
```typescript
import { useSpeechRecognition } from '@/lib/speech';

function MyComponent() {
  const {
    isListening,
    transcript,
    error,
    isAvailable,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition();

  const handleMicPress = async () => {
    if (isListening) {
      await stopListening();
    } else {
      await startListening();
    }
  };

  return (
    <View>
      {isAvailable && (
        <Button
          onPress={handleMicPress}
          title={isListening ? 'Stop' : 'Start'}
        />
      )}
      {isListening && <Text>Listening...</Text>}
      {transcript && <Text>You said: {transcript}</Text>}
      {error && <Text style={{color: 'red'}}>{error}</Text>}
    </View>
  );
}
```

---

### startListening()

Start speech recognition and request microphone permissions if needed.

**Signature**:
```typescript
function startListening(): Promise<void>
```

**Returns**: `Promise<void>` - Resolves when speech recognition starts

**Side Effects**:
- Requests microphone permission (first time)
- Sets `isListening` to `true`
- Clears previous error state
- Begins listening for speech

**Errors**:
Sets `error` state if:
- Permission denied
- Speech recognition not available
- Device doesn't support speech recognition
- Another app is using the microphone

**Example**:
```typescript
try {
  await startListening();
  console.log('Started listening');
} catch (err) {
  console.error('Failed to start:', err);
}
```

**Permission Flow**:
1. Check if already listening (no-op if true)
2. Clear previous errors
3. Request microphone permission
4. Check permission status
5. If granted, start speech recognition
6. If denied, set error message

---

### stopListening()

Stop speech recognition.

**Signature**:
```typescript
function stopListening(): Promise<void>
```

**Returns**: `Promise<void>` - Resolves when speech recognition stops

**Side Effects**:
- Sets `isListening` to `false`
- Stops listening for speech
- Preserves current transcript

**Example**:
```typescript
await stopListening();
console.log('Stopped listening');
```

**Notes**:
- Safe to call even if not listening
- Errors are silently handled
- Transcript is preserved (not cleared)

---

### resetTranscript()

Clear the current transcript.

**Signature**:
```typescript
function resetTranscript(): void
```

**Side Effects**:
- Sets `transcript` to empty string

**Example**:
```typescript
resetTranscript();
console.log('Transcript cleared');
```

**Use Cases**:
- Clear transcript before starting new recording
- Reset after submitting voice input
- Clear after canceling input

---

## Type Definitions

**Module**: `types/index.ts`

### Note

The main data model representing an activity note.

```typescript
interface Note {
  id: string;           // UUID v4
  content: string;      // Note content/description
  keywords: string[];   // Search keywords
  createdAt: number;    // Unix timestamp (ms)
  updatedAt: number;    // Unix timestamp (ms)
}
```

**Example**:
```typescript
const note: Note = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  content: 'Thermometer runs 3° hot when cooking turkey',
  keywords: ['turkey', 'thanksgiving', 'cooking'],
  createdAt: 1703001234567,
  updatedAt: 1703001234567
};
```

---

### CreateNoteInput

Input type for creating new notes.

```typescript
interface CreateNoteInput {
  content: string;      // Note content (required)
  keywords: string[];   // Search keywords (required, can be empty array)
}
```

**Validation**:
- `content` must not be empty after trimming
- `keywords` can be empty array but must be provided

**Example**:
```typescript
const input: CreateNoteInput = {
  content: 'My note content',
  keywords: ['keyword1', 'keyword2']
};
```

---

### UpdateNoteInput

Input type for updating existing notes (all fields optional).

```typescript
interface UpdateNoteInput {
  content?: string;     // New content (optional)
  keywords?: string[];  // New keywords (optional)
}
```

**Validation**:
- At least one field should be provided
- If `content` is provided, it must not be empty after trimming

**Example**:
```typescript
// Update content only
const input1: UpdateNoteInput = {
  content: 'Updated content'
};

// Update keywords only
const input2: UpdateNoteInput = {
  keywords: ['new', 'keywords']
};

// Update both
const input3: UpdateNoteInput = {
  content: 'Updated content',
  keywords: ['new', 'keywords']
};
```

---

### SearchResult

Search result containing a note and its relevance score.

```typescript
interface SearchResult {
  note: Note;          // The matching note
  score: number;       // Fuzzy match score (0-1, lower is better)
}
```

**Example**:
```typescript
const results: SearchResult[] = [
  {
    note: {
      id: '123',
      content: 'Turkey cooking tips',
      keywords: ['turkey'],
      createdAt: 1703001234567,
      updatedAt: 1703001234567
    },
    score: 0.12  // Very good match
  },
  {
    note: {
      id: '456',
      content: 'Thanksgiving recipes',
      keywords: ['thanksgiving', 'cooking'],
      createdAt: 1703001234567,
      updatedAt: 1703001234567
    },
    score: 0.35  // Good match
  }
];
```

---

### UseSpeechRecognitionResult

Return type of the `useSpeechRecognition` hook.

```typescript
interface UseSpeechRecognitionResult {
  isListening: boolean;
  transcript: string;
  error: string | null;
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  resetTranscript: () => void;
  isAvailable: boolean;
}
```

---

## Error Handling

### Database Errors

**Common Errors**:
- `Failed to create note` - Note creation unsuccessful
- `Failed to load note` - Database read error
- `Failed to update note` - Update operation error
- Database connection errors

**Handling Strategy**:
```typescript
try {
  const note = await createNote({
    content: 'My note',
    keywords: []
  });
} catch (error) {
  console.error('Database error:', error);
  // Show user-friendly error message
  setError('Failed to save note. Please try again.');
}
```

### Search Errors

**Edge Cases**:
- Empty notes array: Returns empty results (not an error)
- Empty query: Returns empty results (not an error)
- Invalid notes format: May throw error

**Handling Strategy**:
```typescript
try {
  const results = searchNotes(notes, query);
  if (results.length === 0) {
    // Show "no results" message
  }
} catch (error) {
  console.error('Search error:', error);
  // Fall back to showing all notes
}
```

### Speech Recognition Errors

**Common Errors**:
- `Speech recognition permission denied`
- `Speech recognition not available`
- `Speech recognition failed`
- Network errors (some platforms require internet)

**Handling Strategy**:
```typescript
const { error, startListening } = useSpeechRecognition();

useEffect(() => {
  if (error) {
    // Show error message to user
    Alert.alert('Voice Input Error', error);
  }
}, [error]);

const handleMicPress = async () => {
  await startListening();
  // Error will be available in error state if it fails
};
```

---

## Usage Examples

### Complete Note Creation Flow

```typescript
import { createNote } from '@/lib/database';
import { useSpeechRecognition } from '@/lib/speech';

function CreateNoteScreen() {
  const [content, setContent] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);

  const {
    transcript,
    startListening,
    stopListening
  } = useSpeechRecognition();

  // Sync voice transcript to content
  useEffect(() => {
    if (transcript) {
      setContent(prev => prev + transcript);
    }
  }, [transcript]);

  const handleSave = async () => {
    try {
      const note = await createNote({
        content: content.trim(),
        keywords
      });
      console.log('Created note:', note.id);
      // Navigate back
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  return (
    <View>
      <TextInput
        value={content}
        onChangeText={setContent}
      />
      <Button
        title="Voice Input"
        onPress={startListening}
      />
      <Button
        title="Save"
        onPress={handleSave}
        disabled={!content.trim()}
      />
    </View>
  );
}
```

### Complete Search Flow

```typescript
import { getAllNotes } from '@/lib/database';
import { searchNotes } from '@/lib/search';

function SearchScreen() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Note[]>([]);

  // Load notes on mount
  useEffect(() => {
    const loadNotes = async () => {
      const allNotes = await getAllNotes();
      setNotes(allNotes);
      setResults(allNotes);
    };
    loadNotes();
  }, []);

  // Search when query changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!query.trim()) {
        setResults(notes);
      } else {
        const searchResults = searchNotes(notes, query);
        setResults(searchResults.map(r => r.note));
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, notes]);

  return (
    <View>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search notes..."
      />
      <FlatList
        data={results}
        renderItem={({ item }) => <NoteCard note={item} />}
      />
    </View>
  );
}
```

### Complete Edit and Delete Flow

```typescript
import { getNoteById, updateNote, deleteNote } from '@/lib/database';

function EditNoteScreen({ noteId }: { noteId: string }) {
  const [note, setNote] = useState<Note | null>(null);
  const [content, setContent] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);

  // Load note
  useEffect(() => {
    const loadNote = async () => {
      const loadedNote = await getNoteById(noteId);
      if (loadedNote) {
        setNote(loadedNote);
        setContent(loadedNote.content);
        setKeywords(loadedNote.keywords);
      }
    };
    loadNote();
  }, [noteId]);

  const handleSave = async () => {
    try {
      const updated = await updateNote(noteId, {
        content: content.trim(),
        keywords
      });
      console.log('Updated note:', updated);
      // Navigate back
    } catch (error) {
      console.error('Failed to update:', error);
    }
  };

  const handleDelete = async () => {
    try {
      const deleted = await deleteNote(noteId);
      if (deleted) {
        console.log('Note deleted');
        // Navigate back
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  if (!note) {
    return <Text>Loading...</Text>;
  }

  return (
    <View>
      <TextInput
        value={content}
        onChangeText={setContent}
      />
      <Button title="Save" onPress={handleSave} />
      <Button title="Delete" onPress={handleDelete} />
    </View>
  );
}
```

---

## Best Practices

### Database Operations

1. **Always handle errors**:
```typescript
try {
  await createNote(input);
} catch (error) {
  // Handle error
}
```

2. **Validate input before calling**:
```typescript
if (!content.trim()) {
  return; // Don't call createNote with empty content
}
```

3. **Check for null returns**:
```typescript
const note = await getNoteById(id);
if (!note) {
  // Handle not found
}
```

### Search Operations

1. **Debounce search queries**:
```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    // Perform search
  }, 300);
  return () => clearTimeout(timer);
}, [query]);
```

2. **Handle empty results gracefully**:
```typescript
const results = searchNotes(notes, query);
if (results.length === 0) {
  // Show "no results" message
}
```

### Speech Recognition

1. **Check availability before showing UI**:
```typescript
const { isAvailable } = useSpeechRecognition();
return isAvailable ? <MicButton /> : null;
```

2. **Provide visual feedback**:
```typescript
{isListening && <Text>Listening...</Text>}
{error && <Text style={{color: 'red'}}>{error}</Text>}
```

3. **Clean up on unmount**:
```typescript
useEffect(() => {
  return () => {
    stopListening();
  };
}, []);
```

---

This API reference provides comprehensive documentation for all internal modules in the Activity Reminder App. For architecture details, see [ARCHITECTURE.md](./ARCHITECTURE.md).
