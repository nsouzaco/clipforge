export type MediaFile = {
  id: string;
  path: string; // Actual file system path for FFmpeg
  previewUrl: string; // Browser-compatible URL for video player
  name: string;
  durationSec: number;
  width: number;
  height: number;
  sizeBytes: number;
  transcript?: string; // AI-generated transcript
  transcriptLoading?: boolean; // Loading state for transcript generation
};

export type ScreenSource = {
  id: string;
  name: string;
  is_window: boolean;
};

export type RecordingOptions = {
  include_audio: boolean;
  audio_device: string | null;
};

export type RecordingMode = 'screen' | 'webcam' | 'screen-webcam';

export type PiPPosition = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type TimelineClip = {
  id: string;
  mediaId: string;
  startTimeSec: number; // position on timeline
  inSec: number;        // source start time
  outSec: number;       // source end time
};

export type PendingTrim = {
  clipId: string;
  oldInSec: number;
  oldOutSec: number;
  newInSec: number;
  newOutSec: number;
  type: 'left' | 'right';
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
  pendingTrim: PendingTrim | null;
  
  // Recording state
  isRecording: boolean;
  recordingMode: RecordingMode;
  screenSources: ScreenSource[];
  selectedScreenSource: string | null;
  webcamEnabled: boolean;
  audioEnabled: boolean;
  recordingDuration: number;
  pipPosition: PiPPosition;
  
  // Actions
  addMediaFile: (file: MediaFile) => void;
  updateMediaFile: (fileId: string, updates: Partial<MediaFile>) => void;
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
  setPendingTrim: (trim: PendingTrim | null) => void;
  confirmTrim: () => void;
  cancelTrim: () => void;
  reorderTimeline: () => void;
  removeTimelineClip: (clipId: string) => void;
  
  // Recording actions
  setIsRecording: (recording: boolean) => void;
  setRecordingMode: (mode: RecordingMode) => void;
  setScreenSources: (sources: ScreenSource[]) => void;
  setSelectedScreenSource: (sourceId: string | null) => void;
  setWebcamEnabled: (enabled: boolean) => void;
  setAudioEnabled: (enabled: boolean) => void;
  setRecordingDuration: (duration: number | ((prev: number) => number)) => void;
  setPipPosition: (position: PiPPosition) => void;
}
