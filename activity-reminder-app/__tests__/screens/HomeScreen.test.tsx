import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import HomeScreen from '../../app/(tabs)/index';
import { getAllNotes } from '../../lib/database';
import { searchNotes } from '../../lib/search';
import { useSpeechRecognition } from '../../lib/speech';
import { Note } from '../../types';

// Mock the dependencies
jest.mock('../../lib/database');
jest.mock('../../lib/search');
jest.mock('../../lib/speech');

// Mock data
const mockNotes: Note[] = [
  {
    id: '1',
    content: 'Thermometer runs 3 degrees hot',
    keywords: ['turkey', 'thanksgiving', 'cooking'],
    createdAt: Date.now() - 86400000, // 1 day ago
    updatedAt: Date.now() - 86400000,
  },
  {
    id: '2',
    content: 'Use medium-high heat for perfect scrambled eggs',
    keywords: ['eggs', 'breakfast', 'cooking'],
    createdAt: Date.now() - 172800000, // 2 days ago
    updatedAt: Date.now() - 172800000,
  },
  {
    id: '3',
    content: 'Water plants every Tuesday and Friday',
    keywords: ['plants', 'garden', 'schedule'],
    createdAt: Date.now() - 259200000, // 3 days ago
    updatedAt: Date.now() - 259200000,
  },
];

describe('HomeScreen - Rendering', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    (getAllNotes as jest.Mock).mockResolvedValue(mockNotes);
    (searchNotes as jest.Mock).mockReturnValue([]);
    (useSpeechRecognition as jest.Mock).mockReturnValue({
      isListening: false,
      transcript: '',
      error: null,
      startListening: jest.fn(),
      stopListening: jest.fn(),
      resetTranscript: jest.fn(),
      isAvailable: true,
    });
  });

  it('renders SearchBar component', async () => {
    render(<HomeScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('search-bar')).toBeTruthy();
    });
  });

  it('renders FAB (floating action button) for creating new note', async () => {
    render(<HomeScreen />);

    await waitFor(() => {
      const fab = screen.getByTestId('fab-create-note');
      expect(fab).toBeTruthy();
    });
  });

  it('shows empty state when no notes exist', async () => {
    (getAllNotes as jest.Mock).mockResolvedValue([]);

    render(<HomeScreen />);

    await waitFor(() => {
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toBeTruthy();
      expect(screen.getByText(/no notes yet/i)).toBeTruthy();
    });
  });

  it('shows loading state while fetching notes', async () => {
    // Create a promise that we can control
    let resolveGetAllNotes: (value: Note[]) => void;
    const notesPromise = new Promise<Note[]>((resolve) => {
      resolveGetAllNotes = resolve;
    });

    (getAllNotes as jest.Mock).mockReturnValue(notesPromise);

    render(<HomeScreen />);

    // Should show loading indicator
    expect(screen.getByTestId('loading-indicator')).toBeTruthy();

    // Resolve the promise
    await act(async () => {
      resolveGetAllNotes!(mockNotes);
    });

    // Loading should disappear
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).toBeNull();
    });
  });
});

describe('HomeScreen - Search Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (getAllNotes as jest.Mock).mockResolvedValue(mockNotes);
    (searchNotes as jest.Mock).mockReturnValue([]);
    (useSpeechRecognition as jest.Mock).mockReturnValue({
      isListening: false,
      transcript: '',
      error: null,
      startListening: jest.fn(),
      stopListening: jest.fn(),
      resetTranscript: jest.fn(),
      isAvailable: true,
    });
  });

  it('displays all notes when search is empty', async () => {
    render(<HomeScreen />);

    await waitFor(() => {
      // Should display all 3 notes
      const noteCards = screen.getAllByTestId('note-card');
      expect(noteCards).toHaveLength(3);
    });
  });

  it('filters notes based on search query', async () => {
    jest.useFakeTimers();

    const searchResults = [
      { note: mockNotes[0], score: 0.1 },
      { note: mockNotes[1], score: 0.3 },
    ];

    (searchNotes as jest.Mock).mockReturnValue(searchResults);

    render(<HomeScreen />);

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getAllByTestId('note-card')).toHaveLength(3);
    });

    // Type in search bar
    const searchBar = screen.getByTestId('search-bar');
    fireEvent.changeText(searchBar, 'cooking');

    // Advance timers past the debounce delay (100ms)
    act(() => {
      jest.advanceTimersByTime(150);
    });

    // Should show filtered results after debounce
    await waitFor(() => {
      const noteCards = screen.getAllByTestId('note-card');
      expect(noteCards).toHaveLength(2);
    });

    expect(searchNotes).toHaveBeenCalledWith(mockNotes, 'cooking');

    jest.useRealTimers();
  });

  it('shows "no results" message when search returns empty', async () => {
    (searchNotes as jest.Mock).mockReturnValue([]);

    render(<HomeScreen />);

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getAllByTestId('note-card')).toHaveLength(3);
    });

    // Type in search bar
    const searchBar = screen.getByTestId('search-bar');
    fireEvent.changeText(searchBar, 'nonexistent query');

    // Should show "no results" message
    await waitFor(() => {
      expect(screen.getByTestId('no-results-message')).toBeTruthy();
      expect(screen.getByText(/no notes found/i)).toBeTruthy();
    }, { timeout: 1000 });
  });

  it('updates results as user types (debounced)', async () => {
    const searchResults1 = [{ note: mockNotes[0], score: 0.1 }];
    const searchResults2 = [
      { note: mockNotes[0], score: 0.1 },
      { note: mockNotes[1], score: 0.2 },
    ];

    (searchNotes as jest.Mock)
      .mockReturnValueOnce(searchResults1)
      .mockReturnValueOnce(searchResults2);

    render(<HomeScreen />);

    await waitFor(() => {
      expect(screen.getAllByTestId('note-card')).toHaveLength(3);
    });

    const searchBar = screen.getByTestId('search-bar');

    // First search
    fireEvent.changeText(searchBar, 'cook');

    // Rapidly type more - should debounce
    fireEvent.changeText(searchBar, 'cooki');
    fireEvent.changeText(searchBar, 'cooking');

    // Should only call search once after debounce delay
    await waitFor(() => {
      // The search function should be called after debounce
      expect(searchNotes).toHaveBeenCalled();
    }, { timeout: 1000 });

    // Verify debouncing - should not call for every keystroke
    expect(searchNotes).not.toHaveBeenCalledWith(mockNotes, 'cook');
    expect(searchNotes).not.toHaveBeenCalledWith(mockNotes, 'cooki');
  });
});

describe('HomeScreen - Voice Search', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (getAllNotes as jest.Mock).mockResolvedValue(mockNotes);
    (searchNotes as jest.Mock).mockReturnValue([]);
  });

  it('activates voice search when mic button pressed', async () => {
    const mockStartListening = jest.fn();

    (useSpeechRecognition as jest.Mock).mockReturnValue({
      isListening: false,
      transcript: '',
      error: null,
      startListening: mockStartListening,
      stopListening: jest.fn(),
      resetTranscript: jest.fn(),
      isAvailable: true,
    });

    render(<HomeScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('mic-button')).toBeTruthy();
    });

    const micButton = screen.getByTestId('mic-button');
    fireEvent.press(micButton);

    expect(mockStartListening).toHaveBeenCalled();
  });

  it('updates search query with transcript', async () => {
    // First render without transcript
    const { rerender } = render(<HomeScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('search-bar')).toBeTruthy();
    });

    // Simulate voice recognition returning transcript
    (useSpeechRecognition as jest.Mock).mockReturnValue({
      isListening: false,
      transcript: 'turkey cooking',
      error: null,
      startListening: jest.fn(),
      stopListening: jest.fn(),
      resetTranscript: jest.fn(),
      isAvailable: true,
    });

    // Rerender with new transcript
    rerender(<HomeScreen />);

    await waitFor(() => {
      const searchBar = screen.getByTestId('search-bar');
      expect(searchBar.props.value).toBe('turkey cooking');
    });
  });

  it('shows listening indicator during voice input', async () => {
    (useSpeechRecognition as jest.Mock).mockReturnValue({
      isListening: true,
      transcript: '',
      error: null,
      startListening: jest.fn(),
      stopListening: jest.fn(),
      resetTranscript: jest.fn(),
      isAvailable: true,
    });

    render(<HomeScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('listening-indicator')).toBeTruthy();
    });
  });
});

describe('HomeScreen - Navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (getAllNotes as jest.Mock).mockResolvedValue(mockNotes);
    (searchNotes as jest.Mock).mockReturnValue([]);
    (useSpeechRecognition as jest.Mock).mockReturnValue({
      isListening: false,
      transcript: '',
      error: null,
      startListening: jest.fn(),
      stopListening: jest.fn(),
      resetTranscript: jest.fn(),
      isAvailable: true,
    });
  });

  it('navigates to create note screen when FAB pressed', async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
    });

    render(<HomeScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('fab-create-note')).toBeTruthy();
    });

    const fab = screen.getByTestId('fab-create-note');
    fireEvent.press(fab);

    expect(mockPush).toHaveBeenCalledWith('/create-note');
  });

  it('navigates to edit note screen when NoteCard pressed', async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
    });

    render(<HomeScreen />);

    await waitFor(() => {
      expect(screen.getAllByTestId('note-card')).toHaveLength(3);
    });

    const firstNoteCard = screen.getAllByTestId('note-card')[0];
    fireEvent.press(firstNoteCard);

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/edit-note',
      params: { noteId: '1' },
    });
  });
});

describe('HomeScreen - Note Display', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (getAllNotes as jest.Mock).mockResolvedValue(mockNotes);
    (searchNotes as jest.Mock).mockReturnValue([]);
    (useSpeechRecognition as jest.Mock).mockReturnValue({
      isListening: false,
      transcript: '',
      error: null,
      startListening: jest.fn(),
      stopListening: jest.fn(),
      resetTranscript: jest.fn(),
      isAvailable: true,
    });
  });

  it('renders NoteCard for each search result', async () => {
    render(<HomeScreen />);

    await waitFor(() => {
      const noteCards = screen.getAllByTestId('note-card');
      expect(noteCards).toHaveLength(3);
    });
  });

  it('shows note content and keywords in cards', async () => {
    render(<HomeScreen />);

    await waitFor(() => {
      // Check first note content
      expect(screen.getByText('Thermometer runs 3 degrees hot')).toBeTruthy();

      // Check keywords are displayed (unique to note 1)
      expect(screen.getByText('turkey')).toBeTruthy();
      expect(screen.getByText('thanksgiving')).toBeTruthy();
    });

    // Check 'cooking' keyword appears (shared by notes 1 and 2)
    expect(screen.getAllByText('cooking')).toHaveLength(2);

    // Check second note
    expect(screen.getByText('Use medium-high heat for perfect scrambled eggs')).toBeTruthy();
    expect(screen.getByText('eggs')).toBeTruthy();
    expect(screen.getByText('breakfast')).toBeTruthy();

    // Check third note
    expect(screen.getByText('Water plants every Tuesday and Friday')).toBeTruthy();
    expect(screen.getByText('plants')).toBeTruthy();
    expect(screen.getByText('garden')).toBeTruthy();
    expect(screen.getByText('schedule')).toBeTruthy();
  });
});
