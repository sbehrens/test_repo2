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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import KeywordInput from '@/components/KeywordInput';
import { useSpeechRecognition } from '@/lib/speech';
import { createNote } from '@/lib/database';

export default function CreateNoteScreen() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    isListening,
    transcript,
    error: speechError,
    startListening,
    stopListening,
    isAvailable,
  } = useSpeechRecognition();

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

    if (!trimmedContent) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await createNote({
        content: trimmedContent,
        keywords,
      });
      setIsLoading(false);
      router.back();
    } catch (err) {
      setError('Failed to create note');
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const isFormValid = content.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Create Note</Text>

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
          <View testID="error-message" style={styles.errorContainer}>
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
              (!isFormValid || isLoading) && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!isFormValid || isLoading}
            accessibilityLabel="Save note"
            accessibilityRole="button"
            accessibilityState={{ disabled: !isFormValid || isLoading }}
          >
            {isLoading ? (
              <ActivityIndicator testID="loading-indicator" color="#FFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
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
});
