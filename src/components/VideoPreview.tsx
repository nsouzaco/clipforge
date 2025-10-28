import React, { useRef, useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { readFile } from '@tauri-apps/plugin-fs';

console.log('VideoPreview component loaded');

export const VideoPreview: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const blobUrlRef = useRef<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const { timeline, mediaLibrary, setPlayheadPosition } = useAppStore();

  // Get the currently selected clip
  const selectedClip = timeline.clips.find(
    (clip) => timeline.selectedClips.includes(clip.id)
  );
  
  // Get the media file for the selected clip
  const currentMedia = selectedClip
    ? mediaLibrary.find((file) => file.path === selectedClip.sourceFile)
    : null;

  useEffect(() => {
    if (!videoRef.current || !currentMedia) {
      if (videoRef.current && !currentMedia) {
        videoRef.current.src = '';
      }
      return;
    }
    
    console.log('🎥 Loading video:', currentMedia.path);
    const video = videoRef.current;
    
    const loadVideo = async () => {
      try {
        // Revoke old blob URL if exists
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
          blobUrlRef.current = null;
        }
        
        // Read file as binary
        const data = await readFile(currentMedia.path);
        const blob = new Blob([data], { type: 'video/mp4' });
        const blobUrl = URL.createObjectURL(blob);
        blobUrlRef.current = blobUrl;
        console.log('📁 Created blob URL:', blobUrl);
        video.src = blobUrl;
        setIsPlaying(false);
      } catch (error) {
        console.error('❌ Failed to load video:', error);
      }
    };
    
    loadVideo();
    
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [currentMedia]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => {
      setCurrentTime(video.currentTime);
      setPlayheadPosition(video.currentTime);
    };

    const updateDuration = () => {
      setDuration(video.duration);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
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
      canPlay: video.readyState >= video.HAVE_FUTURE_DATA,
      src: video.src
    });

    if (isPlaying) {
      video.pause();
    } else {
      // Check if video is ready
      if (video.readyState < video.HAVE_METADATA) {
        console.log('⏳ Waiting for video metadata...');
        video.addEventListener('loadedmetadata', async () => {
          try {
            await video.play();
            console.log('✅ Video play() succeeded after loading');
          } catch (error) {
            console.error('❌ Failed to play video:', error);
          }
        }, { once: true });
        video.load();
      } else {
        try {
          await video.play();
          console.log('✅ Video play() succeeded');
        } catch (error) {
          console.error('❌ Failed to play video:', error);
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

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 bg-gray-900 flex flex-col min-h-0">
      {/* Video Display Area */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
        {currentMedia ? (
          <div className="w-full h-full flex items-center justify-center max-w-full max-h-full overflow-hidden">
            <video
              ref={videoRef}
              className="max-w-full max-h-full bg-black object-contain rounded-lg shadow-2xl"
              controls={false}
              preload="metadata"
              playsInline
            />
          </div>
        ) : (
          <div className="text-center">
            <svg className="w-24 h-24 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-400 text-lg mb-2">No clip selected</p>
            <p className="text-gray-500 text-sm mb-4">Double-click a video in the media library or drag to timeline</p>
            
            {/* Test button to add first media file as clip */}
            {mediaLibrary.length > 0 && (
              <button
                onClick={() => {
                  const firstFile = mediaLibrary[0];
                  const newClip = {
                    id: Math.random().toString(36).substr(2, 9),
                    sourceFile: firstFile.path,
                    startTime: 0,
                    duration: firstFile.duration,
                    trimStart: 0,
                    trimEnd: firstFile.duration,
                    track: 0,
                  };
                  console.log('🎬 Adding test clip:', newClip);
                  const { addClip, selectClip } = useAppStore.getState();
                  addClip(newClip);
                  selectClip(newClip.id);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
              >
                🎬 Add First Video as Clip (Test)
              </button>
            )}
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

