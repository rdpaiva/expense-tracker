'use client';

import { useState, useRef } from 'react';
import { Mic, Send, Loader2, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ExpenseInputProps {
  onSubmit: (input: string) => void;
  onImageSubmit: (imageFile: File) => void;
  isProcessing: boolean;
}

export default function ExpenseInput({ onSubmit, onImageSubmit, isProcessing }: ExpenseInputProps) {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isRestartingRef = useRef(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      onSubmit(input.trim());
      setInput('');
    }
  };

  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    // Don't start if already recording or restarting
    if (isRecording || isRestartingRef.current) {
      return;
    }

    // Clear input when starting new recording
    setInput('');
    isRestartingRef.current = false;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsRecording(true);
      setIsListening(true);
      isRestartingRef.current = false;
    };

    recognition.onresult = (event) => {
      let transcript = '';
      
      // Get the most recent result
      if (event.results.length > 0) {
        const lastResult = event.results[event.results.length - 1];
        transcript = lastResult[0].transcript;
      }
      
      setInput(transcript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      // Only stop on serious errors
      if (event.error === 'network' || event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setIsRecording(false);
        setIsListening(false);
        isRestartingRef.current = false;
      }
    };

    recognition.onend = () => {
      // Only restart if we're still supposed to be recording and not already restarting
      if (isRecording && !isRestartingRef.current) {
        isRestartingRef.current = true;
        setTimeout(() => {
          if (isRecording && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (error) {
              console.error('Failed to restart recognition:', error);
              setIsRecording(false);
              setIsListening(false);
              isRestartingRef.current = false;
            }
          }
        }, 100);
      } else if (!isRecording) {
        setIsListening(false);
        isRestartingRef.current = false;
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (error) {
      console.error('Failed to start recognition:', error);
      setIsRecording(false);
      setIsListening(false);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    isRestartingRef.current = false;
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
    
    // Clean up text and stop listening state
    setInput(prev => prev.trim());
    setTimeout(() => {
      setIsListening(false);
    }, 200);
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onImageSubmit(file);
    }
    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <Textarea
            placeholder="e.g., Spent $5.25 at Starbucks for coffee this morning"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isProcessing || isRecording}
            className="min-h-[100px] resize-none"
            rows={3}
          />
        </div>
        <div className="flex gap-2 justify-center">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleCameraClick}
            disabled={isProcessing}
            title="Take photo of receipt"
          >
            <Camera className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            disabled={isProcessing}
            className={`${isListening ? 'bg-red-100 border-red-300' : ''} select-none`}
            title="Hold to record voice"
          >
            <Mic className={`h-4 w-4 ${isListening ? 'text-red-600' : ''}`} />
          </Button>
          <Button
            type="submit"
            disabled={!input.trim() || isProcessing || isRecording}
            size="icon"
            title="Submit expense"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageUpload}
          className="hidden"
        />
      </form>
      {isListening && (
        <p className="text-sm text-muted-foreground mt-2 text-center">
          🎤 Recording... Release button when done
        </p>
      )}
    </div>
  );
}