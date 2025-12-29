import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import EditNoteScreen from '../../app/edit-note';
import { getNoteById, updateNote, deleteNote } from '../../lib/database';
import { useSpeechRecognition } from '../../lib/speech';
import { Note } from '../../types';

// Mock the dependencies
jest.mock('../../lib/database');
jest.mock('../../lib/speech');

const mockNote: Note = {
  id: '123',
  content: 'Thermometer runs 3 degrees hot',
  keywords: ['turkey', 'thanksgiving', 'cooking'],
  createdAt: Date.now() - 86400000,
  updatedAt: Date.now() - 86400000,
};

describe('EditNoteScreen - Loading and Rendering', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useLocalSearchParams as jest.Mock).mockReturnValue({ noteId: '123' });
    (getNoteById as jest.Mock).mockResolvedValue(mockNote);
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

  it('loads existing note data on mount', async () => {
    render(<EditNoteScreen />);

    await waitFor(() => {
      expect(getNoteById).toHaveBeenCalledWith('123');
    });
  });

  it('shows loading while fetching note', () => {
    let resolveGetNote: (value: Note) => void;
    const notePromise = new Promise<Note>((resolve) => {
      resolveGetNote = resolve;
    });

    (getNoteById as jest.Mock).mockReturnValue(notePromise);

    render(<EditNoteScreen />);

    expect(screen.getByTestId('loading-indicator')).toBeTruthy();

    // Resolve the promise
    resolveGetNote!(mockNote);
  });

  it('hides loading after note is fetched', async () => {
    render(<EditNoteScreen />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).toBeNull();
    });
  });

  it('pre-populates content field', async () => {
    render(<EditNoteScreen />);

    await waitFor(() => {
      const contentInput = screen.getByTestId('content-input');
      expect(contentInput.props.value).toBe('Thermometer runs 3 degrees hot');
    });
  });

  it('pre-populates keywords', async () => {
    render(<EditNoteScreen />);

    await waitFor(() => {
      expect(screen.getByText('turkey')).toBeTruthy();
      expect(screen.getByText('thanksgiving')).toBeTruthy();
      expect(screen.getByText('cooking')).toBeTruthy();
    });
  });

  it('renders all form elements after loading', async () => {
    render(<EditNoteScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('content-input')).toBeTruthy();
      expect(screen.getByTestId('keyword-input')).toBeTruthy();
      expect(screen.getByTestId('save-button')).toBeTruthy();
      expect(screen.getByTestId('delete-button')).toBeTruthy();
      expect(screen.getByTestId('mic-button')).toBeTruthy();
    });
  });

  it('renders screen title', async () => {
    render(<EditNoteScreen />);

    await waitFor(() => {
      expect(screen.getByText(/edit note/i)).toBeTruthy();
    });
  });
});

describe('EditNoteScreen - Error Handling on Load', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useLocalSearchParams as jest.Mock).mockReturnValue({ noteId: '123' });
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

  it('handles non-existent note gracefully', async () => {
    (getNoteById as jest.Mock).mockResolvedValue(null);

    render(<EditNoteScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeTruthy();
      expect(screen.getByText(/note not found/i)).toBeTruthy();
    });
  });

  it('shows error when note fetch fails', async () => {
    (getNoteById as jest.Mock).mockRejectedValue(new Error('Database error'));

    render(<EditNoteScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeTruthy();
    });
  });

  it('hides form when note not found', async () => {
    (getNoteById as jest.Mock).mockResolvedValue(null);

    render(<EditNoteScreen />);

    await waitFor(() => {
      expect(screen.queryByTestId('content-input')).toBeNull();
      expect(screen.queryByTestId('save-button')).toBeNull();
    });
  });

  it('shows go back button when note not found', async () => {
    (getNoteById as jest.Mock).mockResolvedValue(null);

    render(<EditNoteScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('go-back-button')).toBeTruthy();
    });
  });

  it('navigates back when go back button pressed', async () => {
    const mockBack = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
      back: mockBack,
    });

    (getNoteById as jest.Mock).mockResolvedValue(null);

    render(<EditNoteScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('go-back-button')).toBeTruthy();
    });

    const goBackButton = screen.getByTestId('go-back-button');
    fireEvent.press(goBackButton);

    expect(mockBack).toHaveBeenCalled();
  });
});

describe('EditNoteScreen - Updating Notes', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useLocalSearchParams as jest.Mock).mockReturnValue({ noteId: '123' });
    (getNoteById as jest.Mock).mockResolvedValue(mockNote);
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

  it('updates note when save pressed', async () => {
    const updatedNote = {
      ...mockNote,
      content: 'Updated content',
      updatedAt: Date.now(),
    };

    (updateNote as jest.Mock).mockResolvedValue(updatedNote);

    render(<EditNoteScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('content-input')).toBeTruthy();
    });

    const contentInput = screen.getByTestId('content-input');
    fireEvent.changeText(contentInput, 'Updated content');

    const saveButton = screen.getByTestId('save-button');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(updateNote).toHaveBeenCalledWith('123', {
        content: 'Updated content',
        keywords: mockNote.keywords,
      });
    });
  });

  it('updates note with modified keywords', async () => {
    const updatedNote = {
      ...mockNote,
      keywords: ['turkey', 'thanksgiving', 'cooking', 'tips'],
      updatedAt: Date.now(),
    };

    (updateNote as jest.Mock).mockResolvedValue(updatedNote);

    render(<EditNoteScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('keyword-input')).toBeTruthy();
    });

    // Add a new keyword
    const keywordInput = screen.getByTestId('keyword-input');
    fireEvent.changeText(keywordInput, 'tips');
    fireEvent(keywordInput, 'submitEditing');

    const saveButton = screen.getByTestId('save-button');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(updateNote).toHaveBeenCalledWith('123', {
        content: mockNote.content,
        keywords: expect.arrayContaining(['turkey', 'thanksgiving', 'cooking', 'tips']),
      });
    });
  });

  it('updates only changed fields', async () => {
    const updatedNote = {
      ...mockNote,
      content: 'New content',
      updatedAt: Date.now(),
    };

    (updateNote as jest.Mock).mockResolvedValue(updatedNote);

    render(<EditNoteScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('content-input')).toBeTruthy();
    });

    const contentInput = screen.getByTestId('content-input');
    fireEvent.changeText(contentInput, 'New content');

    const saveButton = screen.getByTestId('save-button');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(updateNote).toHaveBeenCalledWith('123', {
        content: 'New content',
        keywords: mockNote.keywords,
      });
    });
  });

  it('trims whitespace before updating', async () => {
    const updatedNote = {
      ...mockNote,
      content: 'Trimmed content',
      updatedAt: Date.now(),
    };

    (updateNote as jest.Mock).mockResolvedValue(updatedNote);

    render(<EditNoteScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('content-input')).toBeTruthy();
    });

    const contentInput = screen.getByTestId('content-input');
    fireEvent.changeText(contentInput, '  Trimmed content  ');

    const saveButton = screen.getByTestId('save-button');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(updateNote).toHaveBeenCalledWith('123', {
        content: 'Trimmed content',
        keywords: mockNote.keywords,
      });
    });
  });

  it('disables save button while updating', async () => {
    let resolveUpdate: (value: Note) => void;
    const updatePromise = new Promise<Note>((resolve) => {
      resolveUpdate = resolve;
    });

    (updateNote as jest.Mock).mockReturnValue(updatePromise);

    render(<EditNoteScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('content-input')).toBeTruthy();
    });

    const contentInput = screen.getByTestId('content-input');
    fireEvent.changeText(contentInput, 'Updated');

    const saveButton = screen.getByTestId('save-button');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(saveButton.props.accessibilityState?.disabled).toBe(true);
    });

    resolveUpdate!(mockNote);
  });

  it('shows loading indicator while updating', async () => {
    let resolveUpdate: (value: Note) => void;
    const updatePromise = new Promise<Note>((resolve) => {
      resolveUpdate = resolve;
    });

    (updateNote as jest.Mock).mockReturnValue(updatePromise);

    render(<EditNoteScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('content-input')).toBeTruthy();
    });

    const contentInput = screen.getByTestId('content-input');
    fireEvent.changeText(contentInput, 'Updated');

    const saveButton = screen.getByTestId('save-button');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(screen.getByTestId('loading-indicator')).toBeTruthy();
    });

    resolveUpdate!(mockNote);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).toBeNull();
    });
  });

  it('shows error if update fails', async () => {
    (updateNote as jest.Mock).mockRejectedValue(new Error('Update failed'));

    render(<EditNoteScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('content-input')).toBeTruthy();
    });

    const contentInput = screen.getByTestId('content-input');
    fireEvent.changeText(contentInput, 'Updated content');

    const saveButton = screen.getByTestId('save-button');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeTruthy();
      expect(screen.getByText(/failed to update note/i)).toBeTruthy();
    });
  });
});

describe('EditNoteScreen - Deleting Notes', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useLocalSearchParams as jest.Mock).mockReturnValue({ noteId: '123' });
    (getNoteById as jest.Mock).mockResolvedValue(mockNote);
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

  it('deletes note when delete pressed', async () => {
    (deleteNote as jest.Mock).mockResolvedValue(true);

    render(<EditNoteScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('delete-button')).toBeTruthy();
    });

    const deleteButton = screen.getByTestId('delete-button');
    fireEvent.press(deleteButton);

    // Should show confirmation dialog first
    await waitFor(() => {
      expect(screen.getByTestId('delete-confirmation-dialog')).toBeTruthy();
    });

    // Confirm the deletion
    const confirmButton = screen.getByTestId('confirm-delete-button');
    fireEvent.press(confirmButton);

    await waitFor(() => {
      expect(deleteNote).toHaveBeenCalledWith('123');
    });
  });

  it('shows confirmation dialog before deleting', async () => {
    render(<EditNoteScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('delete-button')).toBeTruthy();
    });

    const deleteButton = screen.getByTestId('delete-button');
    fireEvent.press(deleteButton);

    // Should show confirmation dialog
    await waitFor(() => {
      expect(screen.getByTestId('delete-confirmation-dialog')).toBeTruthy();
    });

    expect(deleteNote).not.toHaveBeenCalled();
  });

  it('deletes note when confirmation accepted', async () => {
    (deleteNote as jest.Mock).mockResolvedValue(true);

    render(<EditNoteScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('delete-button')).toBeTruthy();
    });

    const deleteButton = screen.getByTestId('delete-button');
    fireEvent.press(deleteButton);

    await waitFor(() => {
      expect(screen.getByTestId('delete-confirmation-dialog')).toBeTruthy();
    });

    const confirmButton = screen.getByTestId('confirm-delete-button');
    fireEvent.press(confirmButton);

    await waitFor(() => {
      expect(deleteNote).toHaveBeenCalledWith('123');
    });
  });

  it('does not delete when confirmation cancelled', async () => {
    render(<EditNoteScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('delete-button')).toBeTruthy();
    });

    const deleteButton = screen.getByTestId('delete-button');
    fireEvent.press(deleteButton);

    await waitFor(() => {
      expect(screen.getByTestId('delete-confirmation-dialog')).toBeTruthy();
    });

    const cancelButton = screen.getByTestId('cancel-delete-button');
    fireEvent.press(cancelButton);

    await waitFor(() => {
      expect(screen.queryByTestId('delete-confirmation-dialog')).toBeNull();
    });

    expect(deleteNote).not.toHaveBeenCalled();
  });

  it('shows error if delete fails', async () => {
    (deleteNote as jest.Mock).mockRejectedValue(new Error('Delete failed'));

    render(<EditNoteScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('delete-button')).toBeTruthy();
    });

    const deleteButton = screen.getByTestId('delete-button');
    fireEvent.press(deleteButton);

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

  it('disables delete button while deleting', async () => {
    let resolveDelete: (value: boolean) => void;
    const deletePromise = new Promise<boolean>((resolve) => {
      resolveDelete = resolve;
    });

    (deleteNote as jest.Mock).mockReturnValue(deletePromise);

    render(<EditNoteScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('delete-button')).toBeTruthy();
    });

    const deleteButton = screen.getByTestId('delete-button');
    fireEvent.press(deleteButton);

    await waitFor(() => {
      expect(screen.getByTestId('delete-confirmation-dialog')).toBeTruthy();
    });

    const confirmButton = screen.getByTestId('confirm-delete-button');
    fireEvent.press(confirmButton);

    await waitFor(() => {
      expect(deleteButton.props.accessibilityState?.disabled).toBe(true);
    });

    resolveDelete!(true);
  });
});

describe('EditNoteScreen - Navigation After Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useLocalSearchParams as jest.Mock).mockReturnValue({ noteId: '123' });
    (getNoteById as jest.Mock).mockResolvedValue(mockNote);
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

  it('navigates back after successful save', async () => {
    const mockBack = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
      back: mockBack,
    });

    (updateNote as jest.Mock).mockResolvedValue(mockNote);

    render(<EditNoteScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('content-input')).toBeTruthy();
    });

    const contentInput = screen.getByTestId('content-input');
    fireEvent.changeText(contentInput, 'Updated content');

    const saveButton = screen.getByTestId('save-button');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockBack).toHaveBeenCalled();
    });
  });

  it('navigates back after successful delete', async () => {
    const mockBack = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
      back: mockBack,
    });

    (deleteNote as jest.Mock).mockResolvedValue(true);

    render(<EditNoteScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('delete-button')).toBeTruthy();
    });

    const deleteButton = screen.getByTestId('delete-button');
    fireEvent.press(deleteButton);

    await waitFor(() => {
      expect(screen.getByTestId('delete-confirmation-dialog')).toBeTruthy();
    });

    const confirmButton = screen.getByTestId('confirm-delete-button');
    fireEvent.press(confirmButton);

    await waitFor(() => {
      expect(mockBack).toHaveBeenCalled();
    });
  });

  it('navigates back when cancel button pressed', async () => {
    const mockBack = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
      back: mockBack,
    });

    render(<EditNoteScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('cancel-button')).toBeTruthy();
    });

    const cancelButton = screen.getByTestId('cancel-button');
    fireEvent.press(cancelButton);

    expect(mockBack).toHaveBeenCalled();
  });

  it('does not save when cancel is pressed', async () => {
    const mockBack = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
      back: mockBack,
    });

    render(<EditNoteScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('content-input')).toBeTruthy();
    });

    const contentInput = screen.getByTestId('content-input');
    fireEvent.changeText(contentInput, 'Modified but not saved');

    const cancelButton = screen.getByTestId('cancel-button');
    fireEvent.press(cancelButton);

    expect(updateNote).not.toHaveBeenCalled();
    expect(mockBack).toHaveBeenCalled();
  });
});

describe('EditNoteScreen - Voice-to-Text Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useLocalSearchParams as jest.Mock).mockReturnValue({ noteId: '123' });
    (getNoteById as jest.Mock).mockResolvedValue(mockNote);
  });

  it('integrates voice-to-text for content', async () => {
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

    render(<EditNoteScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('mic-button')).toBeTruthy();
    });

    const micButton = screen.getByTestId('mic-button');
    fireEvent.press(micButton);

    expect(mockStartListening).toHaveBeenCalled();
  });

  it('appends voice transcript to existing content', async () => {
    const { rerender } = render(<EditNoteScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('content-input')).toBeTruthy();
    });

    // Simulate voice recognition
    (useSpeechRecognition as jest.Mock).mockReturnValue({
      isListening: false,
      transcript: ' Additional voice input',
      error: null,
      startListening: jest.fn(),
      stopListening: jest.fn(),
      resetTranscript: jest.fn(),
      isAvailable: true,
    });

    rerender(<EditNoteScreen />);

    const contentInput = screen.getByTestId('content-input');
    expect(contentInput.props.value).toContain('Thermometer runs 3 degrees hot');
    expect(contentInput.props.value).toContain('Additional voice input');
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

    render(<EditNoteScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('listening-indicator')).toBeTruthy();
    });
  });

  it('hides mic button when speech recognition not available', async () => {
    (useSpeechRecognition as jest.Mock).mockReturnValue({
      isListening: false,
      transcript: '',
      error: null,
      startListening: jest.fn(),
      stopListening: jest.fn(),
      resetTranscript: jest.fn(),
      isAvailable: false,
    });

    render(<EditNoteScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('content-input')).toBeTruthy();
    });

    expect(screen.queryByTestId('mic-button')).toBeNull();
  });
});

describe('EditNoteScreen - Form Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useLocalSearchParams as jest.Mock).mockReturnValue({ noteId: '123' });
    (getNoteById as jest.Mock).mockResolvedValue(mockNote);
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

  it('save button is disabled when content is empty', async () => {
    render(<EditNoteScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('content-input')).toBeTruthy();
    });

    const contentInput = screen.getByTestId('content-input');
    fireEvent.changeText(contentInput, '');

    const saveButton = screen.getByTestId('save-button');
    expect(saveButton.props.accessibilityState?.disabled).toBe(true);
  });

  it('save button is disabled when content is only whitespace', async () => {
    render(<EditNoteScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('content-input')).toBeTruthy();
    });

    const contentInput = screen.getByTestId('content-input');
    fireEvent.changeText(contentInput, '   ');

    const saveButton = screen.getByTestId('save-button');
    expect(saveButton.props.accessibilityState?.disabled).toBe(true);
  });

  it('save button is enabled when content is valid', async () => {
    render(<EditNoteScreen />);

    await waitFor(() => {
      const saveButton = screen.getByTestId('save-button');
      expect(saveButton.props.accessibilityState?.disabled).toBe(false);
    });
  });
});

describe('EditNoteScreen - Accessibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useLocalSearchParams as jest.Mock).mockReturnValue({ noteId: '123' });
    (getNoteById as jest.Mock).mockResolvedValue(mockNote);
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

  it('has proper accessibility labels for delete button', async () => {
    render(<EditNoteScreen />);

    await waitFor(() => {
      const deleteButton = screen.getByTestId('delete-button');
      expect(deleteButton.props.accessibilityLabel).toBeDefined();
      expect(deleteButton.props.accessibilityRole).toBe('button');
    });
  });

  it('has proper accessibility labels for save button', async () => {
    render(<EditNoteScreen />);

    await waitFor(() => {
      const saveButton = screen.getByTestId('save-button');
      expect(saveButton.props.accessibilityLabel).toBeDefined();
      expect(saveButton.props.accessibilityRole).toBe('button');
    });
  });

  it('has proper accessibility labels for cancel button', async () => {
    render(<EditNoteScreen />);

    await waitFor(() => {
      const cancelButton = screen.getByTestId('cancel-button');
      expect(cancelButton.props.accessibilityLabel).toBeDefined();
      expect(cancelButton.props.accessibilityRole).toBe('button');
    });
  });
});
