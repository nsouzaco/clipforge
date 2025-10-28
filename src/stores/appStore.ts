import { create } from 'zustand';
import { AppState, MediaFile, TimelineClip } from '../types';

export const useAppStore = create<AppState>((set) => ({
  mediaLibrary: [],
  timeline: [],
  selectedClip: null,
  playheadPosition: 0,
  isPlaying: false,
  zoomLevel: 1, // 1 = 100%, 0.5 = 50%, 2 = 200%

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
}));
