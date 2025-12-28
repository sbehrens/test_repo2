# Architecture Documentation

This document provides an in-depth look at the Activity Reminder App's architecture, design decisions, and data flow.

## Table of Contents
- [Overview](#overview)
- [Architecture Pattern](#architecture-pattern)
- [Data Flow](#data-flow)
- [Component Hierarchy](#component-hierarchy)
- [State Management](#state-management)
- [Database Schema](#database-schema)
- [Navigation Structure](#navigation-structure)
- [Module Design](#module-design)
- [Design Decisions](#design-decisions)

## Overview

The Activity Reminder App follows a **layered architecture** with clear separation of concerns:

```
┌─────────────────────────────────────┐
│     Presentation Layer              │
│  (Screens & Components)             │
├─────────────────────────────────────┤
│     Business Logic Layer            │
│  (Lib: Database, Search, Speech)    │
├─────────────────────────────────────┤
│     Data Layer                      │
│  (SQLite Database)                  │
└─────────────────────────────────────┘
```

## Architecture Pattern

### Three-Tier Architecture

#### 1. Presentation Layer
**Location**: `/app` and `/components`

**Responsibilities**:
- Render UI components
- Handle user interactions
- Manage component-level state
- Display data from business logic layer

**Key Files**:
- `app/(tabs)/index.tsx` - Home screen
- `app/create-note.tsx` - Create note screen
- `app/edit-note.tsx` - Edit note screen
- `components/NoteCard.tsx` - Note card component
- `components/SearchBar.tsx` - Search bar component
- `components/KeywordInput.tsx` - Keyword input component

#### 2. Business Logic Layer
**Location**: `/lib`

**Responsibilities**:
- Implement core business logic
- Abstract data access patterns
- Provide reusable functions and hooks
- Handle complex operations (search, speech)

**Key Files**:
- `lib/database.ts` - Database operations
- `lib/search.ts` - Search functionality
- `lib/speech.ts` - Speech recognition

#### 3. Data Layer
**Location**: SQLite database (managed by `expo-sqlite`)

**Responsibilities**:
- Persist note data
- Provide ACID transactions
- Store relationships between entities

## Data Flow

### Read Flow (Displaying Notes)

```
User Opens App
     ↓
HomeScreen Component Mounts
     ↓
useEffect Hook Triggers
     ↓
Call initDatabase()
     ↓
Call getAllNotes()
     ↓
SQLite Query Executes
     ↓
Transform DB Rows to Note Objects
     ↓
Update Component State
     ↓
Re-render with Notes
     ↓
Display NoteCard Components
```

### Write Flow (Creating a Note)

```
User Navigates to Create Screen
     ↓
User Enters Content & Keywords
     ↓
User Taps Save Button
     ↓
Validate Input (content not empty)
     ↓
Call createNote({ content, keywords })
     ↓
Generate UUID for note
     ↓
Serialize keywords to JSON
     ↓
Insert into SQLite Database
     ↓
Retrieve created note
     ↓
Navigate back to Home Screen
     ↓
Home Screen Refreshes Note List
```

### Search Flow

```
User Types in Search Bar
     ↓
onChangeText Updates State
     ↓
Debounced useEffect Triggers (100ms)
     ↓
Call searchNotes(notes, query)
     ↓
Fuse.js Performs Fuzzy Search
     ↓
Return Sorted Results
     ↓
Update Filtered Notes State
     ↓
Re-render Note List
```

### Voice Input Flow

```
User Taps Microphone Button
     ↓
Call startListening()
     ↓
Request Speech Permissions
     ↓
Start Speech Recognition
     ↓
Set isListening = true
     ↓
Display Listening Indicator
     ↓
Speech Result Event Fires
     ↓
Append Transcript to State
     ↓
useEffect Syncs to Content Field
     ↓
User Sees Text Appear in Input
```

## Component Hierarchy

### Home Screen Hierarchy

```
HomeScreen
├── SearchBar
│   ├── Ionicons (search icon)
│   ├── TextInput
│   └── TouchableOpacity (mic button)
│       └── Ionicons (mic icon)
├── ScrollView
│   └── NoteCard (for each note)
│       ├── Pressable (card container)
│       │   ├── Text (content)
│       │   ├── View (keywords container)
│       │   │   └── View (keyword chips)
│       │   │       └── Text (keyword text)
│       │   └── Text (date)
│       └── TouchableOpacity (delete button)
│           └── Ionicons (trash icon)
└── TouchableOpacity (FAB)
    └── Ionicons (add icon)
```

### Create Note Screen Hierarchy

```
CreateNoteScreen
├── KeyboardAvoidingView
    └── ScrollView
        ├── Text (title)
        ├── View (content input container)
        │   ├── TextInput (content)
        │   └── TouchableOpacity (mic button)
        │       └── Ionicons (mic icon)
        ├── KeywordInput
        │   ├── View (existing keywords)
        │   │   └── View (keyword chips)
        │   │       ├── Text (keyword)
        │   │       └── TouchableOpacity (remove)
        │   └── TextInput (new keyword input)
        └── View (button container)
            ├── TouchableOpacity (cancel)
            │   └── Text
            └── TouchableOpacity (save)
                └── Text or ActivityIndicator
```

### Edit Note Screen Hierarchy

```
EditNoteScreen
├── KeyboardAvoidingView
    ├── ScrollView
    │   ├── Text (title)
    │   ├── View (content input container)
    │   │   ├── TextInput (content)
    │   │   └── TouchableOpacity (mic button)
    │   ├── KeywordInput
    │   ├── View (button container)
    │   │   ├── TouchableOpacity (cancel)
    │   │   └── TouchableOpacity (save)
    │   └── TouchableOpacity (delete)
    └── Modal (delete confirmation)
        └── View (dialog container)
            ├── Text (title)
            ├── Text (message)
            └── View (button container)
                ├── TouchableOpacity (cancel)
                └── TouchableOpacity (confirm)
```

## State Management

### Approach: Local Component State

The app uses **React's built-in state management** (useState, useEffect) rather than external libraries like Redux or MobX.

**Rationale**:
- Simple app with limited state
- No complex state sharing between distant components
- Screen-level state is sufficient
- Navigation handles state passing via params

### State Distribution

#### Home Screen State
```typescript
const [notes, setNotes] = useState<Note[]>([]);              // All notes
const [searchQuery, setSearchQuery] = useState('');          // Search text
const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);  // Search results
const [isLoading, setIsLoading] = useState(true);            // Loading state
```

#### Create Note Screen State
```typescript
const [content, setContent] = useState('');                  // Note content
const [keywords, setKeywords] = useState<string[]>([]);      // Keywords
const [isLoading, setIsLoading] = useState(false);           // Save in progress
const [error, setError] = useState<string | null>(null);     // Error message
```

#### Edit Note Screen State
```typescript
const [note, setNote] = useState<Note | null>(null);         // Current note
const [content, setContent] = useState('');                  // Edited content
const [keywords, setKeywords] = useState<string[]>([]);      // Edited keywords
const [isLoading, setIsLoading] = useState(true);            // Initial load
const [isSaving, setIsSaving] = useState(false);             // Save in progress
const [isDeleting, setIsDeleting] = useState(false);         // Delete in progress
const [showDeleteDialog, setShowDeleteDialog] = useState(false);  // Dialog visibility
```

#### Speech Hook State
```typescript
const [isListening, setIsListening] = useState(false);       // Recording state
const [transcript, setTranscript] = useState('');            // Transcribed text
const [error, setError] = useState<string | null>(null);     // Error message
const [isAvailable, setIsAvailable] = useState(false);       // Feature availability
```

### State Synchronization

**Voice Transcript to Content**:
```typescript
useEffect(() => {
  if (transcript) {
    setContent((prev) => prev + transcript);
  }
}, [transcript]);
```

**Search Query to Filtered Results**:
```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    if (!searchQuery.trim()) {
      setFilteredNotes(notes);
    } else {
      const results = searchNotes(notes, searchQuery);
      setFilteredNotes(results.map(r => r.note));
    }
  }, 100);  // 100ms debounce
  return () => clearTimeout(timer);
}, [searchQuery, notes]);
```

## Database Schema

### Notes Table

```sql
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  keywords TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
)
```

#### Field Descriptions

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | TEXT | UUID v4 identifier | PRIMARY KEY |
| `content` | TEXT | Note content/description | NOT NULL |
| `keywords` | TEXT | JSON array of keyword strings | NOT NULL |
| `createdAt` | INTEGER | Unix timestamp (milliseconds) | NOT NULL |
| `updatedAt` | INTEGER | Unix timestamp (milliseconds) | NOT NULL |

#### Design Decisions

**Why TEXT for ID?**
- UUIDs are generated client-side for offline support
- TEXT allows for UUID v4 format (36 characters)
- No need for auto-increment as IDs are pre-generated

**Why JSON for Keywords?**
- SQLite doesn't have native array type
- JSON serialization is simple and efficient
- Easy to deserialize in JavaScript
- Alternative would be separate keywords table (overkill for this use case)

**Why INTEGER for Timestamps?**
- Unix timestamps are more efficient than datetime strings
- Easy to perform date calculations
- JavaScript Date.now() returns milliseconds (INTEGER)

### Example Data

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "content": "Thermometer runs 3° hot when cooking turkey",
  "keywords": "[\"turkey\",\"thanksgiving\",\"cooking\",\"oven\"]",
  "createdAt": 1703001234567,
  "updatedAt": 1703001234567
}
```

### Database Operations

**Indexes**:
Currently, no additional indexes are defined. The `id` PRIMARY KEY provides automatic indexing for lookups.

**Future Optimization**:
If the app scales to thousands of notes, consider:
- Full-text search index on `content`
- Index on `createdAt` for sorting
- Separate keywords table with many-to-many relationship

## Navigation Structure

### Expo Router File-Based Routing

The app uses **Expo Router** for navigation, which maps file structure to routes.

```
app/
├── _layout.tsx                  # Root layout
├── (tabs)/                      # Tab group
│   ├── _layout.tsx              # Tab layout
│   ├── index.tsx                # / (Home)
│   ├── explore.tsx              # /explore
│   └── two.tsx                  # /two
├── create-note.tsx              # /create-note (modal)
├── edit-note.tsx                # /edit-note?noteId=xxx (modal)
└── +not-found.tsx               # 404 fallback
```

### Navigation Flow

```
┌─────────────────┐
│   Home Screen   │ (/)
│   (Tab Index)   │
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌─────────────────┐ ┌─────────────────┐
│ Create Note     │ │  Edit Note      │
│ (Modal)         │ │  (Modal)        │
│ /create-note    │ │  /edit-note     │
└─────────────────┘ └─────────────────┘
```

### Navigation API

**Push to Create Screen**:
```typescript
router.push('/create-note');
```

**Push to Edit Screen with Note ID**:
```typescript
router.push({
  pathname: '/edit-note',
  params: { noteId: note.id }
});
```

**Navigate Back**:
```typescript
router.back();
```

## Module Design

### Database Module (`lib/database.ts`)

**Pattern**: Repository Pattern

**Responsibilities**:
- Abstract SQLite operations
- Provide clean API for CRUD operations
- Handle data transformation (JSON ↔ Objects)
- Manage database lifecycle

**Key Features**:
- Singleton database instance
- Lazy initialization
- Type-safe operations
- Error handling

**Dependencies**:
- `expo-sqlite`: SQLite database
- `uuid`: UUID generation
- `../types`: TypeScript types

### Search Module (`lib/search.ts`)

**Pattern**: Utility Functions

**Responsibilities**:
- Fuzzy search implementation
- Ranking search results
- Configurable search options

**Key Features**:
- Uses Fuse.js for fuzzy matching
- Searches across content and keywords
- Returns relevance scores
- Configurable threshold

**Dependencies**:
- `fuse.js`: Fuzzy search library
- `../types`: TypeScript types

**Algorithm**:
```
1. Create Fuse instance with notes
2. Configure search keys: ['keywords', 'content']
3. Set threshold: 0.4 (0 = exact, 1 = anything)
4. Execute search with query
5. Transform results to SearchResult format
6. Return sorted by relevance (best first)
```

### Speech Module (`lib/speech.ts`)

**Pattern**: Custom React Hook

**Responsibilities**:
- Manage speech recognition lifecycle
- Handle permissions
- Process speech events
- Provide speech state to components

**Key Features**:
- React hook API
- Permission handling
- Event listeners for result/error/end
- Availability detection

**Dependencies**:
- `expo-speech-recognition`: Speech recognition API
- `react`: React hooks

**State Machine**:
```
[Idle] ─────startListening()────→ [Requesting Permission]
                                          │
                                          ├──denied──→ [Error]
                                          │
                                          └─granted─→ [Listening]
                                                          │
                                                          ├─result─→ [Transcribing]
                                                          │             │
                                                          │             └─→ [Listening]
                                                          │
                                                          ├─error──→ [Error]
                                                          │
                                                          └─end────→ [Idle]
```

## Design Decisions

### Why SQLite?

**Pros**:
- Local-first architecture (works offline)
- Zero server costs
- Fast for small to medium datasets
- ACID transactions
- Native support in Expo

**Cons**:
- No cloud sync
- Limited to device storage
- No multi-device support

**Decision**: SQLite is appropriate for this use case as notes are personal and device-specific. Future versions could add cloud sync.

### Why Fuse.js for Search?

**Alternatives Considered**:
- Native SQL LIKE queries
- Regular expressions
- Third-party search libraries

**Why Fuse.js**:
- Excellent fuzzy matching
- Configurable relevance scoring
- Works entirely client-side
- No additional backend needed
- Small library size

### Why Expo Router?

**Alternatives Considered**:
- React Navigation (manual setup)
- React Native Navigation

**Why Expo Router**:
- File-based routing (simpler)
- Built on React Navigation
- Type-safe routing
- Deep linking support
- Automatic route configuration

### Why Local State Instead of Redux?

**Alternatives Considered**:
- Redux
- MobX
- Zustand
- Context API

**Why Local State**:
- App is simple with limited state
- No complex state sharing
- Easier to understand for new developers
- Less boilerplate
- No over-engineering

**When to Migrate**: If the app grows to include:
- Multiple interconnected screens
- Complex state synchronization
- Undo/redo functionality
- Time-travel debugging needs

### Why TypeScript?

**Benefits**:
- Compile-time type checking
- Better IDE support (autocomplete)
- Self-documenting code
- Easier refactoring
- Catches bugs early

**Trade-offs**:
- Slightly more verbose
- Learning curve for new developers
- Build step required

**Decision**: Benefits far outweigh costs for a production app.

## Performance Considerations

### Database Queries

**Current Approach**:
- Load all notes on app start
- Filter in memory using Fuse.js

**Why**:
- Simple implementation
- Fast for < 1000 notes
- No complex SQL queries needed

**Future Optimization** (if needed):
- Implement pagination (load 50 at a time)
- Use SQL WHERE clauses for filtering
- Add database indexes
- Implement virtual scrolling

### Search Performance

**Debouncing**:
```typescript
const timer = setTimeout(() => {
  // Execute search
}, 100);  // 100ms delay
```

**Why**: Prevents excessive re-renders during typing

### Component Re-renders

**Optimization Techniques Used**:
- `React.memo` for expensive components (not currently needed)
- Proper key props in lists
- Debounced search input
- Conditional rendering for empty states

## Testing Architecture

### Test Structure

```
__tests__/
├── lib/                    # Pure logic tests
│   ├── database.test.ts
│   ├── search.test.ts
│   └── speech.test.ts
├── components/             # Component tests
│   ├── NoteCard.test.tsx
│   ├── SearchBar.test.tsx
│   └── KeywordInput.test.tsx
├── screens/                # Integration tests
│   ├── HomeScreen.test.tsx
│   ├── CreateNoteScreen.test.tsx
│   └── EditNoteScreen.test.tsx
└── e2e/                   # End-to-end tests
    └── production-validation.test.ts
```

### Testing Strategy

**Unit Tests**:
- Test individual functions in isolation
- Mock external dependencies
- Fast execution
- High coverage

**Component Tests**:
- Test component rendering and interactions
- Use React Testing Library
- Mock child components if needed
- Test accessibility

**Integration Tests**:
- Test screen-level workflows
- Mock navigation and database
- Test user flows (create → save → navigate)

**E2E Tests**:
- Test complete user journeys
- Minimal mocking
- Production-like environment

## Security Considerations

### Data Storage

**Local Storage Only**:
- All data stored in local SQLite database
- No network transmission
- No sensitive data encryption (notes are plain text)

**Future Enhancements**:
- Encrypt database file (expo-sqlite/cipher)
- Implement device authentication
- Add backup/restore functionality

### Input Validation

**Current Validation**:
- Content cannot be empty
- Keywords are sanitized (trimmed, deduplicated)
- SQL injection prevented by parameterized queries

**Areas for Improvement**:
- Maximum content length limits
- Keyword count limits
- Input sanitization for special characters

### Permissions

**Required Permissions**:
- Microphone: For speech recognition
- Storage: For SQLite database (automatic)

**Permission Handling**:
- Request permissions before use
- Handle denial gracefully
- Show error messages if permission denied

---

This architecture is designed to be:
- **Simple**: Easy to understand and maintain
- **Scalable**: Can grow with additional features
- **Testable**: Clear separation of concerns
- **Performant**: Optimized for the use case
- **Maintainable**: Well-documented and organized
