# ClipForge Development Tasks

## Project Overview
Building a native desktop video editor with Tauri, React, and Tailwind CSS. Focus on simple video trimming with stable, non-shifting layout.

## Phase 1: Foundation Setup (Day 1)

### 1.1 Project Scaffolding
- [ ] Initialize Tauri project with React template
- [ ] Set up Tailwind CSS configuration
- [ ] Configure TypeScript with proper types
- [ ] Set up basic project structure (components, stores, utils)
- [ ] Configure development scripts and build process

### 1.2 Tauri Configuration
- [ ] Set up minimal capabilities for file operations
- [ ] Configure app window settings (1280×800, min 1100×700)
- [ ] Set up bundle targets (DMG, APP for macOS)
- [ ] Configure permissions for file read/write and dialogs

### 1.3 Core State Management
- [ ] Create Zustand store for media library
- [ ] Define TypeScript types (MediaFile, TimelineClip)
- [ ] Set up state for selected clip and playhead position
- [ ] Implement basic state actions (add media, select clip)

### 1.4 Import System
- [ ] Implement drag & drop functionality
- [ ] Create file picker dialog integration
- [ ] Add file validation (MP4, MOV only)
- [ ] Set up FFmpeg integration for metadata probing
- [ ] Handle import errors gracefully

### 1.5 Video Preview Player
- [ ] Create fixed-size preview component (800×450 logical)
- [ ] Implement responsive scaling and centering
- [ ] Set up HTML5 video element with object-fit: contain
- [ ] Ensure preview never resizes due to timeline content
- [ ] Add basic play/pause functionality

## Phase 2: Timeline & Editing (Day 2)

### 2.1 Timeline Canvas
- [ ] Create HTML5 Canvas timeline component
- [ ] Implement time ruler with mm:ss format
- [ ] Add red playhead indicator
- [ ] Render clip blocks on timeline
- [ ] Set up horizontal scrolling for long clips

### 2.2 Timeline Interactions
- [ ] Implement timeline scrubbing
- [ ] Add click-to-seek functionality
- [ ] Create trim handles for in/out points
- [ ] Implement drag-to-trim functionality
- [ ] Update preview when trimming

### 2.3 Playback Controls
- [ ] Add play/pause button
- [ ] Implement Space key for play/pause
- [ ] Add ←/→ keys for ±1s seeking
- [ ] Sync playhead with video playback
- [ ] Handle video end events

### 2.4 Export System
- [ ] Create export dialog for file path selection
- [ ] Implement FFmpeg export command
- [ ] Add progress indicator for export
- [ ] Handle export errors and success states
- [ ] Add "Reveal in Finder" functionality

## Phase 3: Polish & Packaging (Day 3)

### 3.1 Keyboard Shortcuts
- [ ] Implement Cmd/Ctrl + I for import
- [ ] Add Cmd/Ctrl + E for export
- [ ] Ensure Space, ←/→ work globally
- [ ] Add keyboard shortcut help/display

### 3.2 Error Handling & UX
- [ ] Add toast notifications for success/error
- [ ] Implement loading states for long operations
- [ ] Add error boundaries for React components
- [ ] Create fallback UI for missing media
- [ ] Validate layout contracts don't break

### 3.3 Performance Optimization
- [ ] Optimize timeline rendering for 60fps
- [ ] Ensure preview playback at 30fps
- [ ] Minimize memory usage for long videos
- [ ] Test with 60-minute clips
- [ ] Optimize FFmpeg command performance

### 3.4 Packaging & Distribution
- [ ] Configure app metadata and icons
- [ ] Set up code signing for macOS
- [ ] Create DMG installer
- [ ] Test packaged app functionality
- [ ] Document installation requirements (FFmpeg)

## Acceptance Criteria

### Core Functionality
- [ ] App launches from packaged bundle (not dev mode)
- [ ] Import MP4/MOV via drag & drop and file picker
- [ ] Timeline renders imported clips with horizontal scroll
- [ ] Video preview plays imported clips with fixed sizing
- [ ] Basic trim (set in/out) on single clip works
- [ ] Export to MP4 (H.264) succeeds to user-chosen path

### Layout Contracts (Critical)
- [ ] Video preview never resizes due to timeline content
- [ ] Preview maintains 800×450 logical size, scales proportionally
- [ ] Timeline container width stays 100%, scrolls horizontally
- [ ] No horizontal layout shifts when adding long clips
- [ ] Preview never overflows off-screen

### Performance Targets
- [ ] Launch time < 3 seconds (warm)
- [ ] Timeline render 60fps with single long clip
- [ ] Preview playback 30fps
- [ ] Export completes successfully

## Testing Plan

### Manual Testing
- [ ] Import 60-minute clip, verify preview stays fixed
- [ ] Test drag & drop with various file formats
- [ ] Verify trim handles work correctly
- [ ] Test export with different video lengths
- [ ] Check keyboard shortcuts work globally

### Layout Contract Testing
- [ ] Resize window, verify preview scaling
- [ ] Add long clips, verify no layout shifts
- [ ] Test timeline scrolling behavior
- [ ] Verify preview centering with wide windows

### Performance Testing
- [ ] Measure launch time
- [ ] Test timeline performance with long clips
- [ ] Monitor memory usage during editing
- [ ] Verify smooth playback performance

## Dependencies & Requirements

### System Requirements
- macOS (primary), Windows/Linux (future)
- FFmpeg installed on system
- Node.js v18+
- Rust (latest stable)

### External Dependencies
- Tauri CLI
- FFmpeg for video processing
- System file dialogs for import/export

## Risk Mitigation

### Technical Risks
- **FFmpeg Availability**: Provide clear installation instructions
- **Performance**: Test early with long clips, optimize Canvas rendering
- **Layout Stability**: Implement strict CSS constraints, test thoroughly

### User Experience Risks
- **File Format Support**: Clear error messages for unsupported files
- **Export Failures**: Robust error handling and user feedback
- **Learning Curve**: Intuitive drag & drop interface

## Success Metrics
- All acceptance criteria met
- Layout contracts never broken
- Performance targets achieved
- Packaged app launches successfully
- Export produces playable MP4 files
