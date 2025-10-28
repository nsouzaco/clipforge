import React, { useState, useEffect } from 'react';
import { MediaFile } from '../store/useAppStore';

interface DraggableMediaItemProps {
  file: MediaFile;
  onDoubleClick: () => void;
  onDragStart: (file: MediaFile, e: React.MouseEvent) => void;
}

export const DraggableMediaItem: React.FC<DraggableMediaItemProps> = ({ 
  file, 
  onDoubleClick,
  onDragStart 
}) => {
  const [thumbnailSrc, setThumbnailSrc] = useState<string | null>(null);
  const [thumbnailLoading, setThumbnailLoading] = useState(false);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    onDragStart(file, e);
  };

  // Load thumbnail as blob URL
  useEffect(() => {
    if (!file.thumbnail) {
      setThumbnailSrc(null);
      return;
    }

    const loadThumbnail = async () => {
      try {
        setThumbnailLoading(true);
        const { readFile } = await import('@tauri-apps/plugin-fs');
        const fileData = await readFile(file.thumbnail!);
        
        const blob = new Blob([fileData], { type: 'image/jpeg' });
        const blobUrl = URL.createObjectURL(blob);
        setThumbnailSrc(blobUrl);
      } catch (error) {
        console.warn('Failed to load thumbnail:', error);
        setThumbnailSrc(null);
      } finally {
        setThumbnailLoading(false);
      }
    };

    loadThumbnail();

    // Cleanup blob URL on unmount
    return () => {
      if (thumbnailSrc && thumbnailSrc.startsWith('blob:')) {
        URL.revokeObjectURL(thumbnailSrc);
      }
    };
  }, [file.thumbnail]);

  return (
    <div
      className="bg-gray-700 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:bg-gray-600 transition-colors"
      onMouseDown={handleMouseDown}
      onDoubleClick={onDoubleClick}
      title="Drag to timeline or double-click to add"
    >
      <div className="flex items-start gap-3">
        <div className="w-16 h-16 bg-gray-800 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
          {thumbnailLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : thumbnailSrc ? (
            <img
              src={thumbnailSrc}
              alt={file.name}
              className="w-full h-full object-cover rounded"
            />
          ) : (
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate" title={file.name}>
            {file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {formatDuration(file.duration)}
          </p>
          <p className="text-xs text-gray-400">
            {file.resolution.width}×{file.resolution.height}
          </p>
          <p className="text-xs text-gray-400">
            {(file.size / 1024 / 1024).toFixed(1)} MB
          </p>
        </div>
      </div>
    </div>
  );
};
