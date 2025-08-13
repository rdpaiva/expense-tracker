import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Convert the file to the format expected by OpenAI
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    
    // Create a File-like object for OpenAI
    const file = new File([buffer], 'audio.webm', {
      type: audioFile.type,
    });

    // Transcribe with Whisper
    const response = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'en', // Specify English for better accuracy
      response_format: 'text',
    });

    return NextResponse.json({ text: response });
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}