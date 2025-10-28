import React, { useRef, useEffect, useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { TimelineClip } from '../types';

type TrimHandle = {
  clipId: string;
  type: 'left' | 'right';
  clipIndex: number;
};

export const Timeline: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [trimDrag, setTrimDrag] = useState<TrimHandle | null>(null);
  const [hoveredHandle, setHoveredHandle] = useState<TrimHandle | null>(null);
  const [trimStartValues, setTrimStartValues] = useState<{ inSec: number; outSec: number } | null>(null);
  const [hoveredClipId, setHoveredClipId] = useState<string | null>(null);
  const { timeline, playheadPosition, mediaLibrary, zoomLevel, setZoomLevel, draggingFile, appendClipToEnd, endDrag, updateTimelineClip, setPendingTrim, removeTimelineClip } = useAppStore();

  const basePixelsPerSecond = 50; // Base zoom level
  const pixelsPerSecond = basePixelsPerSecond * zoomLevel;
  const trackHeight = 60; // Height of each track
  const rulerHeight = 40; // Height of time ruler
  const trackPadding = 10; // Vertical padding between tracks
  const maxTimelineDuration = 30 * 60; // 30 minutes in seconds
  
  // Calculate total timeline height based on number of clips
  const numTracks = Math.max(timeline.length, 1);
  const timelineHeight = rulerHeight + (numTracks * (trackHeight + trackPadding));
  
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

  // Helper function to detect if a click is on a trim handle
  const getTrimHandleAtPosition = (x: number, y: number): TrimHandle | null => {
    const handleWidth = 8;
    
    for (let index = 0; index < timeline.length; index++) {
      const clip = timeline[index];
      const media = mediaLibrary.find(m => m.id === clip.mediaId);
      if (!media) continue;

      const clipWidth = (clip.outSec - clip.inSec) * pixelsPerSecond;
      const clipX = clip.startTimeSec * pixelsPerSecond;
      const trackY = rulerHeight + (index * (trackHeight + trackPadding));

      // Check if Y is within track bounds
      if (y >= trackY && y <= trackY + trackHeight) {
        // Check left handle
        if (x >= clipX && x <= clipX + handleWidth) {
          return { clipId: clip.id, type: 'left', clipIndex: index };
        }
        // Check right handle
        if (x >= clipX + clipWidth - handleWidth && x <= clipX + clipWidth) {
          return { clipId: clip.id, type: 'right', clipIndex: index };
        }
      }
    }
    
    return null;
  };

  // Helper function to get clip at position
  const getClipAtPosition = (x: number, y: number): { clip: TimelineClip; index: number } | null => {
    for (let index = 0; index < timeline.length; index++) {
      const clip = timeline[index];
      const media = mediaLibrary.find(m => m.id === clip.mediaId);
      if (!media) continue;

      const clipWidth = (clip.outSec - clip.inSec) * pixelsPerSecond;
      const clipX = clip.startTimeSec * pixelsPerSecond;
      const trackY = rulerHeight + (index * (trackHeight + trackPadding));

      // Check if position is within clip bounds
      if (x >= clipX && x <= clipX + clipWidth && y >= trackY && y <= trackY + trackHeight) {
        return { clip, index };
      }
    }
    
    return null;
  };

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
    
    const rulerY = 0;
    
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

    // Draw track backgrounds and labels
    for (let i = 0; i < numTracks; i++) {
      const trackY = rulerHeight + (i * (trackHeight + trackPadding));
      
      // Draw track background
      ctx.fillStyle = '#374151'; // gray-700
      ctx.fillRect(0, trackY, canvas.width, trackHeight);
      
      // Draw track border
      ctx.strokeStyle = '#4b5563'; // gray-600
      ctx.lineWidth = 1;
      ctx.strokeRect(0, trackY, canvas.width, trackHeight);
      
      // Draw track label
      ctx.fillStyle = '#9ca3af'; // gray-400
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`Track ${i + 1}`, 5, trackY + 15);
    }
    
    // Draw timeline clips - each on its own track
    timeline.forEach((clip, index) => {
      const media = mediaLibrary.find(m => m.id === clip.mediaId);
      if (!media) return;

      const clipWidth = (clip.outSec - clip.inSec) * pixelsPerSecond;
      const clipX = clip.startTimeSec * pixelsPerSecond;
      const trackY = rulerHeight + (index * (trackHeight + trackPadding));

      // Draw clip block with gradient
      const gradient = ctx.createLinearGradient(clipX, trackY, clipX, trackY + trackHeight);
      gradient.addColorStop(0, '#3b82f6'); // blue-500
      gradient.addColorStop(1, '#2563eb'); // blue-600
      ctx.fillStyle = gradient;
      ctx.fillRect(clipX, trackY, clipWidth, trackHeight);

      // Draw clip border
      ctx.strokeStyle = '#1e40af'; // blue-800
      ctx.lineWidth = 2;
      ctx.strokeRect(clipX, trackY, clipWidth, trackHeight);

      // Draw clip label
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(media.name, clipX + 10, trackY + 20);
      
      // Draw duration
      const duration = (clip.outSec - clip.inSec).toFixed(2);
      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#e5e7eb'; // gray-200
      ctx.fillText(`${duration}s`, clipX + 10, trackY + 35);

      // Draw trim handles - more visible and separate
      const handleWidth = 8;
      const isLeftHovered = hoveredHandle?.clipId === clip.id && hoveredHandle?.type === 'left';
      const isRightHovered = hoveredHandle?.clipId === clip.id && hoveredHandle?.type === 'right';
      const isLeftDragging = trimDrag?.clipId === clip.id && trimDrag?.type === 'left';
      const isRightDragging = trimDrag?.clipId === clip.id && trimDrag?.type === 'right';
      
      // Left trim handle
      ctx.fillStyle = isLeftDragging ? '#fb923c' : isLeftHovered ? '#fcd34d' : '#fbbf24'; // amber variations
      ctx.fillRect(clipX, trackY, handleWidth, trackHeight);
      ctx.strokeStyle = isLeftDragging || isLeftHovered ? '#ea580c' : '#f59e0b'; // amber-600/500
      ctx.lineWidth = isLeftDragging || isLeftHovered ? 2 : 1;
      ctx.strokeRect(clipX, trackY, handleWidth, trackHeight);
      
      // Right trim handle
      ctx.fillStyle = isRightDragging ? '#fb923c' : isRightHovered ? '#fcd34d' : '#fbbf24'; // amber variations
      ctx.fillRect(clipX + clipWidth - handleWidth, trackY, handleWidth, trackHeight);
      ctx.strokeStyle = isRightDragging || isRightHovered ? '#ea580c' : '#f59e0b'; // amber-600/500
      ctx.lineWidth = isRightDragging || isRightHovered ? 2 : 1;
      ctx.strokeRect(clipX + clipWidth - handleWidth, trackY, handleWidth, trackHeight);
      
      // Draw trim handle indicators (vertical lines)
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(clipX + handleWidth / 2, trackY + 15);
      ctx.lineTo(clipX + handleWidth / 2, trackY + trackHeight - 15);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(clipX + clipWidth - handleWidth / 2, trackY + 15);
      ctx.lineTo(clipX + clipWidth - handleWidth / 2, trackY + trackHeight - 15);
      ctx.stroke();
    });

    // Draw playhead LAST so it's always on top
    const playheadX = playheadPosition * pixelsPerSecond;
    ctx.strokeStyle = '#ef4444'; // red-500
    ctx.lineWidth = 3; // Made slightly thicker for better visibility
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, canvas.height);
    ctx.stroke();

    // Draw playhead handle at the top for easier dragging
    ctx.fillStyle = '#ef4444'; // red-500
    ctx.beginPath();
    ctx.arc(playheadX, rulerHeight / 2, 6, 0, Math.PI * 2);
    ctx.fill();

  }, [timeline, playheadPosition, mediaLibrary, pixelsPerSecond, zoomLevel, timelineDuration, hoveredHandle, trimDrag]);

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left + (containerRef.current?.scrollLeft || 0);
    const y = e.clientY - rect.top + (containerRef.current?.scrollTop || 0);

    // Check if clicking on a trim handle
    const handle = getTrimHandleAtPosition(x, y);
    if (handle) {
      const clip = timeline.find(c => c.id === handle.clipId);
      if (clip) {
        console.log('✂️ Started trimming:', handle);
        // Store the starting values for potential revert
        setTrimStartValues({ inSec: clip.inSec, outSec: clip.outSec });
        setTrimDrag(handle);
        e.preventDefault();
        return;
      }
    }

    // Otherwise, move playhead
    const timeSeconds = x / pixelsPerSecond;
    useAppStore.getState().setPlayheadPosition(Math.min(timeSeconds, timelineDuration));
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left + (containerRef.current?.scrollLeft || 0);
    const y = e.clientY - rect.top + (containerRef.current?.scrollTop || 0);

    // Update hovered handle
    const handle = getTrimHandleAtPosition(x, y);
    if (handle !== hoveredHandle) {
      setHoveredHandle(handle);
    }

    // Update hovered clip (for delete button)
    if (!trimDrag) {
      const clipAtPos = getClipAtPosition(x, y);
      setHoveredClipId(clipAtPos?.clip.id || null);
    }

    // Handle trim dragging
    if (trimDrag) {
      const clip = timeline.find(c => c.id === trimDrag.clipId);
      const media = clip ? mediaLibrary.find(m => m.id === clip.mediaId) : null;
      
      if (clip && media) {
        const timeSeconds = x / pixelsPerSecond;
        
        if (trimDrag.type === 'left') {
          // Dragging left handle - adjust inSec
          const newInSec = Math.max(0, Math.min(clip.outSec - 0.1, timeSeconds - clip.startTimeSec));
          updateTimelineClip(clip.id, { inSec: newInSec });
        } else {
          // Dragging right handle - adjust outSec
          const newOutSec = Math.min(media.durationSec, Math.max(clip.inSec + 0.1, timeSeconds - clip.startTimeSec));
          updateTimelineClip(clip.id, { outSec: newOutSec });
        }
      }
    }
  };

  const handleCanvasMouseUp = () => {
    if (trimDrag && trimStartValues) {
      const clip = timeline.find(c => c.id === trimDrag.clipId);
      if (clip) {
        // Check if anything actually changed
        const hasChanged = clip.inSec !== trimStartValues.inSec || clip.outSec !== trimStartValues.outSec;
        
        if (hasChanged) {
          console.log('✂️ Trim drag ended, showing confirmation dialog');
          
          // Set pending trim for confirmation
          setPendingTrim({
            clipId: clip.id,
            oldInSec: trimStartValues.inSec,
            oldOutSec: trimStartValues.outSec,
            newInSec: clip.inSec,
            newOutSec: clip.outSec,
            type: trimDrag.type
          });
        } else {
          console.log('No trim changes detected');
        }
      }
      
      setTrimDrag(null);
      setTrimStartValues(null);
    }
  };

  const handleMouseEnter = () => {
    if (draggingFile) {
      setIsHovering(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  const handleMouseUp = () => {
    if (draggingFile && isHovering) {
      appendClipToEnd(draggingFile);
      endDrag();
      setIsHovering(false);
    }
  };

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newZoom = parseFloat(e.target.value);
    setZoomLevel(newZoom);
  };

  const zoomPercentage = Math.round(zoomLevel * 100);

  return (
    <div className="flex flex-col h-full">
      {/* Timeline Header - Fixed at top, doesn't scroll */}
      <div className="flex items-center justify-between p-4 pb-2 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-white">Timeline</h3>
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

      {/* 
        Timeline Canvas Container - Scrollable area
        
        ROOT CAUSE OF PREVIOUS FAILURE:
        1. p-4 padding on parent consumed space from the 320px container
        2. With padding, the inner flex-1 element had less than expected available height
        3. flex-1 tried to grow, but parent's content box was already reduced by padding
        4. Result: canvas was clipped because container couldn't grow beyond constrained space
        
        THE FIX:
        1. Moved padding from parent to header only (no padding on root)
        2. Added px-4 (horizontal padding) to this container for consistent spacing
        3. flex-1 now uses the FULL 320px height minus header height (no padding overhead)
        4. min-h-0 allows this flex child to shrink, enabling overflow-y-auto to work
        5. Canvas can now be taller than container, triggering scrollbars properly
      */}
      <div 
        ref={containerRef}
        className={`mx-4 mb-4 overflow-auto bg-gray-700 rounded-lg relative flex-1 ${isHovering ? 'ring-2 ring-blue-500' : ''}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
      >
        {/* Dashed highlight overlay when hovering */}
        {isHovering && (
          <div className="absolute inset-0 border-2 border-dashed border-blue-400 rounded-lg pointer-events-none z-10" />
        )}
        
        <canvas 
          ref={canvasRef}
          className={hoveredHandle || trimDrag ? 'cursor-ew-resize' : 'cursor-pointer'}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          style={{ display: 'block', height: `${timelineHeight}px` }}
        />

        {/* Delete buttons overlay */}
        {timeline.map((clip, index) => {
          const media = mediaLibrary.find(m => m.id === clip.mediaId);
          if (!media) return null;

          const clipWidth = (clip.outSec - clip.inSec) * pixelsPerSecond;
          const clipX = clip.startTimeSec * pixelsPerSecond;
          const trackY = rulerHeight + (index * (trackHeight + trackPadding));
          const isHovered = hoveredClipId === clip.id;

          if (!isHovered) return null;

          return (
            <button
              key={`delete-${clip.id}`}
              onClick={(e) => {
                e.stopPropagation();
                removeTimelineClip(clip.id);
              }}
              className="absolute bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg transition-colors z-20"
              style={{
                left: `${clipX + clipWidth - 30}px`,
                top: `${trackY + 5}px`,
              }}
              title="Delete clip"
            >
              ✕
            </button>
          );
        })}
      </div>
    </div>
  );
};
