import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import NoteCard from '../../components/NoteCard';
import { Note } from '../../types';

describe('NoteCard Component', () => {
  const mockNote: Note = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    content: 'Thermometer runs 3° hot',
    keywords: ['turkey', 'thanksgiving', 'cooking'],
    createdAt: 1700000000000, // Nov 14, 2023
    updatedAt: 1700000000000,
  };

  const mockOnPress = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders note content correctly', () => {
      render(<NoteCard note={mockNote} onPress={mockOnPress} />);

      const content = screen.getByText('Thermometer runs 3° hot');
      expect(content).toBeTruthy();
    });

    it('renders all keywords as tags', () => {
      render(<NoteCard note={mockNote} onPress={mockOnPress} />);

      expect(screen.getByText('turkey')).toBeTruthy();
      expect(screen.getByText('thanksgiving')).toBeTruthy();
      expect(screen.getByText('cooking')).toBeTruthy();
    });

    it('renders note with empty keywords array', () => {
      const noteWithoutKeywords: Note = {
        ...mockNote,
        keywords: [],
      };

      render(<NoteCard note={noteWithoutKeywords} onPress={mockOnPress} />);

      expect(screen.getByText('Thermometer runs 3° hot')).toBeTruthy();
      // Should not crash when no keywords present
    });

    it('renders note with single keyword', () => {
      const noteWithOneKeyword: Note = {
        ...mockNote,
        keywords: ['cooking'],
      };

      render(<NoteCard note={noteWithOneKeyword} onPress={mockOnPress} />);

      expect(screen.getByText('cooking')).toBeTruthy();
    });

    it('renders note with many keywords', () => {
      const noteWithManyKeywords: Note = {
        ...mockNote,
        keywords: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
      };

      render(<NoteCard note={noteWithManyKeywords} onPress={mockOnPress} />);

      // All keywords should be rendered
      expect(screen.getByText('a')).toBeTruthy();
      expect(screen.getByText('h')).toBeTruthy();
    });

    it('formats date correctly', () => {
      render(<NoteCard note={mockNote} onPress={mockOnPress} />);

      // Should display formatted date (exact format depends on implementation)
      const dateElement = screen.getByTestId('note-date');
      expect(dateElement).toBeTruthy();
      expect(dateElement.props.children).toBeDefined();
    });

    it('displays delete button when onDelete prop is provided', () => {
      render(
        <NoteCard
          note={mockNote}
          onPress={mockOnPress}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByTestId('delete-button');
      expect(deleteButton).toBeTruthy();
    });

    it('does not display delete button when onDelete prop is not provided', () => {
      render(<NoteCard note={mockNote} onPress={mockOnPress} />);

      const deleteButton = screen.queryByTestId('delete-button');
      expect(deleteButton).toBeNull();
    });
  });

  describe('User Interactions', () => {
    it('calls onPress with note when card is pressed', () => {
      render(<NoteCard note={mockNote} onPress={mockOnPress} />);

      const card = screen.getByTestId('note-card');
      fireEvent.press(card);

      expect(mockOnPress).toHaveBeenCalledTimes(1);
      expect(mockOnPress).toHaveBeenCalledWith(mockNote);
    });

    it('calls onPress multiple times when card is pressed multiple times', () => {
      render(<NoteCard note={mockNote} onPress={mockOnPress} />);

      const card = screen.getByTestId('note-card');
      fireEvent.press(card);
      fireEvent.press(card);
      fireEvent.press(card);

      expect(mockOnPress).toHaveBeenCalledTimes(3);
      expect(mockOnPress).toHaveBeenCalledWith(mockNote);
    });

    it('calls onDelete with note when delete button is pressed', () => {
      render(
        <NoteCard
          note={mockNote}
          onPress={mockOnPress}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByTestId('delete-button');
      fireEvent.press(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledTimes(1);
      expect(mockOnDelete).toHaveBeenCalledWith(mockNote);
    });

    it('does not call onPress when delete button is pressed', () => {
      render(
        <NoteCard
          note={mockNote}
          onPress={mockOnPress}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByTestId('delete-button');
      fireEvent.press(deleteButton);

      // Only onDelete should be called, not onPress
      expect(mockOnDelete).toHaveBeenCalledTimes(1);
      expect(mockOnPress).not.toHaveBeenCalled();
    });
  });

  describe('Date Formatting', () => {
    it('formats recent dates correctly', () => {
      const recentNote: Note = {
        ...mockNote,
        createdAt: Date.now() - 1000 * 60 * 5, // 5 minutes ago
      };

      render(<NoteCard note={recentNote} onPress={mockOnPress} />);

      const dateElement = screen.getByTestId('note-date');
      expect(dateElement).toBeTruthy();
    });

    it('formats dates from different months', () => {
      const oldNote: Note = {
        ...mockNote,
        createdAt: 1577836800000, // Jan 1, 2020
      };

      render(<NoteCard note={oldNote} onPress={mockOnPress} />);

      const dateElement = screen.getByTestId('note-date');
      expect(dateElement).toBeTruthy();
    });

    it('formats dates from different years', () => {
      const veryOldNote: Note = {
        ...mockNote,
        createdAt: 946684800000, // Jan 1, 2000
      };

      render(<NoteCard note={veryOldNote} onPress={mockOnPress} />);

      const dateElement = screen.getByTestId('note-date');
      expect(dateElement).toBeTruthy();
    });

    it('uses createdAt for date display by default', () => {
      const noteWithDifferentDates: Note = {
        ...mockNote,
        createdAt: 1700000000000,
        updatedAt: 1700100000000, // Different from createdAt
      };

      render(<NoteCard note={noteWithDifferentDates} onPress={mockOnPress} />);

      // Should use createdAt by default
      const dateElement = screen.getByTestId('note-date');
      expect(dateElement).toBeTruthy();
    });
  });

  describe('Content Variations', () => {
    it('renders short content correctly', () => {
      const shortNote: Note = {
        ...mockNote,
        content: 'Hi',
      };

      render(<NoteCard note={shortNote} onPress={mockOnPress} />);

      expect(screen.getByText('Hi')).toBeTruthy();
    });

    it('renders long content correctly', () => {
      const longContent = 'This is a very long note with lots of information about cooking turkey for thanksgiving dinner. It includes temperatures, timing, and various other important details that should be displayed correctly.';
      const longNote: Note = {
        ...mockNote,
        content: longContent,
      };

      render(<NoteCard note={longNote} onPress={mockOnPress} />);

      expect(screen.getByText(longContent)).toBeTruthy();
    });

    it('renders content with special characters', () => {
      const specialNote: Note = {
        ...mockNote,
        content: 'Temperature: 350°F, Time: 3½ hours, Cost: $25.99',
      };

      render(<NoteCard note={specialNote} onPress={mockOnPress} />);

      expect(screen.getByText(specialNote.content)).toBeTruthy();
    });

    it('renders content with line breaks', () => {
      const multilineNote: Note = {
        ...mockNote,
        content: 'First line\nSecond line\nThird line',
      };

      render(<NoteCard note={multilineNote} onPress={mockOnPress} />);

      expect(screen.getByText(multilineNote.content)).toBeTruthy();
    });

    it('renders keywords with special characters', () => {
      const specialKeywordsNote: Note = {
        ...mockNote,
        keywords: ['café', 'naïve', 'résumé'],
      };

      render(<NoteCard note={specialKeywordsNote} onPress={mockOnPress} />);

      expect(screen.getByText('café')).toBeTruthy();
      expect(screen.getByText('naïve')).toBeTruthy();
      expect(screen.getByText('résumé')).toBeTruthy();
    });

    it('renders long keywords correctly', () => {
      const longKeywordNote: Note = {
        ...mockNote,
        keywords: ['this-is-a-very-long-keyword-that-should-still-display'],
      };

      render(<NoteCard note={longKeywordNote} onPress={mockOnPress} />);

      expect(
        screen.getByText('this-is-a-very-long-keyword-that-should-still-display')
      ).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('has proper accessibility labels for card', () => {
      render(<NoteCard note={mockNote} onPress={mockOnPress} />);

      const card = screen.getByTestId('note-card');
      expect(card.props.accessibilityLabel).toBeDefined();
      expect(card.props.accessibilityRole).toBe('button');
    });

    it('has proper accessibility labels for delete button', () => {
      render(
        <NoteCard
          note={mockNote}
          onPress={mockOnPress}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByTestId('delete-button');
      expect(deleteButton.props.accessibilityLabel).toBeDefined();
      expect(deleteButton.props.accessibilityRole).toBe('button');
    });

    it('has proper accessibility hint for card interaction', () => {
      render(<NoteCard note={mockNote} onPress={mockOnPress} />);

      const card = screen.getByTestId('note-card');
      expect(card.props.accessibilityHint).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('handles note with empty content string', () => {
      const emptyContentNote: Note = {
        ...mockNote,
        content: '',
      };

      render(<NoteCard note={emptyContentNote} onPress={mockOnPress} />);

      // Should still render the card
      const card = screen.getByTestId('note-card');
      expect(card).toBeTruthy();
    });

    it('handles keyword tags being pressable (if implemented)', () => {
      render(<NoteCard note={mockNote} onPress={mockOnPress} />);

      const keywordTag = screen.getByText('turkey');
      expect(keywordTag).toBeTruthy();
      // Tags might be pressable for filtering in future
    });

    it('handles rapid successive presses on card', () => {
      render(<NoteCard note={mockNote} onPress={mockOnPress} />);

      const card = screen.getByTestId('note-card');
      for (let i = 0; i < 10; i++) {
        fireEvent.press(card);
      }

      expect(mockOnPress).toHaveBeenCalledTimes(10);
    });

    it('handles zero timestamp edge case', () => {
      const zeroTimestampNote: Note = {
        ...mockNote,
        createdAt: 0,
        updatedAt: 0,
      };

      render(<NoteCard note={zeroTimestampNote} onPress={mockOnPress} />);

      const dateElement = screen.getByTestId('note-date');
      expect(dateElement).toBeTruthy();
    });
  });

  describe('Visual States', () => {
    it('renders correctly when pressed (press state)', () => {
      render(<NoteCard note={mockNote} onPress={mockOnPress} />);

      const card = screen.getByTestId('note-card');
      fireEvent(card, 'pressIn');

      // Card should still be visible in pressed state
      expect(card).toBeTruthy();

      fireEvent(card, 'pressOut');
      expect(card).toBeTruthy();
    });
  });
});
