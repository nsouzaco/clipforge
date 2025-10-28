import { TopBar } from "./components/TopBar";
import { MediaLibrary } from "./components/MediaLibrary";
import { VideoPreview } from "./components/VideoPreview";
import { Timeline } from "./components/Timeline";
import "./App.css";
import { useAppStore } from "./store/useAppStore";
import { useEffect, useState } from "react";
import { MediaFile } from "./store/useAppStore";

function App() {
  const { mediaLibrary, timeline } = useAppStore();
  const [draggingFile, setDraggingFile] = useState<MediaFile | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    // App mounted
  }, [mediaLibrary, timeline]);

  const handleDragStart = (file: MediaFile, e: React.MouseEvent) => {
    setDraggingFile(file);
    setDragPosition({ x: e.clientX, y: e.clientY });
  };

  const handleDragMove = (e: React.MouseEvent) => {
    if (draggingFile) {
      setDragPosition({ x: e.clientX, y: e.clientY });
    }
  };

  const handleDragEnd = () => {
    setDraggingFile(null);
  };

  return (
    <div 
      className="h-screen flex flex-col bg-gray-900 text-white overflow-hidden"
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
    >
      <TopBar />
      <div className="flex-1 flex overflow-hidden min-h-0">
        <MediaLibrary onDragStart={handleDragStart} />
        <div className="flex-1 flex flex-col min-h-0">
          <VideoPreview />
          <Timeline draggingFile={draggingFile} />
        </div>
      </div>
      
      {/* Drag preview ghost */}
      {draggingFile && (
        <div 
          className="fixed pointer-events-none z-50 bg-blue-600 text-white px-3 py-2 rounded shadow-lg opacity-75"
          style={{ 
            left: dragPosition.x + 10, 
            top: dragPosition.y + 10 
          }}
        >
          🎬 {draggingFile.name}
        </div>
      )}
    </div>
  );
}

export default App;
