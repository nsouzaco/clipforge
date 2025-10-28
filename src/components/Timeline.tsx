import React, { useRef, useEffect, useState } from 'react';
import { useAppStore, MediaFile } from '../store/useAppStore';

interface TimelineProps {
  draggingFile: MediaFile | null;
}

export const Timeline: React.FC<TimelineProps> = ({ draggingFile }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { timeline, setPlayheadPosition, selectClip, deselectClip, addClip, updateClip, deleteClip } = useAppStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [isHovering, setIsHovering] = useState(false);
  const [trimming, setTrimming] = useState<{ clipId: string; side: 'left' | 'right' } | null>(null);

  // Define constants
  const PIXELS_PER_SECOND = (50 * zoom) / 100;
  const TRACK_HEIGHT = 60;
  const TIME_RULER_HEIGHT = 30;
  const TIMELINE_LEFT_MARGIN = 80;
  const MIN_TIMELINE_WIDTH = 500;
  
  // Calculate timeline width based on clips
  const calculateTimelineWidth = () => {
    if (timeline.clips.length === 0) return 1000; // Default width when empty
    
    const maxEndTime = Math.max(...timeline.clips.map(c => c.startTime + c.duration));
    const calculatedWidth = TIMELINE_LEFT_MARGIN + (maxEndTime + 5) * PIXELS_PER_SECOND; // +5 seconds padding
    return Math.max(1000, calculatedWidth); // At least 1000px
  };

  const isDraggingOver = draggingFile !== null && isHovering;

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!draggingFile) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    // Get the scroll position to calculate correct drop position
    const scrollLeft = container.scrollLeft;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollLeft - TIMELINE_LEFT_MARGIN;
    const y = e.clientY - rect.top;
    
    const trackIndex = Math.floor((y - TIME_RULER_HEIGHT - 10) / (TRACK_HEIGHT + 10));
    const track = Math.max(0, Math.min(1, trackIndex));
    const startTime = Math.max(0, x / PIXELS_PER_SECOND);
    
    const newClip = {
      id: Math.random().toString(36).substr(2, 9),
      sourceFile: draggingFile.path,
      startTime,
      duration: draggingFile.duration,
      trimStart: 0,
      trimEnd: draggingFile.duration,
      track,
    };
    
        addClip(newClip);
        selectClip(newClip.id);
  };

  const handleMouseEnter = () => {
    if (draggingFile) {
      setIsHovering(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  useEffect(() => {
    drawTimeline();
  }, [timeline, isDragging, zoom, isDraggingOver, calculateTimelineWidth]);

  const drawTimeline = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const calculatedWidth = calculateTimelineWidth();
    const trackLabelsWidth = TIMELINE_LEFT_MARGIN;
    const tracksWidth = calculatedWidth - TIMELINE_LEFT_MARGIN;
    
    // Set canvas size
    canvas.width = calculatedWidth;
    canvas.height = TIME_RULER_HEIGHT + 2 * (TRACK_HEIGHT + 10) + 10;

    // Clear canvas
    ctx.fillStyle = '#1a1d24';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw track labels
    drawTrackLabels(ctx);

    // Draw time ruler
    drawTimeRuler(ctx);

    // Draw grid
    drawGrid(ctx);

    // Draw clips
    drawClips(ctx);

    // Draw playhead
    drawPlayhead(ctx);
  };

  const drawTrackLabels = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#2d3139';
    ctx.fillRect(0, 0, TIMELINE_LEFT_MARGIN, ctx.canvas.height);

    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'left';

    for (let i = 0; i < 2; i++) {
      const y = TIME_RULER_HEIGHT + i * (TRACK_HEIGHT + 10) + 10 + TRACK_HEIGHT / 2;
      ctx.fillText(`Track ${i + 1}`, 10, y);
    }
  };

  const drawTimeRuler = (ctx: CanvasRenderingContext2D) => {
    const calculatedWidth = calculateTimelineWidth();
    ctx.fillStyle = '#2d3139';
    ctx.fillRect(TIMELINE_LEFT_MARGIN, 0, calculatedWidth - TIMELINE_LEFT_MARGIN, TIME_RULER_HEIGHT);

    ctx.strokeStyle = '#4b5563';
    ctx.fillStyle = '#9ca3af';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';

    const maxTime = Math.max(20, timeline.totalDuration, (calculatedWidth - TIMELINE_LEFT_MARGIN) / PIXELS_PER_SECOND);

    for (let i = 0; i <= maxTime; i += 2) {
      const x = TIMELINE_LEFT_MARGIN + i * PIXELS_PER_SECOND;
      
      if (x > calculatedWidth) break;

      // Draw tick
      ctx.beginPath();
      ctx.moveTo(x, TIME_RULER_HEIGHT - 8);
      ctx.lineTo(x, TIME_RULER_HEIGHT);
      ctx.stroke();

      // Draw time label
      const mins = Math.floor(i / 60);
      const secs = i % 60;
      const label = `${mins}:${secs.toString().padStart(2, '0')}`;
      ctx.fillText(label, x, 12);
    }
  };

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#2d3139';
    ctx.lineWidth = 1;

    const calculatedWidth = calculateTimelineWidth();
    const maxTime = Math.max(20, timeline.totalDuration, (calculatedWidth - TIMELINE_LEFT_MARGIN) / PIXELS_PER_SECOND);

    // Vertical lines
    for (let i = 0; i <= maxTime; i += 2) {
      const x = TIMELINE_LEFT_MARGIN + i * PIXELS_PER_SECOND;
      if (x > calculatedWidth) break;

      ctx.beginPath();
      ctx.moveTo(x, TIME_RULER_HEIGHT);
      ctx.lineTo(x, ctx.canvas.height);
      ctx.stroke();
    }

    // Horizontal lines (tracks) - extend full width
    for (let i = 0; i < 2; i++) {
      const y = TIME_RULER_HEIGHT + i * (TRACK_HEIGHT + 10) + 10;
      
      ctx.fillStyle = '#23262e';
      ctx.fillRect(TIMELINE_LEFT_MARGIN, y, calculatedWidth - TIMELINE_LEFT_MARGIN, TRACK_HEIGHT);
      
      ctx.strokeStyle = '#2d3139';
      ctx.strokeRect(TIMELINE_LEFT_MARGIN, y, calculatedWidth - TIMELINE_LEFT_MARGIN, TRACK_HEIGHT);
    }
  };

  const drawClips = (ctx: CanvasRenderingContext2D) => {
    timeline.clips.forEach((clip) => {
      const x = TIMELINE_LEFT_MARGIN + clip.startTime * PIXELS_PER_SECOND;
      const width = clip.duration * PIXELS_PER_SECOND;
      const y = TIME_RULER_HEIGHT + clip.track * (TRACK_HEIGHT + 10) + 10;
      const height = TRACK_HEIGHT;

      const isSelected = timeline.selectedClips.includes(clip.id);
      
      // Clip background
      ctx.fillStyle = isSelected ? '#3b82f6' : '#4b5563';
      ctx.fillRect(x, y, width, height);

      // Clip border
      ctx.strokeStyle = isSelected ? '#60a5fa' : '#6b7280';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);

      // Clip name
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(
        clip.sourceFile.split('/').pop() || 'Clip',
        x + 8,
        y + 20
      );

      // Duration
      ctx.font = '10px Inter, sans-serif';
      ctx.fillStyle = '#d1d5db';
      ctx.fillText(`${clip.duration.toFixed(1)}s`, x + 8, y + 35);

      // Trim handles (only for selected clips)
      if (isSelected) {
        const handleWidth = 8;
        
        // Left trim handle
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(x, y, handleWidth, height);
        
        // Right trim handle
        ctx.fillRect(x + width - handleWidth, y, handleWidth, height);
        
        // Handle indicators
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        for (let i = 0; i < 2; i++) {
          ctx.beginPath();
          ctx.moveTo(x + 3, y + height * 0.3 + i * height * 0.2);
          ctx.lineTo(x + 3, y + height * 0.3 + i * height * 0.2 + height * 0.15);
          ctx.stroke();
          
          ctx.beginPath();
          ctx.moveTo(x + width - 3, y + height * 0.3 + i * height * 0.2);
          ctx.lineTo(x + width - 3, y + height * 0.3 + i * height * 0.2 + height * 0.15);
          ctx.stroke();
        }
      }
    });
  };

  const drawPlayhead = (ctx: CanvasRenderingContext2D) => {
    const x = TIMELINE_LEFT_MARGIN + timeline.playheadPosition * PIXELS_PER_SECOND;
    const calculatedWidth = calculateTimelineWidth();
    
    // Don't draw playhead if it's outside the calculated width
    if (x > calculatedWidth) return;

    // Playhead line
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, TIME_RULER_HEIGHT);
    ctx.lineTo(x, ctx.canvas.height);
    ctx.stroke();

    // Playhead handle
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(x, TIME_RULER_HEIGHT);
    ctx.lineTo(x - 6, TIME_RULER_HEIGHT + 10);
    ctx.lineTo(x + 6, TIME_RULER_HEIGHT + 10);
    ctx.closePath();
    ctx.fill();
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (trimming) return; // Don't handle clicks while trimming
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicked on time ruler
    if (y < TIME_RULER_HEIGHT && x >= TIMELINE_LEFT_MARGIN) {
      const time = (x - TIMELINE_LEFT_MARGIN) / PIXELS_PER_SECOND;
      setPlayheadPosition(Math.max(0, time));
      return;
    }

    // Check if clicked on a clip
    let clickedClip = false;
    timeline.clips.forEach((clip) => {
      const clipX = TIMELINE_LEFT_MARGIN + clip.startTime * PIXELS_PER_SECOND;
      const clipWidth = clip.duration * PIXELS_PER_SECOND;
      const clipY = TIME_RULER_HEIGHT + clip.track * (TRACK_HEIGHT + 10) + 10;
      const clipHeight = TRACK_HEIGHT;

      if (x >= clipX && x <= clipX + clipWidth && y >= clipY && y <= clipY + clipHeight) {
        if (timeline.selectedClips.includes(clip.id)) {
          deselectClip(clip.id);
        } else {
          selectClip(clip.id);
        }
        clickedClip = true;
      }
    });

    if (!clickedClip) {
      timeline.selectedClips.forEach((id) => deselectClip(id));
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;

    // Handle trimming
    if (trimming) {
      const clip = timeline.clips.find((c) => c.id === trimming.clipId);
      if (!clip) return;

      const newTime = Math.max(0, (x - TIMELINE_LEFT_MARGIN) / PIXELS_PER_SECOND);
      const originalDuration = clip.trimEnd - clip.trimStart;

      if (trimming.side === 'left') {
        // Trim from the start
        const maxTrimStart = clip.trimEnd - 0.5; // Min 0.5s duration
        const newTrimStart = Math.max(clip.trimStart, Math.min(maxTrimStart, newTime - clip.startTime + clip.trimStart));
        const newDuration = clip.trimEnd - newTrimStart;

        updateClip(clip.id, {
          trimStart: newTrimStart,
          duration: newDuration,
        });
      } else {
        // Trim from the end
        const minTrimEnd = clip.trimStart + 0.5; // Min 0.5s duration
        const newTrimEnd = Math.max(minTrimEnd, Math.min(originalDuration, newTime - clip.startTime + clip.trimStart));
        const newDuration = newTrimEnd - clip.trimStart;

        updateClip(clip.id, {
          trimEnd: newTrimEnd,
          duration: newDuration,
        });
      }
      return;
    }

    // Handle playhead dragging
    if (isDragging) {
      const time = (x - TIMELINE_LEFT_MARGIN) / PIXELS_PER_SECOND;
      setPlayheadPosition(Math.max(0, time));
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const HANDLE_WIDTH = 8;

    // Check if clicking on trim handles for selected clips
    for (const clip of timeline.clips) {
      if (!timeline.selectedClips.includes(clip.id)) continue;

      const clipX = TIMELINE_LEFT_MARGIN + clip.startTime * PIXELS_PER_SECOND;
      const clipWidth = clip.duration * PIXELS_PER_SECOND;
      const clipY = TIME_RULER_HEIGHT + clip.track * (TRACK_HEIGHT + 10) + 10;
      const clipHeight = TRACK_HEIGHT;

      // Check left trim handle
      if (
        x >= clipX &&
        x <= clipX + HANDLE_WIDTH &&
        y >= clipY &&
        y <= clipY + clipHeight
      ) {
        setTrimming({ clipId: clip.id, side: 'left' });
        e.preventDefault();
        return;
      }

      // Check right trim handle
      if (
        x >= clipX + clipWidth - HANDLE_WIDTH &&
        x <= clipX + clipWidth &&
        y >= clipY &&
        y <= clipY + clipHeight
      ) {
        setTrimming({ clipId: clip.id, side: 'right' });
        e.preventDefault();
        return;
      }
    }

    if (y < TIME_RULER_HEIGHT && x >= TIMELINE_LEFT_MARGIN) {
      setIsDragging(true);
      handleCanvasMouseMove(e);
    }
  };

  const handleCanvasMouseUp = () => {
    if (trimming) {
      setTrimming(null);
    }
    setIsDragging(false);
  };

  const handleTimelinePlayPause = () => {
    // Find the first clip that should be playing at current playhead position
    const currentClip = timeline.clips.find(clip => 
      timeline.playheadPosition >= clip.startTime && 
      timeline.playheadPosition < clip.startTime + clip.duration
    );

    if (currentClip) {
      // Select the clip and trigger play
      selectClip(currentClip.id);
      setIsPlaying(!isPlaying);
      
      // Dispatch custom event to communicate with VideoPreview
      window.dispatchEvent(new CustomEvent('timeline-play-pause', { 
        detail: { isPlaying: !isPlaying, clipId: currentClip.id } 
      }));
    }
  };

  return (
    <div className="h-64 bg-gray-800 text-white flex flex-col border-t border-gray-700">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-base font-semibold">Timeline</h3>
          
          {/* Timeline Play/Pause Button */}
          <button
            onClick={handleTimelinePlayPause}
            className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center hover:bg-blue-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
            disabled={timeline.clips.length === 0}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">Zoom:</span>
          <input
            type="range"
            min="50"
            max="200"
            value={zoom}
            onChange={(e) => setZoom(parseInt(e.target.value))}
            className="w-24"
          />
          <span className="text-xs text-gray-400 w-12">{zoom}%</span>
        </div>
      </div>

      {/* Timeline Container with Scroll */}
      <div className="flex-1 overflow-auto" style={{ minHeight: 0 }} ref={containerRef}>
        <div 
          className={`relative transition-colors ${
            isDraggingOver ? 'bg-blue-500/10 border-2 border-blue-400 border-dashed' : ''
          }`}
          style={{ width: calculateTimelineWidth(), minWidth: '100%' }}
          onMouseUp={handleMouseUp}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Canvas for rendering timeline */}
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            className="cursor-crosshair block"
            style={{ width: calculateTimelineWidth() }}
          />
        
        {/* Drop zone indicator */}
        {isDraggingOver && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-white text-xl font-semibold bg-blue-600/90 px-8 py-4 rounded-lg shadow-lg">
              🎬 Drop video here
            </p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
