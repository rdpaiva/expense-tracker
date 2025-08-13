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
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      onSubmit(input.trim());
      setInput('');
    }
  };

  const startRecording = async () => {
    if (isRecording || isProcessingAudio) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      audioChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudioWithWhisper(audioBlob);
        
        // Stop all tracks to free up the microphone
        stream.getTracks().forEach(track => track.stop());
      };

      setIsRecording(true);
      mediaRecorder.start();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudioWithWhisper = async (audioBlob: Blob) => {
    setIsProcessingAudio(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('/api/transcribe-audio', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to transcribe audio');
      }

      const { text } = await response.json();
      setInput(text.trim());
    } catch (error) {
      console.error('Error transcribing audio:', error);
      alert('Failed to transcribe audio. Please try again.');
    } finally {
      setIsProcessingAudio(false);
    }
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
            disabled={isProcessing || isRecording || isProcessingAudio}
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
            disabled={isProcessing || isProcessingAudio}
            className={`${isRecording ? 'bg-red-100 border-red-300' : ''} select-none`}
            title="Hold to record voice"
          >
            <Mic className={`h-4 w-4 ${isRecording ? 'text-red-600' : ''}`} />
          </Button>
          <Button
            type="submit"
            disabled={!input.trim() || isProcessing || isRecording || isProcessingAudio}
            size="icon"
            title="Submit expense"
          >
            {isProcessing || isProcessingAudio ? (
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
      {isRecording && (
        <p className="text-sm text-muted-foreground mt-2 text-center">
          🎤 Recording... Release button when done
        </p>
      )}
      {isProcessingAudio && (
        <p className="text-sm text-muted-foreground mt-2 text-center">
          🤖 Processing audio with AI...
        </p>
      )}
    </div>
  );
}