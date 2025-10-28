# ClipForge - Project Brief

## Project Overview
ClipForge is a native desktop video editor built with Tauri, React, and Tailwind CSS. The MVP focuses on simple video trimming functionality with a clean, stable interface.

## Core Mission
Create a simple, stable native video editor that allows users to:
- Import MP4/MOV files via drag & drop or file picker
- Preview videos with fixed, non-shifting layout
- Trim single clips with in/out points
- Export trimmed videos to MP4 format

## Key Constraints
- **Platform**: Tauri desktop app (macOS first)
- **UI**: React + Tailwind CSS
- **Scope**: Single clip trimming only (no multi-track, effects, transitions)
- **Layout Stability**: Video preview must never resize or shift due to timeline content
- **Performance**: 60fps timeline rendering, <3s launch time

## Success Criteria
- Desktop app launches from packaged bundle
- Import works via drag & drop and file picker
- Timeline renders with horizontal scroll for long clips
- Video preview maintains fixed 800×450 logical size
- Trim functionality works with visual handles
- Export produces playable MP4 files
- No layout shifts when adding long clips

## Technical Foundation
- **Frontend**: React with Zustand for state management
- **Backend**: Rust (Tauri) for FFmpeg integration
- **Timeline**: HTML5 Canvas for rendering
- **Preview**: HTML5 video element with object-fit: contain
- **Export**: FFmpeg with H.264/AAC encoding

## Timeline
- Day 1: Scaffold app, capabilities, import + probe, preview stability
- Day 2: Timeline canvas, playhead, trim handles, export command  
- Day 3: Polish layout contracts, errors, packaging, QA pass
