import { create } from 'zustand';
import { AppState, MediaFile, TimelineClip } from '../types';

export const useAppStore = create<AppState>((set, get) => ({
  mediaLibrary: [],
  timeline: [],
  selectedClip: null,
  playheadPosition: 0,
  isPlaying: false,
  zoomLevel: 1, // 1 = 100%, 0.5 = 50%, 2 = 200%
  draggingFile: null,
  dragCursor: { x: 0, y: 0 },

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
    console.log('📝 Store: Updating timeline clip:', { clipId, updates });
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
}));
