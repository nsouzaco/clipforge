import React from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';
import { useAppStore } from '../store/useAppStore';

export const TopBar: React.FC = () => {
  const { addMediaFile, timeline } = useAppStore();

  const handleImport = async () => {
    console.log('📥 Import button clicked');
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

  const importFile = async (path: string) => {
    console.log('📥 Importing file:', path);
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
      
      console.log('✅ Real FFmpeg metadata:', metadata);
      
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
      });
    } catch (error) {
      console.error('❌ Failed to import video:', error);
      alert(`Failed to import: ${error}`);
    }
  };

  const handleExport = async () => {
    console.log('🎬 Export button clicked');
    
    // Check if there are clips to export
    if (timeline.clips.length === 0) {
      alert('No clips to export! Please add videos to the timeline first.');
      return;
    }

    try {
      // Open save dialog
      const outputPath = await save({
        defaultPath: 'exported_video.mp4',
        filters: [{
          name: 'Video',
          extensions: ['mp4']
        }]
      });

      if (!outputPath) {
        console.log('Export cancelled by user');
        return;
      }

      console.log('📹 Exporting to:', outputPath);

      // Prepare clip configurations
      const clips = timeline.clips.map((clip) => ({
        source_file: clip.sourceFile,
        start_time: clip.startTime,
        duration: clip.duration,
        trim_start: clip.trimStart,
        trim_end: clip.trimEnd,
      }));

      console.log('📦 Export config:', { clips, output_path: outputPath });

      // Call export command
      await invoke('export_video', {
        config: {
          clips,
          output_path: outputPath,
        }
      });

      alert(`✅ Video exported successfully to:\n${outputPath}`);
      console.log('✅ Export complete!');
    } catch (error) {
      console.error('❌ Export failed:', error);
      alert(`Export failed: ${error}`);
    }
  };


  return (
    <div className="h-14 bg-gray-900 text-white px-6 flex items-center justify-between border-b border-gray-700">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold">ClipForge</h1>
        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">v2.0</span>
      </div>
      <div className="flex gap-3">
        <button
          onClick={handleImport}
          className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
        >
          Import
        </button>
        <button 
          onClick={handleExport}
          className="px-5 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition-colors"
        >
          Export
        </button>
      </div>
    </div>
  );
};
