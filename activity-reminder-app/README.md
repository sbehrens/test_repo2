# Activity Reminder App

A mobile application for capturing and organizing activity notes with voice input support, designed to help you remember important details about recurring activities.

## Overview

The Activity Reminder App solves the problem of forgetting important details about activities you only do occasionally. For example:
- "My thermometer runs 3 degrees hot when cooking turkey"
- "The garage door needs to be lifted slightly when locking"
- "Use setting #4 on the espresso machine for best results"

By allowing you to create searchable notes with keywords, the app helps you quickly retrieve important information when you need it, even months later.

## Features

### Core Functionality
- **Create Notes**: Add new activity notes with rich text content
- **Voice Input**: Use speech-to-text to quickly capture notes hands-free
- **Keyword Tagging**: Organize notes with multiple keywords for easy retrieval
- **Smart Search**: Fuzzy search across note content and keywords
- **Voice Search**: Search notes using voice commands
- **Edit Notes**: Update note content and keywords
- **Delete Notes**: Remove notes with confirmation dialog
- **Persistent Storage**: All notes stored locally using SQLite

### User Experience
- **Intuitive Interface**: Clean, modern UI with Material Design principles
- **Real-time Search**: Search results update as you type
- **Smart Date Display**: Relative timestamps (e.g., "2h ago", "3d ago")
- **Empty States**: Helpful messages when no notes exist
- **Loading States**: Visual feedback during async operations
- **Error Handling**: Clear error messages for failed operations

## Screenshots/UI Description

### Home Screen
- **Search Bar**: Prominent search bar at the top with voice search button
- **Notes List**: Scrollable list of note cards showing content, keywords, and timestamp
- **FAB Button**: Floating Action Button (+) in the bottom-right for creating new notes
- **Empty State**: Icon and message displayed when no notes exist
- **No Results State**: Helpful message when search yields no results

### Create Note Screen
- **Title**: "Create Note" header
- **Content Input**: Large multiline text area for note content
- **Voice Input Button**: Microphone icon for speech-to-text input
- **Listening Indicator**: Visual feedback when recording voice
- **Keywords Section**: Tag-based keyword input with comma separation
- **Action Buttons**: Cancel and Save buttons at the bottom

### Edit Note Screen
- **Title**: "Edit Note" header
- **Pre-filled Content**: Existing note content loaded in text area
- **Pre-filled Keywords**: Existing keywords displayed as removable chips
- **Voice Input Button**: Same speech-to-text capability as create screen
- **Action Buttons**: Cancel and Save buttons
- **Delete Button**: Red delete button with trash icon
- **Delete Confirmation**: Modal dialog to confirm deletion

## Getting Started

### Prerequisites

Before running the app, ensure you have the following installed:

- **Node.js**: Version 18.x or higher
  ```bash
  node --version  # Should be v18.0.0 or higher
  ```

- **npm**: Version 9.x or higher (comes with Node.js)
  ```bash
  npm --version   # Should be 9.0.0 or higher
  ```

- **Expo CLI**: For running the app
  ```bash
  npm install -g expo-cli
  ```

- **Mobile Development Environment** (optional, for native builds):
  - For iOS: Xcode (macOS only)
  - For Android: Android Studio and Android SDK

### Installation

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd activity-reminder-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Verify installation**:
   ```bash
   npm list expo expo-router react-native
   ```

### Running the App

#### Development Mode

1. **Start the Expo development server**:
   ```bash
   npm start
   ```

2. **Choose your platform**:
   - Press `i` for iOS Simulator (macOS only)
   - Press `a` for Android Emulator
   - Press `w` for Web browser
   - Scan the QR code with Expo Go app on your physical device

#### Platform-Specific Commands

**iOS**:
```bash
npm run ios
```

**Android**:
```bash
npm run android
```

**Web**:
```bash
npm run web
```

### Running Tests

#### Run all tests:
```bash
npm test
```

#### Run tests in watch mode:
```bash
npm run test:watch
```

#### Run tests with coverage:
```bash
npm run test:coverage
```

The test suite includes:
- Unit tests for all library functions (database, search, speech)
- Component tests for all UI components
- Screen tests for all screens
- E2E production validation tests

Coverage reports are generated in the `/coverage` directory.

## Project Structure

```
activity-reminder-app/
├── app/                          # Expo Router screens and layouts
│   ├── (tabs)/                  # Tab-based navigation
│   │   ├── _layout.tsx          # Tab layout configuration
│   │   ├── index.tsx            # Home screen (main notes list)
│   │   ├── explore.tsx          # Explore tab (template)
│   │   └── two.tsx              # Additional tab (template)
│   ├── _layout.tsx              # Root layout
│   ├── create-note.tsx          # Create new note screen
│   ├── edit-note.tsx            # Edit existing note screen
│   ├── modal.tsx                # Modal screen template
│   └── +not-found.tsx           # 404 screen
├── components/                   # Reusable React components
│   ├── KeywordInput.tsx         # Keyword tag input component
│   ├── NoteCard.tsx             # Note display card component
│   ├── SearchBar.tsx            # Search input with voice button
│   ├── Themed.tsx               # Theme-aware components
│   └── __tests__/               # Component tests
├── lib/                         # Core business logic
│   ├── database.ts              # SQLite database operations
│   ├── search.ts                # Fuzzy search implementation
│   └── speech.ts                # Speech recognition hook
├── types/                       # TypeScript type definitions
│   └── index.ts                 # Core data models
├── __tests__/                   # Test files
│   ├── components/              # Component unit tests
│   ├── screens/                 # Screen integration tests
│   ├── lib/                     # Library unit tests
│   └── e2e/                     # End-to-end tests
├── constants/                   # App constants
│   └── Colors.ts                # Color theme definitions
├── assets/                      # Static assets
│   ├── fonts/                   # Custom fonts
│   └── images/                  # Images and icons
├── docs/                        # Documentation
│   ├── ARCHITECTURE.md          # Architecture documentation
│   └── API.md                   # API reference
├── package.json                 # Dependencies and scripts
├── tsconfig.json                # TypeScript configuration
├── jest.config.js               # Jest test configuration
└── app.json                     # Expo configuration
```

## Tech Stack

### Core Technologies
- **React Native** (0.81.5): Cross-platform mobile framework
- **TypeScript** (5.9.2): Static type checking
- **Expo** (54.0.30): Development platform and tooling
- **Expo Router** (6.0.21): File-based routing for React Native

### Key Libraries
- **expo-sqlite** (16.0.10): Local SQLite database for data persistence
- **expo-speech-recognition** (3.0.1): Speech-to-text functionality
- **fuse.js** (7.1.0): Fuzzy search algorithm
- **uuid** (13.0.0): UUID generation for note IDs
- **@expo/vector-icons** (15.0.3): Icon library (Ionicons)

### Development Tools
- **Jest** (29.7.0): Testing framework
- **@testing-library/react-native** (13.3.3): React Native testing utilities
- **@testing-library/jest-native** (5.4.3): Additional Jest matchers

### Navigation
- **@react-navigation/native** (7.1.8): Navigation infrastructure
- **react-native-screens** (4.16.0): Native screen components
- **react-native-safe-area-context** (5.6.0): Safe area handling

## Architecture

The app follows a **three-tier architecture**:

### 1. Presentation Layer (Components/Screens)
- React components for UI rendering
- Screens managed by Expo Router
- Reusable components in `/components`

### 2. Business Logic Layer (Lib)
- **Database Module**: CRUD operations on SQLite
- **Search Module**: Fuzzy search implementation
- **Speech Module**: Voice recognition hook

### 3. Data Layer (Types/Models)
- TypeScript interfaces defining data structures
- Note model with validation
- Input/Output types for API functions

### Key Design Patterns

**Hooks Pattern**:
- `useSpeechRecognition` for voice input state management
- React hooks for component state and effects

**Repository Pattern**:
- Database functions abstract SQLite operations
- Clean separation between data access and business logic

**Component Composition**:
- Small, focused components (SearchBar, NoteCard, KeywordInput)
- Composed into larger screens

## API Reference

### Database API (`lib/database.ts`)

All database functions are asynchronous and return Promises. See [docs/API.md](docs/API.md) for detailed documentation.

**Core Functions**:
- `initDatabase()`: Initialize SQLite database
- `createNote(input)`: Create a new note
- `getNoteById(id)`: Retrieve a note by ID
- `getAllNotes()`: Get all notes (sorted by creation date)
- `updateNote(id, input)`: Update an existing note
- `deleteNote(id)`: Delete a note by ID

### Search API (`lib/search.ts`)

**Functions**:
- `searchNotes(notes, query)`: Fuzzy search notes by content/keywords

### Speech Recognition Hook (`lib/speech.ts`)

**Hook**:
- `useSpeechRecognition()`: React hook for voice input

**Returns**:
- `isListening`: Boolean indicating recording state
- `transcript`: Current transcribed text
- `error`: Error message if any
- `startListening()`: Start voice recording
- `stopListening()`: Stop voice recording
- `resetTranscript()`: Clear transcript
- `isAvailable`: Whether speech recognition is available

## Testing

### Test Structure

The app has comprehensive test coverage across all layers:

```
__tests__/
├── lib/                         # Unit tests for business logic
│   ├── database.test.ts         # Database CRUD operations
│   ├── search.test.ts           # Search algorithm tests
│   └── speech.test.ts           # Speech recognition tests
├── components/                  # Component unit tests
│   ├── NoteCard.test.tsx
│   ├── SearchBar.test.tsx
│   └── KeywordInput.test.tsx
├── screens/                     # Screen integration tests
│   ├── HomeScreen.test.tsx
│   ├── CreateNoteScreen.test.tsx
│   └── EditNoteScreen.test.tsx
└── e2e/                        # End-to-end tests
    └── production-validation.test.ts
```

### Testing Philosophy

- **Unit Tests**: Test individual functions and components in isolation
- **Integration Tests**: Test screen-level interactions and workflows
- **E2E Tests**: Test complete user flows from start to finish
- **Mocking**: External dependencies (SQLite, Speech Recognition) are mocked

### Running Specific Tests

```bash
# Run a specific test file
npm test -- database.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="create note"

# Run with verbose output
npm test -- --verbose

# Update snapshots
npm test -- -u
```

### Coverage Thresholds

The project maintains high test coverage standards:
- **Statements**: 95%+
- **Branches**: 90%+
- **Functions**: 95%+
- **Lines**: 95%+

## Contributing

We welcome contributions! Here's how you can help:

### Getting Started

1. **Fork the repository**
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** following the guidelines below
4. **Run tests**:
   ```bash
   npm test
   ```
5. **Commit your changes**:
   ```bash
   git commit -m "feat: add your feature description"
   ```
6. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Open a Pull Request**

### Code Standards

- **TypeScript**: All code must be TypeScript with proper types
- **Testing**: All new features must include tests
- **Coverage**: Maintain minimum 90% code coverage
- **Linting**: Code must pass ESLint checks
- **Formatting**: Follow existing code style

### Commit Message Convention

Follow conventional commits format:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `test:` Adding or updating tests
- `refactor:` Code refactoring
- `style:` Code style changes (formatting, etc.)
- `chore:` Maintenance tasks

### Development Workflow

1. **Check existing issues** before starting work
2. **Create an issue** for major changes
3. **Keep PRs focused** - one feature/fix per PR
4. **Write clear descriptions** of your changes
5. **Update documentation** if needed
6. **Ensure tests pass** before submitting

### Code Review Process

- All PRs require at least one review
- Address reviewer feedback promptly
- Keep PRs up to date with main branch
- Squash commits before merging

## License

This project is part of a demonstration/portfolio and is available for reference and learning purposes.

## Support

For questions, issues, or suggestions:
1. Check the [documentation](docs/)
2. Search [existing issues](../../issues)
3. Create a new issue with detailed information

---

**Built with Test-Driven Development (TDD)** - All features were developed test-first, ensuring reliability and maintainability.
