import { useState, useRef, useEffect } from 'react';
import { PiPPosition } from '../types';
import { WebcamPreview } from './WebcamPreview';

interface PiPOverlayProps {
  stream: MediaStream | null;
  position: PiPPosition;
  onPositionChange: (position: PiPPosition) => void;
  containerWidth: number;
  containerHeight: number;
}

export const PiPOverlay: React.FC<PiPOverlayProps> = ({
  stream,
  position,
  onPositionChange,
  containerWidth,
  containerHeight,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('resize-handle')) {
      return; // Let resize handle take over
    }
    
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  // Handle resizing
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = Math.max(0, Math.min(containerWidth - position.width, e.clientX - dragStart.x));
        const newY = Math.max(0, Math.min(containerHeight - position.height, e.clientY - dragStart.y));
        
        onPositionChange({
          ...position,
          x: newX,
          y: newY,
        });
      } else if (isResizing) {
        const deltaX = e.clientX - dragStart.x;
        
        // Maintain 4:3 aspect ratio for webcam
        const newWidth = Math.max(160, Math.min(640, position.width + deltaX));
        const newHeight = Math.round(newWidth * 0.75); // 4:3 aspect ratio
        
        onPositionChange({
          ...position,
          width: newWidth,
          height: newHeight,
        });
        
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, position, containerWidth, containerHeight, onPositionChange]);

  // Preset positions
  const setPresetPosition = (preset: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right') => {
    const padding = 20;
    const presets = {
      'top-left': { x: padding, y: padding },
      'top-right': { x: containerWidth - position.width - padding, y: padding },
      'bottom-left': { x: padding, y: containerHeight - position.height - padding },
      'bottom-right': { x: containerWidth - position.width - padding, y: containerHeight - position.height - padding },
    };
    
    onPositionChange({
      ...position,
      ...presets[preset],
    });
  };

  return (
    <>
      {/* PiP Overlay */}
      <div
        ref={overlayRef}
        className={`absolute border-2 border-blue-500 rounded-lg overflow-hidden shadow-2xl ${
          isDragging || isResizing ? 'cursor-move' : 'cursor-grab'
        }`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: `${position.width}px`,
          height: `${position.height}px`,
          zIndex: 50,
        }}
        onMouseDown={handleMouseDown}
      >
        <WebcamPreview stream={stream} className="w-full h-full" />
        
        {/* Resize Handle */}
        <div
          className="resize-handle absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-se-resize"
          onMouseDown={handleResizeMouseDown}
        />
        
        {/* Position Label */}
        <div className="absolute top-1 left-1 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
          Webcam
        </div>
      </div>

      {/* Position Presets UI */}
      <div className="absolute top-4 right-4 bg-gray-800 rounded-lg p-3 shadow-lg" style={{ zIndex: 51 }}>
        <p className="text-xs text-gray-400 mb-2">Position Presets</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setPresetPosition('top-left')}
            className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            Top Left
          </button>
          <button
            onClick={() => setPresetPosition('top-right')}
            className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            Top Right
          </button>
          <button
            onClick={() => setPresetPosition('bottom-left')}
            className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            Bottom Left
          </button>
          <button
            onClick={() => setPresetPosition('bottom-right')}
            className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            Bottom Right
          </button>
        </div>
      </div>
    </>
  );
};

