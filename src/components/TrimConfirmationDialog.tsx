import React from 'react';
import { useAppStore } from '../stores/appStore';

export const TrimConfirmationDialog: React.FC = () => {
  const { pendingTrim, confirmTrim, cancelTrim, mediaLibrary } = useAppStore();

  if (!pendingTrim) return null;

  const oldDuration = pendingTrim.oldOutSec - pendingTrim.oldInSec;
  const newDuration = pendingTrim.newOutSec - pendingTrim.newInSec;
  const trimmedAmount = oldDuration - newDuration;
  const trimLocation = pendingTrim.type === 'left' ? 'beginning' : 'end';

  // Find the clip's media file to get the name
  const clip = useAppStore.getState().timeline.find(c => c.id === pendingTrim.clipId);
  const media = clip ? mediaLibrary.find(m => m.id === clip.mediaId) : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700 shadow-xl">
        {/* Header */}
        <div className="flex items-center mb-4">
          <div className="text-yellow-500 mr-3">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Confirm Trim</h2>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-300 mb-4">
            {media && <span className="font-semibold text-white">{media.name}</span>}
          </p>
          <p className="text-gray-300 mb-2">
            You are trimming <span className="font-bold text-yellow-400">{trimmedAmount.toFixed(2)}s</span> from the <span className="font-bold">{trimLocation}</span> of this clip.
          </p>
          
          <div className="bg-gray-700 rounded p-4 mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400">Original Duration:</span>
              <span className="text-white font-mono">{oldDuration.toFixed(2)}s</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">New Duration:</span>
              <span className="text-green-400 font-mono font-bold">{newDuration.toFixed(2)}s</span>
            </div>
          </div>

          <p className="text-gray-400 text-sm mt-4">
            All clips after this will be repositioned to close any gaps.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={cancelTrim}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={confirmTrim}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors font-medium"
          >
            Confirm Trim
          </button>
        </div>
      </div>
    </div>
  );
};

