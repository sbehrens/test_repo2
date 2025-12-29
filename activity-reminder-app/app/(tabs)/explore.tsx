import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import NoteCard from '@/components/NoteCard';
import { getAllNotes, deleteNote } from '@/lib/database';
import { Note } from '@/types';

export default function AllNotesScreen() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);

  const fetchNotes = useCallback((isRefreshing = false) => {
    return getAllNotes()
      .then((fetchedNotes) => {
        setNotes(fetchedNotes);
        setError(null);
        setLoading(false);
        if (isRefreshing) {
          setRefreshing(false);
        }
      })
      .catch(() => {
        setError('Failed to load notes');
        setLoading(false);
        if (isRefreshing) {
          setRefreshing(false);
        }
      });
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotes(true);
  }, [fetchNotes]);

  const handleNotePress = useCallback((note: Note) => {
    router.push({
      pathname: '/edit-note',
      params: { noteId: note.id },
    });
  }, [router]);

  const handleDeletePress = useCallback((note: Note) => {
    setNoteToDelete(note);
    setShowDeleteDialog(true);
    setDeleteError(null);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!noteToDelete) return;

    setDeleteError(null);
    deleteNote(noteToDelete.id)
      .then((success) => {
        if (success) {
          setShowDeleteDialog(false);
          setNoteToDelete(null);
          return fetchNotes();
        }
      })
      .catch(() => {
        setDeleteError('Failed to delete note');
      });
  }, [noteToDelete, fetchNotes]);

  const handleCancelDelete = useCallback(() => {
    setShowDeleteDialog(false);
    setNoteToDelete(null);
    setDeleteError(null);
  }, []);

  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchNotes();
  }, [fetchNotes]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator testID="loading-indicator" size="large" color="#007AFF" />
      </View>
    );
  }

  if (error && !notes.length) {
    return (
      <View style={styles.centered}>
        <Text testID="error-message" style={styles.errorText}>
          {error}
        </Text>
        <TouchableOpacity
          testID="retry-button"
          style={styles.retryButton}
          onPress={handleRetry}
          accessibilityLabel="Retry loading notes"
          accessibilityRole="button"
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (notes.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>All Notes</Text>
        <View
          testID="empty-state"
          style={styles.centered}
          accessibilityLabel="No notes available"
        >
          <Text style={styles.emptyText}>No notes yet</Text>
          <Text style={styles.emptySubtext}>
            Start adding notes to see them here
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>All Notes</Text>
      <FlatList
        testID="notes-list"
        data={notes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NoteCard
            note={item}
            onPress={handleNotePress}
            onDelete={handleDeletePress}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
        contentContainerStyle={styles.listContent}
      />

      <Modal
        visible={showDeleteDialog}
        transparent
        animationType="fade"
        onRequestClose={handleCancelDelete}
      >
        <View style={styles.modalOverlay}>
          <View
            testID="delete-confirmation-dialog"
            style={styles.modalContent}
          >
            <Text style={styles.modalTitle}>Delete Note</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete this note?
            </Text>

            {deleteError && (
              <Text testID="error-message" style={styles.errorText}>
                {deleteError}
              </Text>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                testID="cancel-delete-button"
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancelDelete}
                accessibilityLabel="Cancel deletion"
                accessibilityRole="button"
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                testID="confirm-delete-button"
                style={[styles.modalButton, styles.deleteButton]}
                onPress={handleConfirmDelete}
                accessibilityLabel="Confirm deletion"
                accessibilityRole="button"
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#BBB',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#E5E5E5',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
