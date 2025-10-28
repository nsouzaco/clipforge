import { PiPPosition } from '../types';

export class RecordingCompositor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private screenVideo: HTMLVideoElement;
  private webcamVideo: HTMLVideoElement;
  private animationFrame: number | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  constructor(
    screenStream: MediaStream,
    webcamStream: MediaStream,
    pipPosition: PiPPosition,
    outputWidth: number = 1920,
    outputHeight: number = 1080
  ) {
    // Create canvas for compositing
    this.canvas = document.createElement('canvas');
    this.canvas.width = outputWidth;
    this.canvas.height = outputHeight;
    this.ctx = this.canvas.getContext('2d')!;

    // Create video elements
    this.screenVideo = document.createElement('video');
    this.screenVideo.srcObject = screenStream;
    this.screenVideo.play();

    this.webcamVideo = document.createElement('video');
    this.webcamVideo.srcObject = webcamStream;
    this.webcamVideo.play();

    // Start drawing loop
    this.startDrawing(pipPosition);
  }

  private startDrawing(pipPosition: PiPPosition) {
    const draw = () => {
      // Draw screen video (full canvas)
      if (this.screenVideo.readyState >= 2) {
        this.ctx.drawImage(this.screenVideo, 0, 0, this.canvas.width, this.canvas.height);
      }

      // Draw webcam video (PiP overlay)
      if (this.webcamVideo.readyState >= 2) {
        // Calculate scaled position for canvas
        const scaleX = this.canvas.width / 1920; // Assuming 1920 base width
        const scaleY = this.canvas.height / 1080; // Assuming 1080 base height

        const x = pipPosition.x * scaleX;
        const y = pipPosition.y * scaleY;
        const w = pipPosition.width * scaleX;
        const h = pipPosition.height * scaleY;

        // Draw border
        this.ctx.strokeStyle = '#3B82F6';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(x, y, w, h);

        // Draw webcam
        this.ctx.drawImage(this.webcamVideo, x, y, w, h);
      }

      this.animationFrame = requestAnimationFrame(draw);
    };

    draw();
  }

  startRecording(mimeType: string = 'video/webm;codecs=vp8'): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const canvasStream = this.canvas.captureStream(30); // 30 FPS

        this.mediaRecorder = new MediaRecorder(canvasStream, {
          mimeType,
          videoBitsPerSecond: 5000000, // 5 Mbps
        });

        this.recordedChunks = [];

        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            this.recordedChunks.push(event.data);
          }
        };

        this.mediaRecorder.start(1000); // Collect data every second
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No recording in progress'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  updatePiPPosition(_pipPosition: PiPPosition) {
    // PiP position will be applied in the next draw cycle
    // Store position for dynamic updates if needed
  }

  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    this.screenVideo.pause();
    this.webcamVideo.pause();
    this.screenVideo.srcObject = null;
    this.webcamVideo.srcObject = null;
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  getStream(): MediaStream {
    return this.canvas.captureStream(30);
  }
}

export const saveBlobToFile = async (blob: Blob, _filename: string): Promise<string> => {
  // Convert blob to base64 for saving via Tauri
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

