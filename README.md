# AI Expense Tracker

A modern expense tracking app powered by AI and natural language processing. Simply type or speak your expenses in natural language and let AI automatically categorize and organize them.

## Features

- **Natural Language Input**: Type expenses like "Spent $5.25 at Starbucks" or "20 dollars for uber"
- **Voice Input**: Press and hold the microphone button to record expenses with AI-powered Whisper transcription
- **Receipt Scanning**: Take photos of receipts and automatically extract multiple expenses
- **AI-Powered Parsing**: OpenAI GPT-4o Vision analyzes receipts and GPT-3.5 Turbo processes text
- **Interactive Review**: Edit, remove, or confirm extracted expenses before saving
- **Real-time Summaries**: View spending summaries for today, this week, and this month
- **Detailed Expense Lists**: Click summary cards to see itemized expenses with categories
- **Offline Storage**: Uses IndexedDB for client-side data storage
- **Mobile-First**: Responsive design optimized for mobile devices with camera access
- **Modern UI**: Built with Tailwind CSS and Shadcn UI components

## Technology Stack

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS + Shadcn UI
- **AI**: OpenAI GPT-4o Vision for receipt scanning, GPT-3.5 Turbo for text parsing, Whisper for speech-to-text
- **Database**: IndexedDB for client-side storage
- **Audio**: MediaRecorder API + OpenAI Whisper for high-accuracy voice transcription
- **Camera**: HTML5 File API with camera capture
- **Deployment**: Optimized for Vercel

## Getting Started

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   - Copy `.env.local` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000) in your browser**

## Usage

1. **Text Input**: Type expenses naturally:
   - "Spent $5.25 at Starbucks"
   - "20 dollars for uber ride"
   - "Coffee $4.50"

2. **Voice Input**: Press and hold the microphone button to record expenses

3. **Receipt Scanning**: Click the camera button to take photos of receipts and extract multiple expenses

4. **View Summaries**: See automatic summaries for today, this week, and this month

5. **Detailed Lists**: Click on summary cards to view itemized expense lists

6. **Delete Expenses**: Remove individual expenses from the detailed list view

## API Routes

- `POST /api/parse-expense`: Parses natural language expense input using OpenAI
- `POST /api/parse-receipt`: Analyzes receipt images and extracts multiple expenses using OpenAI Vision
- `POST /api/transcribe-audio`: Transcribes audio recordings to text using OpenAI Whisper

## Building for Production

```bash
npm run build
npm start
```

## Deployment

This app is optimized for deployment on Vercel:

1. Push to GitHub
2. Connect repository to Vercel
3. Add `OPENAI_API_KEY` environment variable in Vercel dashboard
4. Deploy

## Browser Support

- Modern browsers with IndexedDB support
- Speech recognition requires Chrome/Safari (WebKit Speech API)
- Fully responsive on mobile devices

## License

MIT License