import React from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { useAppStore, MediaFile } from '../store/useAppStore';
import { DraggableMediaItem } from './DraggableMediaItem';

interface MediaLibraryProps {
  onDragStart: (file: MediaFile, e: React.MouseEvent) => void;
}

export const MediaLibrary: React.FC<MediaLibraryProps> = ({ onDragStart }) => {
  const { mediaLibrary, addMediaFile, addClip, selectClip } = useAppStore();

  const importFile = async (path: string) => {
    try {
      const metadata = await invoke<{
        path: string;
        duration: number;
        width: number;
        height: number;
        fps: number;
        codec: string;
        size: number;
      }>('import_video', { path });
      
      // Generate thumbnail
      let thumbnail = '';
      try {
        thumbnail = await invoke<string>('generate_thumbnail', { path });
      } catch (error) {
        console.warn('Failed to generate thumbnail:', error);
      }
      
      addMediaFile({
        id: Math.random().toString(36).substr(2, 9),
        path: metadata.path,
        name: path.split('/').pop() || path.split('\\').pop() || path,
        duration: metadata.duration,
        resolution: {
          width: metadata.width,
          height: metadata.height,
        },
        size: metadata.size,
        fps: metadata.fps,
        codec: metadata.codec,
        thumbnail,
      });
    } catch (error) {
      console.error('❌ Failed to import video:', error);
      alert(`Failed to import: ${error}`);
    }
  };



  const openFilePicker = async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [{
          name: 'Video',
          extensions: ['mp4', 'mov', 'webm', 'avi', 'mkv']
        }]
      });

      if (!selected) return; // User cancelled

      if (Array.isArray(selected)) {
        for (const path of selected) {
          await importFile(path);
        }
      } else {
        await importFile(selected);
      }
    } catch (error) {
      console.error('❌ Error opening file dialog:', error);
    }
  };

  return (
    <div className="w-80 bg-gray-800 text-white p-4 flex flex-col border-r border-gray-700">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-200 mb-1">Media Library</h2>
        <p className="text-xs text-gray-400">{mediaLibrary.length} {mediaLibrary.length === 1 ? 'item' : 'items'}</p>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => e.preventDefault()}
        className="border-2 border-dashed border-gray-600 bg-gray-700/30 rounded-lg p-6 mb-4 text-center transition-colors"
      >
        <div className="flex flex-col items-center">
          <svg className="w-12 h-12 text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <p className="text-sm text-gray-300 mb-3">Drag and drop video files here</p>
          <button
            onClick={openFilePicker}
            className="px-6 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            Choose Files
          </button>
          <p className="text-xs text-gray-500 mt-3">Supports MP4, MOV, WebM, AVI, MKV</p>
        </div>
      </div>

      {/* Imported Videos */}
      {mediaLibrary.length > 0 && (
        <div className="flex-1 overflow-y-auto">
          <p className="text-xs text-gray-400 mb-3">
            {mediaLibrary.length} video{mediaLibrary.length !== 1 ? 's' : ''} imported
            <span className="block mt-1 text-gray-500">💡 Double-click or drag to timeline</span>
          </p>
          <div className="space-y-3">
            {mediaLibrary.map((file) => (
              <DraggableMediaItem
                key={file.id}
                file={file}
                onDragStart={onDragStart}
                onDoubleClick={() => {
                  // Add to timeline at time 0, track 0
                  const newClip = {
                    id: Math.random().toString(36).substr(2, 9),
                    sourceFile: file.path,
                    startTime: 0,
                    duration: file.duration,
                    trimStart: 0,
                    trimEnd: file.duration,
                    track: 0,
                  };
                  addClip(newClip);
                  selectClip(newClip.id);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
