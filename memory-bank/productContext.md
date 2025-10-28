# Product Context - ClipForge

## Why This Project Exists
Video editing software is typically complex and resource-heavy. ClipForge addresses the need for a simple, lightweight desktop video editor focused specifically on trimming tasks.

## Problems It Solves
- **Complexity**: Most video editors are overkill for simple trimming tasks
- **Performance**: Heavy editors slow down systems and have long load times
- **Layout Instability**: Many editors have shifting interfaces that disrupt workflow
- **Platform Dependency**: Web-based editors require internet and have limitations

## Target User Experience
- **Instant Launch**: App opens quickly from desktop
- **Drag & Drop**: Simply drag video files to start editing
- **Fixed Preview**: Video preview never moves or resizes unexpectedly
- **Simple Trimming**: Visual handles for setting in/out points
- **One-Click Export**: Save trimmed video with minimal steps

## Core User Flows
1. **Quick Start**: Drag video file → immediate preview → start trimming
2. **Precise Editing**: Use timeline scrubber and trim handles for exact cuts
3. **Export**: Choose save location → progress indicator → file ready

## Design Principles
- **Stability First**: Layout contracts must never break
- **Performance**: Smooth 60fps timeline, responsive preview
- **Simplicity**: Single-track, single-clip focus
- **Native Feel**: Desktop app with system integration

## Success Metrics
- Launch time < 3 seconds
- Timeline renders at 60fps with long clips
- Preview playback at 30fps
- Zero layout shifts during normal operation
- Export produces playable MP4 files
