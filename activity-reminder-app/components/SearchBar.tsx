import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onMicPress: () => void;
  isListening?: boolean;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onMicPress,
  isListening = false,
  placeholder = 'Search...',
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          testID="search-bar"
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          accessibilityLabel="Search input"
          accessibilityHint="Type to search notes"
        />
        <TouchableOpacity
          testID="mic-button"
          onPress={onMicPress}
          style={[styles.micButton, isListening && styles.micButtonActive]}
          accessibilityLabel="Voice search"
          accessibilityRole="button"
          accessibilityState={{ selected: isListening }}
        >
          <Ionicons
            name={isListening ? 'mic' : 'mic-outline'}
            size={24}
            color={isListening ? '#007AFF' : '#666'}
          />
        </TouchableOpacity>
      </View>
      {isListening && (
        <View testID="listening-indicator" style={styles.listeningIndicator}>
          <View style={styles.listeningDot} />
          <Text style={styles.listeningText}>Listening...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 6,
  },
  micButton: {
    padding: 4,
    marginLeft: 8,
  },
  micButtonActive: {
    backgroundColor: '#E3F2FD',
    borderRadius: 20,
  },
  listeningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
  },
  listeningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF0000',
    marginRight: 8,
  },
  listeningText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default SearchBar;
