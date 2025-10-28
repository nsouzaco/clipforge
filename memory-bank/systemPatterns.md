# System Patterns

## Architecture Overview

ClipForge follows a layered architecture:
1. **Frontend (React):** UI, state management, user interactions
2. **Tauri API:** Communication layer between JS and Rust
3. **Backend (Rust):** File operations, media processing, native APIs

## Core Data Structures

### Clip Structure
```typescript
interface Clip {
  id: string;
  sourceFile: string;
  startTime: number;      // Timeline position in seconds
  duration: number;       // Clip duration in seconds
  trimStart: number;      // Trim start from source (seconds)
  trimEnd: number;        // Trim end from source (seconds)
  track: number;          // Track number (0-based)
}
```

### Timeline State
```typescript
interface TimelineState {
  clips: Clip[];
  playheadPosition: number;
  zoomLevel: number;      // 0.1 to 1.0 (10% to 100%)
  selectedClips: string[]; // Clip IDs
  totalDuration: number;
}
```

### Media Library State
```typescript
interface MediaLibrary {
  files: MediaFile[];
}

interface MediaFile {
  id: string;
  path: string;
  name: string;
  duration: number;
  resolution: { width: number; height: number };
  thumbnail?: string; // Base64 or file path
  size: number;      // File size in bytes
}
```

## Key Patterns

### 1. Timeline Rendering
- Use HTML5 Canvas for 60fps performance
- Render playhead, time ruler, and clips
- Update on playhead change, zoom, or clip manipulation
- Virtual scrolling for long timelines

### 2. State Management (Zustand)
```typescript
interface AppStore {
  timeline: TimelineState;
  mediaLibrary: MediaLibrary;
  recording: RecordingState;
  exportProgress: number;
  
  // Actions
  addClip: (clip: Clip) => void;
  updateClip: (id: string, updates: Partial<Clip>) => void;
  deleteClip: (id: string) => void;
}
```

### 3. FFmpeg Command Building
- Rust functions generate FFmpeg commands
- Use filter_complex for advanced operations
- Progress parsing via `-progress pipe:1`
- Error handling with user-friendly messages

### 4. Recording Flow
1. User selects source (screen/webcam)
2. Frontend requests stream via MediaRecorder API
3. Stream captured and saved to temporary file
4. File auto-imported to timeline
5. User can edit/export

### 5. Export Flow
1. User configures export settings
2. Frontend sends export config to Rust
3. Rust builds FFmpeg concat command
4. Rust executes FFmpeg with progress callbacks
5. Frontend displays progress bar
6. On completion, show success/error

## Component Hierarchy

```
App
├── MediaLibrary (left panel)
│   ├── MediaFileGrid
│   └── MediaFileCard
├── VideoPreview (center)
│   └── VideoControls
├── Timeline (bottom)
│   ├── TimeRuler
│   ├── TrackLayers
│   └── Playhead
└── TopBar
    ├── RecordButton
    └── ExportButton
```

## Communication Patterns

### Tauri Commands (Frontend → Rust)
```rust
#[tauri::command]
fn import_video(path: String) -> Result<VideoMetadata>;
#[tauri::command]
fn export_video(config: ExportConfig) -> Result<()>;
#[tauri::command]
fn get_screen_sources() -> Result<Vec<ScreenSource>>;
```

### Tauri Events (Rust → Frontend)
```typescript
import { listen } from '@tauri-apps/api/event';

listen('export_progress', (event) => {
  setProgress(event.payload.percent);
});
```

## Design Decisions

### Why Canvas for Timeline?
- Better performance for 60fps rendering
- Easier to draw custom clip representations
- Smooth dragging and animations

### Why Zustand over Context?
- Simpler API than Context
- Better performance for frequent updates
- TypeScript support built-in

### Why FFmpeg over Rust libraries?
- FFmpeg is battle-tested and complete
- Supports all necessary codecs
- Cross-platform compatibility
- Well-documented

