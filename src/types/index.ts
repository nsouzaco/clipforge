export type MediaFile = {
  id: string;
  path: string;
  name: string;
  durationSec: number;
  width: number;
  height: number;
  sizeBytes: number;
};

export type TimelineClip = {
  id: string;
  mediaId: string;
  startTimeSec: number; // position on timeline
  inSec: number;        // source start time
  outSec: number;       // source end time
};

export interface AppState {
  mediaLibrary: MediaFile[];
  timeline: TimelineClip[];
  selectedClip: string | null;
  playheadPosition: number;
  isPlaying: boolean;
  zoomLevel: number;
  draggingFile: MediaFile | null;
  dragCursor: { x: number; y: number };
  
  // Actions
  addMediaFile: (file: MediaFile) => void;
  selectClip: (clipId: string | null) => void;
  setPlayheadPosition: (position: number) => void;
  setIsPlaying: (playing: boolean) => void;
  addTimelineClip: (clip: TimelineClip) => void;
  updateTimelineClip: (clipId: string, updates: Partial<TimelineClip>) => void;
  setZoomLevel: (zoom: number) => void;
  startDrag: (file: MediaFile) => void;
  updateDragCursor: (x: number, y: number) => void;
  endDrag: () => void;
  appendClipToEnd: (file: MediaFile) => void;
}
