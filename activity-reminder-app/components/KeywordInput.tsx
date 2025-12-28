import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface KeywordInputProps {
  keywords: string[];
  onKeywordsChange: (keywords: string[]) => void;
  placeholder?: string;
}

const KeywordInput: React.FC<KeywordInputProps> = ({
  keywords,
  onKeywordsChange,
  placeholder = 'Add keywords...',
}) => {
  const [inputValue, setInputValue] = useState('');

  const addKeywords = (text: string) => {
    // Split by comma and process each keyword
    const newKeywords = text
      .split(',')
      .map((keyword) => keyword.trim())
      .filter((keyword) => keyword.length > 0);

    if (newKeywords.length > 0) {
      // Filter out duplicates and empty strings
      const uniqueNewKeywords = newKeywords.filter(
        (keyword) => !keywords.includes(keyword)
      );

      if (uniqueNewKeywords.length > 0) {
        onKeywordsChange([...keywords, ...uniqueNewKeywords]);
      }
    }
  };

  const handleChangeText = (text: string) => {
    // Check if text contains a comma
    if (text.includes(',')) {
      // Extract keywords before the last comma
      const parts = text.split(',');
      const keywordsToAdd = parts.slice(0, -1).join(',');
      const remainingText = parts[parts.length - 1];

      if (keywordsToAdd) {
        addKeywords(keywordsToAdd);
      }

      setInputValue(remainingText);
    } else {
      setInputValue(text);
    }
  };

  const handleSubmitEditing = () => {
    const trimmedValue = inputValue.trim();

    if (trimmedValue.length === 0) {
      return;
    }

    // Check for duplicates
    if (keywords.includes(trimmedValue)) {
      setInputValue('');
      return;
    }

    onKeywordsChange([...keywords, trimmedValue]);
    setInputValue('');
  };

  const removeKeyword = (keywordToRemove: string) => {
    onKeywordsChange(keywords.filter((keyword) => keyword !== keywordToRemove));
  };

  return (
    <View style={styles.container}>
      {keywords.length > 0 && (
        <View style={styles.keywordsContainer}>
          {keywords.map((keyword, index) => (
            <View key={index} testID={`keyword-chip-${keyword}`} style={styles.chip}>
              <Text style={styles.chipText}>{keyword}</Text>
              <TouchableOpacity
                testID={`remove-keyword-${keyword}`}
                onPress={() => removeKeyword(keyword)}
                style={styles.removeButton}
                accessibilityLabel={`Remove keyword ${keyword}`}
                accessibilityRole="button"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={18} color="#666" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <TextInput
        testID="keyword-input"
        style={styles.input}
        value={inputValue}
        onChangeText={handleChangeText}
        onSubmitEditing={handleSubmitEditing}
        placeholder={placeholder}
        accessibilityLabel="Keyword input"
        accessibilityHint="Type keywords and press enter or comma to add"
        returnKeyType="done"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  chipText: {
    fontSize: 14,
    color: '#1976D2',
    marginRight: 4,
    fontWeight: '500',
  },
  removeButton: {
    padding: 2,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
});

export default KeywordInput;
