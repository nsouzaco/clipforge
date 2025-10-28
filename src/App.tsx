import { VideoPreview } from './components/VideoPreview';
import { Timeline } from './components/Timeline';
import { MediaLibrary } from './components/MediaLibrary';
import { TrimConfirmationDialog } from './components/TrimConfirmationDialog';
import { ExportDialog } from './components/ExportDialog';
import { useAppStore } from './stores/appStore';
import { useState, useRef } from 'react';

function App() {
  const { draggingFile, dragCursor, updateDragCursor, endDrag } = useAppStore();
  const [timelineHeight, setTimelineHeight] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(320);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingFile) {
      updateDragCursor(e.clientX, e.clientY);
    }
    
    if (isResizing) {
      const deltaY = startYRef.current - e.clientY; // Positive when dragging up
      const newHeight = Math.max(200, Math.min(800, startHeightRef.current + deltaY));
      setTimelineHeight(newHeight);
    }
  };

  const handleMouseUp = () => {
    if (draggingFile) {
      endDrag();
    }
    if (isResizing) {
      setIsResizing(false);
    }
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startYRef.current = e.clientY;
    startHeightRef.current = timelineHeight;
  };

  return (
    <div 
      className="h-screen bg-gray-900 text-white flex flex-col"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Header */}
      <header className="bg-gray-800 p-4 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-white">ClipForge</h1>
          <span className="text-sm text-gray-400 ml-2">v2.0</span>
        </div>
            <div className="flex gap-3">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors">
                Import
              </button>
              <button 
                onClick={() => setIsExportDialogOpen(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Export
              </button>
            </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Panel - Media Library */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 p-4">
          <MediaLibrary />
        </div>

        {/* Right Panel - Video Preview */}
        <div className="flex-1 p-4">
          <VideoPreview />
        </div>
      </div>

      {/* Timeline with Resize Handle - Fixed at bottom, grows upward */}
      <div 
        className="bg-gray-800 border-t border-gray-700 flex flex-col fixed bottom-0 left-0 right-0" 
        style={{ height: `${timelineHeight}px`, zIndex: 20 }}
      >
        {/* Resize Handle */}
        <div
          className={`absolute top-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-blue-500 transition-colors ${isResizing ? 'bg-blue-500' : 'bg-transparent'}`}
          onMouseDown={handleResizeStart}
          style={{ zIndex: 30 }}
        >
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-1 bg-gray-400 rounded-full" />
        </div>
        <Timeline />
      </div>

      {/* Drag Ghost */}
      {draggingFile && (
        <div
          className="fixed pointer-events-none bg-blue-500 bg-opacity-50 text-white px-3 py-2 rounded-md shadow-lg"
          style={{
            left: dragCursor.x + 10,
            top: dragCursor.y + 10,
            zIndex: 9999,
          }}
        >
          {draggingFile.name}
        </div>
      )}

      {/* Trim Confirmation Dialog */}
      <TrimConfirmationDialog />

      {/* Export Dialog */}
      <ExportDialog 
        isOpen={isExportDialogOpen} 
        onClose={() => setIsExportDialogOpen(false)} 
      />
    </div>
  );
}

export default App;
