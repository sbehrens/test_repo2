import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import KeywordInput from '@/components/KeywordInput';
import { useSpeechRecognition } from '@/lib/speech';
import { getNoteById, updateNote, deleteNote } from '@/lib/database';
import { Note } from '@/types';

export default function EditNoteScreen() {
  const router = useRouter();
  const { noteId } = useLocalSearchParams<{ noteId: string }>();

  const [note, setNote] = useState<Note | null>(null);
  const [content, setContent] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    isListening,
    transcript,
    error: speechError,
    startListening,
    stopListening,
    isAvailable,
  } = useSpeechRecognition();

  // Load note on mount
  useEffect(() => {
    const loadNote = async () => {
      if (!noteId) {
        setError('Note not found');
        setIsLoading(false);
        return;
      }

      try {
        const loadedNote = await getNoteById(noteId);

        if (!loadedNote) {
          setError('Note not found');
          setIsLoading(false);
          return;
        }

        setNote(loadedNote);
        setContent(loadedNote.content);
        setKeywords(loadedNote.keywords);
        setIsLoading(false);
      } catch (err) {
        setError('Failed to load note');
        setIsLoading(false);
      }
    };

    loadNote();
  }, [noteId]);

  // Update content with voice transcript
  useEffect(() => {
    if (transcript) {
      setContent((prev) => prev + transcript);
    }
  }, [transcript]);

  const handleMicPress = async () => {
    if (isListening) {
      await stopListening();
    } else {
      await startListening();
    }
  };

  const handleContentChange = (text: string) => {
    setContent(text);
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const handleSave = async () => {
    const trimmedContent = content.trim();

    if (!trimmedContent || !noteId) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await updateNote(noteId, {
        content: trimmedContent,
        keywords,
      });
      setIsSaving(false);
      router.back();
    } catch (err) {
      setError('Failed to update note');
      setIsSaving(false);
    }
  };

  const handleDeletePress = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!noteId) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await deleteNote(noteId);
      setShowDeleteDialog(false);
      router.back();
    } catch (err) {
      setError('Failed to delete note');
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
  };

  const handleCancel = () => {
    router.back();
  };

  const handleGoBack = () => {
    router.back();
  };

  const isFormValid = content.trim().length > 0;

  // Show loading while fetching note
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator testID="loading-indicator" size="large" color="#2196F3" />
      </View>
    );
  }

  // Show error if note not found
  if (!note) {
    return (
      <View style={styles.centerContainer}>
        <View testID="error-message" style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#F44336" />
          <Text style={styles.errorTitle}>Note not found</Text>
          <Text style={styles.errorDescription}>
            The note you're looking for doesn't exist or has been deleted.
          </Text>
          <TouchableOpacity
            testID="go-back-button"
            style={[styles.button, styles.saveButton]}
            onPress={handleGoBack}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Text style={styles.saveButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Edit Note</Text>

        {/* Content Input */}
        <View style={styles.inputContainer}>
          <View style={styles.contentInputWrapper}>
            <TextInput
              testID="content-input"
              style={styles.contentInput}
              value={content}
              onChangeText={handleContentChange}
              placeholder="Note content..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              accessibilityLabel="Note content input"
            />
            {isAvailable && (
              <TouchableOpacity
                testID="mic-button"
                style={[styles.micButton, isListening && styles.micButtonActive]}
                onPress={handleMicPress}
                accessibilityLabel="Voice input"
                accessibilityRole="button"
              >
                <Ionicons
                  name={isListening ? 'mic' : 'mic-outline'}
                  size={24}
                  color={isListening ? '#F44336' : '#666'}
                />
              </TouchableOpacity>
            )}
          </View>

          {isListening && (
            <View testID="listening-indicator" style={styles.listeningIndicator}>
              <View style={styles.listeningDot} />
              <Text style={styles.listeningText}>Listening...</Text>
            </View>
          )}

          {speechError && (
            <Text style={styles.errorText}>{speechError}</Text>
          )}
        </View>

        {/* Keywords */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Keywords (optional)</Text>
          <KeywordInput keywords={keywords} onKeywordsChange={setKeywords} />
        </View>

        {/* Error Message */}
        {error && (
          <View testID="error-message" style={styles.errorMessageContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            testID="cancel-button"
            style={[styles.button, styles.cancelButton]}
            onPress={handleCancel}
            accessibilityLabel="Cancel"
            accessibilityRole="button"
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="save-button"
            style={[
              styles.button,
              styles.saveButton,
              (!isFormValid || isSaving) && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!isFormValid || isSaving}
            accessibilityLabel="Save note"
            accessibilityRole="button"
            accessibilityState={{ disabled: !isFormValid || isSaving }}
          >
            {isSaving ? (
              <ActivityIndicator testID="loading-indicator" color="#FFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Delete Button */}
        <TouchableOpacity
          testID="delete-button"
          style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
          onPress={handleDeletePress}
          disabled={isDeleting}
          accessibilityLabel="Delete note"
          accessibilityRole="button"
          accessibilityState={{ disabled: isDeleting }}
        >
          <Ionicons name="trash-outline" size={20} color="#F44336" />
          <Text style={styles.deleteButtonText}>Delete Note</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Delete Confirmation Dialog */}
      <Modal
        visible={showDeleteDialog}
        transparent
        animationType="fade"
        onRequestClose={handleCancelDelete}
      >
        <View style={styles.modalOverlay}>
          <View testID="delete-confirmation-dialog" style={styles.dialogContainer}>
            <Text style={styles.dialogTitle}>Delete Note?</Text>
            <Text style={styles.dialogMessage}>
              Are you sure you want to delete this note? This action cannot be undone.
            </Text>

            <View style={styles.dialogButtonContainer}>
              <TouchableOpacity
                testID="cancel-delete-button"
                style={[styles.dialogButton, styles.dialogCancelButton]}
                onPress={handleCancelDelete}
                accessibilityLabel="Cancel delete"
                accessibilityRole="button"
              >
                <Text style={styles.dialogCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                testID="confirm-delete-button"
                style={[styles.dialogButton, styles.dialogDeleteButton]}
                onPress={handleConfirmDelete}
                accessibilityLabel="Confirm delete"
                accessibilityRole="button"
              >
                <Text style={styles.dialogDeleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#333',
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  contentInputWrapper: {
    position: 'relative',
  },
  contentInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 120,
    paddingRight: 50,
  },
  micButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  micButtonActive: {
    backgroundColor: '#FFEBEE',
  },
  listeningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  listeningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F44336',
    marginRight: 8,
  },
  listeningText: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: '500',
  },
  errorContainer: {
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorMessageContainer: {
    marginBottom: 16,
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#2196F3',
    marginLeft: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F44336',
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F44336',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  dialogMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    lineHeight: 22,
  },
  dialogButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dialogButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogCancelButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    marginRight: 8,
  },
  dialogCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  dialogDeleteButton: {
    backgroundColor: '#F44336',
    marginLeft: 8,
  },
  dialogDeleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
