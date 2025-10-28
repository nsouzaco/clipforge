# Technical Context

## Technology Stack

### Frontend
- **Framework:** React 18+
- **Language:** TypeScript
- **State Management:** Zustand (or React Context)
- **Styling:** Tailwind CSS
- **Timeline Rendering:** HTML5 Canvas
- **Video Player:** HTML5 `<video>` element

### Backend
- **Framework:** Tauri
- **Language:** Rust
- **Media Processing:** FFmpeg (via Rust bindings)
- **File Operations:** Rust std::fs for file I/O
- **Screen Recording:** Platform-specific APIs
  - macOS: AVFoundation
  - Windows: Windows.Graphics.Capture
  - Linux: PipeWire/X11

### Media Pipeline
```
Import → Decode (FFmpeg) → Timeline State → Preview → Encode (FFmpeg) → Export
```

## Development Setup

### Prerequisites
- Rust (latest stable)
- Node.js 18+
- FFmpeg (system installation or bundled)
- OS-specific dependencies:
  - macOS: Xcode Command Line Tools
  - Windows: Microsoft C++ Build Tools
  - Linux: build-essential, libwebkit2gtk-4.0-dev

### Project Structure
```
clipforge/
├── src-tauri/          # Rust backend
│   ├── src/
│   │   ├── main.rs     # Entry point
│   │   ├── video.rs    # FFmpeg integration
│   │   └── recording.rs # Screen/webcam capture
│   └── Cargo.toml      # Rust dependencies
├── src/                # React frontend
│   ├── components/     # UI components
│   ├── stores/         # State management
│   ├── utils/          # Helper functions
│   └── App.tsx         # Main component
└── package.json        # Node dependencies
```

## Key Dependencies

### Rust (Cargo.toml)
- `tauri` - Desktop framework
- `serde` - Serialization
- `tokio` - Async runtime
- `ffmpeg` - Media processing (or subprocess calls)

### Node.js (package.json)
- `react` + `react-dom`
- `zustand` - State management
- `tailwindcss` - Styling
- `@tauri-apps/api` - Tauri JavaScript APIs

## Technical Constraints

### Tauri Considerations
- Bundle size must be smaller than Electron (~3MB vs. ~50MB)
- Native performance with lower memory usage
- FFmpeg integration requires Rust knowledge
- Platform APIs differ (screen capture per OS)

### FFmpeg Integration
- **Encoding Speed:** Use `fast` preset for H.264
- **Codec Priority:** MP4/H.264 for compatibility
- **Error Handling:** User-friendly error messages
- **Progress Tracking:** Parse FFmpeg output for progress

### Performance Targets
| Metric | Target |
|--------|--------|
| App Launch | < 5 seconds |
| Timeline FPS | 60fps with 10+ clips |
| Preview FPS | 30fps minimum |
| Memory Usage | < 1GB with 20 clips |
| Export Speed | 1x realtime minimum |

## Platform-Specific Notes

### macOS
- AVFoundation for screen capture
- Native .app bundle output
- Code signing for distribution

### Windows
- Windows.Graphics.Capture for screen capture
- .exe installer expected
- Visual Studio runtime dependencies

### Linux
- PipeWire/X11 for screen capture
- .AppImage or .deb package
- Distribution-specific dependencies

