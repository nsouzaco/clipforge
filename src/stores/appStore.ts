import { create } from 'zustand';
import { AppState, MediaFile, TimelineClip, PendingTrim, RecordingMode, ScreenSource, PiPPosition } from '../types';

export const useAppStore = create<AppState>((set, get) => ({
  mediaLibrary: [],
  timeline: [],
  selectedClip: null,
  playheadPosition: 0,
  isPlaying: false,
  zoomLevel: 1, // 1 = 100%, 0.5 = 50%, 2 = 200%
  draggingFile: null,
  dragCursor: { x: 0, y: 0 },
  pendingTrim: null,
  
  // Recording state
  isRecording: false,
  recordingMode: 'screen' as RecordingMode,
  screenSources: [],
  selectedScreenSource: null,
  webcamEnabled: false,
  audioEnabled: true,
  recordingDuration: 0,
  pipPosition: { x: 20, y: 20, width: 320, height: 240 },

  addMediaFile: (file: MediaFile) => {
    set((state) => ({
      mediaLibrary: [...state.mediaLibrary, file]
    }));
  },

  selectClip: (clipId: string | null) => {
    set({ selectedClip: clipId });
  },

  setPlayheadPosition: (position: number) => {
    set({ playheadPosition: position });
  },

  setIsPlaying: (playing: boolean) => {
    set({ isPlaying: playing });
  },

  addTimelineClip: (clip: TimelineClip) => {
    set((state) => ({
      timeline: [...state.timeline, clip]
    }));
  },

  updateTimelineClip: (clipId: string, updates: Partial<TimelineClip>) => {
    set((state) => ({
      timeline: state.timeline.map(clip => 
        clip.id === clipId ? { ...clip, ...updates } : clip
      )
    }));
  },

  setZoomLevel: (zoom: number) => {
    set({ zoomLevel: Math.max(0.1, Math.min(5, zoom)) }); // Clamp between 0.1x and 5x
  },

  startDrag: (file: MediaFile) => {
    set({ draggingFile: file });
  },

  updateDragCursor: (x: number, y: number) => {
    set({ dragCursor: { x, y } });
  },

  endDrag: () => {
    set({ draggingFile: null });
  },

  appendClipToEnd: (file: MediaFile) => {
    const { timeline } = get();
    
    // Calculate end position of timeline
    const endPosition = timeline.reduce((max, clip) => {
      const clipEnd = clip.startTimeSec + (clip.outSec - clip.inSec);
      return Math.max(max, clipEnd);
    }, 0);

    const newClip: TimelineClip = {
      id: Math.random().toString(36).substr(2, 9),
      mediaId: file.id,
      startTimeSec: endPosition,
      inSec: 0,
      outSec: file.durationSec,
    };

    set((state) => ({
      timeline: [...state.timeline, newClip],
      selectedClip: file.id, // Auto-select the added clip
    }));
  },

  setPendingTrim: (trim: PendingTrim | null) => {
    set({ pendingTrim: trim });
  },

  confirmTrim: () => {
    const { pendingTrim, timeline } = get();
    if (!pendingTrim) return;

    console.log('✅ Confirming trim:', pendingTrim);

    // Update the clip with new trim values
    const updatedTimeline = timeline.map(clip =>
      clip.id === pendingTrim.clipId
        ? { ...clip, inSec: pendingTrim.newInSec, outSec: pendingTrim.newOutSec }
        : clip
    );

    set({ timeline: updatedTimeline, pendingTrim: null });

    // Reorder timeline to close gaps
    get().reorderTimeline();
  },

  cancelTrim: () => {
    const { pendingTrim } = get();
    if (!pendingTrim) return;

    console.log('❌ Canceling trim, reverting to original values');

    // Revert to old values
    set((state) => ({
      timeline: state.timeline.map(clip =>
        clip.id === pendingTrim.clipId
          ? { ...clip, inSec: pendingTrim.oldInSec, outSec: pendingTrim.oldOutSec }
          : clip
      ),
      pendingTrim: null
    }));
  },

  reorderTimeline: () => {
    const { timeline } = get();
    
    console.log('🔄 Reordering timeline to close gaps...');

    // Sort clips by their current startTimeSec
    const sortedClips = [...timeline].sort((a, b) => a.startTimeSec - b.startTimeSec);

    // Reposition clips to be adjacent (no gaps)
    let currentPosition = 0;
    const reorderedClips = sortedClips.map(clip => {
      const clipDuration = clip.outSec - clip.inSec;
      const updatedClip = { ...clip, startTimeSec: currentPosition };
      currentPosition += clipDuration;
      return updatedClip;
    });

    set({ timeline: reorderedClips });
    console.log('✅ Timeline reordered');
  },
  
  // Recording actions
  setIsRecording: (recording: boolean) => {
    set({ isRecording: recording });
  },
  
  setRecordingMode: (mode: RecordingMode) => {
    set({ recordingMode: mode });
  },
  
  setScreenSources: (sources: ScreenSource[]) => {
    set({ screenSources: sources });
  },
  
  setSelectedScreenSource: (sourceId: string | null) => {
    set({ selectedScreenSource: sourceId });
  },
  
  setWebcamEnabled: (enabled: boolean) => {
    set({ webcamEnabled: enabled });
  },
  
  setAudioEnabled: (enabled: boolean) => {
    set({ audioEnabled: enabled });
  },
  
  setRecordingDuration: (duration: number | ((prev: number) => number)) => {
    set((state) => ({
      recordingDuration: typeof duration === 'function' ? duration(state.recordingDuration) : duration
    }));
  },
  
  setPipPosition: (position: PiPPosition) => {
    set({ pipPosition: position });
  },
}));
