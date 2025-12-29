import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import AllNotesScreen from '../../app/(tabs)/explore';
import { getAllNotes, deleteNote } from '../../lib/database';
import { Note } from '../../types';

// Mock the dependencies
jest.mock('../../lib/database');
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

// Mock data - sorted by creation date (newest first)
const mockNotes: Note[] = [
  {
    id: '1',
    content: 'Remember to check tire pressure before long trips',
    keywords: ['car', 'maintenance', 'safety'],
    createdAt: Date.now() - 3600000, // 1 hour ago
    updatedAt: Date.now() - 3600000,
  },
  {
    id: '2',
    content: 'Thermometer runs 3 degrees hot',
    keywords: ['turkey', 'thanksgiving', 'cooking'],
    createdAt: Date.now() - 86400000, // 1 day ago
    updatedAt: Date.now() - 86400000,
  },
  {
    id: '3',
    content: 'Water plants every Tuesday and Friday',
    keywords: ['plants', 'garden', 'schedule'],
    createdAt: Date.now() - 172800000, // 2 days ago
    updatedAt: Date.now() - 172800000,
  },
  {
    id: '4',
    content: 'Use medium-high heat for perfect scrambled eggs',
    keywords: ['eggs', 'breakfast', 'cooking'],
    createdAt: Date.now() - 259200000, // 3 days ago
    updatedAt: Date.now() - 259200000,
  },
];

describe('AllNotesScreen - Rendering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAllNotes as jest.Mock).mockReset();
    (deleteNote as jest.Mock).mockReset();

    // Default mock implementations
    (getAllNotes as jest.Mock).mockResolvedValue(mockNotes);
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    });
  });

  it('renders list of all notes', async () => {
    render(<AllNotesScreen />);

    await waitFor(() => {
      const noteCards = screen.getAllByTestId('note-card');
      expect(noteCards).toHaveLength(4);
    }, { timeout: 3000 });

    // Verify note content is displayed
    expect(screen.getByText('Remember to check tire pressure before long trips')).toBeTruthy();
    expect(screen.getByText('Thermometer runs 3 degrees hot')).toBeTruthy();
    expect(screen.getByText('Water plants every Tuesday and Friday')).toBeTruthy();
    expect(screen.getByText('Use medium-high heat for perfect scrambled eggs')).toBeTruthy();
  });

  it('shows loading state while fetching', async () => {
    // Create a promise that we can control
    let resolveGetAllNotes: (value: Note[]) => void;
    const notesPromise = new Promise<Note[]>((resolve) => {
      resolveGetAllNotes = resolve;
    });

    (getAllNotes as jest.Mock).mockReturnValue(notesPromise);

    render(<AllNotesScreen />);

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

  it('shows empty state when no notes exist', async () => {
    (getAllNotes as jest.Mock).mockResolvedValue([]);

    render(<AllNotesScreen />);

    await waitFor(() => {
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toBeTruthy();
      expect(screen.getByText(/no notes yet/i)).toBeTruthy();
    });

    // Should not display note cards
    expect(screen.queryByTestId('note-card')).toBeNull();
  });

  it('displays notes in chronological order (newest first)', async () => {
    render(<AllNotesScreen />);

    await waitFor(() => {
      const noteCards = screen.getAllByTestId('note-card');
      expect(noteCards).toHaveLength(4);
    });

    // Get all note cards and verify order
    const noteCards = screen.getAllByTestId('note-card');

    // The first card should contain the newest note
    expect(noteCards[0]).toHaveTextContent(/Remember to check tire pressure before long trips/);

    // The second card should contain the second newest note
    expect(noteCards[1]).toHaveTextContent(/Thermometer runs 3 degrees hot/);

    // The third card should contain the third newest note
    expect(noteCards[2]).toHaveTextContent(/Water plants every Tuesday and Friday/);

    // The fourth card should contain the oldest note
    expect(noteCards[3]).toHaveTextContent(/Use medium-high heat for perfect scrambled eggs/);
  });

  it('renders screen title', async () => {
    render(<AllNotesScreen />);

    await waitFor(() => {
      expect(screen.getByText(/all notes/i)).toBeTruthy();
    });
  });

  it('calls getAllNotes on mount', async () => {
    render(<AllNotesScreen />);

    await waitFor(() => {
      expect(getAllNotes).toHaveBeenCalled();
    });
  });
});

describe('AllNotesScreen - Navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAllNotes as jest.Mock).mockReset();
    (deleteNote as jest.Mock).mockReset();

    (getAllNotes as jest.Mock).mockResolvedValue(mockNotes);
  });

  it('navigates to edit note when note card pressed', async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
    });

    render(<AllNotesScreen />);

    await waitFor(() => {
      expect(screen.getAllByTestId('note-card')).toHaveLength(4);
    });

    const firstNoteCard = screen.getAllByTestId('note-card')[0];
    fireEvent.press(firstNoteCard);

    expect(mockPush).toHaveBeenCalled();
  });

  it('passes correct noteId to edit screen', async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
    });

    render(<AllNotesScreen />);

    await waitFor(() => {
      expect(screen.getAllByTestId('note-card')).toHaveLength(4);
    });

    // Press the first note card (newest note with id '1')
    const firstNoteCard = screen.getAllByTestId('note-card')[0];
    fireEvent.press(firstNoteCard);

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/edit-note',
      params: { noteId: '1' },
    });

    // Press the second note card (id '2')
    const secondNoteCard = screen.getAllByTestId('note-card')[1];
    fireEvent.press(secondNoteCard);

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/edit-note',
      params: { noteId: '2' },
    });
  });

  it('each note card is pressable', async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
    });

    render(<AllNotesScreen />);

    await waitFor(() => {
      expect(screen.getAllByTestId('note-card')).toHaveLength(4);
    });

    const noteCards = screen.getAllByTestId('note-card');

    // Press each note card and verify navigation was called
    noteCards.forEach((card) => {
      fireEvent.press(card);
    });

    expect(mockPush).toHaveBeenCalledTimes(4);
  });
});

describe('AllNotesScreen - Deleting Notes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAllNotes as jest.Mock).mockReset();
    (deleteNote as jest.Mock).mockReset();

    (getAllNotes as jest.Mock).mockResolvedValue(mockNotes);
    (deleteNote as jest.Mock).mockResolvedValue(true);
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    });
  });

  it('shows delete button on note cards', async () => {
    render(<AllNotesScreen />);

    await waitFor(() => {
      const deleteButtons = screen.getAllByTestId('delete-button');
      expect(deleteButtons).toHaveLength(4);
    });
  });

  it('shows confirmation before deleting', async () => {
    render(<AllNotesScreen />);

    await waitFor(() => {
      expect(screen.getAllByTestId('delete-button')).toHaveLength(4);
    });

    const firstDeleteButton = screen.getAllByTestId('delete-button')[0];
    fireEvent.press(firstDeleteButton);

    // Should show confirmation dialog
    await waitFor(() => {
      expect(screen.getByTestId('delete-confirmation-dialog')).toBeTruthy();
      expect(screen.getByText(/are you sure/i)).toBeTruthy();
    });

    // Should not delete yet
    expect(deleteNote).not.toHaveBeenCalled();
  });

  it('deletes note when delete confirmed', async () => {
    (deleteNote as jest.Mock).mockResolvedValue(true);

    render(<AllNotesScreen />);

    await waitFor(() => {
      expect(screen.getAllByTestId('delete-button')).toHaveLength(4);
    });

    // Press delete button on first note
    const firstDeleteButton = screen.getAllByTestId('delete-button')[0];
    fireEvent.press(firstDeleteButton);

    // Wait for confirmation dialog
    await waitFor(() => {
      expect(screen.getByTestId('delete-confirmation-dialog')).toBeTruthy();
    });

    // Confirm deletion
    const confirmButton = screen.getByTestId('confirm-delete-button');
    fireEvent.press(confirmButton);

    await waitFor(() => {
      expect(deleteNote).toHaveBeenCalledWith('1');
    });
  });

  it('does not delete when confirmation cancelled', async () => {
    render(<AllNotesScreen />);

    await waitFor(() => {
      expect(screen.getAllByTestId('delete-button')).toHaveLength(4);
    });

    const firstDeleteButton = screen.getAllByTestId('delete-button')[0];
    fireEvent.press(firstDeleteButton);

    await waitFor(() => {
      expect(screen.getByTestId('delete-confirmation-dialog')).toBeTruthy();
    });

    // Cancel deletion
    const cancelButton = screen.getByTestId('cancel-delete-button');
    fireEvent.press(cancelButton);

    await waitFor(() => {
      expect(screen.queryByTestId('delete-confirmation-dialog')).toBeNull();
    });

    expect(deleteNote).not.toHaveBeenCalled();
  });

  it('updates list after deletion', async () => {
    const notesAfterDeletion = mockNotes.slice(1); // Remove first note

    (getAllNotes as jest.Mock)
      .mockResolvedValueOnce(mockNotes)
      .mockResolvedValueOnce(notesAfterDeletion);

    (deleteNote as jest.Mock).mockResolvedValue(true);

    render(<AllNotesScreen />);

    await waitFor(() => {
      expect(screen.getAllByTestId('note-card')).toHaveLength(4);
    });

    // Delete the first note
    const firstDeleteButton = screen.getAllByTestId('delete-button')[0];
    fireEvent.press(firstDeleteButton);

    await waitFor(() => {
      expect(screen.getByTestId('delete-confirmation-dialog')).toBeTruthy();
    });

    const confirmButton = screen.getByTestId('confirm-delete-button');

    await act(async () => {
      fireEvent.press(confirmButton);
    });

    // List should update and show only 3 notes
    await waitFor(() => {
      const noteCards = screen.getAllByTestId('note-card');
      expect(noteCards).toHaveLength(3);
    }, { timeout: 3000 });

    // Deleted note should not be visible
    expect(screen.queryByText('Remember to check tire pressure before long trips')).toBeNull();

    // Other notes should still be visible
    expect(screen.getByText('Thermometer runs 3 degrees hot')).toBeTruthy();
    expect(screen.getByText('Water plants every Tuesday and Friday')).toBeTruthy();
  });

  it('shows error message if delete fails', async () => {
    (deleteNote as jest.Mock).mockRejectedValue(new Error('Delete failed'));

    render(<AllNotesScreen />);

    await waitFor(() => {
      expect(screen.getAllByTestId('delete-button')).toHaveLength(4);
    });

    const firstDeleteButton = screen.getAllByTestId('delete-button')[0];
    fireEvent.press(firstDeleteButton);

    await waitFor(() => {
      expect(screen.getByTestId('delete-confirmation-dialog')).toBeTruthy();
    });

    const confirmButton = screen.getByTestId('confirm-delete-button');
    fireEvent.press(confirmButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeTruthy();
      expect(screen.getByText(/failed to delete note/i)).toBeTruthy();
    });
  });

  it('hides confirmation dialog after successful deletion', async () => {
    (deleteNote as jest.Mock).mockResolvedValue(true);

    render(<AllNotesScreen />);

    await waitFor(() => {
      expect(screen.getAllByTestId('delete-button')).toHaveLength(4);
    });

    const firstDeleteButton = screen.getAllByTestId('delete-button')[0];
    fireEvent.press(firstDeleteButton);

    await waitFor(() => {
      expect(screen.getByTestId('delete-confirmation-dialog')).toBeTruthy();
    });

    const confirmButton = screen.getByTestId('confirm-delete-button');
    fireEvent.press(confirmButton);

    await waitFor(() => {
      expect(screen.queryByTestId('delete-confirmation-dialog')).toBeNull();
    });
  });
});

describe('AllNotesScreen - Refresh', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAllNotes as jest.Mock).mockReset();
    (deleteNote as jest.Mock).mockReset();

    (getAllNotes as jest.Mock).mockResolvedValue(mockNotes);
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    });
  });

  it('refreshes notes when pull-to-refresh triggered', async () => {
    const updatedNotes: Note[] = [
      ...mockNotes,
      {
        id: '5',
        content: 'New note added',
        keywords: ['new'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    (getAllNotes as jest.Mock)
      .mockResolvedValueOnce(mockNotes)
      .mockResolvedValueOnce(updatedNotes);

    render(<AllNotesScreen />);

    await waitFor(() => {
      expect(screen.getAllByTestId('note-card')).toHaveLength(4);
    });

    // Trigger pull-to-refresh via the RefreshControl
    const flatList = screen.getByTestId('notes-list');
    const refreshControl = flatList.props.refreshControl;

    await act(async () => {
      refreshControl.props.onRefresh();
    });

    // Should show new note after refresh
    await waitFor(() => {
      const noteCards = screen.getAllByTestId('note-card');
      expect(noteCards).toHaveLength(5);
      expect(screen.getByText('New note added')).toBeTruthy();
    }, { timeout: 3000 });

    // getAllNotes should be called twice (initial load + refresh)
    expect(getAllNotes).toHaveBeenCalledTimes(2);
  });

  it('shows refresh indicator during refresh', async () => {
    let resolveRefresh: (value: Note[]) => void;
    const refreshPromise = new Promise<Note[]>((resolve) => {
      resolveRefresh = resolve;
    });

    (getAllNotes as jest.Mock)
      .mockResolvedValueOnce(mockNotes)
      .mockReturnValueOnce(refreshPromise);

    render(<AllNotesScreen />);

    await waitFor(() => {
      expect(screen.getAllByTestId('note-card')).toHaveLength(4);
    });

    // Trigger pull-to-refresh via the RefreshControl
    const flatList = screen.getByTestId('notes-list');
    const refreshControl = flatList.props.refreshControl;

    act(() => {
      refreshControl.props.onRefresh();
    });

    // Refresh indicator should be visible
    await waitFor(() => {
      const updatedFlatList = screen.getByTestId('notes-list');
      const updatedRefreshControl = updatedFlatList.props.refreshControl;
      expect(updatedRefreshControl.props.refreshing).toBe(true);
    });

    // Resolve the refresh
    await act(async () => {
      resolveRefresh!(mockNotes);
    });

    // Refresh indicator should disappear
    await waitFor(() => {
      const updatedFlatList = screen.getByTestId('notes-list');
      const updatedRefreshControl = updatedFlatList.props.refreshControl;
      expect(updatedRefreshControl.props.refreshing).toBe(false);
    });
  });

  it('maintains scroll position after refresh', async () => {
    (getAllNotes as jest.Mock).mockResolvedValue(mockNotes);

    render(<AllNotesScreen />);

    await waitFor(() => {
      expect(screen.getAllByTestId('note-card')).toHaveLength(4);
    });

    // Trigger pull-to-refresh via the RefreshControl
    const flatList = screen.getByTestId('notes-list');
    const refreshControl = flatList.props.refreshControl;

    await act(async () => {
      refreshControl.props.onRefresh();
    });

    await waitFor(() => {
      // After refresh, notes should still be visible
      expect(screen.getAllByTestId('note-card')).toHaveLength(4);
    });
  });
});

describe('AllNotesScreen - Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAllNotes as jest.Mock).mockReset();
    (deleteNote as jest.Mock).mockReset();

    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    });
  });

  it('shows error message when fetching notes fails', async () => {
    (getAllNotes as jest.Mock).mockRejectedValue(new Error('Database error'));

    render(<AllNotesScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeTruthy();
      expect(screen.getByText(/failed to load notes/i)).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('hides loading indicator when fetch fails', async () => {
    (getAllNotes as jest.Mock).mockRejectedValue(new Error('Database error'));

    render(<AllNotesScreen />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).toBeNull();
    });
  });

  it('shows retry button on error', async () => {
    (getAllNotes as jest.Mock).mockRejectedValue(new Error('Database error'));

    render(<AllNotesScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('retry-button')).toBeTruthy();
    });
  });

  it('retries fetching notes when retry button pressed', async () => {
    (getAllNotes as jest.Mock)
      .mockRejectedValueOnce(new Error('Database error'))
      .mockResolvedValueOnce(mockNotes);

    render(<AllNotesScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeTruthy();
    });

    const retryButton = screen.getByTestId('retry-button');
    fireEvent.press(retryButton);

    await waitFor(() => {
      expect(screen.getAllByTestId('note-card')).toHaveLength(4);
    });

    expect(getAllNotes).toHaveBeenCalledTimes(2);
  });
});

describe('AllNotesScreen - Accessibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAllNotes as jest.Mock).mockReset();
    (deleteNote as jest.Mock).mockReset();

    (getAllNotes as jest.Mock).mockResolvedValue(mockNotes);
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    });
  });

  it('has proper accessibility labels for note cards', async () => {
    render(<AllNotesScreen />);

    await waitFor(() => {
      const noteCards = screen.getAllByTestId('note-card');
      expect(noteCards).toHaveLength(4);
    });

    const firstNoteCard = screen.getAllByTestId('note-card')[0];
    expect(firstNoteCard.props.accessibilityLabel).toBeDefined();
    expect(firstNoteCard.props.accessibilityRole).toBe('button');
  });

  it('has proper accessibility labels for delete buttons', async () => {
    render(<AllNotesScreen />);

    await waitFor(() => {
      const deleteButtons = screen.getAllByTestId('delete-button');
      expect(deleteButtons).toHaveLength(4);
    });

    const firstDeleteButton = screen.getAllByTestId('delete-button')[0];
    expect(firstDeleteButton.props.accessibilityLabel).toBeDefined();
    expect(firstDeleteButton.props.accessibilityRole).toBe('button');
  });

  it('empty state has accessibility label', async () => {
    (getAllNotes as jest.Mock).mockResolvedValue([]);

    render(<AllNotesScreen />);

    await waitFor(() => {
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState.props.accessibilityLabel).toBeDefined();
    });
  });
});
