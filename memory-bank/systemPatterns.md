# System Patterns - ClipForge

## Architecture Overview
ClipForge follows a clean separation between frontend (React) and backend (Tauri/Rust) with specific patterns for video editing workflows.

## Core Components

### State Management (Zustand)
```typescript
interface AppState {
  mediaLibrary: MediaFile[];
  timeline: TimelineClip[];
  selectedClip: string | null;
  playheadPosition: number;
  isPlaying: boolean;
}
```

### Media File Structure
```typescript
type MediaFile = {
  id: string;
  path: string;
  name: string;
  durationSec: number;
  width: number;
  height: number;
  sizeBytes: number;
};
```

### Timeline Clip Structure
```typescript
type TimelineClip = {
  id: string;
  mediaId: string;
  startTimeSec: number; // position on timeline
  inSec: number;        // source start time
  outSec: number;       // source end time
};
```

## Layout Contracts (Critical)

### Video Preview Sizing
- **Fixed Logical Size**: 800×450 (16:9 aspect ratio)
- **Responsive Scaling**: Scale down proportionally if window narrower
- **Centering**: Center with max width 800 if window wider
- **No Overflow**: Preview never exceeds available width
- **Stable Position**: Preview position/size never changes due to timeline content

### Timeline Behavior
- **Container**: `width: 100%; overflow-x: auto; overflow-y: hidden;`
- **Fixed Height**: 220-260px (header + ruler + one track)
- **Content Width**: `leftMargin + durationSec * pixelsPerSecond`
- **Scrollbar**: Horizontal scrollbar appears when content wider than container
- **No Growth**: Container never grows wider than parent

## Component Patterns

### Timeline Canvas
- HTML5 Canvas for ruler, playhead, clip blocks, trim handles
- Constant pixels-per-second ratio (zoom out of scope for MVP)
- Red playhead indicator
- Time ruler in mm:ss format

### Video Preview
- HTML5 `<video>` element
- `object-fit: contain` to fill preview region
- Bound to selected media file
- Update `currentTime` on timeline scrub

### Drag & Drop
- Drop supported files anywhere in window → import
- Drop on timeline → append to end of Track 1
- Validate file extensions on frontend
- Handle `tauri://file-drop` events

## Tauri Integration Patterns

### File Operations
- Use open/save dialogs (avoid broad directory access)
- Minimal permissions: file read, dialog access, temp read/write
- FFmpeg integration for probe and export

### FFmpeg Commands
- **Probe**: `ffprobe` or `ffmpeg -i` for metadata
- **Export**: `ffmpeg -ss <inSec> -to <outSec> -i <source> -c:v libx264 -preset fast -crf 22 -c:a aac -movflags +faststart <output.mp4>`

## Error Handling Patterns
- Graceful file validation rejection
- Progress indicators for long operations
- Toast notifications for success/failure
- Fallback UI states for missing media
