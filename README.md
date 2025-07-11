# Rectizza Voice Challenge

A full-stack, cross-platform voice challenge app built with Next.js. Users shout "Rectizza" to unlock discounts—the longer you hold, the bigger the bite!

## Features

- Works in all modern browsers (Chrome, Firefox, Edge, Safari)
- Records audio using MediaRecorder API
- Uses Web Audio API to measure loudness (volume) in real time
- Sends audio to backend for speech-to-text transcription
- Calculates discount based on both how long and how loud you say "Rectizza" (or similar)
- Fuzzy matches similar words for robust challenge
- Modern UI with live feedback and error handling
- Ready for integration with cloud speech-to-text APIs (Google, Deepgram, AssemblyAI)

## Getting Started

1. **Install dependencies:**

   ```bash
   npm install
   # or
   yarn install
   ```

2. **Run the development server:**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

3. **Open your browser:**
   Visit [http://localhost:3000](http://localhost:3000)

## How It Works

- Click the challenge button and allow microphone access.
- Say "Rectizza" and hold it as long as you can.
- The app records your voice and sends it to the backend.
- The backend transcribes your audio and returns the result.
- If you said "Rectizza" for at least 2 seconds, you unlock a discount!

## Backend API

- The backend endpoint `/api/transcribe` accepts audio uploads and returns a transcript.
- You can integrate with any cloud speech-to-text provider by updating `app/api/transcribe/route.ts`.

## Deployment

- Deploy easily on Vercel, Netlify, or any platform that supports Next.js API routes.
- Make sure to set up API keys for your chosen speech-to-text provider in production.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [Google Cloud Speech-to-Text](https://cloud.google.com/speech-to-text)
- [Deepgram Speech API](https://developers.deepgram.com/)
- [AssemblyAI Speech API](https://www.assemblyai.com/)

---

© {new Date().getFullYear()} Rectizza. Crunch louder, save hotter. 🍕
