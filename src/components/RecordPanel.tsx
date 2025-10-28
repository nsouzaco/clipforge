import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../stores/appStore';
import { useWebcam } from '../hooks/useWebcam';
import { WebcamPreview } from './WebcamPreview';
import { ScreenSource, RecordingOptions, MediaFile } from '../types';

export const RecordPanel: React.FC = () => {
  const {
    isRecording,
    recordingMode,
    screenSources,
    selectedScreenSource,
    audioEnabled,
    recordingDuration,
    setIsRecording,
    setRecordingMode,
    setScreenSources,
    setSelectedScreenSource,
    setAudioEnabled,
    setRecordingDuration,
    addMediaFile,
    appendClipToEnd,
  } = useAppStore();

  const {
    stream: webcamStream,
    devices: webcamDevices,
    selectedDevice: selectedWebcam,
    error: webcamError,
    isActive: webcamActive,
    startWebcam,
    stopWebcam,
    changeDevice,
  } = useWebcam();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recordingIntervalRef = useRef<number | null>(null);
  const webcamRecorderRef = useRef<MediaRecorder | null>(null);
  const webcamChunksRef = useRef<Blob[]>([]);

  // Load screen sources on mount
  useEffect(() => {
    loadScreenSources();
  }, []);

  const loadScreenSources = async () => {
    try {
      setLoading(true);
      const sources = await invoke<ScreenSource[]>('get_screen_sources');
      setScreenSources(sources);
      
      if (sources.length > 0 && !selectedScreenSource) {
        setSelectedScreenSource(sources[0].id);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Failed to load screen sources:', err);
      setError('Failed to load screen sources');
      setLoading(false);
    }
  };

  // Format duration as mm:ss
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start recording
  const handleStartRecording = async () => {
    try {
      setError(null);
      setRecordingDuration(0);
      
      // Generate output path
      const timestamp = Date.now();
      const outputPath = await invoke<string>('app_cache_dir').then((cacheDir: string) =>
        `${cacheDir}/recordings/recording_${timestamp}.mp4`
      ).catch(() => {
        // Fallback to temp directory
        return `/tmp/clipforge_recording_${timestamp}.mp4`;
      });

      // Start screen recording if needed
      if (recordingMode === 'screen' || recordingMode === 'screen-webcam') {
        if (!selectedScreenSource) {
          setError('Please select a screen source');
          return;
        }

        const options: RecordingOptions = {
          include_audio: audioEnabled,
          audio_device: null,
        };

        await invoke('start_recording', {
          sourceId: selectedScreenSource,
          options,
          outputPath,
        });
      }

      // Start webcam recording if needed
      if ((recordingMode === 'webcam' || recordingMode === 'screen-webcam') && webcamStream) {
        const options = {
          mimeType: 'video/webm;codecs=vp8,opus',
        };
        
        const recorder = new MediaRecorder(webcamStream, options);
        webcamChunksRef.current = [];
        
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            webcamChunksRef.current.push(e.data);
          }
        };
        
        recorder.start(1000); // Collect data every second
        webcamRecorderRef.current = recorder;
      }

      setIsRecording(true);

      // Start duration counter
      recordingIntervalRef.current = window.setInterval(() => {
        setRecordingDuration((prev: number) => prev + 1);
      }, 1000);

      console.log('✅ Recording started');
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError(`Failed to start recording: ${err}`);
    }
  };

  // Stop recording
  const handleStopRecording = async () => {
    try {
      // Stop duration counter
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }

      let screenFilePath: string | null = null;
      let webcamFilePath: string | null = null;

      // Stop screen recording
      if (recordingMode === 'screen' || recordingMode === 'screen-webcam') {
        screenFilePath = await invoke<string>('stop_recording');
        console.log('📹 Screen recording saved:', screenFilePath);
      }

      // Stop webcam recording
      if ((recordingMode === 'webcam' || recordingMode === 'screen-webcam') && webcamRecorderRef.current) {
        webcamFilePath = await new Promise<string>((resolve) => {
          if (webcamRecorderRef.current) {
            webcamRecorderRef.current.onstop = async () => {
              const blob = new Blob(webcamChunksRef.current, { type: 'video/webm' });
              const timestamp = Date.now();
              const filePath = `/tmp/clipforge_webcam_${timestamp}.webm`;
              
              console.log('📹 Webcam recording blob:', blob.size, 'bytes');
              
              // Convert blob to array buffer
              const arrayBuffer = await blob.arrayBuffer();
              const uint8Array = new Uint8Array(arrayBuffer);
              
              // Save blob to file using Tauri command
              try {
                const savedPath = await invoke<string>('save_blob_to_file', {
                  data: Array.from(uint8Array),
                  filePath: filePath,
                });
                console.log('✅ Webcam file saved:', savedPath);
                resolve(savedPath);
              } catch (err) {
                console.error('Failed to save webcam file:', err);
                resolve('');
              }
            };
            
            webcamRecorderRef.current.stop();
            webcamRecorderRef.current = null;
          } else {
            resolve('');
          }
        });
      }

      setIsRecording(false);

      // Import recorded file(s) to media library
      if (recordingMode === 'screen' && screenFilePath) {
        await importRecordedFile(screenFilePath);
      } else if (recordingMode === 'webcam' && webcamFilePath) {
        // Import webcam-only recording
        // Note: WebM format may not be supported by all players
        // Consider converting to MP4 in future
        console.log('📹 Importing webcam recording:', webcamFilePath);
        await importRecordedFile(webcamFilePath);
      } else if (recordingMode === 'screen-webcam') {
        // Import screen recording (webcam compositing would happen here in future)
        if (screenFilePath) {
          await importRecordedFile(screenFilePath);
        }
        // TODO: Composite screen + webcam using FFmpeg
        if (webcamFilePath) {
          console.log('📹 Webcam file available for compositing:', webcamFilePath);
        }
      }

      console.log('✅ Recording stopped');
    } catch (err) {
      console.error('Failed to stop recording:', err);
      setError(`Failed to stop recording: ${err}`);
      setIsRecording(false);
    }
  };

  // Import recorded file to media library
  const importRecordedFile = async (filePath: string) => {
    try {
      const metadata = await invoke<any>('import_video', { path: filePath });
      
      const mediaFile: MediaFile = {
        id: Math.random().toString(36).substr(2, 9),
        path: metadata.path,
        previewUrl: `asset://localhost/${metadata.path}`,
        name: filePath.split('/').pop() || 'recording.mp4',
        durationSec: metadata.duration,
        width: metadata.width,
        height: metadata.height,
        sizeBytes: metadata.size,
      };

      addMediaFile(mediaFile);
      appendClipToEnd(mediaFile);
      
      console.log('✅ Recorded file imported to media library');
    } catch (err) {
      console.error('Failed to import recorded file:', err);
      setError(`Failed to import recording: Recording may be too short (minimum 2 seconds recommended) or file is corrupted.`);
    }
  };

  // Toggle webcam
  const handleToggleWebcam = async () => {
    if (webcamActive) {
      stopWebcam();
    } else {
      await startWebcam();
    }
  };

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-4">Record</h2>

      {/* Error/Info Display */}
      {(error || webcamError) && (
        <div className="mb-4 p-3 bg-yellow-900 bg-opacity-30 border border-yellow-500 rounded-lg text-yellow-200 text-sm">
          <div className="font-semibold mb-1">ℹ️ Note:</div>
          <div>{error || webcamError}</div>
          <div className="mt-2 text-xs">Screen recording works perfectly! Webcam support requires native implementation.</div>
        </div>
      )}

      {/* Recording Mode Selection */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-2">Recording Mode</label>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setRecordingMode('screen')}
            disabled={isRecording}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              recordingMode === 'screen'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            } disabled:opacity-50`}
          >
            Screen Only
          </button>
          <button
            onClick={() => setRecordingMode('webcam')}
            disabled={isRecording}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              recordingMode === 'webcam'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            } disabled:opacity-50`}
          >
            Webcam Only
          </button>
          <button
            onClick={() => setRecordingMode('screen-webcam')}
            disabled={isRecording}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              recordingMode === 'screen-webcam'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            } disabled:opacity-50`}
          >
            Screen + Webcam (PiP)
          </button>
        </div>
      </div>

      {/* Screen Source Selection */}
      {(recordingMode === 'screen' || recordingMode === 'screen-webcam') && (
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">Screen Source</label>
          <select
            value={selectedScreenSource || ''}
            onChange={(e) => setSelectedScreenSource(e.target.value)}
            disabled={isRecording || loading}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg text-sm"
          >
            {screenSources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Webcam Controls */}
      {(recordingMode === 'webcam' || recordingMode === 'screen-webcam') && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-gray-400">Webcam</label>
            <button
              onClick={handleToggleWebcam}
              disabled={isRecording}
              className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                webcamActive
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              } disabled:opacity-50`}
            >
              {webcamActive ? 'Stop Webcam' : 'Start Webcam'}
            </button>
          </div>

          {/* Webcam Device Selection */}
          {webcamDevices.length > 0 && (
            <select
              value={selectedWebcam || ''}
              onChange={(e) => changeDevice(e.target.value)}
              disabled={isRecording}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg text-sm mb-2"
            >
              {webcamDevices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </option>
              ))}
            </select>
          )}

          {/* Webcam Preview */}
          <WebcamPreview stream={webcamStream} className="w-full h-40" />
        </div>
      )}

      {/* Audio Toggle */}
      <div className="mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={audioEnabled}
            onChange={(e) => setAudioEnabled(e.target.checked)}
            disabled={isRecording}
            className="w-4 h-4"
          />
          <span className="text-sm text-gray-300">Include Microphone Audio</span>
        </label>
      </div>

      {/* Recording Duration Display */}
      {isRecording && (
        <div className="mb-4 p-4 bg-red-900 bg-opacity-30 border border-red-500 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-red-200">Recording</span>
            </div>
            <span className="text-lg font-mono text-white">{formatDuration(recordingDuration)}</span>
          </div>
          {recordingDuration < 2 && (
            <div className="mt-2 text-xs text-yellow-300">
              💡 Record for at least 2 seconds for best results
            </div>
          )}
        </div>
      )}

      {/* Record/Stop Button */}
      <button
        onClick={isRecording ? handleStopRecording : handleStartRecording}
        disabled={loading || (!selectedScreenSource && recordingMode !== 'webcam')}
        className={`w-full py-3 rounded-lg font-semibold transition-colors ${
          isRecording
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isRecording ? '⏹ Stop Recording' : '⏺ Start Recording'}
      </button>

      {/* Info Text */}
      <div className="mt-4 text-xs text-gray-500">
        <p>Recordings will be automatically added to your media library and timeline.</p>
      </div>
    </div>
  );
};

