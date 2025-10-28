import { VideoPreview } from './components/VideoPreview';
import { Timeline } from './components/Timeline';
import { MediaLibrary } from './components/MediaLibrary';
import { useAppStore } from './stores/appStore';

function App() {
  const { draggingFile, dragCursor, updateDragCursor, endDrag } = useAppStore();

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingFile) {
      updateDragCursor(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    if (draggingFile) {
      endDrag();
    }
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
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors">
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

      {/* Timeline */}
      <div className="bg-gray-800 border-t border-gray-700">
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
    </div>
  );
}

export default App;
