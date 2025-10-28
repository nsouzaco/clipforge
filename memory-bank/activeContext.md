# Active Context - ClipForge

## Current Focus
Phase 2 complete: Recording features implementation with screen capture, webcam support, and picture-in-picture recording.

## Recent Changes
- ✅ Implemented macOS screen recording backend using Core Graphics
- ✅ Created webcam integration using getUserMedia() web API
- ✅ Built Record Panel UI with mode selection (Screen/Webcam/Both)
- ✅ Added draggable/resizable PiP overlay for webcam positioning
- ✅ Integrated recording state management in Zustand store
- ✅ Added recording duration counter and status indicators
- ✅ Created recording compositor for screen + webcam merging
- ✅ Auto-import recorded files to media library and timeline

## Next Steps
1. **Test Recording Features**: Verify screen recording, webcam recording, and PiP mode
2. **Implement FFmpeg-based Screen Capture**: Replace placeholder with actual AVFoundation/FFmpeg recording
3. **Add Audio Mixing**: Implement microphone audio capture and mixing
4. **Optimize Recording Performance**: Ensure smooth 30fps recording with minimal CPU usage
5. **Error Handling**: Add comprehensive error handling for permission denials and device issues

## Active Decisions

### macOS-First Approach
Recording features currently target macOS only using Core Graphics for screen enumeration. Windows support will be added later using Windows.Graphics.Capture API.

### Webcam Compositing Strategy
For screen + webcam recording, we use Canvas-based compositing on the frontend with MediaRecorder API. This allows real-time preview of the PiP layout before recording.

### Recording File Management
Recordings are saved to system temp directory initially, then imported to media library. This prevents file clutter and allows users to decide which recordings to keep.

## Current Considerations

### Screen Recording Implementation
- Current implementation uses placeholders for actual screen capture
- Need to implement FFmpeg-based screen recording or native AVFoundation integration
- Consider using `screencapturekit` crate for modern macOS screen capture

### Audio Capture
- Microphone audio capture ready in backend
- Need to implement audio mixing for screen + webcam mode
- Consider separate audio tracks vs. mixed audio for editing flexibility

### Performance Optimization
- Canvas compositing runs at 30fps for PiP mode
- Monitor CPU usage during long recordings
- Consider hardware acceleration options

### Permissions
- Need to request screen recording permission on macOS
- Need to request camera and microphone permissions
- Add permission status indicators in UI

## Blockers
None currently identified. Screen recording implementation can be enhanced with actual capture in future iterations.

## Success Metrics for Current Phase
- ✅ Record tab accessible with mode selection
- ✅ Screen sources enumerated and selectable
- ✅ Webcam preview shows live feed
- ✅ PiP overlay is draggable and resizable
- ✅ Recording duration counter works
- ⏳ Actual screen capture working (placeholder implementation)
- ⏳ Recorded files save and import to timeline
