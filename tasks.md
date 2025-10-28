# ClipForge Development Tasks

This file tracks the development tasks for building ClipForge, organized by day and priority.

## Day 1: Foundation (Monday, Oct 27)

### Project Setup
- [ ] Initialize Tauri project with `cargo tauri init`
- [ ] Set up React + TypeScript frontend
- [ ] Configure Tailwind CSS
- [ ] Set up Zustand for state management
- [ ] Install FFmpeg and verify integration
- [ ] Create basic project structure

### Core Infrastructure
- [ ] Create Rust backend structure (`src-tauri/src/`)
  - [ ] Main entry point
  - [ ] FFmpeg integration module
  - [ ] File operations module
- [ ] Set up Tauri commands for file import
- [ ] Create React component structure
  - [ ] App.tsx
  - [ ] VideoPreview component
  - [ ] Timeline component
  - [ ] MediaLibrary component

### File Import System
- [ ] Implement drag-and-drop file handler
- [ ] Create file picker UI
- [ ] Add Tauri command: `import_video(path: String)`
- [ ] Integrate FFmpeg probe for metadata extraction
- [ ] Generate video thumbnails
- [ ] Store media file metadata
- [ ] Test import with various video formats (MP4, MOV, WebM)

### Basic UI Layout
- [ ] Create main app layout (top bar, side panels, center)
- [ ] Build media library panel (left)
- [ ] Build video preview area (center)
- [ ] Build timeline area (bottom)
- [ ] Add basic styling with Tailwind
- [ ] Make layout responsive

### Video Preview Player
- [ ] Create HTML5 video player component
- [ ] Implement play/pause controls
- [ ] Add timeline scrubber
- [ ] Add volume control
- [ ] Add playback speed control
- [ ] Test video playback with imported files

### Timeline UI (Basic)
- [ ] Create HTML5 Canvas for timeline rendering
- [ ] Draw time ruler (00:00 format)
- [ ] Draw playhead (red vertical line)
- [ ] Implement playhead movement on click
- [ ] Add zoom controls (fit, zoom in, zoom out)
- [ ] Test canvas rendering performance

**Day 1 Goal:** Import → Preview pipeline working

## Day 2: MVP Features (Tuesday, Oct 28)

### Timeline Clip Display
- [ ] Display imported clips as colored blocks
- [ ] Add visual thumbnails to clips
- [ ] Show clip duration
- [ ] Support multi-track display (2 tracks minimum)
- [ ] Handle clip overlapping

### Clip Manipulation (Basic)
- [ ] Drag clips from media library to timeline
- [ ] Drag clips horizontally to reorder
- [ ] Select clip on click
- [ ] Delete selected clip
- [ ] Visual feedback for drag operations

### Trim Functionality
- [ ] Add trim handles to clip edges
- [ ] Drag trim handles to adjust in/out points
- [ ] Update clip duration in state
- [ ] Update video preview to show trimmed content
- [ ] Prevent invalid trim ranges

### Playhead & Scrub Control
- [ ] Click timeline to jump playhead
- [ ] Drag playhead to scrub
- [ ] Space bar for play/pause
- [ ] Arrow keys for frame stepping
- [ ] Synchronize playhead with video preview

### Export System
- [ ] Create export configuration UI
  - [ ] Resolution selector (Source, 1080p, 720p, 480p)
  - [ ] Frame rate selector (30fps, 60fps)
  - [ ] Output filename input
  - [ ] Output location picker
- [ ] Implement Tauri command: `export_video(config)`
- [ ] Build FFmpeg command for single clip export
- [ ] Add export progress tracking
- [ ] Show progress bar
- [ ] Add cancel export option
- [ ] Handle export errors
- [ ] Show success notification

### Testing & Bug Fixes
- [ ] Test import with large files
- [ ] Test timeline with multiple clips
- [ ] Test trim functionality edge cases
- [ ] Test export on various video formats
- [ ] Fix critical bugs
- [ ] Optimize performance

### Native App Build
- [ ] Configure Tauri build settings
- [ ] Build macOS app (.app)
- [ ] Build Windows app (.exe)
- [ ] Build Linux app (.AppImage or .deb)
- [ ] Test built apps launch
- [ ] Create README with build instructions

**Day 2 Goal:** MVP submission by 10:59 PM CT ✅

### Day 2.5: Start Recording (if time permits)
- [ ] Begin screen recording implementation
  - [ ] macOS AVFoundation integration
  - [ ] Create recording UI (start/stop buttons)
  - [ ] Add platform detection
  - [ ] Test screen capture

## Day 3: Polish & Advanced Features (Wednesday, Oct 29)

### Recording Features

#### Screen Recording
- [ ] Implement `get_screen_sources()` Tauri command
- [ ] Create screen/window selector UI
- [ ] Implement screen capture (platform-specific):
  - [ ] macOS: AVFoundation
  - [ ] Windows: Windows.Graphics.Capture (stub first)
  - [ ] Linux: PipeWire/X11 (stub first)
- [ ] Add start/stop recording controls
- [ ] Add recording indicator
- [ ] Save recording to timeline automatically
- [ ] Test screen recording

#### Webcam Recording
- [ ] Implement `getUserMedia()` for camera access
- [ ] List available cameras
- [ ] Create camera preview component
- [ ] Record webcam with MediaRecorder API
- [ ] Add microphone audio capture
- [ ] Save recording to timeline
- [ ] Test webcam recording

#### Picture-in-Picture (PiP)
- [ ] Record screen and webcam simultaneously
- [ ] Position webcam overlay (draggable)
- [ ] Composite streams in preview
- [ ] Use FFmpeg overlay filter for export
- [ ] Test PiP recording and export

### Timeline Enhancements

#### Advanced Clip Manipulation
- [ ] Implement split at playhead
- [ ] Add multi-select (Shift+click, drag box)
- [ ] Delete multiple clips
- [ ] Add undo/redo (Cmd/Ctrl+Z)
- [ ] Improve snap-to-grid (1-second intervals)

#### Timeline UI Improvements
- [ ] Add context menu for clips
- [ ] Add track layers (video, audio)
- [ ] Improve zoom range (10-500%)
- [ ] Add waveform visualization
- [ ] Keyboard shortcuts for common actions

### Export Enhancements

#### Multi-Clip Export
- [ ] Implement FFmpeg concat filter
- [ ] Handle transitions between clips
- [ ] Export multiple clips in sequence
- [ ] Maintain audio sync
- [ ] Test with 10+ clips

#### Export Progress
- [ ] Parse FFmpeg progress output
- [ ] Show accurate progress percentage
- [ ] Display time remaining
- [ ] Add cancel export functionality
- [ ] Handle export errors gracefully

### Additional Features (if time permits)
- [ ] Text overlay system
- [ ] Fade in/out transitions
- [ ] Audio volume control per clip
- [ ] Audio fade in/out
- [ ] Full-screen preview mode
- [ ] More keyboard shortcuts

### Polish & Performance

#### Performance Testing
- [ ] Test with 10+ clips
- [ ] Test timeline performance at 60fps
- [ ] Test memory usage (< 1GB target)
- [ ] Optimize canvas rendering
- [ ] Profile and fix bottlenecks

#### Error Handling
- [ ] Handle unsupported video formats
- [ ] Handle import errors
- [ ] Handle export failures
- [ ] Show user-friendly error messages
- [ ] Log errors for debugging

#### UI/UX Improvements
- [ ] Add loading states
- [ ] Add tooltips
- [ ] Improve visual feedback
- [ ] Polish animations
- [ ] Responsive design testing

### Documentation & Packaging

#### Documentation
- [ ] Write comprehensive README
- [ ] Create setup instructions
- [ ] Document architecture
- [ ] Write user guide (basic operations)
- [ ] Add troubleshooting section
- [ ] List known limitations

#### Demo Video (3-5 minutes)
- [ ] Record import clips demo
- [ ] Record screen + webcam demo
- [ ] Record timeline editing demo
- [ ] Record export process
- [ ] Edit and publish demo

#### Final Packaging
- [ ] Build all platform distributions
- [ ] Test installers on clean systems
- [ ] Create GitHub Releases
- [ ] Upload distributable files
- [ ] Prepare submission materials

**Day 3 Goal:** Final submission by 10:59 PM CT ✅

## Testing Scenarios (Cross-cutting)

### End-to-End Tests
- [ ] **Basic Edit:** Import 3 clips → Arrange → Trim → Export
- [ ] **Screen Recording:** Record 30s → Add to timeline → Export
- [ ] **PiP Recording:** Screen + Webcam → Export
- [ ] **Long Session:** 15-minute editing session (memory leak test)
- [ ] **Large Files:** Import 4K video → Edit → Export

### Regression Tests
- [ ] Import doesn't break after recording
- [ ] Timeline doesn't break with many clips
- [ ] Export works after multiple edits
- [ ] No memory leaks during long sessions

## Quick Reference: Keyboard Shortcuts

| Action | Shortcut | Status |
|--------|----------|--------|
| Play/Pause | Space | ⏳ |
| Split Clip | S | ⏳ |
| Delete | Delete/Backspace | ⏳ |
| Undo | Cmd/Ctrl + Z | ⏳ |
| Redo | Cmd/Ctrl + Shift + Z | ⏳ |
| Export | Cmd/Ctrl + E | ⏳ |
| Import | Cmd/Ctrl + I | ⏳ |

---

## Notes
- Check off tasks as they're completed
- Revisit tasks as new patterns emerge
- Update memory bank files as architecture evolves
- Test thoroughly on each platform before submission

