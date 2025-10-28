# ClipForge

A modern video editing application with native screen recording and AI-powered transcription. Built with Tauri and React for native performance.

## ✨ Features

### 🎥 Recording
- **Screen Recording**: Capture your entire screen or specific displays (macOS)
- **Webcam Recording**: Record from your system camera
- **Picture-in-Picture**: Simultaneous screen + webcam recording
- **Audio Capture**: Built-in microphone support
- **Direct to Timeline**: Recordings automatically added to your project

### 🤖 AI Transcription
- **OpenAI Whisper Integration**: Industry-leading speech-to-text accuracy
- **One-Click Transcription**: Generate transcripts from any video with audio
- **Smart Caching**: Transcripts saved with media files for instant access
- **Copy to Clipboard**: Easy export of transcripts
- **Cost Efficient**: ~$0.006 per minute (~$0.36 per hour)

### ✂️ Video Editing
- **Timeline Editor**: Drag and drop video clips with precision
- **Trim Tools**: Adjust in/out points with visual handles
- **Clip Management**: Delete, reorder, and organize clips
- **Video Preview**: Full playback controls with frame-accurate seeking
- **Multi-Format Support**: MP4, MOV, WebM, AVI, MKV

### 📚 Media Library
- **Auto-Thumbnails**: Visual previews for all media
- **Metadata Display**: Duration, resolution, file size
- **Quick Access**: Drag files directly to timeline
- **AI Indicators**: Visual status for transcripts

### 📤 Export
- **High-Quality Output**: Multiple quality presets
- **Format Options**: Export to various formats
- **Progress Tracking**: Real-time export status
- **Optimized Encoding**: FFmpeg-powered processing

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Tauri 2.0 (Rust)
- **State Management**: Zustand
- **Video Processing**: FFmpeg
- **Screen Capture**: AVFoundation (macOS), Core Graphics
- **AI/ML**: OpenAI Whisper API
- **HTTP Client**: Reqwest (Rust)
- **Async Runtime**: Tokio

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or later
- **Rust** (latest stable)
- **FFmpeg** (required for video processing)
- **OpenAI API Key** (for transcription features)

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/nsouzaco/clipforge.git
cd clipforge
```

2. **Install dependencies:**
```bash
npm install
```

3. **Install FFmpeg:**
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt update && sudo apt install ffmpeg

# Windows
# Download from https://ffmpeg.org/download.html
```

4. **Set up OpenAI API Key (for AI transcription):**
```bash
# Create .env file in project root
echo "OPENAI_API_KEY=your_api_key_here" > .env
```

Get your API key at: https://platform.openai.com/api-keys

See `TRANSCRIPTION_SETUP.md` for detailed setup instructions.

5. **Run the development server:**
```bash
npm run tauri dev
```

## 📦 Download & Installation

### Pre-built Binaries

**macOS (Apple Silicon)**
- Download: `ClipForge_1.0.0_aarch64.dmg` (4.6 MB)
- Location: Check [Releases](../../releases) page (coming soon)

**Requirements:**
- macOS 10.13 or later
- Apple Silicon (M1/M2/M3) or Intel Mac
- FFmpeg installed (`brew install ffmpeg`)

**Installation:**
1. Download the DMG file
2. Open the DMG and drag ClipForge to Applications
3. Right-click and select "Open" first time (macOS security)
4. Grant screen recording & microphone permissions when prompted

### Building from Source

**Build the production app:**
```bash
npm run tauri build
```

**Output locations:**
- **App Bundle**: `src-tauri/target/release/bundle/macos/ClipForge.app`
- **DMG Installer**: `src-tauri/target/release/bundle/dmg/ClipForge_1.0.0_aarch64.dmg`
- **Raw Executable**: `src-tauri/target/release/app`

**Build time:** ~3-5 minutes (first build may take longer)

**Platform-specific builds:**
- macOS: Produces `.app` bundle and `.dmg` installer
- Windows: Produces `.exe` and `.msi` (planned)
- Linux: Produces `.AppImage` and `.deb` (planned)

**Note:** Current build is optimized for macOS. Cross-platform builds coming soon!

## 📁 Project Structure

```
src/
├── components/              # React components
│   ├── VideoPreview.tsx     # Video player with controls
│   ├── Timeline.tsx         # Timeline editor with trim tools
│   ├── MediaLibrary.tsx     # Media file management + AI button
│   ├── RecordPanel.tsx      # Recording UI and controls
│   ├── WebcamPreview.tsx    # Live webcam feed
│   ├── PiPOverlay.tsx       # Picture-in-Picture overlay
│   ├── TranscriptDialog.tsx # AI transcript viewer
│   ├── ExportDialog.tsx     # Export configuration
│   └── ...
├── stores/
│   └── appStore.ts          # Zustand global state
├── hooks/
│   └── useWebcam.ts         # Webcam access hook
├── utils/
│   └── recordingCompositor.ts # Stream compositing
├── types/
│   └── index.ts             # TypeScript definitions
└── ...

src-tauri/
├── src/
│   ├── lib.rs               # Main Tauri entry + commands
│   ├── video.rs             # Video processing & metadata
│   ├── recording.rs         # Screen recording (AVFoundation)
│   ├── transcription.rs     # OpenAI Whisper integration
│   └── ...
├── Cargo.toml               # Rust dependencies
├── tauri.conf.json          # Tauri configuration
└── Info.plist               # macOS permissions
```

## 📊 Current Status

✅ **Phase 1**: Core video editing - **COMPLETE**
- Timeline editing with drag & drop
- Video preview with playback controls
- Media library management
- Trim tools and clip management
- Export functionality

✅ **Phase 2**: Native recording - **COMPLETE**
- Screen recording (macOS via AVFoundation)
- Webcam recording (web APIs)
- Picture-in-Picture mode
- Audio capture from microphone
- Direct-to-timeline workflow

✅ **Phase 3**: AI transcription - **COMPLETE**
- OpenAI Whisper API integration
- Automatic audio extraction
- Transcript caching and viewing
- Copy to clipboard functionality

### ⚠️ Known Limitations

- **macOS Only**: Screen recording currently uses AVFoundation (macOS-specific)
- **Webcam in Tauri**: Web APIs have limited support in Tauri webview
- **Audio-Only Videos**: Transcription requires videos with audio tracks
- **API Costs**: Transcription incurs OpenAI API charges (~$0.006/min)

## 📖 Usage Guide

### Recording a Video

1. Click the **⏺ Record** button in the top toolbar
2. Choose recording mode:
   - **Screen Only**: Capture your display
   - **Webcam Only**: Record from camera
   - **Screen + Webcam**: Picture-in-Picture mode
3. Select your screen source (if applicable)
4. Toggle **🎤 Microphone** on/off
5. Click **Start Recording**
6. Record for at least 2 seconds for best results
7. Click **Stop Recording** - video is added to timeline automatically

### Editing on the Timeline

1. **Add Clips**: Drag videos from Media Library to Timeline
2. **Trim Clips**: Drag the left/right edges of clips to adjust in/out points
3. **Delete Clips**: Hover over a clip and click the **✕** button
4. **Reorder**: Drag clips horizontally to rearrange
5. **Preview**: Click a clip to load it in the video player
6. **Playback**: Use spacebar or play button to preview

### AI Transcription

1. Import or record a video **with audio**
2. Click the **⚡** (purple lightning) button in Media Library
3. Wait 30 seconds to 2 minutes for processing
4. View the transcript in the popup dialog
5. Click **Copy to Clipboard** to export text
6. Click the **📄** (green document) button to view again anytime

### Exporting Your Video

1. Click the **Export** button in the top toolbar
2. Choose quality preset (High/Medium/Low)
3. Select output format
4. Click **Start Export**
5. Wait for processing to complete
6. Your video will be saved to the selected location

## 🐛 Troubleshooting

### Screen Recording Not Working
- **macOS Only**: Currently requires macOS with AVFoundation support
- **Permissions**: Allow screen recording in System Preferences → Privacy & Security
- **FFmpeg**: Ensure FFmpeg is installed: `brew install ffmpeg`

### Webcam Not Detected
- **Limited Support**: Tauri webview has limited `getUserMedia()` support
- **Workaround**: Use Screen Only mode for now
- **Future**: Native Rust webcam implementation planned

### Transcription Errors
- **"No audio track"**: Video must have audio to transcribe
- **API Key Missing**: Add `OPENAI_API_KEY` to `.env` file
- **See**: `TRANSCRIPTION_SETUP.md` for detailed setup

### Video Won't Import
- **Format Support**: MP4, MOV, WebM, AVI, MKV supported
- **Corrupted Files**: Try re-encoding with FFmpeg
- **Permissions**: Check file read permissions

## 🗺 Roadmap

### Completed ✅
- [x] Core video editing and timeline
- [x] Native screen recording (macOS)
- [x] AI-powered transcription (OpenAI Whisper)
- [x] Webcam recording (web APIs)
- [x] Picture-in-Picture mode
- [x] Export functionality
- [x] Trim tools and clip management

### In Progress 🚧
- [ ] Cross-platform screen recording (Windows, Linux)
- [ ] Native webcam support (Rust)
- [ ] Audio waveform visualization
- [ ] Video effects and transitions

### Planned 📋
- [ ] Multi-track timeline
- [ ] Text overlays and captions
- [ ] Audio editing and mixing
- [ ] GPU-accelerated rendering
- [ ] Collaborative editing
- [ ] Cloud storage integration
- [ ] Plugin system

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

### Development Guidelines
- Follow TypeScript/Rust best practices
- Write descriptive commit messages
- Test on macOS before submitting
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Tauri** - Desktop app framework
- **FFmpeg** - Video processing
- **OpenAI Whisper** - AI transcription
- **React** - UI framework
- **Zustand** - State management

---

**Made with ❤️ by the ClipForge team**
