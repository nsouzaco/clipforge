import React, { useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '../stores/appStore';

export const VideoPreview: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const { mediaLibrary, selectedClip, playheadPosition, isPlaying, setPlayheadPosition } = useAppStore();

  const selectedMedia = mediaLibrary.find(media => media.id === selectedClip);

  useEffect(() => {
    if (videoRef.current && selectedMedia) {
      videoRef.current.src = selectedMedia.path;
      videoRef.current.currentTime = 0;
    }
  }, [selectedMedia]);

  useEffect(() => {
    if (videoRef.current) {
      // Only seek if the difference is significant (more than 0.5 seconds)
      // This prevents fighting with the video's natural playback
      const timeDiff = Math.abs(videoRef.current.currentTime - playheadPosition);
      if (timeDiff > 0.5) {
        videoRef.current.currentTime = playheadPosition;
      }
    }
  }, [playheadPosition]);

  // Sync playhead with video playback using requestAnimationFrame
  const syncPlayhead = useCallback(() => {
    if (videoRef.current && isPlaying) {
      setPlayheadPosition(videoRef.current.currentTime);
      animationFrameRef.current = requestAnimationFrame(syncPlayhead);
    }
  }, [isPlaying, setPlayheadPosition]);

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
