import { create } from 'zustand';

export interface Clip {
  id: string;
  sourceFile: string;
  startTime: number;
  duration: number;
  trimStart: number;
  trimEnd: number;
  track: number;
}

export interface MediaFile {
  id: string;
  path: string;
  name: string;
  duration: number;
  resolution: { width: number; height: number };
  thumbnail?: string;
  size: number;
  fps?: number;
  codec?: string;
}

export interface TimelineState {
  clips: Clip[];
  playheadPosition: number;
  zoomLevel: number;
  selectedClips: string[];
  totalDuration: number;
}

interface AppStore {
  // State
  timeline: TimelineState;
  mediaLibrary: MediaFile[];
  recording: any;
  exportProgress: number;
  isExporting: boolean;

  // Actions
  setPlayheadPosition: (position: number) => void;
  addClip: (clip: Clip) => void;
  updateClip: (id: string, updates: Partial<Clip>) => void;
  deleteClip: (id: string) => void;
  selectClip: (id: string) => void;
  deselectClip: (id: string) => void;
  addMediaFile: (file: MediaFile) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  // Initial state
  timeline: {
    clips: [],
    playheadPosition: 0,
    zoomLevel: 1.0,
    selectedClips: [],
    totalDuration: 0,
  },
  mediaLibrary: [],
  recording: null,
  exportProgress: 0,
  isExporting: false,

  // Actions
  setPlayheadPosition: (position) =>
    set((state) => ({
      timeline: { ...state.timeline, playheadPosition: position },
    })),
  
  addClip: (clip) => {
    set((state) => {
      const newClips = [...state.timeline.clips, clip];
      return {
        timeline: {
          ...state.timeline,
          clips: newClips,
        },
      };
    });
  },
  
  updateClip: (id, updates) =>
    set((state) => ({
      timeline: {
        ...state.timeline,
        clips: state.timeline.clips.map((clip) =>
          clip.id === id ? { ...clip, ...updates } : clip
        ),
      },
    })),
  
  deleteClip: (id) =>
    set((state) => ({
      timeline: {
        ...state.timeline,
        clips: state.timeline.clips.filter((clip) => clip.id !== id),
        selectedClips: state.timeline.selectedClips.filter((clipId) => clipId !== id),
      },
    })),
  
  selectClip: (id) => {
    set((state) => {
      const newSelectedClips = state.timeline.selectedClips.includes(id)
        ? state.timeline.selectedClips
        : [...state.timeline.selectedClips, id];
      return {
        timeline: {
          ...state.timeline,
          selectedClips: newSelectedClips,
        },
      };
    });
  },
  
  deselectClip: (id) =>
    set((state) => ({
      timeline: {
        ...state.timeline,
        selectedClips: state.timeline.selectedClips.filter((clipId) => clipId !== id),
      },
    })),
  
  addMediaFile: (file) => {
    set((state) => {
      const newLibrary = [...state.mediaLibrary, file];
      return {
        mediaLibrary: newLibrary,
      };
    });
  },
}));

