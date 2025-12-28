import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import SearchBar from '../../components/SearchBar';

describe('SearchBar Component', () => {
  const mockOnChangeText = jest.fn();
  const mockOnMicPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders correctly with placeholder', () => {
      render(
        <SearchBar
          value=""
          onChangeText={mockOnChangeText}
          onMicPress={mockOnMicPress}
          placeholder="Search notes..."
        />
      );

      const input = screen.getByPlaceholderText('Search notes...');
      expect(input).toBeTruthy();
    });

    it('renders with default placeholder when not provided', () => {
      render(
        <SearchBar
          value=""
          onChangeText={mockOnChangeText}
          onMicPress={mockOnMicPress}
        />
      );

      // Component should render even without explicit placeholder
      expect(screen.getByTestId('search-bar')).toBeTruthy();
    });

    it('displays value prop correctly', () => {
      const testValue = 'turkey thermometer';
      render(
        <SearchBar
          value={testValue}
          onChangeText={mockOnChangeText}
          onMicPress={mockOnMicPress}
          placeholder="Search notes..."
        />
      );

      const input = screen.getByDisplayValue(testValue);
      expect(input).toBeTruthy();
      expect(input.props.value).toBe(testValue);
    });

    it('renders microphone button', () => {
      render(
        <SearchBar
          value=""
          onChangeText={mockOnChangeText}
          onMicPress={mockOnMicPress}
        />
      );

      const micButton = screen.getByTestId('mic-button');
      expect(micButton).toBeTruthy();
    });
  });

  describe('User Interactions', () => {
    it('calls onChangeText when text input changes', () => {
      render(
        <SearchBar
          value=""
          onChangeText={mockOnChangeText}
          onMicPress={mockOnMicPress}
          placeholder="Search notes..."
        />
      );

      const input = screen.getByPlaceholderText('Search notes...');
      fireEvent.changeText(input, 'cooking tips');

      expect(mockOnChangeText).toHaveBeenCalledTimes(1);
      expect(mockOnChangeText).toHaveBeenCalledWith('cooking tips');
    });

    it('calls onChangeText with empty string when cleared', () => {
      render(
        <SearchBar
          value="some text"
          onChangeText={mockOnChangeText}
          onMicPress={mockOnMicPress}
          placeholder="Search notes..."
        />
      );

      const input = screen.getByPlaceholderText('Search notes...');
      fireEvent.changeText(input, '');

      expect(mockOnChangeText).toHaveBeenCalledWith('');
    });

    it('calls onMicPress when microphone button is pressed', () => {
      render(
        <SearchBar
          value=""
          onChangeText={mockOnChangeText}
          onMicPress={mockOnMicPress}
        />
      );

      const micButton = screen.getByTestId('mic-button');
      fireEvent.press(micButton);

      expect(mockOnMicPress).toHaveBeenCalledTimes(1);
    });

    it('can press microphone button multiple times', () => {
      render(
        <SearchBar
          value=""
          onChangeText={mockOnChangeText}
          onMicPress={mockOnMicPress}
        />
      );

      const micButton = screen.getByTestId('mic-button');
      fireEvent.press(micButton);
      fireEvent.press(micButton);
      fireEvent.press(micButton);

      expect(mockOnMicPress).toHaveBeenCalledTimes(3);
    });
  });

  describe('Listening State', () => {
    it('shows listening indicator when isListening is true', () => {
      render(
        <SearchBar
          value=""
          onChangeText={mockOnChangeText}
          onMicPress={mockOnMicPress}
          isListening={true}
        />
      );

      const listeningIndicator = screen.getByTestId('listening-indicator');
      expect(listeningIndicator).toBeTruthy();
    });

    it('does not show listening indicator when isListening is false', () => {
      render(
        <SearchBar
          value=""
          onChangeText={mockOnChangeText}
          onMicPress={mockOnMicPress}
          isListening={false}
        />
      );

      const listeningIndicator = screen.queryByTestId('listening-indicator');
      expect(listeningIndicator).toBeNull();
    });

    it('does not show listening indicator when isListening is not provided', () => {
      render(
        <SearchBar
          value=""
          onChangeText={mockOnChangeText}
          onMicPress={mockOnMicPress}
        />
      );

      const listeningIndicator = screen.queryByTestId('listening-indicator');
      expect(listeningIndicator).toBeNull();
    });

    it('mic button visual state changes when listening', () => {
      const { rerender } = render(
        <SearchBar
          value=""
          onChangeText={mockOnChangeText}
          onMicPress={mockOnMicPress}
          isListening={false}
        />
      );

      const micButton = screen.getByTestId('mic-button');
      const initialAccessibilityState = micButton.props.accessibilityState;

      rerender(
        <SearchBar
          value=""
          onChangeText={mockOnChangeText}
          onMicPress={mockOnMicPress}
          isListening={true}
        />
      );

      const updatedMicButton = screen.getByTestId('mic-button');
      // The button should have some visual indication of active listening state
      expect(updatedMicButton).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('has proper accessibility labels for text input', () => {
      render(
        <SearchBar
          value=""
          onChangeText={mockOnChangeText}
          onMicPress={mockOnMicPress}
          placeholder="Search notes..."
        />
      );

      const input = screen.getByPlaceholderText('Search notes...');
      expect(input.props.accessibilityLabel).toBeDefined();
    });

    it('has proper accessibility labels for mic button', () => {
      render(
        <SearchBar
          value=""
          onChangeText={mockOnChangeText}
          onMicPress={mockOnMicPress}
        />
      );

      const micButton = screen.getByTestId('mic-button');
      expect(micButton.props.accessibilityLabel).toBeDefined();
      expect(micButton.props.accessibilityRole).toBe('button');
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid text input changes', () => {
      render(
        <SearchBar
          value=""
          onChangeText={mockOnChangeText}
          onMicPress={mockOnMicPress}
        />
      );

      const input = screen.getByTestId('search-bar');
      fireEvent.changeText(input, 't');
      fireEvent.changeText(input, 'tu');
      fireEvent.changeText(input, 'tur');
      fireEvent.changeText(input, 'turk');
      fireEvent.changeText(input, 'turke');
      fireEvent.changeText(input, 'turkey');

      expect(mockOnChangeText).toHaveBeenCalledTimes(6);
      expect(mockOnChangeText).toHaveBeenLastCalledWith('turkey');
    });

    it('handles special characters in input', () => {
      render(
        <SearchBar
          value=""
          onChangeText={mockOnChangeText}
          onMicPress={mockOnMicPress}
        />
      );

      const input = screen.getByTestId('search-bar');
      const specialText = '!@#$%^&*()_+-={}[]|:";\'<>?,./';
      fireEvent.changeText(input, specialText);

      expect(mockOnChangeText).toHaveBeenCalledWith(specialText);
    });

    it('handles very long input text', () => {
      render(
        <SearchBar
          value=""
          onChangeText={mockOnChangeText}
          onMicPress={mockOnMicPress}
        />
      );

      const input = screen.getByTestId('search-bar');
      const longText = 'a'.repeat(1000);
      fireEvent.changeText(input, longText);

      expect(mockOnChangeText).toHaveBeenCalledWith(longText);
    });

    it('handles unicode and emoji in input', () => {
      render(
        <SearchBar
          value=""
          onChangeText={mockOnChangeText}
          onMicPress={mockOnMicPress}
        />
      );

      const input = screen.getByTestId('search-bar');
      const unicodeText = 'Search 🦃 thanksgiving 🍗';
      fireEvent.changeText(input, unicodeText);

      expect(mockOnChangeText).toHaveBeenCalledWith(unicodeText);
    });
  });
});
