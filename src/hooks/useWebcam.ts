import { useState, useEffect, useCallback, useRef } from 'react';

export interface WebcamDevice {
  deviceId: string;
  label: string;
}

export const useWebcam = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<WebcamDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  // Get available webcam devices
  const getDevices = useCallback(async () => {
    try {
      // Check if mediaDevices API is available (Tauri limitation)
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        console.warn('MediaDevices API not available in Tauri webview');
        setError('Webcam access not available in current Tauri build. Use Screen Only mode.');
        return;
      }
      
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = deviceList
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 8)}`,
        }));
      
      setDevices(videoDevices);
      
      // Auto-select first device if none selected
      if (videoDevices.length > 0 && !selectedDevice) {
        setSelectedDevice(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.error('Failed to enumerate devices:', err);
      setError('Webcam not available. Use Screen Only mode for recording.');
    }
  }, [selectedDevice]);

  // Start webcam stream
  const startWebcam = useCallback(async (deviceId?: string) => {
    try {
      setError(null);
      
      // Check if mediaDevices API is available (Tauri limitation)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Webcam not available in Tauri. Use Screen Only mode.');
        return;
      }
      
      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: deviceId 
          ? { deviceId: { exact: deviceId } }
          : { width: 1280, height: 720 },
        audio: false, // Audio handled separately
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = newStream;
      setStream(newStream);
      setIsActive(true);
      
      console.log('✅ Webcam started:', newStream.getVideoTracks()[0].label);
    } catch (err) {
      console.error('Failed to start webcam:', err);
      setError('Webcam access not available. Use Screen Only mode for now.');
      setIsActive(false);
    }
  }, []);

  // Stop webcam stream
  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('🛑 Stopped track:', track.label);
      });
      streamRef.current = null;
      setStream(null);
      setIsActive(false);
    }
  }, []);

  // Change webcam device
  const changeDevice = useCallback(async (deviceId: string) => {
    setSelectedDevice(deviceId);
    if (isActive) {
      await startWebcam(deviceId);
    }
  }, [isActive, startWebcam]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Get devices on mount
  useEffect(() => {
    getDevices();
  }, [getDevices]);

  return {
    stream,
    devices,
    selectedDevice,
    error,
    isActive,
    startWebcam,
    stopWebcam,
    changeDevice,
    refreshDevices: getDevices,
  };
};

