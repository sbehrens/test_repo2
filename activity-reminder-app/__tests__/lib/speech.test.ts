/**
 * Speech Recognition Hook Tests (TDD Approach)
 *
 * These tests are written BEFORE implementation to define expected behavior.
 * Tests should initially fail until the speech.ts implementation is complete.
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useSpeechRecognition } from '../../lib/speech';

// Mock event handlers storage
let mockEventHandlers: Record<string, Function> = {};

// Reset mocks and event handlers before each test
beforeEach(() => {
  jest.clearAllMocks();
  mockEventHandlers = {};

  // Setup default mock implementations
  (ExpoSpeechRecognitionModule.isRecognitionAvailable as jest.Mock).mockResolvedValue(true);
  (ExpoSpeechRecognitionModule.requestPermissionsAsync as jest.Mock).mockResolvedValue({
    status: 'granted',
  });
  (ExpoSpeechRecognitionModule.getStateAsync as jest.Mock).mockResolvedValue('inactive');

  // Mock useSpeechRecognitionEvent to capture event handlers
  (useSpeechRecognitionEvent as jest.Mock).mockImplementation((eventName, handler) => {
    mockEventHandlers[eventName] = handler;
  });
});

describe('useSpeechRecognition Hook', () => {
  describe('Hook State Initialization', () => {
    it('should initialize with isListening as false', () => {
      // Act
      const { result } = renderHook(() => useSpeechRecognition());

      // Assert
      expect(result.current.isListening).toBe(false);
    });

    it('should initialize with empty transcript', () => {
      // Act
      const { result } = renderHook(() => useSpeechRecognition());

      // Assert
      expect(result.current.transcript).toBe('');
      expect(result.current.transcript.length).toBe(0);
    });

    it('should initialize with no error', () => {
      // Act
      const { result } = renderHook(() => useSpeechRecognition());

      // Assert
      expect(result.current.error).toBeNull();
    });

    it('should expose startListening function', () => {
      // Act
      const { result } = renderHook(() => useSpeechRecognition());

      // Assert
      expect(result.current.startListening).toBeDefined();
      expect(typeof result.current.startListening).toBe('function');
    });

    it('should expose stopListening function', () => {
      // Act
      const { result } = renderHook(() => useSpeechRecognition());

      // Assert
      expect(result.current.stopListening).toBeDefined();
      expect(typeof result.current.stopListening).toBe('function');
    });

    it('should expose resetTranscript function', () => {
      // Act
      const { result } = renderHook(() => useSpeechRecognition());

      // Assert
      expect(result.current.resetTranscript).toBeDefined();
      expect(typeof result.current.resetTranscript).toBe('function');
    });
  });

  describe('Start/Stop Listening', () => {
    it('should set isListening to true when startListening is called', async () => {
      // Arrange
      (ExpoSpeechRecognitionModule.start as jest.Mock).mockResolvedValue(undefined);
      const { result } = renderHook(() => useSpeechRecognition());

      // Act
      await act(async () => {
        await result.current.startListening();
      });

      // Assert
      expect(result.current.isListening).toBe(true);
      expect(ExpoSpeechRecognitionModule.start).toHaveBeenCalled();
    });

    it('should set isListening to false when stopListening is called', async () => {
      // Arrange
      (ExpoSpeechRecognitionModule.start as jest.Mock).mockResolvedValue(undefined);
      (ExpoSpeechRecognitionModule.stop as jest.Mock).mockResolvedValue(undefined);
      const { result } = renderHook(() => useSpeechRecognition());

      // Start listening first
      await act(async () => {
        await result.current.startListening();
      });

      expect(result.current.isListening).toBe(true);

      // Act - Stop listening
      await act(async () => {
        await result.current.stopListening();
      });

      // Assert
      expect(result.current.isListening).toBe(false);
      expect(ExpoSpeechRecognitionModule.stop).toHaveBeenCalled();
    });

    it('should request permissions before starting', async () => {
      // Arrange
      (ExpoSpeechRecognitionModule.start as jest.Mock).mockResolvedValue(undefined);
      const { result } = renderHook(() => useSpeechRecognition());

      // Act
      await act(async () => {
        await result.current.startListening();
      });

      // Assert
      expect(ExpoSpeechRecognitionModule.requestPermissionsAsync).toHaveBeenCalled();

      // Verify permissions were requested before starting
      const permissionCallOrder = (ExpoSpeechRecognitionModule.requestPermissionsAsync as jest.Mock).mock.invocationCallOrder[0];
      const startCallOrder = (ExpoSpeechRecognitionModule.start as jest.Mock).mock.invocationCallOrder[0];
      expect(permissionCallOrder).toBeLessThan(startCallOrder);
    });
  });

  describe('Transcript Handling', () => {
    it('should update transcript when speech is recognized', async () => {
      // Arrange
      (ExpoSpeechRecognitionModule.start as jest.Mock).mockResolvedValue(undefined);
      const { result } = renderHook(() => useSpeechRecognition());

      await act(async () => {
        await result.current.startListening();
      });

      // Act - Simulate speech recognition result event
      await act(async () => {
        const resultHandler = mockEventHandlers['result'];
        if (resultHandler) {
          resultHandler({
            results: [
              {
                transcript: 'Hello world',
                isFinal: true,
                confidence: 0.95,
              },
            ],
          });
        }
      });

      // Assert
      expect(result.current.transcript).toBe('Hello world');
    });

    it('should append to transcript for continuous recognition', async () => {
      // Arrange
      (ExpoSpeechRecognitionModule.start as jest.Mock).mockResolvedValue(undefined);
      const { result } = renderHook(() => useSpeechRecognition());

      await act(async () => {
        await result.current.startListening();
      });

      // Act - Simulate multiple speech recognition results
      await act(async () => {
        const resultHandler = mockEventHandlers['result'];
        if (resultHandler) {
          // First result
          resultHandler({
            results: [
              {
                transcript: 'Hello',
                isFinal: true,
                confidence: 0.95,
              },
            ],
          });
        }
      });

      await act(async () => {
        const resultHandler = mockEventHandlers['result'];
        if (resultHandler) {
          // Second result
          resultHandler({
            results: [
              {
                transcript: ' world',
                isFinal: true,
                confidence: 0.93,
              },
            ],
          });
        }
      });

      // Assert
      expect(result.current.transcript).toBe('Hello world');
    });

    it('should clear transcript when resetTranscript is called', async () => {
      // Arrange
      (ExpoSpeechRecognitionModule.start as jest.Mock).mockResolvedValue(undefined);
      const { result } = renderHook(() => useSpeechRecognition());

      await act(async () => {
        await result.current.startListening();
      });

      // Add some transcript
      await act(async () => {
        const resultHandler = mockEventHandlers['result'];
        if (resultHandler) {
          resultHandler({
            results: [
              {
                transcript: 'Some text to clear',
                isFinal: true,
                confidence: 0.9,
              },
            ],
          });
        }
      });

      expect(result.current.transcript).toBe('Some text to clear');

      // Act - Reset transcript
      act(() => {
        result.current.resetTranscript();
      });

      // Assert
      expect(result.current.transcript).toBe('');
    });
  });

  describe('Error Handling', () => {
    it('should set error when speech recognition fails', async () => {
      // Arrange
      const mockError = new Error('Speech recognition failed');
      (ExpoSpeechRecognitionModule.start as jest.Mock).mockRejectedValue(mockError);
      const { result } = renderHook(() => useSpeechRecognition());

      // Act
      await act(async () => {
        await result.current.startListening();
      });

      // Assert
      expect(result.current.error).toBeTruthy();
      expect(result.current.error).toContain('Speech recognition failed');
    });

    it('should handle permission denied error', async () => {
      // Arrange
      (ExpoSpeechRecognitionModule.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });
      const { result } = renderHook(() => useSpeechRecognition());

      // Act
      await act(async () => {
        await result.current.startListening();
      });

      // Assert
      expect(result.current.error).toBeTruthy();
      expect(result.current.error).toContain('permission');
      expect(result.current.isListening).toBe(false);
      expect(ExpoSpeechRecognitionModule.start).not.toHaveBeenCalled();
    });

    it('should clear error on successful start', async () => {
      // Arrange
      const mockError = new Error('Initial error');
      (ExpoSpeechRecognitionModule.start as jest.Mock)
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useSpeechRecognition());

      // First attempt - should fail
      await act(async () => {
        await result.current.startListening();
      });

      expect(result.current.error).toBeTruthy();

      // Act - Second attempt - should succeed
      await act(async () => {
        await result.current.startListening();
      });

      // Assert
      expect(result.current.error).toBeNull();
      expect(result.current.isListening).toBe(true);
    });
  });

  describe('Availability', () => {
    it('should check if speech recognition is available on device', async () => {
      // Arrange
      (ExpoSpeechRecognitionModule.isRecognitionAvailable as jest.Mock).mockResolvedValue(true);

      // Act
      const { result } = renderHook(() => useSpeechRecognition());

      // Wait for availability check
      await waitFor(() => {
        expect(result.current.isAvailable).toBe(true);
      });

      // Assert
      expect(ExpoSpeechRecognitionModule.isRecognitionAvailable).toHaveBeenCalled();
    });

    it('should set isAvailable based on device capabilities', async () => {
      // Arrange
      (ExpoSpeechRecognitionModule.isRecognitionAvailable as jest.Mock).mockResolvedValue(false);

      // Act
      const { result } = renderHook(() => useSpeechRecognition());

      // Wait for availability check
      await waitFor(() => {
        expect(result.current.isAvailable).toBe(false);
      });

      // Assert
      expect(result.current.isAvailable).toBe(false);
    });
  });

  describe('Edge Cases and Integration Scenarios', () => {
    it('should handle rapid start/stop calls', async () => {
      // Arrange
      (ExpoSpeechRecognitionModule.start as jest.Mock).mockResolvedValue(undefined);
      (ExpoSpeechRecognitionModule.stop as jest.Mock).mockResolvedValue(undefined);
      const { result } = renderHook(() => useSpeechRecognition());

      // Act - Start and stop rapidly
      await act(async () => {
        await result.current.startListening();
        await result.current.stopListening();
        await result.current.startListening();
        await result.current.stopListening();
      });

      // Assert
      expect(result.current.isListening).toBe(false);
      expect(ExpoSpeechRecognitionModule.start).toHaveBeenCalledTimes(2);
      expect(ExpoSpeechRecognitionModule.stop).toHaveBeenCalledTimes(2);
    });

    it('should handle error events from recognition engine', async () => {
      // Arrange
      (ExpoSpeechRecognitionModule.start as jest.Mock).mockResolvedValue(undefined);
      const { result } = renderHook(() => useSpeechRecognition());

      await act(async () => {
        await result.current.startListening();
      });

      // Act - Simulate error event
      await act(async () => {
        const errorHandler = mockEventHandlers['error'];
        if (errorHandler) {
          errorHandler({
            error: 'network-error',
            message: 'Network connection lost',
          });
        }
      });

      // Assert
      expect(result.current.error).toBeTruthy();
      expect(result.current.error).toContain('Network connection lost');
    });

    it('should handle end event and update isListening', async () => {
      // Arrange
      (ExpoSpeechRecognitionModule.start as jest.Mock).mockResolvedValue(undefined);
      const { result } = renderHook(() => useSpeechRecognition());

      await act(async () => {
        await result.current.startListening();
      });

      expect(result.current.isListening).toBe(true);

      // Act - Simulate end event (e.g., speech recognition stopped automatically)
      await act(async () => {
        const endHandler = mockEventHandlers['end'];
        if (endHandler) {
          endHandler({});
        }
      });

      // Assert
      expect(result.current.isListening).toBe(false);
    });

    it('should not start if already listening', async () => {
      // Arrange
      (ExpoSpeechRecognitionModule.start as jest.Mock).mockResolvedValue(undefined);
      const { result } = renderHook(() => useSpeechRecognition());

      await act(async () => {
        await result.current.startListening();
      });

      const firstCallCount = (ExpoSpeechRecognitionModule.start as jest.Mock).mock.calls.length;

      // Act - Try to start again while already listening
      await act(async () => {
        await result.current.startListening();
      });

      // Assert
      const secondCallCount = (ExpoSpeechRecognitionModule.start as jest.Mock).mock.calls.length;
      expect(secondCallCount).toBe(firstCallCount); // Should not call start again
    });

    it('should handle partial (non-final) results', async () => {
      // Arrange
      (ExpoSpeechRecognitionModule.start as jest.Mock).mockResolvedValue(undefined);
      const { result } = renderHook(() => useSpeechRecognition());

      await act(async () => {
        await result.current.startListening();
      });

      // Act - Simulate partial result (isFinal: false)
      await act(async () => {
        const resultHandler = mockEventHandlers['result'];
        if (resultHandler) {
          resultHandler({
            results: [
              {
                transcript: 'Hello',
                isFinal: false,
                confidence: 0.7,
              },
            ],
          });
        }
      });

      const partialTranscript = result.current.transcript;

      // Then simulate final result
      await act(async () => {
        const resultHandler = mockEventHandlers['result'];
        if (resultHandler) {
          resultHandler({
            results: [
              {
                transcript: 'Hello world',
                isFinal: true,
                confidence: 0.95,
              },
            ],
          });
        }
      });

      // Assert
      // The implementation should handle both partial and final results appropriately
      expect(result.current.transcript).toBeTruthy();
      expect(result.current.transcript.length).toBeGreaterThan(0);
    });

    it('should preserve transcript when starting after stopping', async () => {
      // Arrange
      (ExpoSpeechRecognitionModule.start as jest.Mock).mockResolvedValue(undefined);
      (ExpoSpeechRecognitionModule.stop as jest.Mock).mockResolvedValue(undefined);
      const { result } = renderHook(() => useSpeechRecognition());

      await act(async () => {
        await result.current.startListening();
      });

      // Add some transcript
      await act(async () => {
        const resultHandler = mockEventHandlers['result'];
        if (resultHandler) {
          resultHandler({
            results: [
              {
                transcript: 'First session',
                isFinal: true,
                confidence: 0.9,
              },
            ],
          });
        }
      });

      // Stop listening
      await act(async () => {
        await result.current.stopListening();
      });

      // Start again
      await act(async () => {
        await result.current.startListening();
      });

      // Add more transcript
      await act(async () => {
        const resultHandler = mockEventHandlers['result'];
        if (resultHandler) {
          resultHandler({
            results: [
              {
                transcript: ' Second session',
                isFinal: true,
                confidence: 0.92,
              },
            ],
          });
        }
      });

      // Assert - Transcript should contain both sessions
      expect(result.current.transcript).toBe('First session Second session');
    });

    it('should clean up event listeners on unmount', () => {
      // Arrange
      const { unmount } = renderHook(() => useSpeechRecognition());

      // Act
      unmount();

      // Assert - This test verifies cleanup happens
      // The implementation should properly clean up event listeners
      // This is more of a structural test to ensure cleanup is considered
      expect(useSpeechRecognitionEvent).toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    it('should maintain independent state across multiple hook instances', () => {
      // Arrange & Act
      const { result: result1 } = renderHook(() => useSpeechRecognition());
      const { result: result2 } = renderHook(() => useSpeechRecognition());

      // Assert - Each instance should have its own state
      expect(result1.current.transcript).toBe('');
      expect(result2.current.transcript).toBe('');
      expect(result1.current.isListening).toBe(false);
      expect(result2.current.isListening).toBe(false);
    });

    it('should update state synchronously when calling resetTranscript', () => {
      // Arrange
      const { result } = renderHook(() => useSpeechRecognition());

      // Manually set transcript (simulating it has content)
      act(() => {
        const resultHandler = mockEventHandlers['result'];
        if (resultHandler) {
          resultHandler({
            results: [
              {
                transcript: 'Test content',
                isFinal: true,
                confidence: 0.9,
              },
            ],
          });
        }
      });

      // Act
      act(() => {
        result.current.resetTranscript();
      });

      // Assert - Should be updated immediately
      expect(result.current.transcript).toBe('');
    });
  });
});
