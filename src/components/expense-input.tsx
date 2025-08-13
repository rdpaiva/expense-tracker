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
  const accumulatedTextRef = useRef<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Clear accumulated text when starting new recording
    accumulatedTextRef.current = '';
    setInput('');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true; // Keep recording until stopped
    recognition.interimResults = true; // Show interim results
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsRecording(true);
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      // Process all results from the beginning
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      // Accumulate final transcripts and show with current interim
      if (finalTranscript.trim()) {
        accumulatedTextRef.current = finalTranscript.trim();
      }

      // Display accumulated final text + current interim text
      const displayText = accumulatedTextRef.current + 
        (accumulatedTextRef.current && interimTranscript ? ' ' : '') + 
        interimTranscript;
      
      setInput(displayText);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      // Don't clear text on errors - keep what we have
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        // These errors are common during pauses, just continue
        return;
      }
      setIsRecording(false);
      setIsListening(false);
    };

    recognition.onend = () => {
      // If we're still supposed to be recording, restart recognition
      if (isRecording) {
        setTimeout(() => {
          if (isRecording) {
            recognition.start();
          }
        }, 100);
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    // Clean up any trailing spaces
    setInput(prev => prev.trim());
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