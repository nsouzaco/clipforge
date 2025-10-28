import React, { useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '../stores/appStore';

export const VideoPreview: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const currentClipIndexRef = useRef<number>(0);
  const { mediaLibrary, timeline, playheadPosition, isPlaying, setPlayheadPosition, setIsPlaying } = useAppStore();

  // Get current clip to play based on index
  const currentClip = timeline[currentClipIndexRef.current];
  const selectedMedia = currentClip ? mediaLibrary.find(media => media.id === currentClip.mediaId) : null;

  useEffect(() => {
    if (videoRef.current && selectedMedia && currentClip) {
      videoRef.current.src = selectedMedia.previewUrl;
      videoRef.current.currentTime = currentClip.inSec;
    }
  }, [selectedMedia, currentClip]);

  // Handle playhead position changes (e.g., user clicking on timeline)
  useEffect(() => {
    if (!isPlaying && videoRef.current && timeline.length > 0) {
      // Find which clip the playhead is currently on
      for (let i = 0; i < timeline.length; i++) {
        const clip = timeline[i];
        const clipDuration = clip.outSec - clip.inSec;
        const clipEnd = clip.startTimeSec + clipDuration;

        if (playheadPosition >= clip.startTimeSec && playheadPosition <= clipEnd) {
          // Playhead is within this clip
          if (currentClipIndexRef.current !== i) {
            console.log('📍 Playhead moved to clip', i);
            currentClipIndexRef.current = i;
            
            const media = mediaLibrary.find(m => m.id === clip.mediaId);
            if (media) {
              videoRef.current.src = media.previewUrl;
            }
          }

          // Seek to the correct position within the clip (respecting trim points)
          const relativePosition = playheadPosition - clip.startTimeSec;
          const videoTime = clip.inSec + relativePosition;
          videoRef.current.currentTime = videoTime;
          
          break;
        }
      }
    }
  }, [playheadPosition, isPlaying, timeline, mediaLibrary]);

  // Handle video ending - move to next clip
  const handleVideoEnded = useCallback(() => {
    if (currentClipIndexRef.current < timeline.length - 1) {
      // Move to next clip
      currentClipIndexRef.current += 1;
      const nextClip = timeline[currentClipIndexRef.current];
      if (nextClip && videoRef.current) {
        const nextMedia = mediaLibrary.find(m => m.id === nextClip.mediaId);
        if (nextMedia) {
          videoRef.current.src = nextMedia.previewUrl;
          videoRef.current.currentTime = nextClip.inSec;
          setPlayheadPosition(nextClip.startTimeSec);
          if (isPlaying) {
            videoRef.current.play().catch(err => console.error('Play error:', err));
          }
        }
      }
    } else {
      // All clips played, stop
      setIsPlaying(false);
      currentClipIndexRef.current = 0;
    }
  }, [timeline, mediaLibrary, isPlaying, setPlayheadPosition, setIsPlaying]);

  // Sync playhead with video playback using requestAnimationFrame
  const syncPlayhead = useCallback(() => {
    if (videoRef.current && isPlaying && currentClip) {
      const videoTime = videoRef.current.currentTime;
      
      // Check if we've reached the outSec trim point
      if (videoTime >= currentClip.outSec) {
        console.log('⏹️ Reached outSec trim point:', currentClip.outSec);
        // Trigger moving to next clip or stopping
        handleVideoEnded();
        return;
      }
      
      const timelinePosition = currentClip.startTimeSec + (videoTime - currentClip.inSec);
      setPlayheadPosition(timelinePosition);
      animationFrameRef.current = requestAnimationFrame(syncPlayhead);
    }
  }, [isPlaying, setPlayheadPosition, currentClip, handleVideoEnded]);

  useEffect(() => {
    if (isPlaying) {
      if (videoRef.current) {
        videoRef.current.play().catch(err => console.error('Play error:', err));
        syncPlayhead();
      }
    } else {
      if (videoRef.current) {
        videoRef.current.pause();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, syncPlayhead]);

  const togglePlay = () => {
    useAppStore.getState().setIsPlaying(!isPlaying);
  };

  const stopPlayback = () => {
    useAppStore.getState().setIsPlaying(false);
    useAppStore.getState().setPlayheadPosition(0);
    currentClipIndexRef.current = 0; // Reset to first clip
  };

  return (
    <div className="h-full flex flex-col">
      {/* Video Player - Fixed Size */}
      <div className="bg-black rounded-lg overflow-hidden mb-4 relative" style={{ aspectRatio: '16/9', maxHeight: '450px' }}>
        {selectedMedia ? (
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            controls={false}
            onEnded={handleVideoEnded}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-6xl mb-4">📹</div>
              <p className="text-xl mb-2">No clip selected</p>
              <p className="text-sm text-gray-400">Double-click a video in the media library or drag to timeline.</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          {/* Playback Controls */}
          <div className="flex items-center space-x-3">
            <button
              onClick={togglePlay}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md transition-colors"
            >
              {isPlaying ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            
            <button
              onClick={stopPlayback}
              className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-md transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Time Display */}
          <div className="text-white font-mono">
            {playheadPosition.toFixed(2)}s
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="w-full bg-gray-600 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-100"
              style={{ width: selectedMedia ? `${(playheadPosition / selectedMedia.durationSec) * 100}%` : '0%' }}
            />
          </div>
        </div>

        {/* Volume and Speed Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-300">Vol:</span>
            <div className="flex items-center space-x-2">
              <div className="w-20 bg-gray-600 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full w-4/5" />
              </div>
              <span className="text-sm text-gray-300">100%</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-300">Speed:</span>
            <div className="flex items-center space-x-1">
              <select className="bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600">
                <option value="1">1x</option>
                <option value="0.5">0.5x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2x</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
