### ClipForge — MVP Product Requirements Document (clean rewrite)

## Product Snapshot

- **Platform**: Tauri desktop (macOS first, Windows/Linux later)
- **UI**: React + Tailwind
- **Scope (MVP)**: Import → Preview → Trim (single clip) → Export MP4
- **Goal**: Simple, stable native editor with zero layout shifts

## Core Outcomes (MVP)

- Desktop app launches from a packaged bundle (not dev mode)
- Import MP4/MOV via drag & drop and file picker
- Timeline renders imported clips (single track)
- Video preview player plays imported clips
- Basic trim (set in/out) on a single clip
- Export to MP4 (H.264) succeeds to user-chosen path

## Non‑Goals (MVP)

- Multi-track, effects, transitions, text overlays
- Recording/webcam/PiP
- Multi-clip concat export

## UX Contracts (must not break)

- **Video preview sizing**
  - Fixed logical preview region: 800×450 (16:9). If the window is narrower, scale down proportionally; if wider, center with max width 800. The preview must never exceed available width or overflow off-screen.
  - Preview region position and size must never change because of timeline content. Adding long clips or zooming the timeline must not move or resize the preview.
  - `<video>` element uses `object-fit: contain;` and fills the preview region.

- **Timeline behavior**
  - Container: `width: 100%; overflow-x: auto; overflow-y: hidden;` Fixed height 220–260px (header + ruler + one track).
  - Content/canvas width = `leftMargin + durationSec * pixelsPerSecond`. When wider than container, a horizontal scrollbar appears; the container must not grow wider than its parent.
  - Time ruler (mm:ss), red playhead, clip blocks. Zoom out of scope for MVP (constant px/sec).

- **Drag & drop**
  - Dropping supported files anywhere in the window imports them. Dropping on the timeline appends to the end of Track 1.

Acceptance test: Import a 60‑minute clip. The preview remains fixed/centered; only the timeline shows a horizontal scrollbar. No horizontal layout shifts occur.

## Primary Flows

1) **Import**: Drag file or use Import button → probe metadata → add to library → optional auto-append to timeline.
2) **Preview**: Select clip → video loads; Space toggles play/pause; ←/→ seek ±1s.
3) **Trim**: Drag In/Out handles on the single clip; display In, Out, and duration.
4) **Export**: Choose path → encode to MP4 (H.264/AAC) → progress → success toast + reveal in Finder/Explorer.

## Architecture

- **React** for UI/state (Zustand): media library, timeline, playhead.
- **Timeline**: HTML5 Canvas (ruler, playhead, clip block, trim handles).
- **Preview**: HTML5 `<video>` bound to selected media; update `currentTime` on scrub.
- **Rust (Tauri)**: FFmpeg probe + export commands.

### Data Shapes
```ts
type MediaFile = {
  id: string;
  path: string;
  name: string;
  durationSec: number;
  width: number;
  height: number;
  sizeBytes: number;
};

type TimelineClip = {
  id: string;
  mediaId: string;
  startTimeSec: number; // on timeline
  inSec: number;        // source in
  outSec: number;       // source out
};
```


## Tauri Configuration (Capabilities & Permissions)

Use minimal, explicit permissions for file open/save and reading videos.

### Capabilities (`src-tauri/capabilities/default.json`)
```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Main window capability",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "opener:default",
    "dialog:allow-open",
    "dialog:allow-save",
    "fs:allow-read-file",
    "fs:allow-read-text-file",
    "fs:allow-video-read",
    "fs:allow-video-read-recursive",
    "fs:allow-temp-read",
    "fs:allow-temp-write"
  ]
}
```

Guidelines:
- Prefer using open/save dialogs; avoid broad directory access.
- Validate extensions on the frontend; reject unsupported files gracefully.
- Handle `tauri://file-drop` for drag & drop with the same validation.

### App window & bundling (`src-tauri/tauri.conf.json`)
```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "ClipForge",
  "version": "0.1.0",
  "app": {
    "windows": [{
      "label": "main",
      "title": "ClipForge",
      "width": 1280,
      "height": 800,
      "minWidth": 1100,
      "minHeight": 700
    }]
  },
  "bundle": { "targets": ["dmg", "app"] }
}
```

## FFmpeg (MVP)

- Probe metadata: `ffprobe` or `ffmpeg -i` (parse duration/resolution).
- Export trimmed single source:
```bash
ffmpeg -ss <inSec> -to <outSec> -i <source> \
  -c:v libx264 -preset fast -crf 22 -c:a aac -movflags +faststart \
  <output.mp4>
```

## Keyboard Shortcuts

- Play/Pause: Space
- Seek: ←/→ (±1s)
- Import: Cmd/Ctrl + I
- Export: Cmd/Ctrl + E

## Performance Targets

- Launch < 3s (warm)
- Timeline render 60fps (single long clip)
- Preview playback 30fps

## Definition of Done

- `tauri build` produces a launchable bundle (macOS).
- Import via drag & drop and dialog works for MP4/MOV.
- Preview region never resizes or goes off-screen after adding long clips.
- Timeline scrolls horizontally; container width remains 100%.
- Trim in/out reflected in preview and final export.
- Export MP4 at chosen path plays in system player.

## Milestones

- Day 1: Scaffold app; capabilities; import + probe; preview stable
- Day 2: Timeline canvas; playhead; trim handles; export command
- Day 3: Polish layout contracts; errors; packaging; QA pass


