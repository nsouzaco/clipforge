# Active Context - ClipForge

## Current Focus
Setting up the foundational Tauri + React project structure and implementing core import functionality.

## Recent Changes
- Created comprehensive memory bank documentation
- Established project structure and technical requirements
- Defined clear layout contracts and UX constraints

## Next Steps
1. **Initialize Tauri Project**: Set up React + Tailwind + Tauri scaffold
2. **Configure Capabilities**: Set up minimal file access permissions
3. **Build Import System**: Implement drag & drop and file picker
4. **Create Preview Player**: Build fixed-size video preview component
5. **Develop Timeline**: Canvas-based timeline with ruler and playhead

## Active Decisions

### Layout Stability Priority
The video preview sizing contract is critical - it must never resize or shift due to timeline content. This drives many architectural decisions.

### Single-Clip Focus
MVP scope is intentionally limited to single-clip trimming to ensure stability and performance targets are met.

### Canvas-Based Timeline
Using HTML5 Canvas for timeline rendering to achieve 60fps performance with long clips.

## Current Considerations

### FFmpeg Integration
- Need to ensure FFmpeg is available on target systems
- Consider bundling or providing clear installation instructions
- Handle FFmpeg errors gracefully

### File Validation
- Frontend validation for supported formats (MP4, MOV)
- Graceful rejection of unsupported files
- Clear error messages for users

### State Management
- Zustand store structure for media library and timeline
- Efficient updates for timeline rendering
- Proper cleanup of video resources

## Blockers
None currently identified.

## Success Metrics for Current Phase
- Tauri app launches successfully
- Import functionality works via drag & drop and file picker
- Video preview displays with correct sizing constraints
- Basic timeline structure renders
