# Video Playback Debugging - Comprehensive Context

## Project Overview
**ClipForge** is a Tauri + React desktop video editor. The application successfully imports videos, generates thumbnails, and displays them in a timeline, but **video playback is not working** despite the video element being ready and blob URLs being created successfully.

## Current Status
- ✅ **Video Import**: Working (FFmpeg metadata extraction successful)
- ✅ **Thumbnail Generation**: Working (FFmpeg-based thumbnails generated)
- ✅ **Timeline Display**: Working (clips appear on timeline)
- ✅ **Blob URL Creation**: Working (blob URLs created successfully)
- ❌ **Video Playback**: NOT WORKING (play() succeeds but video doesn't actually play)

## Technical Stack
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Tauri (Rust)
- **State Management**: Zustand
- **Video Processing**: FFmpeg via Rust subprocess calls
- **File Handling**: Tauri FS plugin + blob URLs

## Current Issue Details

### What Works
1. **Video Import**: Files are successfully imported with FFmpeg metadata extraction
2. **Blob URL Creation**: Videos are loaded into memory and blob URLs are created
3. **Video Element State**: `readyState: 4` (ready to play), `networkState: 1` (loaded)
4. **Play Function**: `video.play()` succeeds without throwing errors

### What Doesn't Work
1. **Actual Playback**: Video doesn't start playing despite successful `play()` call
2. **Time Updates**: `currentTime` remains 0, no `timeupdate` events fire
3. **Visual Playback**: No video frames are displayed

### Console Logs from User
```
[Log] 🎮 Play/pause clicked. Current state: – {isPlaying: false, paused: true, readyState: 4, …}
[Log] 🎬 Attempting to play video...
[Log] 🎬 Video element state before play: – {readyState: 4, networkState: 1, src: "blob:http://localhost:1420/637d6479-608a-4d6c-811c-af03a2cfc9cf", …}
```

## Code Files

### 1. VideoPreview.tsx (Main Video Component)
```typescript
import React, { useRef, useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { convertFileSrc } from '@tauri-apps/api/core';

console.log('VideoPreview component loaded');

export const VideoPreview: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string>('');
  const { timeline, mediaLibrary, setPlayheadPosition, deleteClip } = useAppStore();

  // Get the currently selected clip, or auto-select the first clip
  const selectedClip = timeline.clips.find(
    (clip) => timeline.selectedClips.includes(clip.id)
  ) || timeline.clips[0]; // Fallback to first clip if none selected
  
  // Get the media file for the selected clip
  const currentMedia = selectedClip
    ? mediaLibrary.find((file) => file.path === selectedClip.sourceFile)
    : null;
    
  console.log('🎬 VideoPreview - Selected clip:', selectedClip?.id, 'Current media:', currentMedia?.name);

  useEffect(() => {
    if (!currentMedia) {
      setVideoSrc('');
      setIsPlaying(false);
      setIsLoading(false);
      return;
    }
    
    console.log('🎥 Loading video:', currentMedia.path);
    
    const loadVideo = async () => {
      try {
        setIsLoading(true);
        
        // Clean up previous blob URL if it exists
        if (videoSrc && videoSrc.startsWith('blob:')) {
          URL.revokeObjectURL(videoSrc);
        }
        
        // Try multiple approaches for video loading
        let src = '';
        let success = false;
        
        // Approach 1: Try blob URL first (most reliable)
        try {
          console.log('🔄 Attempting blob URL creation...');
          const { readFile } = await import('@tauri-apps/plugin-fs');
          const fileData = await readFile(currentMedia.path);
          
          // Determine MIME type based on file extension
          const extension = currentMedia.path.toLowerCase().split('.').pop();
          let mimeType = 'video/mp4'; // default
          if (extension === 'mov') mimeType = 'video/quicktime';
          else if (extension === 'webm') mimeType = 'video/webm';
          else if (extension === 'avi') mimeType = 'video/x-msvideo';
          else if (extension === 'mkv') mimeType = 'video/x-matroska';
          
          console.log('📁 Detected MIME type:', mimeType, 'for extension:', extension);
          const blob = new Blob([fileData], { type: mimeType });
          src = URL.createObjectURL(blob);
          console.log('📁 Created blob URL:', src);
          success = true;
        } catch (error) {
          console.error('❌ Blob URL creation failed:', error);
        }
        
        // Approach 2: Try convertFileSrc with http protocol
        if (!success) {
          try {
            src = convertFileSrc(currentMedia.path, 'http');
            console.log('📁 Converted file src (http):', src);
            success = true;
          } catch (error) {
            console.error('❌ HTTP protocol failed:', error);
          }
        }
        
        // Approach 3: Try convertFileSrc with asset protocol
        if (!success) {
          try {
            src = convertFileSrc(currentMedia.path, 'asset');
            console.log('📁 Converted file src (asset):', src);
            success = true;
          } catch (error) {
            console.error('❌ Asset protocol failed:', error);
          }
        }
        
        // Approach 4: Try convertFileSrc without protocol (default)
        if (!success) {
          try {
            src = convertFileSrc(currentMedia.path);
            console.log('📁 Converted file src (default):', src);
            success = true;
          } catch (error) {
            console.error('❌ Default protocol failed:', error);
          }
        }
        
        // Approach 5: Last resort - direct file path
        if (!success) {
          src = `file://${currentMedia.path}`;
          console.log('📁 Using direct file path:', src);
        }
        
        console.log('📁 Final video src:', src);
        console.log('📁 Original path:', currentMedia.path);
        setVideoSrc(src);
        
        // Force video to load after setting src
        setTimeout(() => {
          const video = videoRef.current;
          if (video && video.src !== src) {
            console.log('🔄 Forcing video load...');
            video.load();
          }
        }, 100);
        
        // Set a timeout to prevent infinite loading
        setTimeout(() => {
          if (isLoading) {
            console.warn('⚠️ Video loading timeout - stopping loading animation');
            setIsLoading(false);
          }
        }, 10000); // 10 second timeout
        
      } catch (error) {
        console.error('❌ Failed to load video:', error);
        setIsLoading(false);
      }
    };
    
    loadVideo();
    
    // Cleanup function
    return () => {
      if (videoSrc && videoSrc.startsWith('blob:')) {
        URL.revokeObjectURL(videoSrc);
      }
    };
  }, [currentMedia, isLoading]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => {
      setCurrentTime(video.currentTime);
      setPlayheadPosition(video.currentTime);
    };

    const updateDuration = () => {
      console.log('📊 Video duration loaded:', video.duration);
      setDuration(video.duration);
    };

    const handlePlay = () => {
      console.log('▶️ Video started playing');
      setIsPlaying(true);
    };

    const handlePause = () => {
      console.log('⏸️ Video paused');
      setIsPlaying(false);
    };

    const handleEnded = () => {
      console.log('🏁 Video ended');
      setIsPlaying(false);
    };

    const handleLoadStart = () => {
      console.log('🔄 Video load started');
    };

    const handleLoadedData = () => {
      console.log('📊 Video data loaded');
    };

    const handleCanPlay = () => {
      console.log('✅ Video can play');
    };

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [setPlayheadPosition]);

  const handlePlayPause = async () => {
    const video = videoRef.current;
    if (!video || !currentMedia) {
      console.log('⚠️ No video element or media');
      return;
    }

    console.log('🎮 Play/pause clicked. Current state:', {
      isPlaying,
      paused: video.paused,
      readyState: video.readyState,
      src: video.src,
      videoSrc,
      currentMedia: currentMedia.name
    });

    if (isPlaying) {
      video.pause();
    } else {
      try {
        console.log('🎬 Attempting to play video...');
        console.log('🎬 Video element state before play:', {
          readyState: video.readyState,
          networkState: video.networkState,
          src: video.src,
          videoSrc,
          currentMedia: currentMedia.name
        });
        
        try {
          await video.play();
          console.log('✅ Video play() succeeded');
        } catch (playError) {
          console.warn('⚠️ First play attempt failed, trying with muted:', playError);
          // Try playing muted (browser autoplay policy)
          video.muted = true;
          await video.play();
          console.log('✅ Video play() succeeded (muted)');
          // Unmute after starting
          setTimeout(() => {
            video.muted = false;
            console.log('🔊 Video unmuted');
          }, 100);
        }
        console.log('🎬 Video state after play:', {
          paused: video.paused,
          currentTime: video.currentTime,
          readyState: video.readyState,
          networkState: video.networkState
        });
        
        // Check if video is actually playing
        setTimeout(() => {
          console.log('🎬 Video state 100ms after play:', {
            paused: video.paused,
            currentTime: video.currentTime,
            readyState: video.readyState,
            networkState: video.networkState
          });
        }, 100);
        
        // Check video tracks and capabilities
        console.log('🎬 Video tracks:', {
          videoTracks: video.videoTracks?.length || 0,
          audioTracks: video.audioTracks?.length || 0,
          textTracks: video.textTracks?.length || 0,
          duration: video.duration,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight
        });
        
        // Check video element visibility and dimensions
        const rect = video.getBoundingClientRect();
        console.log('🎬 Video element dimensions:', {
          width: rect.width,
          height: rect.height,
          visible: rect.width > 0 && rect.height > 0,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight
        });
      } catch (error) {
        console.error('❌ Failed to play video:', error);
        console.error('❌ Video element state:', {
          readyState: video.readyState,
          networkState: video.networkState,
          error: video.error,
          src: video.src,
          videoSrc
        });
        
        // Try to reload the video if play fails
        if (video.error) {
          console.log('🔄 Attempting to reload video...');
          video.load();
        }
      }
    }
  };

  const handleStop = () => {
    const video = videoRef.current;
    if (!video) return;

    video.pause();
    video.currentTime = 0;
    setIsPlaying(false);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const time = parseFloat(e.target.value);
    video.currentTime = time;
    setCurrentTime(time);
    setPlayheadPosition(time);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const vol = parseFloat(e.target.value);
    video.volume = vol;
    setVolume(vol);
  };

  const handlePlaybackRateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const rate = parseFloat(e.target.value);
    video.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const handleRemoveClip = () => {
    if (selectedClip) {
      console.log('🗑️ Removing clip:', selectedClip.id);
      deleteClip(selectedClip.id);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 bg-gray-900 flex flex-col min-h-0">
      {/* Video Display Area */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-hidden relative">
        {currentMedia ? (
          <div className="w-full h-full flex items-center justify-center">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 z-10 rounded-lg">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-gray-300 text-sm">Loading video...</p>
                </div>
              </div>
            )}
            <video
              ref={videoRef}
              src={videoSrc}
              className="max-w-[80%] max-h-[80%] bg-black object-contain rounded-lg shadow-2xl"
              controls={false}
              preload="metadata"
              playsInline
              onLoadStart={() => {
                console.log('🔄 Video load started, src:', videoSrc);
              }}
              onLoadedMetadata={() => {
                console.log('✅ Video metadata loaded');
                setIsLoading(false);
              }}
              onLoadedData={() => {
                console.log('📊 Video data loaded');
                setIsLoading(false);
              }}
              onCanPlay={() => {
                console.log('✅ Video can play');
                setIsLoading(false);
              }}
              onError={(e) => {
                console.error('❌ Video error:', e);
                console.error('❌ Video error details:', videoRef.current?.error);
                console.error('❌ Video src:', videoSrc);
                console.error('❌ Video network state:', videoRef.current?.networkState);
                console.error('❌ Video ready state:', videoRef.current?.readyState);
                setIsLoading(false);
              }}
            />
          </div>
        ) : (
          <div className="text-center">
            <svg className="w-24 h-24 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-400 text-lg mb-2">No clip at current position</p>
            <p className="text-gray-500 text-sm">Drag clips from the media library to the timeline</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 border-t border-gray-700 px-6 py-4">
        <div className="flex items-center gap-4">
          {/* Play/Stop Buttons */}
          <button
            onClick={handlePlayPause}
            className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
            disabled={!currentMedia}
          >
            {isPlaying ? (
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          
          <button
            onClick={handleStop}
            className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center hover:bg-gray-600 transition-colors disabled:bg-gray-800 disabled:cursor-not-allowed"
            disabled={!currentMedia}
          >
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h12v12H6z" />
            </svg>
          </button>

          {/* Remove Clip Button */}
          <button
            onClick={handleRemoveClip}
            className="w-10 h-10 bg-red-600 rounded flex items-center justify-center hover:bg-red-700 transition-colors disabled:bg-gray-800 disabled:cursor-not-allowed"
            disabled={!selectedClip}
            title="Remove clip from timeline"
          >
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>

          {/* Time Display */}
          <span className="text-sm text-gray-300 font-mono">
            {formatTime(currentTime)}
          </span>

          {/* Scrubber */}
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1"
            disabled={!currentMedia}
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / duration) * 100}%, #4b5563 ${(currentTime / duration) * 100}%, #4b5563 100%)`
            }}
          />

          {/* Volume */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Vol:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-20"
              disabled={!currentMedia}
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volume * 100}%, #4b5563 ${volume * 100}%, #4b5563 100%)`
              }}
            />
            <span className="text-sm text-gray-400 w-12">
              {Math.round(volume * 100)}%
            </span>
          </div>

          {/* Speed */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Speed:</span>
            <select
              value={playbackRate}
              onChange={handlePlaybackRateChange}
              className="bg-gray-700 text-white text-sm px-2 py-1 rounded border border-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed"
              disabled={!currentMedia}
            >
              <option value="0.5">0.5x</option>
              <option value="1">1x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2x</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### 2. Tauri Configuration (tauri.conf.json)
```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "ClipForge",
  "version": "0.1.0",
  "identifier": "com.nat.clipforge",
  "build": {
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:1420",
    "beforeBuildCommand": "npm run build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "ClipForge",
        "width": 1400,
        "height": 900
      }
    ],
    "security": {
      "csp": "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: http: https: file: asset: tauri:; media-src 'self' data: blob: http: https: file: asset: tauri: localhost:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

### 3. Tauri Capabilities (capabilities/default.json)
```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "opener:default",
    "dialog:allow-open",
    "dialog:allow-save",
    "fs:allow-desktop-read",
    "fs:allow-desktop-read-recursive",
    "fs:allow-download-read",
    "fs:allow-download-read-recursive",
    "fs:allow-video-read",
    "fs:allow-video-read-recursive",
    "fs:allow-read-file",
    "fs:allow-read-text-file"
  ]
}
```

### 4. App Store (useAppStore.ts)
```typescript
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
    console.log('🏪 STORE: Adding clip to state:', clip);
    set((state) => {
      const newClips = [...state.timeline.clips, clip];
      console.log('🏪 STORE: New clips array:', newClips);
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
  
  selectClip: (id) =>
    set((state) => ({
      timeline: {
        ...state.timeline,
        selectedClips: state.timeline.selectedClips.includes(id)
          ? state.timeline.selectedClips
          : [...state.timeline.selectedClips, id],
      },
    })),
  
  deselectClip: (id) =>
    set((state) => ({
      timeline: {
        ...state.timeline,
        selectedClips: state.timeline.selectedClips.filter((clipId) => clipId !== id),
      },
    })),
  
  addMediaFile: (file) => {
    console.log('🏪 STORE: Adding media file to state:', file);
    set((state) => {
      const newLibrary = [...state.mediaLibrary, file];
      console.log('🏪 STORE: New media library:', newLibrary);
      return {
        mediaLibrary: newLibrary,
      };
    });
  },
}));
```

## Video File Details
- **Format**: MOV (QuickTime)
- **Codec**: H.264
- **Resolution**: 2836x1498 (portrait)
- **Frame Rate**: 60fps
- **Duration**: 58.5 seconds
- **File Size**: ~18MB

## Debugging Attempts Made
1. ✅ **Multiple URL approaches**: convertFileSrc with different protocols, blob URLs, direct file paths
2. ✅ **MIME type detection**: Dynamic MIME type based on file extension
3. ✅ **Browser autoplay policy**: Muted fallback for play attempts
4. ✅ **Enhanced logging**: Comprehensive state logging before/after play
5. ✅ **Video element attributes**: playsInline, preload="metadata", proper event handlers
6. ✅ **CSP configuration**: Added localhost: to media-src
7. ✅ **File system permissions**: Proper Tauri FS plugin permissions

## Key Observations
- **Blob URL Creation**: Successfully creates blob URLs (e.g., `blob:http://localhost:1420/637d6479-608a-4d6c-811c-af03a2cfc9cf`)
- **Video Element State**: `readyState: 4` (ready), `networkState: 1` (loaded)
- **Play Function**: `video.play()` succeeds without errors
- **Missing Events**: No `play`, `timeupdate`, or visual playback events fire
- **Time Stays Zero**: `currentTime` remains 0 despite successful play call

## Potential Issues to Investigate
1. **Codec Compatibility**: H.264 in MOV container might not be supported by browser
2. **Blob URL Limitations**: Large video files might have issues with blob URLs
3. **Tauri Context**: Video element might be in wrong context or sandbox
4. **Event Loop**: React state updates might be interfering with video events
5. **Browser Security**: CSP or other security policies blocking playback
6. **Video Element Timing**: Race conditions between src setting and play attempts

## Request
Please analyze this comprehensive context and provide a solution to fix the video playback issue. The video element is ready and play() succeeds, but no actual playback occurs. Focus on:
1. Why `video.play()` succeeds but no playback happens
2. Why no `timeupdate` events fire
3. Why `currentTime` stays at 0
4. Potential workarounds or alternative approaches

The goal is to get actual video playback working in this Tauri + React application.
