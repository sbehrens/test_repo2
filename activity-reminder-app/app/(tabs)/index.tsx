import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import SearchBar from '@/components/SearchBar';
import NoteCard from '@/components/NoteCard';
import { useSpeechRecognition } from '@/lib/speech';
import { searchNotes } from '@/lib/search';
import { getAllNotes, initDatabase } from '@/lib/database';
import { Note } from '@/types';

export default function HomeScreen() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Voice search integration
  const {
    isListening,
    transcript,
    startListening,
  } = useSpeechRecognition();

  // Load notes on mount
  useEffect(() => {
    const loadNotes = async () => {
      try {
        setIsLoading(true);
        await initDatabase();
        const allNotes = await getAllNotes();
        setNotes(allNotes);
        setFilteredNotes(allNotes);
      } catch (error) {
        console.error('Error loading notes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotes();
  }, []);

  // Update search query when voice transcript changes
  useEffect(() => {
    if (transcript) {
      setSearchQuery(transcript);
    }
  }, [transcript]);

  // Filter notes based on search query (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!searchQuery.trim()) {
        setFilteredNotes(notes);
      } else {
        const searchResults = searchNotes(notes, searchQuery);
        const mapped = searchResults.map(result => result.note);
        setFilteredNotes(mapped);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [searchQuery, notes]);

  // Handle mic button press
  const handleMicPress = () => {
    startListening();
  };

  // Handle FAB press
  const handleCreateNote = () => {
    router.push('/create-note');
  };

  // Handle note card press
  const handleNotePress = (note: Note) => {
    router.push({
      pathname: '/edit-note',
      params: { noteId: note.id },
    });
  };

  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator testID="loading-indicator" size="large" color="#007AFF" />
      </View>
    );
  }

  // Render empty state
  if (notes.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            onMicPress={handleMicPress}
            isListening={isListening}
            placeholder="Search notes..."
          />
        </View>
        <View style={styles.centerContainer}>
          <View testID="empty-state" style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#CCC" />
            <Text style={styles.emptyStateText}>No notes yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Tap the + button to create your first note
            </Text>
          </View>
        </View>
        <TouchableOpacity
          testID="fab-create-note"
          style={styles.fab}
          onPress={handleCreateNote}
          accessibilityLabel="Create new note"
          accessibilityRole="button"
        >
          <Ionicons name="add" size={28} color="#FFF" />
        </TouchableOpacity>
      </View>
    );
  }

  // Render no results state
  if (searchQuery.trim() && filteredNotes.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            onMicPress={handleMicPress}
            isListening={isListening}
            placeholder="Search notes..."
          />
        </View>
        <View style={styles.centerContainer}>
          <View testID="no-results-message" style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color="#CCC" />
            <Text style={styles.emptyStateText}>No notes found</Text>
            <Text style={styles.emptyStateSubtext}>
              Try a different search term
            </Text>
          </View>
        </View>
        <TouchableOpacity
          testID="fab-create-note"
          style={styles.fab}
          onPress={handleCreateNote}
          accessibilityLabel="Create new note"
          accessibilityRole="button"
        >
          <Ionicons name="add" size={28} color="#FFF" />
        </TouchableOpacity>
      </View>
    );
  }

  // Render notes list
  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onMicPress={handleMicPress}
          isListening={isListening}
          placeholder="Search notes..."
        />
      </View>
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredNotes.map((note) => (
          <NoteCard key={note.id} note={note} onPress={handleNotePress} />
        ))}
      </ScrollView>
      <TouchableOpacity
        testID="fab-create-note"
        style={styles.fab}
        onPress={handleCreateNote}
        accessibilityLabel="Create new note"
        accessibilityRole="button"
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#F8F8F8',
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 80,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
});
