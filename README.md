# ClipForge

A modern video editing application built with Tauri and React.

## Features

- **Video Import**: Import videos in various formats (MP4, MOV, WebM, AVI, MKV)
- **Timeline Editor**: Drag and drop video clips onto a timeline
- **Video Preview**: Preview selected clips with playback controls
- **Media Library**: Organize and manage your video files
- **Cross-Platform**: Built with Tauri for native performance on macOS, Windows, and Linux

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Tauri (Rust)
- **State Management**: Zustand
- **Video Processing**: FFmpeg
- **File Handling**: Tauri File System API

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- Rust (latest stable)
- FFmpeg (for video processing)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/nsouzaco/clipforge.git
cd clipforge
```

2. Install dependencies:
```bash
npm install
```

3. Install FFmpeg (if not already installed):
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt update
sudo apt install ffmpeg

# Windows
# Download from https://ffmpeg.org/download.html
```

4. Run the development server:
```bash
npm run tauri dev
```

## Project Structure

```
src/
├── components/          # React components
│   ├── VideoPreview.tsx # Video player and controls
│   ├── Timeline.tsx     # Timeline editor
│   ├── MediaLibrary.tsx # File management
│   └── ...
├── store/               # State management
│   └── useAppStore.ts   # Zustand store
└── ...

src-tauri/
├── src/                 # Rust backend
│   ├── video.rs         # Video processing
│   ├── recording.rs     # Screen recording
│   └── ...
└── tauri.conf.json     # Tauri configuration
```

## Current Status

🚧 **Work in Progress** - The video player functionality is currently being debugged and improved.

### Known Issues

- Video preview may not load properly in some cases
- Timeline clip selection needs refinement
- Some video formats may require conversion

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Roadmap

- [ ] Fix video player loading issues
- [ ] Improve timeline interaction
- [ ] Add video effects and transitions
- [ ] Implement audio editing
- [ ] Add export functionality
- [ ] Performance optimizations
