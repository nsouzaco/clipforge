# ClipForge Product Requirements Document

## Overview

**Product Name:** ClipForge  
**Platform:** Desktop (macOS, Windows, Linux)  
**Tech Stack:** Tauri + React  
**Timeline:** 72 hours (October 27-29, 2025)  
**MVP Deadline:** Tuesday, October 28, 10:59 PM CT  
**Final Deadline:** Wednesday, October 29, 10:59 PM CT

## Product Vision

ClipForge is a lightweight, native desktop video editor that empowers creators to record, edit, and export professional videos without the complexity of traditional editing software. Built with Tauri and React, it delivers near-native performance with a modern web-based UI.

## Success Criteria

### MVP Gate (Tuesday 10:59 PM CT)
- ✅ Desktop app launches successfully
- ✅ Import video files (MP4/MOV) via drag-and-drop or file picker
- ✅ Timeline displays imported clips visually
- ✅ Video preview player with playback controls
- ✅ Trim functionality (set in/out points)
- ✅ Export single clip to MP4
- ✅ Native app build (not dev mode)

### Final Submission (Wednesday 10:59 PM CT)
- All core features implemented and tested
- Stable performance with 10+ clips
- Complete recording capabilities
- Professional export pipeline

## Target Users

- **Content Creators:** YouTubers, streamers, educators
- **Professionals:** Product demos, tutorials, presentations
- **Educators:** Lecture recordings, course materials
- **Teams:** Quick video edits without Adobe Premiere complexity

## Technical Architecture

### Frontend Layer (React)
- **UI Framework:** React 18+ with hooks
- **State Management:** Zustand or React Context for timeline state
- **Styling:** Tailwind CSS for rapid UI development
- **Timeline Rendering:** HTML5 Canvas or CSS Grid for clip visualization
- **Video Player:** HTML5 `<video>` element with custom controls

### Backend Layer (Tauri/Rust)
- **File Operations:** Rust commands for file I/O, import/export
- **Media Processing:** FFmpeg integration via Rust
- **Screen Recording:** Platform-specific capture APIs
  - macOS: AVFoundation
  - Windows: Windows.Graphics.Capture
  - Linux: PipeWire/X11 screen capture
- **Webcam Access:** Frontend getUserMedia() + Rust MediaRecorder

### Media Pipeline
```
Import → Decode (FFmpeg) → Timeline State → Preview → Encode (FFmpeg) → Export
```

## Feature Specifications

### 1. Recording Features (Priority: High)

#### 1.1 Screen Recording
**User Story:** As a creator, I want to record my screen to capture tutorials and demos.

**Requirements:**
- Display list of available screens/windows
- Select full screen or specific window
- Start/stop recording with visual indicator
- Save recording directly to timeline or media library
- Support 1080p/30fps minimum

**Technical Implementation:**
- Tauri command: `get_screen_sources()` returns list of screens
- Rust: Capture screen using platform APIs
- Frontend: React component for source selection
- MediaRecorder API for stream capture

#### 1.2 Webcam Recording
**User Story:** As a creator, I want to record my face for talking-head videos.

**Requirements:**
- List available cameras
- Preview camera feed before recording
- Record with audio from microphone
- Resolution up to 1080p

**Technical Implementation:**
- `navigator.mediaDevices.getUserMedia({ video: true, audio: true })`
- React component for camera preview
- MediaRecorder for webcam stream

#### 1.3 Picture-in-Picture (Screen + Webcam)
**User Story:** As an educator, I want to show my screen with my face in the corner.

**Requirements:**
- Record screen and webcam simultaneously
- Webcam overlay in corner (draggable position)
- Both streams synchronized
- Export as single video file

**Technical Implementation:**
- Two separate MediaRecorder instances
- Canvas compositing for preview
- FFmpeg overlay filter for export: `-filter_complex overlay=W-w-10:H-h-10`

### 2. Import & Media Management (Priority: Critical)

#### 2.1 File Import
**Requirements:**
- Drag-and-drop video files onto app window
- File picker button (MP4, MOV, WebM, AVI)
- Show import progress for large files
- Validate file format and codec support

**Technical Implementation:**
- Tauri event listener: `tauri://file-drop`
- Rust command: `import_video(path: String) -> Result<VideoMetadata>`
- FFmpeg probe for metadata extraction

#### 2.2 Media Library Panel
**Requirements:**
- Grid view of imported clips
- Thumbnail preview (first frame or generated poster)
- Metadata: filename, duration, resolution, file size
- Right-click context menu: Add to timeline, Delete, Show in folder

**Technical Implementation:**
- FFmpeg thumbnail generation: `-ss 00:00:01 -vframes 1`
- React component with virtualized list for performance
- Zustand store for media library state

### 3. Timeline Editor (Priority: Critical)

#### 3.1 Timeline UI
**Requirements:**
- Horizontal timeline with time ruler (00:00 format)
- Playhead (red vertical line) showing current time
- Zoom controls: Fit to window, Zoom in/out (10-100%)
- Multi-track support: 2 video tracks minimum
- Visual clip representation: colored blocks with thumbnails
- Snap-to-grid: 1-second intervals, snap to clip edges

**Technical Implementation:**
- HTML5 Canvas for timeline rendering (60fps)
- React state: `clips[]`, `playheadPosition`, `zoomLevel`
- Drag events: `onMouseDown`, `onMouseMove`, `onMouseUp`

#### 3.2 Clip Manipulation
**Requirements:**
- **Drag to Timeline:** Drag from media library to timeline
- **Reorder:** Drag clips horizontally to rearrange
- **Trim:** Drag clip edges to adjust in/out points
- **Split:** Click split button at playhead position
- **Delete:** Select clip + Delete key or context menu
- **Multi-select:** Shift+click or drag selection box

**Technical Implementation:**
- Clip data structure:
```javascript
{
  id: string,
  sourceFile: string,
  startTime: number,    // Timeline position
  duration: number,
  trimStart: number,    // Trim from source
  trimEnd: number,
  track: number
}
```

#### 3.3 Playhead Control
**Requirements:**
- Click timeline to jump playhead
- Drag playhead to scrub through timeline
- Keyboard shortcuts: Space (play/pause), Left/Right arrows (frame step)

### 4. Preview & Playback (Priority: Critical)

#### 4.1 Video Preview Window
**Requirements:**
- Display current frame at playhead position
- 16:9 aspect ratio maintained
- Resize preview window
- Full-screen preview mode

**Technical Implementation:**
- HTML5 `<video>` element
- React effect: Update video `currentTime` when playhead changes
- Canvas compositing for multi-track preview

#### 4.2 Playback Controls
**Requirements:**
- Play/Pause button
- Stop button (reset to start)
- Timeline scrubber synchronized with preview
- Volume control
- Playback speed: 0.5x, 1x, 1.5x, 2x

**Technical Implementation:**
- Video element API: `play()`, `pause()`, `playbackRate`
- RequestAnimationFrame loop for smooth playhead update

### 5. Export & Rendering (Priority: Critical)

#### 5.1 Export Configuration
**Requirements:**
- Resolution options: Source, 1080p, 720p, 480p
- Frame rate: 30fps, 60fps
- Format: MP4 (H.264 codec)
- Output filename and location picker

**Technical Implementation:**
- Tauri command: `export_video(config: ExportConfig) -> Result<()>`
- FFmpeg command builder in Rust:
```bash
ffmpeg -i input1.mp4 -i input2.mp4 \
  -filter_complex "[0:v][1:v]concat=n=2:v=1:a=1[outv][outa]" \
  -map "[outv]" -map "[outa]" \
  -c:v libx264 -preset fast -crf 23 \
  -c:a aac -b:a 192k \
  output.mp4
```

#### 5.2 Export Progress
**Requirements:**
- Progress bar (0-100%)
- Estimated time remaining
- Cancel export option
- Success/error notifications

**Technical Implementation:**
- FFmpeg progress parsing: `-progress pipe:1`
- Tauri event emitter: `export_progress` → React listener
- React state: `exportProgress`, `isExporting`

### 6. Additional Features (Priority: Medium)

#### 6.1 Text Overlays
- Add text layer to timeline
- Position, font, size, color customization
- Fade in/out animations

#### 6.2 Transitions
- Fade in/out between clips
- Cross-dissolve transition
- Duration control (0.5-2 seconds)

#### 6.3 Audio Controls
- Volume adjustment per clip (0-200%)
- Fade in/out
- Mute/unmute tracks

#### 6.4 Keyboard Shortcuts
| Action | Shortcut |
|--------|----------|
| Play/Pause | Space |
| Split Clip | S |
| Delete | Delete/Backspace |
| Undo | Cmd/Ctrl + Z |
| Redo | Cmd/Ctrl + Shift + Z |
| Export | Cmd/Ctrl + E |
| Import | Cmd/Ctrl + I |

## Performance Requirements

| Metric | Target |
|--------|--------|
| App Launch Time | < 5 seconds |
| Timeline Responsiveness | 60fps with 10+ clips |
| Preview Playback | 30fps minimum |
| Memory Usage | < 1GB with 20 clips |
| Export Speed | 1x realtime minimum |
| File Size Overhead | < 20% vs. source |

## Testing Strategy

### Unit Tests
- Rust functions: FFmpeg commands, file operations
- React components: Timeline calculations, clip manipulation

### Integration Tests
- Import → Preview → Export pipeline
- Recording → Timeline → Export pipeline
- Multi-clip timeline rendering

### End-to-End Scenarios
1. **Basic Edit:** Import 3 clips → Arrange → Trim → Export
2. **Screen Recording:** Record 30s → Add to timeline → Export
3. **PiP Recording:** Screen + Webcam → Export
4. **Long Session:** 15-minute editing session (memory leak test)
5. **Large Files:** Import 4K video → Edit → Export

## Technical Constraints

### Tauri Limitations
- **Bundle Size:** Smaller than Electron (~3MB vs. ~50MB)
- **Native Performance:** Near-native speed, lower memory usage
- **Rust Learning Curve:** FFmpeg integration requires Rust knowledge
- **Platform APIs:** Must implement screen capture per OS

### FFmpeg Considerations
- **Encoding Speed:** H.264 preset: `fast` (balance quality/speed)
- **Codec Support:** Prioritize MP4/H.264 for compatibility
- **Error Handling:** FFmpeg failures must show user-friendly messages

## Development Milestones

### Day 1 (Monday, Oct 27) - Foundation
- [ ] Initialize Tauri + React project
- [ ] Setup FFmpeg in Rust (test probe command)
- [ ] Implement file import (drag-and-drop + picker)
- [ ] Create basic timeline UI (canvas rendering)
- [ ] Video preview player (HTML5 video element)
- [ ] **Test import → preview pipeline**

### Day 2 (Tuesday, Oct 28) - MVP
- [ ] Trim functionality (adjust clip in/out points)
- [ ] Export single clip to MP4
- [ ] Build and package app
- [ ] **Submit MVP by 10:59 PM CT**
- [ ] Start recording implementation (screen capture)
- [ ] Timeline clip manipulation (drag, split, delete)

### Day 3 (Wednesday, Oct 29) - Polish
- [ ] Webcam recording
- [ ] Picture-in-Picture recording
- [ ] Multi-clip export (concat filter)
- [ ] Export progress UI
- [ ] Performance testing
- [ ] Bug fixes and error handling
- [ ] Record demo video
- [ ] **Final submission by 10:59 PM CT**

## Submission Deliverables

1. **GitHub Repository**
   - Source code
   - README with setup instructions
   - Architecture documentation
   - Build instructions for all platforms

2. **Demo Video (3-5 minutes)**
   - Import clips demonstration
   - Screen + webcam recording
   - Timeline editing (trim, split, arrange)
   - Export process

3. **Packaged Application**
   - macOS: `.dmg` or `.app` bundle
   - Windows: `.exe` installer
   - Linux: `.AppImage` or `.deb`
   - Host on GitHub Releases

4. **Documentation**
   - Installation guide
   - User manual (basic operations)
   - Troubleshooting section
   - Known limitations

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| FFmpeg integration complexity | High | Test export early on Day 1 |
| Screen capture platform differences | High | Focus on one OS first (macOS), stub others |
| Timeline performance with many clips | Medium | Use Canvas rendering, virtual scrolling |
| Export crashes with large files | High | Add memory limits, progress checkpoints |
| Packaging issues | Medium | Test build process on Day 1 |

## Success Metrics

### MVP Success
- App launches and imports video ✅
- Single clip can be trimmed and exported ✅
- Packaged as native app ✅

### Final Success
- All recording modes work
- Multi-clip timeline editing smooth
- Export completes without errors
- Demo video showcases all features
- Code is well-documented

## Out of Scope (v1)

- Cloud collaboration
- Advanced color grading
- Motion graphics / keyframe animation
- Multi-cam editing
- Proxy workflows for 4K footage
- Plugin system
- Mobile companion app

---
