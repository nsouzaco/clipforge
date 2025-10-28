import React, { useRef } from 'react';
import { useAppStore } from '../stores/appStore';

export const MediaLibrary: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mediaLibrary, addMediaFile, addTimelineClip } = useAppStore();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file type
    const supportedTypes = ['video/mp4', 'video/quicktime'];
    if (!supportedTypes.includes(file.type)) {
      alert('Please select an MP4 or MOV file');
      return;
    }

    try {
      // Create video element to get actual duration
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      const getVideoMetadata = (): Promise<{duration: number, width: number, height: number}> => {
        return new Promise((resolve, reject) => {
          video.onloadedmetadata = () => {
            resolve({
              duration: video.duration,
              width: video.videoWidth,
              height: video.videoHeight
            });
          };
          video.onerror = () => reject(new Error('Failed to load video metadata'));
          video.src = URL.createObjectURL(file);
        });
      };

      const metadata = await getVideoMetadata();

      const mediaFile = {
        id: Math.random().toString(36).substr(2, 9),
        path: URL.createObjectURL(file),
        name: file.name,
        durationSec: metadata.duration,
        width: metadata.width,
        height: metadata.height,
        sizeBytes: file.size,
      };

      addMediaFile(mediaFile);

      // Auto-add to timeline with actual duration
      const timelineClip = {
        id: Math.random().toString(36).substr(2, 9),
        mediaId: mediaFile.id,
        startTimeSec: 0,
        inSec: 0,
        outSec: mediaFile.durationSec, // Use actual video duration
      };

      addTimelineClip(timelineClip);
      
      // Select the clip
      useAppStore.getState().selectClip(mediaFile.id);

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
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      // Simulate file input change
      const mockEvent = {
        target: { files: [file] }
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(mockEvent);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white mb-1">Media Library</h2>
        <p className="text-sm text-gray-400">{mediaLibrary.length} items</p>
      </div>

      {/* Drag & Drop Zone */}
      <div 
        className="flex-1 border-2 border-dashed border-gray-600 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-gray-500 transition-colors cursor-pointer"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {/* Folder Icon */}
        <div className="text-gray-400 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
          </svg>
        </div>
        
        <p className="text-gray-300 mb-4">Drag and drop video files here.</p>
        
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors">
          Choose Files
        </button>
        
        <p className="text-xs text-gray-500 mt-4">Supports MP4, MOV, WebM, AVI, MKV</p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Media List */}
      {mediaLibrary.length > 0 && (
        <div className="mt-4 space-y-2">
          {mediaLibrary.map((media) => (
            <div 
              key={media.id}
              className="bg-gray-700 rounded-md p-3 cursor-pointer hover:bg-gray-600 transition-colors"
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
