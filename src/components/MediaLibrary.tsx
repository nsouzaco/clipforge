import React from 'react';
import { useAppStore } from '../stores/appStore';
import { open } from '@tauri-apps/plugin-dialog';
import { convertFileSrc } from '@tauri-apps/api/core';

export const MediaLibrary: React.FC = () => {
  const { mediaLibrary, addMediaFile } = useAppStore();

  const handleFileSelect = async () => {
    try {
      // Use Tauri's open dialog to get actual file path
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'Video',
          extensions: ['mp4', 'mov']
        }],
        title: 'Select Video File'
      });

      if (!selected) {
        console.log('No file selected');
        return;
      }

      const filePath = selected as string;
      console.log('📁 Selected file:', filePath);

      // For Tauri v2, we need to use the asset protocol
      // convertFileSrc adds the proper protocol prefix
      const previewUrl = convertFileSrc(filePath);
      console.log('🔗 Preview URL:', previewUrl);
      
      // Create video element to get metadata
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      const getVideoMetadata = (): Promise<{duration: number, width: number, height: number, size: number}> => {
        return new Promise((resolve, reject) => {
          video.onloadedmetadata = () => {
            resolve({
              duration: video.duration,
              width: video.videoWidth,
              height: video.videoHeight,
              size: 0 // Size not available from browser
            });
          };
          video.onerror = () => reject(new Error('Failed to load video metadata'));
          video.src = previewUrl;
        });
      };

      const metadata = await getVideoMetadata();

      // Extract filename from path
      const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || 'video.mp4';

      const mediaFile = {
        id: Math.random().toString(36).substr(2, 9),
        path: filePath, // Real file path for FFmpeg
        previewUrl: previewUrl, // Browser URL for video player
        name: fileName,
        durationSec: metadata.duration,
        width: metadata.width,
        height: metadata.height,
        sizeBytes: metadata.size,
      };

      console.log('✅ Media file created:', mediaFile);
      addMediaFile(mediaFile);

    } catch (error) {
      console.error('Error importing file:', error);
      alert('Error importing file. Please try again.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    // For drag & drop, we'll just trigger the file dialog
    // Tauri handles file drops through a different mechanism
    handleFileSelect();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 flex-shrink-0">
        <h2 className="text-lg font-semibold text-white mb-1">Media Library</h2>
        <p className="text-sm text-gray-400">{mediaLibrary.length} items</p>
      </div>

      {/* Drag & Drop Zone - Compact */}
      <div 
        className="border-2 border-dashed border-gray-600 rounded-lg p-4 flex flex-col items-center justify-center text-center hover:border-gray-500 transition-colors cursor-pointer flex-shrink-0 mb-4"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleFileSelect}
      >
        {/* Folder Icon */}
        <div className="text-gray-400 mb-2">
          <svg className="w-10 h-10 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
          </svg>
        </div>
        
        <p className="text-sm text-gray-300 mb-2">Drag and drop video files here.</p>
        
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-sm rounded-md transition-colors">
          Choose Files
        </button>
        
        <p className="text-xs text-gray-500 mt-2">MP4, MOV, WebM, AVI, MKV</p>
      </div>


      {/* Media List - Scrollable */}
      {mediaLibrary.length > 0 && (
        <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
          {mediaLibrary.map((media) => (
            <div 
              key={media.id}
              onMouseDown={(e) => {
                e.preventDefault();
                useAppStore.getState().startDrag(media);
                useAppStore.getState().updateDragCursor(e.clientX, e.clientY);
              }}
              className="bg-gray-700 rounded-md p-3 cursor-move hover:bg-gray-600 transition-colors select-none"
              onClick={() => useAppStore.getState().selectClip(media.id)}
            >
              <div className="flex items-center space-x-3">
                <div className="text-blue-400">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{media.name}</p>
                  <p className="text-xs text-gray-400">{media.durationSec.toFixed(2)}s</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
