import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Note } from '../types';

interface NoteCardProps {
  note: Note;
  onPress: (note: Note) => void;
  onDelete?: (note: Note) => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onPress, onDelete }) => {
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      const options: Intl.DateTimeFormatOptions = {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      };
      return date.toLocaleDateString('en-US', options);
    }
  };

  const handleDeletePress = () => {
    if (onDelete) {
      onDelete(note);
    }
  };

  return (
    <Pressable
      testID="note-card"
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={() => onPress(note)}
      accessibilityLabel={`Note: ${note.content}`}
      accessibilityRole="button"
      accessibilityHint="Double tap to view note details"
    >
      <View style={styles.cardContent}>
        <View style={styles.header}>
          <Text style={styles.content}>{note.content}</Text>
          {onDelete && (
            <TouchableOpacity
              testID="delete-button"
              onPress={handleDeletePress}
              style={styles.deleteButton}
              accessibilityLabel="Delete note"
              accessibilityRole="button"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            </TouchableOpacity>
          )}
        </View>

        {note.keywords.length > 0 && (
          <View style={styles.keywordsContainer}>
            {note.keywords.map((keyword, index) => (
              <View key={index} style={styles.keywordTag}>
                <Text style={styles.keywordText}>{keyword}</Text>
              </View>
            ))}
          </View>
        )}

        <Text testID="note-date" style={styles.date}>
          {formatDate(note.createdAt)}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardPressed: {
    opacity: 0.7,
    backgroundColor: '#F8F8F8',
  },
  cardContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  content: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
    marginRight: 8,
  },
  deleteButton: {
    padding: 4,
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 6,
  },
  keywordTag: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  keywordText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
});

export default NoteCard;
