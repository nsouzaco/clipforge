# AI Transcription Setup Guide

## Overview
ClipForge now includes AI-powered audio transcription using OpenAI's Whisper API. Each video in your media library can be transcribed with a single click.

## Setup Instructions

### 1. Get OpenAI API Key
1. Visit [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the key (you won't be able to see it again!)

### 2. Configure Environment
1. Open the `.env` file in the project root
2. Replace `your_openai_api_key_here` with your actual API key:
```
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
```
3. Save the file

**Note**: The `.env` file is already in `.gitignore` and won't be committed to version control.

### 3. Restart the Application
After setting the API key, restart the application for changes to take effect.

## Usage

### Transcribe a Video
1. Import a video into your Media Library
2. Look for the **purple lightning bolt** icon (⚡) next to each video
3. Click the button to start transcription
4. Wait for the AI to process (usually 30 seconds to 2 minutes depending on video length)
5. The transcript will appear in a dialog automatically

### View Existing Transcripts
- Once transcribed, the button turns **green with a document icon** (📄)
- Click it again to view the transcript
- Transcripts are cached - no need to regenerate

### Features
- **Copy to Clipboard**: One-click copy of the full transcript
- **Word & Character Count**: See transcript statistics
- **Persistent Storage**: Transcripts are saved with your media files
- **Loading Indicator**: Visual feedback during transcription

## How It Works

### Backend Process
1. **Audio Extraction**: FFmpeg extracts audio from video to MP3 format
   - Converted to mono, 16kHz sample rate (optimal for Whisper)
   - Temporary file created in `/tmp`

2. **API Call**: Audio sent to OpenAI Whisper API
   - Uses `whisper-1` model
   - Handles videos up to 25MB audio

3. **Transcript Storage**: Result saved with media file
   - Displayed in dialog
   - Cached for future access

### Tech Stack
- **Backend**: Rust with `reqwest` for HTTP requests
- **Audio Processing**: FFmpeg command-line tool
- **API**: OpenAI Whisper (`whisper-1` model)
- **Frontend**: React with Tauri integration

## Pricing
- OpenAI Whisper API costs **$0.006 per minute** of audio
- Example: A 10-minute video costs ~$0.06 to transcribe
- See [OpenAI Pricing](https://openai.com/api/pricing/) for current rates

## Troubleshooting

### "OPENAI_API_KEY not set"
- Make sure you created the `.env` file with your API key
- Restart the application after setting the key

### "Please set a valid OpenAI API key"
- Your `.env` file still has the placeholder value
- Replace `your_openai_api_key_here` with your actual key

### Transcription Takes Too Long
- Videos over 5 minutes may take 2-3 minutes to transcribe
- Check your internet connection
- Ensure FFmpeg is installed and in PATH

### "Failed to extract audio"
- FFmpeg might not be installed
- Install: `brew install ffmpeg` (macOS) or see FFmpeg docs

## File Locations
- **Config**: `/Users/nat/clipcut/.env`
- **Backend**: `/Users/nat/clipcut/src-tauri/src/transcription.rs`
- **Frontend**: `/Users/nat/clipcut/src/components/TranscriptDialog.tsx`
- **UI**: `/Users/nat/clipcut/src/components/MediaLibrary.tsx`

## Security Notes
- ⚠️ **Never commit your `.env` file** - it's already in `.gitignore`
- ⚠️ **Don't share your API key** publicly
- ⚠️ API keys in screenshots or demos should be regenerated after

## Future Enhancements
- [ ] Timestamped transcripts (with word-level timing)
- [ ] Export transcripts as SRT/VTT subtitle files
- [ ] Multi-language support
- [ ] Speaker diarization
- [ ] Transcript search across media library


