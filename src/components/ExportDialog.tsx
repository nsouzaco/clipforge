import React, { useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { invoke } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({ isOpen, onClose }) => {
  const { timeline, mediaLibrary } = useAppStore();
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');
  const [exportError, setExportError] = useState('');

  if (!isOpen) return null;

  const handleExport = async () => {
    if (timeline.length === 0) {
      setExportError('No clips to export');
      return;
    }

    try {
      // Open save dialog with MP4 filter
      const filePath = await save({
        filters: [{
          name: 'Video',
          extensions: ['mp4']
        }],
        defaultPath: 'export.mp4',
        title: 'Export Video as MP4'
      });

      if (!filePath) {
        console.log('Export cancelled by user');
        return;
      }

      // Ensure .mp4 extension
      const outputPath = filePath.endsWith('.mp4') ? filePath : `${filePath}.mp4`;

      console.log('🎬 Starting export to:', outputPath);
      setIsExporting(true);
      setExportError('');
      setExportProgress('Preparing clips for export...');

      // Prepare clip data for Rust backend
      const clipsData = timeline.map(clip => {
        const media = mediaLibrary.find(m => m.id === clip.mediaId);
        if (!media) {
          throw new Error(`Media not found for clip ${clip.id}`);
        }

        return {
          source_path: media.path,
          in_sec: clip.inSec,
          out_sec: clip.outSec
        };
      });

      console.log('📦 Exporting clips:', clipsData);
      setExportProgress(`Exporting ${timeline.length} clip(s) to MP4...`);

      // Call Tauri backend
      const result = await invoke<string>('export_video', {
        clips: clipsData,
        outputPath: outputPath
      });

      console.log('✅ Export result:', result);
      setExportProgress('Export completed successfully!');
      
      // Close dialog after a short delay
      setTimeout(() => {
        onClose();
        setIsExporting(false);
        setExportProgress('');
      }, 2000);

    } catch (error) {
      console.error('❌ Export error:', error);
      setExportError(error instanceof Error ? error.message : String(error));
      setIsExporting(false);
      setExportProgress('');
    }
  };

  const totalDuration = timeline.reduce((sum, clip) => {
    return sum + (clip.outSec - clip.inSec);
  }, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700 shadow-xl">
        {/* Header */}
        <div className="flex items-center mb-4">
          <div className="text-green-500 mr-3">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Export to MP4</h2>
        </div>

        {/* Content */}
        <div className="mb-6">
          {timeline.length === 0 ? (
            <p className="text-gray-300">No clips to export. Add videos to the timeline first.</p>
          ) : (
            <>
              <div className="bg-gray-700 rounded p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400">Clips to export:</span>
                  <span className="text-white font-mono font-bold">{timeline.length}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400">Total Duration:</span>
                  <span className="text-white font-mono">{totalDuration.toFixed(2)}s</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Output Format:</span>
                  <span className="text-green-400 font-mono font-bold">MP4 (H.264/AAC)</span>
                </div>
              </div>

              {exportProgress && (
                <div className="bg-blue-900 bg-opacity-30 border border-blue-500 rounded p-3 mb-3">
                  <p className="text-blue-300 text-sm">{exportProgress}</p>
                </div>
              )}

              {exportError && (
                <div className="bg-red-900 bg-opacity-30 border border-red-500 rounded p-3 mb-3">
                  <p className="text-red-300 text-sm">{exportError}</p>
                </div>
              )}

              <p className="text-gray-400 text-sm">
                {isExporting 
                  ? 'Please wait while your video is being processed...'
                  : 'All clips will be trimmed and combined into a single MP4 file.'}
              </p>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isExporting}
            className={`flex-1 px-4 py-2 rounded-md transition-colors font-medium ${
              isExporting 
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
          >
            {isExporting ? 'Exporting...' : 'Cancel'}
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || timeline.length === 0}
            className={`flex-1 px-4 py-2 rounded-md transition-colors font-medium ${
              isExporting || timeline.length === 0
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isExporting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Exporting...
              </span>
            ) : (
              'Export MP4'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

