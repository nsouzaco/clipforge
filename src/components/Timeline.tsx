import React, { useRef, useEffect } from 'react';
import { useAppStore } from '../stores/appStore';

export const Timeline: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { timeline, playheadPosition, mediaLibrary, isPlaying, zoomLevel, setZoomLevel } = useAppStore();

  const basePixelsPerSecond = 50; // Base zoom level
  const pixelsPerSecond = basePixelsPerSecond * zoomLevel;
  const timelineHeight = 120;
  const maxTimelineDuration = 30 * 60; // 30 minutes in seconds
  
  // Calculate the actual timeline duration based on clips
  const actualTimelineDuration = timeline.reduce((max, clip) => {
    const media = mediaLibrary.find(m => m.id === clip.mediaId);
    if (media) {
      const clipEndTime = clip.startTimeSec + (clip.outSec - clip.inSec);
      return Math.max(max, clipEndTime);
    }
    return max;
  }, 0);
  
  // Use the larger of actual duration or 30 minutes
  const timelineDuration = Math.max(actualTimelineDuration, maxTimelineDuration);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size - make it wide enough for the actual timeline duration
    const canvasWidth = Math.max(container.clientWidth, timelineDuration * pixelsPerSecond);
    canvas.width = canvasWidth;
    canvas.height = timelineHeight;

    // Clear canvas
    ctx.fillStyle = '#1f2937'; // gray-800
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw time ruler
    ctx.fillStyle = '#9ca3af'; // gray-400
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    
    const rulerHeight = 30;
    const rulerY = 10;
    
    // Draw ruler background
    ctx.fillStyle = '#374151'; // gray-700
    ctx.fillRect(0, rulerY, canvas.width, rulerHeight);
    
    // Draw time markers - show every second with different visual styles
    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    
    for (let i = 0; i <= timelineDuration; i += 1) {
      const x = i * pixelsPerSecond;
      const timeSeconds = i;
      const minutes = Math.floor(timeSeconds / 60);
      const seconds = timeSeconds % 60;
      
      // Different marker styles based on time intervals
      if (timeSeconds % 60 === 0) {
        // Every minute - major marker with full time label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px monospace';
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        ctx.fillText(timeString, x, rulerY + 20);
        
        // Major tick mark
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, rulerY);
        ctx.lineTo(x, rulerY + rulerHeight);
        ctx.stroke();
      } else if (timeSeconds % 5 === 0) {
        // Every 5 seconds - medium marker with seconds only
        ctx.fillStyle = '#d1d5db';
        ctx.font = '10px monospace';
        ctx.fillText(seconds.toString(), x, rulerY + 18);
        
        // Medium tick mark
        ctx.strokeStyle = '#9ca3af';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, rulerY + 5);
        ctx.lineTo(x, rulerY + rulerHeight - 5);
        ctx.stroke();
      } else {
        // Every second - minor marker
        ctx.strokeStyle = '#6b7280';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, rulerY + 10);
        ctx.lineTo(x, rulerY + rulerHeight - 5);
        ctx.stroke();
      }
    }

    // Draw playhead
    const playheadX = playheadPosition * pixelsPerSecond;
    ctx.strokeStyle = '#ef4444'; // red-500
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, canvas.height);
    ctx.stroke();

    // Draw timeline clips
    const trackY = 60;
    const trackHeight = 40;
    
    timeline.forEach((clip) => {
      const media = mediaLibrary.find(m => m.id === clip.mediaId);
      if (!media) return;

      const clipWidth = (clip.outSec - clip.inSec) * pixelsPerSecond;
      const clipX = clip.startTimeSec * pixelsPerSecond;

      // Draw clip block
      ctx.fillStyle = '#3b82f6'; // blue-500
      ctx.fillRect(clipX, trackY, clipWidth, trackHeight);

      // Draw clip label
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(media.name, clipX + 5, trackY + 25);

      // Draw trim handles (simplified for MVP)
      ctx.fillStyle = '#f59e0b'; // amber-500
      ctx.fillRect(clipX - 5, trackY, 10, trackHeight);
      ctx.fillRect(clipX + clipWidth - 5, trackY, 10, trackHeight);
    });

  }, [timeline, playheadPosition, mediaLibrary, pixelsPerSecond, zoomLevel, timelineDuration]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const timeSeconds = x / pixelsPerSecond;
    
    useAppStore.getState().setPlayheadPosition(Math.min(timeSeconds, timelineDuration));
  };

  const togglePlay = () => {
    useAppStore.getState().setIsPlaying(!isPlaying);
  };

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newZoom = parseFloat(e.target.value);
    setZoomLevel(newZoom);
  };

  const zoomPercentage = Math.round(zoomLevel * 100);

  return (
    <div className="p-4">
      {/* Timeline Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-white">Timeline</h3>
          <button
            onClick={togglePlay}
            className="bg-blue-600 hover:bg-blue-700 text-white p-1 rounded transition-colors"
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
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-300">Zoom:</span>
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={zoomLevel}
              onChange={handleZoomChange}
              className="w-20 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
            <span className="text-sm text-gray-300 w-12">{zoomPercentage}%</span>
          </div>
        </div>
      </div>

      {/* Timeline Canvas */}
      <div 
        ref={containerRef}
        className="w-full overflow-x-auto overflow-y-hidden bg-gray-700 rounded-lg"
        style={{ height: `${timelineHeight + 20}px` }}
      >
        <canvas
          ref={canvasRef}
          className="cursor-pointer"
          onClick={handleCanvasClick}
          style={{ height: `${timelineHeight}px` }}
        />
        
        {/* Track Label */}
        <div className="absolute left-2 top-16 text-xs text-gray-400 font-medium">
          Track 1
        </div>
      </div>
    </div>
  );
};
