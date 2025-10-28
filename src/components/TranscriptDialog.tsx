import React from 'react';

interface TranscriptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transcript: string | null;
  fileName: string;
  isLoading: boolean;
}

export const TranscriptDialog: React.FC<TranscriptDialogProps> = ({
  isOpen,
  onClose,
  transcript,
  fileName,
  isLoading,
}) => {
  if (!isOpen) return null;

  const copyToClipboard = () => {
    if (transcript) {
      navigator.clipboard.writeText(transcript);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-white">AI Transcript</h2>
            <p className="text-sm text-gray-400 mt-1">{fileName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className="text-gray-400">Transcribing audio with AI...</p>
              <p className="text-sm text-gray-500">This may take a minute depending on video length</p>
            </div>
          ) : transcript ? (
            <div className="space-y-4">
              <div className="bg-gray-900 rounded-lg p-4 text-white whitespace-pre-wrap leading-relaxed">
                {transcript}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              No transcript available
            </div>
          )}
        </div>

        {/* Footer */}
        {transcript && !isLoading && (
          <div className="flex items-center justify-between p-6 border-t border-gray-700">
            <div className="text-sm text-gray-400">
              {transcript.split(' ').length} words • {transcript.length} characters
            </div>
            <div className="flex gap-3">
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


