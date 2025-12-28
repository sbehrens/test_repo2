import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import CreateNoteScreen from '../../app/create-note';
import { createNote } from '../../lib/database';
import { useSpeechRecognition } from '../../lib/speech';

// Mock the dependencies
jest.mock('../../lib/database');
jest.mock('../../lib/speech');

describe('CreateNoteScreen - Rendering', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
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

  it('renders content text input', () => {
    render(<CreateNoteScreen />);

    const contentInput = screen.getByTestId('content-input');
    expect(contentInput).toBeTruthy();
  });

  it('renders content input with placeholder', () => {
    render(<CreateNoteScreen />);

    const contentInput = screen.getByPlaceholderText(/note content/i);
    expect(contentInput).toBeTruthy();
  });

  it('renders KeywordInput component', () => {
    render(<CreateNoteScreen />);

    const keywordInput = screen.getByTestId('keyword-input');
    expect(keywordInput).toBeTruthy();
  });

  it('renders save button', () => {
    render(<CreateNoteScreen />);

    const saveButton = screen.getByTestId('save-button');
    expect(saveButton).toBeTruthy();
  });

  it('renders mic button for voice input', () => {
    render(<CreateNoteScreen />);

    const micButton = screen.getByTestId('mic-button');
    expect(micButton).toBeTruthy();
  });

  it('renders cancel/back button', () => {
    render(<CreateNoteScreen />);

    const cancelButton = screen.getByTestId('cancel-button');
    expect(cancelButton).toBeTruthy();
  });

  it('renders screen title', () => {
    render(<CreateNoteScreen />);

    expect(screen.getByText(/create note/i)).toBeTruthy();
  });
});

describe('CreateNoteScreen - Form Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();

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

  it('save button is disabled when form is empty', () => {
    render(<CreateNoteScreen />);

    const saveButton = screen.getByTestId('save-button');
    expect(saveButton.props.accessibilityState?.disabled).toBe(true);
  });

  it('save button is disabled when content is empty', () => {
    render(<CreateNoteScreen />);

    const contentInput = screen.getByTestId('content-input');
    fireEvent.changeText(contentInput, '');

    const saveButton = screen.getByTestId('save-button');
    expect(saveButton.props.accessibilityState?.disabled).toBe(true);
  });

  it('save button is disabled when content is only whitespace', () => {
    render(<CreateNoteScreen />);

    const contentInput = screen.getByTestId('content-input');
    fireEvent.changeText(contentInput, '   ');

    const saveButton = screen.getByTestId('save-button');
    expect(saveButton.props.accessibilityState?.disabled).toBe(true);
  });

  it('save button is enabled when content is provided', () => {
    render(<CreateNoteScreen />);

    const contentInput = screen.getByTestId('content-input');
    fireEvent.changeText(contentInput, 'Thermometer runs 3 degrees hot');

    const saveButton = screen.getByTestId('save-button');
    expect(saveButton.props.accessibilityState?.disabled).toBe(false);
  });

  it('save button is enabled with content but no keywords', () => {
    render(<CreateNoteScreen />);

    const contentInput = screen.getByTestId('content-input');
    fireEvent.changeText(contentInput, 'Some note content');

    const saveButton = screen.getByTestId('save-button');
    expect(saveButton.props.accessibilityState?.disabled).toBe(false);
  });
});

describe('CreateNoteScreen - Creating Notes', () => {
  beforeEach(() => {
    jest.clearAllMocks();

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

  it('creates note when save pressed with valid data', async () => {
    const mockNote = {
      id: '1',
      content: 'Thermometer runs 3 degrees hot',
      keywords: ['turkey', 'thanksgiving'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    (createNote as jest.Mock).mockResolvedValue(mockNote);

    render(<CreateNoteScreen />);

    // Fill in content
    const contentInput = screen.getByTestId('content-input');
    fireEvent.changeText(contentInput, 'Thermometer runs 3 degrees hot');

    // Add keywords
    const keywordInput = screen.getByTestId('keyword-input');
    fireEvent.changeText(keywordInput, 'turkey');
    fireEvent(keywordInput, 'submitEditing');
    fireEvent.changeText(keywordInput, 'thanksgiving');
    fireEvent(keywordInput, 'submitEditing');

    // Press save
    const saveButton = screen.getByTestId('save-button');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(createNote).toHaveBeenCalledWith({
        content: 'Thermometer runs 3 degrees hot',
        keywords: expect.arrayContaining(['turkey', 'thanksgiving']),
      });
    });
  });

  it('creates note with content only (no keywords)', async () => {
    const mockNote = {
      id: '1',
      content: 'Simple note',
      keywords: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    (createNote as jest.Mock).mockResolvedValue(mockNote);

    render(<CreateNoteScreen />);

    const contentInput = screen.getByTestId('content-input');
    fireEvent.changeText(contentInput, 'Simple note');

    const saveButton = screen.getByTestId('save-button');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(createNote).toHaveBeenCalledWith({
        content: 'Simple note',
        keywords: [],
      });
    });
  });

  it('trims whitespace from content before saving', async () => {
    const mockNote = {
      id: '1',
      content: 'Note with spaces',
      keywords: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    (createNote as jest.Mock).mockResolvedValue(mockNote);

    render(<CreateNoteScreen />);

    const contentInput = screen.getByTestId('content-input');
    fireEvent.changeText(contentInput, '  Note with spaces  ');

    const saveButton = screen.getByTestId('save-button');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(createNote).toHaveBeenCalledWith({
        content: 'Note with spaces',
        keywords: [],
      });
    });
  });

  it('disables save button while creating note', async () => {
    let resolveCreate: (value: any) => void;
    const createPromise = new Promise((resolve) => {
      resolveCreate = resolve;
    });

    (createNote as jest.Mock).mockReturnValue(createPromise);

    render(<CreateNoteScreen />);

    const contentInput = screen.getByTestId('content-input');
    fireEvent.changeText(contentInput, 'Test note');

    const saveButton = screen.getByTestId('save-button');
    fireEvent.press(saveButton);

    // Button should be disabled during save
    await waitFor(() => {
      expect(saveButton.props.accessibilityState?.disabled).toBe(true);
    });

    // Resolve the promise
    resolveCreate!({
      id: '1',
      content: 'Test note',
      keywords: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  });

  it('shows loading indicator while creating note', async () => {
    let resolveCreate: (value: any) => void;
    const createPromise = new Promise((resolve) => {
      resolveCreate = resolve;
    });

    (createNote as jest.Mock).mockReturnValue(createPromise);

    render(<CreateNoteScreen />);

    const contentInput = screen.getByTestId('content-input');
    fireEvent.changeText(contentInput, 'Test note');

    const saveButton = screen.getByTestId('save-button');
    fireEvent.press(saveButton);

    // Should show loading indicator
    await waitFor(() => {
      expect(screen.getByTestId('loading-indicator')).toBeTruthy();
    });

    // Resolve the promise
    resolveCreate!({
      id: '1',
      content: 'Test note',
      keywords: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Loading should disappear
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).toBeNull();
    });
  });
});

describe('CreateNoteScreen - Navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();

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

    const mockNote = {
      id: '1',
      content: 'Test note',
      keywords: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    (createNote as jest.Mock).mockResolvedValue(mockNote);

    render(<CreateNoteScreen />);

    const contentInput = screen.getByTestId('content-input');
    fireEvent.changeText(contentInput, 'Test note');

    const saveButton = screen.getByTestId('save-button');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockBack).toHaveBeenCalled();
    });
  });

  it('navigates back when cancel button pressed', () => {
    const mockBack = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
      back: mockBack,
    });

    render(<CreateNoteScreen />);

    const cancelButton = screen.getByTestId('cancel-button');
    fireEvent.press(cancelButton);

    expect(mockBack).toHaveBeenCalled();
  });

  it('does not save when cancel is pressed', () => {
    const mockBack = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
      back: mockBack,
    });

    render(<CreateNoteScreen />);

    const contentInput = screen.getByTestId('content-input');
    fireEvent.changeText(contentInput, 'Unsaved content');

    const cancelButton = screen.getByTestId('cancel-button');
    fireEvent.press(cancelButton);

    expect(createNote).not.toHaveBeenCalled();
    expect(mockBack).toHaveBeenCalled();
  });
});

describe('CreateNoteScreen - Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();

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

  it('shows error if save fails', async () => {
    (createNote as jest.Mock).mockRejectedValue(new Error('Failed to create note'));

    render(<CreateNoteScreen />);

    const contentInput = screen.getByTestId('content-input');
    fireEvent.changeText(contentInput, 'Test note');

    const saveButton = screen.getByTestId('save-button');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeTruthy();
    });
  });

  it('displays error message text when save fails', async () => {
    (createNote as jest.Mock).mockRejectedValue(new Error('Database error'));

    render(<CreateNoteScreen />);

    const contentInput = screen.getByTestId('content-input');
    fireEvent.changeText(contentInput, 'Test note');

    const saveButton = screen.getByTestId('save-button');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to create note/i)).toBeTruthy();
    });
  });

  it('re-enables save button after error', async () => {
    (createNote as jest.Mock).mockRejectedValue(new Error('Failed'));

    render(<CreateNoteScreen />);

    const contentInput = screen.getByTestId('content-input');
    fireEvent.changeText(contentInput, 'Test note');

    const saveButton = screen.getByTestId('save-button');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeTruthy();
    });

    // Save button should be re-enabled after error
    expect(saveButton.props.accessibilityState?.disabled).toBe(false);
  });

  it('clears error message when user starts typing', async () => {
    (createNote as jest.Mock).mockRejectedValue(new Error('Failed'));

    render(<CreateNoteScreen />);

    const contentInput = screen.getByTestId('content-input');
    fireEvent.changeText(contentInput, 'Test note');

    const saveButton = screen.getByTestId('save-button');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeTruthy();
    });

    // User starts typing again
    fireEvent.changeText(contentInput, 'Updated note');

    // Error should be cleared
    await waitFor(() => {
      expect(screen.queryByTestId('error-message')).toBeNull();
    });
  });
});

describe('CreateNoteScreen - Voice-to-Text Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('integrates voice-to-text for content', () => {
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

    render(<CreateNoteScreen />);

    const micButton = screen.getByTestId('mic-button');
    fireEvent.press(micButton);

    expect(mockStartListening).toHaveBeenCalled();
  });

  it('updates content field with voice transcript', () => {
    const { rerender } = render(<CreateNoteScreen />);

    // Simulate voice recognition returning transcript
    (useSpeechRecognition as jest.Mock).mockReturnValue({
      isListening: false,
      transcript: 'Voice input test',
      error: null,
      startListening: jest.fn(),
      stopListening: jest.fn(),
      resetTranscript: jest.fn(),
      isAvailable: true,
    });

    rerender(<CreateNoteScreen />);

    const contentInput = screen.getByTestId('content-input');
    expect(contentInput.props.value).toBe('Voice input test');
  });

  it('shows listening indicator during voice input', () => {
    (useSpeechRecognition as jest.Mock).mockReturnValue({
      isListening: true,
      transcript: '',
      error: null,
      startListening: jest.fn(),
      stopListening: jest.fn(),
      resetTranscript: jest.fn(),
      isAvailable: true,
    });

    render(<CreateNoteScreen />);

    expect(screen.getByTestId('listening-indicator')).toBeTruthy();
  });

  it('stops listening when mic button pressed while listening', () => {
    const mockStopListening = jest.fn();

    (useSpeechRecognition as jest.Mock).mockReturnValue({
      isListening: true,
      transcript: 'Some text',
      error: null,
      startListening: jest.fn(),
      stopListening: mockStopListening,
      resetTranscript: jest.fn(),
      isAvailable: true,
    });

    render(<CreateNoteScreen />);

    const micButton = screen.getByTestId('mic-button');
    fireEvent.press(micButton);

    expect(mockStopListening).toHaveBeenCalled();
  });

  it('hides mic button when speech recognition not available', () => {
    (useSpeechRecognition as jest.Mock).mockReturnValue({
      isListening: false,
      transcript: '',
      error: null,
      startListening: jest.fn(),
      stopListening: jest.fn(),
      resetTranscript: jest.fn(),
      isAvailable: false,
    });

    render(<CreateNoteScreen />);

    expect(screen.queryByTestId('mic-button')).toBeNull();
  });

  it('appends voice transcript to existing content', () => {
    const { rerender } = render(<CreateNoteScreen />);

    // Type some content
    const contentInput = screen.getByTestId('content-input');
    fireEvent.changeText(contentInput, 'Manual input. ');

    // Simulate voice recognition
    (useSpeechRecognition as jest.Mock).mockReturnValue({
      isListening: false,
      transcript: 'Voice input',
      error: null,
      startListening: jest.fn(),
      stopListening: jest.fn(),
      resetTranscript: jest.fn(),
      isAvailable: true,
    });

    rerender(<CreateNoteScreen />);

    expect(contentInput.props.value).toBe('Manual input. Voice input');
  });

  it('shows error message if voice recognition fails', () => {
    (useSpeechRecognition as jest.Mock).mockReturnValue({
      isListening: false,
      transcript: '',
      error: 'Microphone permission denied',
      startListening: jest.fn(),
      stopListening: jest.fn(),
      resetTranscript: jest.fn(),
      isAvailable: true,
    });

    render(<CreateNoteScreen />);

    expect(screen.getByText(/microphone permission denied/i)).toBeTruthy();
  });
});

describe('CreateNoteScreen - Accessibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();

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

  it('has proper accessibility labels for content input', () => {
    render(<CreateNoteScreen />);

    const contentInput = screen.getByTestId('content-input');
    expect(contentInput.props.accessibilityLabel).toBeDefined();
  });

  it('has proper accessibility labels for save button', () => {
    render(<CreateNoteScreen />);

    const saveButton = screen.getByTestId('save-button');
    expect(saveButton.props.accessibilityLabel).toBeDefined();
    expect(saveButton.props.accessibilityRole).toBe('button');
  });

  it('has proper accessibility labels for cancel button', () => {
    render(<CreateNoteScreen />);

    const cancelButton = screen.getByTestId('cancel-button');
    expect(cancelButton.props.accessibilityLabel).toBeDefined();
    expect(cancelButton.props.accessibilityRole).toBe('button');
  });

  it('has proper accessibility labels for mic button', () => {
    render(<CreateNoteScreen />);

    const micButton = screen.getByTestId('mic-button');
    expect(micButton.props.accessibilityLabel).toBeDefined();
    expect(micButton.props.accessibilityRole).toBe('button');
  });

  it('indicates disabled state for save button via accessibility', () => {
    render(<CreateNoteScreen />);

    const saveButton = screen.getByTestId('save-button');
    expect(saveButton.props.accessibilityState?.disabled).toBe(true);
  });
});
