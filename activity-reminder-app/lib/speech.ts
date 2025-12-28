import { useState, useEffect } from 'react';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
  ExpoSpeechRecognitionResult,
  ExpoSpeechRecognitionErrorEvent
} from 'expo-speech-recognition';

export interface UseSpeechRecognitionResult {
  isListening: boolean;
  transcript: string;
  error: string | null;
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  resetTranscript: () => void;
  isAvailable: boolean;
}

export function useSpeechRecognition(): UseSpeechRecognitionResult {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);

  // Check availability on mount
  useEffect(() => {
    const checkAvailability = async () => {
      try {
        const available = await ExpoSpeechRecognitionModule.isRecognitionAvailable();
        setIsAvailable(available);
      } catch (err) {
        setIsAvailable(false);
      }
    };

    checkAvailability();
  }, []);

  // Handle result events
  useSpeechRecognitionEvent('result', (event: ExpoSpeechRecognitionResult) => {
    if (event.results && event.results.length > 0) {
      const newTranscript = event.results[0].transcript;
      setTranscript((prev) => prev + newTranscript);
    }
  });

  // Handle error events
  useSpeechRecognitionEvent('error', (event: ExpoSpeechRecognitionErrorEvent) => {
    setError(event.message || 'An error occurred');
  });

  // Handle end events
  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
  });

  const startListening = async () => {
    try {
      // Don't start if already listening
      if (isListening) {
        return;
      }

      // Clear previous error
      setError(null);

      // Request permissions first
      const permissionResult = await ExpoSpeechRecognitionModule.requestPermissionsAsync();

      // Check if permission was granted
      if (permissionResult.status !== 'granted') {
        setError('Speech recognition permission denied');
        return;
      }

      // Start speech recognition
      await ExpoSpeechRecognitionModule.start();
      setIsListening(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Speech recognition failed';
      setError(errorMessage);
    }
  };

  const stopListening = async () => {
    try {
      await ExpoSpeechRecognitionModule.stop();
      setIsListening(false);
    } catch (err) {
      // Silently handle stop errors
    }
  };

  const resetTranscript = () => {
    setTranscript('');
  };

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript,
    isAvailable,
  };
}
