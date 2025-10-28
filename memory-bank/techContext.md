# Technical Context - ClipForge

## Technology Stack

### Frontend
- **React**: UI framework with hooks and functional components
- **Tailwind CSS**: Utility-first styling with custom design system
- **Zustand**: Lightweight state management for media library and timeline
- **HTML5 Canvas**: Timeline rendering (ruler, playhead, clips, handles)
- **HTML5 Video**: Preview player with object-fit: contain

### Backend
- **Tauri**: Rust-based desktop app framework
- **FFmpeg**: Video processing and export via command line
- **Rust**: System integration and file operations

## Development Setup

### Prerequisites
- Node.js (v18+)
- Rust (latest stable)
- FFmpeg (system installation)
- Tauri CLI

### Project Structure
```
clipcut/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── stores/            # Zustand state stores
│   ├── utils/             # Helper functions
│   └── types/             # TypeScript definitions
├── src-tauri/             # Rust backend
│   ├── src/               # Rust source code
│   ├── capabilities/      # Tauri permissions
│   └── tauri.conf.json    # App configuration
└── memory-bank/           # Project documentation
```

## Technical Constraints

### Performance Targets
- **Launch Time**: < 3 seconds (warm)
- **Timeline Rendering**: 60fps with single long clip
- **Preview Playback**: 30fps
- **Memory Usage**: Efficient for long video files

### Platform Support
- **Primary**: macOS (DMG and APP bundles)
- **Future**: Windows (MSI), Linux (AppImage)

### File Format Support
- **Input**: MP4, MOV
- **Output**: MP4 (H.264/AAC)

## Dependencies

### Frontend Dependencies
```json
{
  "react": "^18.0.0",
  "react-dom": "^18.0.0",
  "zustand": "^4.0.0",
  "tailwindcss": "^3.0.0",
  "@tauri-apps/api": "^1.0.0"
}
```

### Backend Dependencies
```toml
[dependencies]
tauri = { version = "1.0", features = ["api-all"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1.0", features = ["full"] }
```

## Build Configuration

### Tauri Configuration
- **Window Size**: 1280×800 (min: 1100×700)
- **Bundle Targets**: DMG, APP for macOS
- **Capabilities**: Minimal file access permissions

### Development Commands
```bash
# Development
npm run tauri dev

# Build
npm run tauri build

# Lint
npm run lint
```

## Security Considerations
- Minimal file system permissions
- Validate file extensions on frontend
- Use system dialogs for file operations
- No network access required
- Sandboxed execution environment
