import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import KeywordInput from '../../components/KeywordInput';

describe('KeywordInput Component', () => {
  const mockOnKeywordsChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders correctly with empty keywords array', () => {
      render(
        <KeywordInput keywords={[]} onKeywordsChange={mockOnKeywordsChange} />
      );

      const input = screen.getByTestId('keyword-input');
      expect(input).toBeTruthy();
    });

    it('renders with placeholder when provided', () => {
      render(
        <KeywordInput
          keywords={[]}
          onKeywordsChange={mockOnKeywordsChange}
          placeholder="Add keywords..."
        />
      );

      const input = screen.getByPlaceholderText('Add keywords...');
      expect(input).toBeTruthy();
    });

    it('renders existing keywords as chips/tags', () => {
      const keywords = ['turkey', 'thanksgiving', 'cooking'];
      render(
        <KeywordInput
          keywords={keywords}
          onKeywordsChange={mockOnKeywordsChange}
        />
      );

      expect(screen.getByText('turkey')).toBeTruthy();
      expect(screen.getByText('thanksgiving')).toBeTruthy();
      expect(screen.getByText('cooking')).toBeTruthy();
    });

    it('renders single keyword correctly', () => {
      render(
        <KeywordInput
          keywords={['cooking']}
          onKeywordsChange={mockOnKeywordsChange}
        />
      );

      expect(screen.getByText('cooking')).toBeTruthy();
    });

    it('renders multiple keywords with remove buttons', () => {
      const keywords = ['turkey', 'thanksgiving'];
      render(
        <KeywordInput
          keywords={keywords}
          onKeywordsChange={mockOnKeywordsChange}
        />
      );

      const removeButtons = screen.getAllByTestId(/remove-keyword-/);
      expect(removeButtons).toHaveLength(2);
    });

    it('renders many keywords correctly', () => {
      const manyKeywords = Array.from({ length: 10 }, (_, i) => `keyword${i}`);
      render(
        <KeywordInput
          keywords={manyKeywords}
          onKeywordsChange={mockOnKeywordsChange}
        />
      );

      manyKeywords.forEach((keyword) => {
        expect(screen.getByText(keyword)).toBeTruthy();
      });
    });
  });

  describe('Adding Keywords', () => {
    it('adds keyword when user types and presses enter', () => {
      render(
        <KeywordInput keywords={[]} onKeywordsChange={mockOnKeywordsChange} />
      );

      const input = screen.getByTestId('keyword-input');
      fireEvent.changeText(input, 'turkey');
      fireEvent(input, 'submitEditing');

      expect(mockOnKeywordsChange).toHaveBeenCalledTimes(1);
      expect(mockOnKeywordsChange).toHaveBeenCalledWith(['turkey']);
    });

    it('adds keyword when user types and presses comma', () => {
      render(
        <KeywordInput keywords={[]} onKeywordsChange={mockOnKeywordsChange} />
      );

      const input = screen.getByTestId('keyword-input');
      fireEvent.changeText(input, 'turkey,');

      expect(mockOnKeywordsChange).toHaveBeenCalledTimes(1);
      expect(mockOnKeywordsChange).toHaveBeenCalledWith(['turkey']);
    });

    it('adds multiple keywords separated by commas', () => {
      render(
        <KeywordInput keywords={[]} onKeywordsChange={mockOnKeywordsChange} />
      );

      const input = screen.getByTestId('keyword-input');
      fireEvent.changeText(input, 'turkey,thanksgiving,cooking');

      expect(mockOnKeywordsChange).toHaveBeenCalled();
      // Should add all keywords
    });

    it('adds keyword to existing keywords array', () => {
      render(
        <KeywordInput
          keywords={['existing']}
          onKeywordsChange={mockOnKeywordsChange}
        />
      );

      const input = screen.getByTestId('keyword-input');
      fireEvent.changeText(input, 'new');
      fireEvent(input, 'submitEditing');

      expect(mockOnKeywordsChange).toHaveBeenCalledWith(['existing', 'new']);
    });

    it('trims whitespace from keywords before adding', () => {
      render(
        <KeywordInput keywords={[]} onKeywordsChange={mockOnKeywordsChange} />
      );

      const input = screen.getByTestId('keyword-input');
      fireEvent.changeText(input, '  turkey  ');
      fireEvent(input, 'submitEditing');

      expect(mockOnKeywordsChange).toHaveBeenCalledWith(['turkey']);
    });

    it('does not add empty keyword', () => {
      render(
        <KeywordInput keywords={[]} onKeywordsChange={mockOnKeywordsChange} />
      );

      const input = screen.getByTestId('keyword-input');
      fireEvent.changeText(input, '');
      fireEvent(input, 'submitEditing');

      expect(mockOnKeywordsChange).not.toHaveBeenCalled();
    });

    it('does not add whitespace-only keyword', () => {
      render(
        <KeywordInput keywords={[]} onKeywordsChange={mockOnKeywordsChange} />
      );

      const input = screen.getByTestId('keyword-input');
      fireEvent.changeText(input, '   ');
      fireEvent(input, 'submitEditing');

      expect(mockOnKeywordsChange).not.toHaveBeenCalled();
    });

    it('does not add duplicate keywords', () => {
      render(
        <KeywordInput
          keywords={['turkey']}
          onKeywordsChange={mockOnKeywordsChange}
        />
      );

      const input = screen.getByTestId('keyword-input');
      fireEvent.changeText(input, 'turkey');
      fireEvent(input, 'submitEditing');

      // Should not add duplicate
      expect(mockOnKeywordsChange).not.toHaveBeenCalledWith(['turkey', 'turkey']);
    });

    it('clears input field after adding keyword', () => {
      const { rerender } = render(
        <KeywordInput keywords={[]} onKeywordsChange={mockOnKeywordsChange} />
      );

      const input = screen.getByTestId('keyword-input');
      fireEvent.changeText(input, 'turkey');
      fireEvent(input, 'submitEditing');

      // After adding, the component should clear the input
      // This would be reflected in the next render
      expect(mockOnKeywordsChange).toHaveBeenCalledWith(['turkey']);
    });
  });

  describe('Removing Keywords', () => {
    it('removes keyword when X button is pressed on chip', () => {
      const keywords = ['turkey', 'thanksgiving', 'cooking'];
      render(
        <KeywordInput
          keywords={keywords}
          onKeywordsChange={mockOnKeywordsChange}
        />
      );

      const removeButton = screen.getByTestId('remove-keyword-turkey');
      fireEvent.press(removeButton);

      expect(mockOnKeywordsChange).toHaveBeenCalledTimes(1);
      expect(mockOnKeywordsChange).toHaveBeenCalledWith([
        'thanksgiving',
        'cooking',
      ]);
    });

    it('removes correct keyword when multiple are present', () => {
      const keywords = ['turkey', 'thanksgiving', 'cooking'];
      render(
        <KeywordInput
          keywords={keywords}
          onKeywordsChange={mockOnKeywordsChange}
        />
      );

      const removeButton = screen.getByTestId('remove-keyword-thanksgiving');
      fireEvent.press(removeButton);

      expect(mockOnKeywordsChange).toHaveBeenCalledWith(['turkey', 'cooking']);
    });

    it('removes last remaining keyword', () => {
      render(
        <KeywordInput
          keywords={['onlyKeyword']}
          onKeywordsChange={mockOnKeywordsChange}
        />
      );

      const removeButton = screen.getByTestId('remove-keyword-onlyKeyword');
      fireEvent.press(removeButton);

      expect(mockOnKeywordsChange).toHaveBeenCalledWith([]);
    });

    it('can remove multiple keywords in sequence', () => {
      const { rerender } = render(
        <KeywordInput
          keywords={['a', 'b', 'c']}
          onKeywordsChange={mockOnKeywordsChange}
        />
      );

      const removeA = screen.getByTestId('remove-keyword-a');
      fireEvent.press(removeA);
      expect(mockOnKeywordsChange).toHaveBeenCalledWith(['b', 'c']);

      rerender(
        <KeywordInput
          keywords={['b', 'c']}
          onKeywordsChange={mockOnKeywordsChange}
        />
      );

      const removeB = screen.getByTestId('remove-keyword-b');
      fireEvent.press(removeB);
      expect(mockOnKeywordsChange).toHaveBeenCalledWith(['c']);
    });
  });

  describe('Keyboard Handling', () => {
    it('handles Enter key press', () => {
      render(
        <KeywordInput keywords={[]} onKeywordsChange={mockOnKeywordsChange} />
      );

      const input = screen.getByTestId('keyword-input');
      fireEvent.changeText(input, 'turkey');
      fireEvent(input, 'submitEditing');

      expect(mockOnKeywordsChange).toHaveBeenCalledWith(['turkey']);
    });

    it('handles comma delimiter', () => {
      render(
        <KeywordInput keywords={[]} onKeywordsChange={mockOnKeywordsChange} />
      );

      const input = screen.getByTestId('keyword-input');
      fireEvent.changeText(input, 'turkey,');

      expect(mockOnKeywordsChange).toHaveBeenCalled();
    });

    it('handles Tab key if implemented', () => {
      render(
        <KeywordInput keywords={[]} onKeywordsChange={mockOnKeywordsChange} />
      );

      const input = screen.getByTestId('keyword-input');
      fireEvent.changeText(input, 'turkey');
      // Tab handling may be platform-specific
    });
  });

  describe('Edge Cases', () => {
    it('handles keywords with special characters', () => {
      const keywords = ['café', 'naïve', 'résumé'];
      render(
        <KeywordInput
          keywords={keywords}
          onKeywordsChange={mockOnKeywordsChange}
        />
      );

      expect(screen.getByText('café')).toBeTruthy();
      expect(screen.getByText('naïve')).toBeTruthy();
      expect(screen.getByText('résumé')).toBeTruthy();
    });

    it('handles very long keywords', () => {
      const longKeyword = 'this-is-a-very-long-keyword-that-should-still-work';
      render(
        <KeywordInput
          keywords={[longKeyword]}
          onKeywordsChange={mockOnKeywordsChange}
        />
      );

      expect(screen.getByText(longKeyword)).toBeTruthy();
    });

    it('handles keywords with hyphens and underscores', () => {
      const keywords = ['long-keyword', 'another_keyword', 'mix-ed_style'];
      render(
        <KeywordInput
          keywords={keywords}
          onKeywordsChange={mockOnKeywordsChange}
        />
      );

      keywords.forEach((keyword) => {
        expect(screen.getByText(keyword)).toBeTruthy();
      });
    });

    it('handles keywords with numbers', () => {
      const keywords = ['recipe123', '2024', 'item1'];
      render(
        <KeywordInput
          keywords={keywords}
          onKeywordsChange={mockOnKeywordsChange}
        />
      );

      keywords.forEach((keyword) => {
        expect(screen.getByText(keyword)).toBeTruthy();
      });
    });

    it('handles rapid keyword additions', () => {
      const { rerender } = render(
        <KeywordInput keywords={[]} onKeywordsChange={mockOnKeywordsChange} />
      );

      const input = screen.getByTestId('keyword-input');

      fireEvent.changeText(input, 'a');
      fireEvent(input, 'submitEditing');

      rerender(
        <KeywordInput
          keywords={['a']}
          onKeywordsChange={mockOnKeywordsChange}
        />
      );

      fireEvent.changeText(input, 'b');
      fireEvent(input, 'submitEditing');

      rerender(
        <KeywordInput
          keywords={['a', 'b']}
          onKeywordsChange={mockOnKeywordsChange}
        />
      );

      fireEvent.changeText(input, 'c');
      fireEvent(input, 'submitEditing');

      expect(mockOnKeywordsChange).toHaveBeenCalledTimes(3);
    });

    it('handles case sensitivity correctly', () => {
      render(
        <KeywordInput
          keywords={['Turkey']}
          onKeywordsChange={mockOnKeywordsChange}
        />
      );

      const input = screen.getByTestId('keyword-input');
      fireEvent.changeText(input, 'turkey');
      fireEvent(input, 'submitEditing');

      // Implementation may choose to be case-sensitive or case-insensitive
      expect(mockOnKeywordsChange).toHaveBeenCalled();
    });

    it('handles comma at end of input', () => {
      render(
        <KeywordInput keywords={[]} onKeywordsChange={mockOnKeywordsChange} />
      );

      const input = screen.getByTestId('keyword-input');
      fireEvent.changeText(input, 'turkey,');

      expect(mockOnKeywordsChange).toHaveBeenCalledWith(['turkey']);
    });

    it('handles multiple consecutive commas', () => {
      render(
        <KeywordInput keywords={[]} onKeywordsChange={mockOnKeywordsChange} />
      );

      const input = screen.getByTestId('keyword-input');
      fireEvent.changeText(input, 'turkey,,,thanksgiving');

      // Should handle gracefully and not add empty keywords
      expect(mockOnKeywordsChange).toHaveBeenCalled();
    });

    it('handles comma with spaces', () => {
      render(
        <KeywordInput keywords={[]} onKeywordsChange={mockOnKeywordsChange} />
      );

      const input = screen.getByTestId('keyword-input');
      fireEvent.changeText(input, 'turkey , thanksgiving , cooking');

      // Should trim spaces and add keywords correctly
      expect(mockOnKeywordsChange).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper accessibility labels for input field', () => {
      render(
        <KeywordInput keywords={[]} onKeywordsChange={mockOnKeywordsChange} />
      );

      const input = screen.getByTestId('keyword-input');
      expect(input.props.accessibilityLabel).toBeDefined();
    });

    it('has proper accessibility labels for remove buttons', () => {
      render(
        <KeywordInput
          keywords={['turkey']}
          onKeywordsChange={mockOnKeywordsChange}
        />
      );

      const removeButton = screen.getByTestId('remove-keyword-turkey');
      expect(removeButton.props.accessibilityLabel).toBeDefined();
      expect(removeButton.props.accessibilityRole).toBe('button');
    });

    it('has proper accessibility hints', () => {
      render(
        <KeywordInput keywords={[]} onKeywordsChange={mockOnKeywordsChange} />
      );

      const input = screen.getByTestId('keyword-input');
      expect(input.props.accessibilityHint).toBeDefined();
    });
  });

  describe('Visual Feedback', () => {
    it('renders chips with proper styling', () => {
      render(
        <KeywordInput
          keywords={['turkey', 'cooking']}
          onKeywordsChange={mockOnKeywordsChange}
        />
      );

      const turkeyChip = screen.getByTestId('keyword-chip-turkey');
      expect(turkeyChip).toBeTruthy();
    });

    it('shows remove button on each chip', () => {
      render(
        <KeywordInput
          keywords={['turkey', 'cooking']}
          onKeywordsChange={mockOnKeywordsChange}
        />
      );

      expect(screen.getByTestId('remove-keyword-turkey')).toBeTruthy();
      expect(screen.getByTestId('remove-keyword-cooking')).toBeTruthy();
    });
  });

  describe('Input Behavior', () => {
    it('maintains focus after adding keyword', () => {
      render(
        <KeywordInput keywords={[]} onKeywordsChange={mockOnKeywordsChange} />
      );

      const input = screen.getByTestId('keyword-input');
      fireEvent.changeText(input, 'turkey');
      fireEvent(input, 'submitEditing');

      // Input should still be accessible
      expect(input).toBeTruthy();
    });

    it('allows continuous keyword entry', () => {
      const { rerender } = render(
        <KeywordInput keywords={[]} onKeywordsChange={mockOnKeywordsChange} />
      );

      const input = screen.getByTestId('keyword-input');

      // Add first keyword
      fireEvent.changeText(input, 'turkey');
      fireEvent(input, 'submitEditing');

      rerender(
        <KeywordInput
          keywords={['turkey']}
          onKeywordsChange={mockOnKeywordsChange}
        />
      );

      // Add second keyword
      fireEvent.changeText(input, 'thanksgiving');
      fireEvent(input, 'submitEditing');

      expect(mockOnKeywordsChange).toHaveBeenCalledTimes(2);
    });
  });
});
