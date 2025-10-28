use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use std::path::PathBuf;
use std::process::{Child, Command};

/// Screen source for recording
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScreenSource {
    pub id: String,
    pub name: String,
    pub is_window: bool,
}

/// Recording options
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecordingOptions {
    pub include_audio: bool,
    pub audio_device: Option<String>,
}

/// Recording state
#[derive(Debug)]
pub struct RecordingState {
    pub is_recording: bool,
    pub output_path: Option<String>,
    pub start_time: Option<std::time::Instant>,
    pub ffmpeg_process: Option<Child>,
}

lazy_static::lazy_static! {
    static ref RECORDING_STATE: Arc<Mutex<RecordingState>> = Arc::new(Mutex::new(RecordingState {
        is_recording: false,
        output_path: None,
        start_time: None,
        ffmpeg_process: None,
    }));
}

/// Get available screen sources
#[cfg(target_os = "macos")]
pub fn get_screen_sources() -> Vec<ScreenSource> {
    use core_graphics::display::{CGDisplay, CGDirectDisplayID};
    
    let mut sources = Vec::new();
    
    // Get all active displays
    if let Ok(displays) = CGDisplay::active_displays() {
        for (index, display_id) in displays.iter().enumerate() {
            let display = CGDisplay::new(*display_id);
            let bounds = display.bounds();
            
            sources.push(ScreenSource {
                id: format!("display_{}", display_id),
                name: format!("Display {} ({}x{})", index + 1, bounds.size.width as i32, bounds.size.height as i32),
                is_window: false,
            });
        }
    }
    
    // For now, we'll focus on display capture
    // Window capture requires more complex CGWindowListCopyWindowInfo implementation
    
    sources
}

#[cfg(not(target_os = "macos"))]
pub fn get_screen_sources() -> Vec<ScreenSource> {
    vec![ScreenSource {
        id: "screen_0".to_string(),
        name: "Primary Display".to_string(),
        is_window: false,
    }]
}

/// Start screen recording (macOS implementation)
#[cfg(target_os = "macos")]
pub fn start_screen_recording(
    source_id: String,
    options: RecordingOptions,
    output_path: String,
) -> Result<(), String> {
    let mut state = RECORDING_STATE.lock().unwrap();
    
    if state.is_recording {
        return Err("Recording already in progress".to_string());
    }
    
    // Validate output path
    let path = PathBuf::from(&output_path);
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create output directory: {}", e))?;
    }
    
    println!("🎥 Starting screen recording: {}", source_id);
    println!("📁 Output: {}", output_path);
    println!("🎤 Audio: {}", if options.include_audio { "enabled" } else { "disabled" });
    
    // Extract display number from source_id (e.g., "display_1" -> "1")
    let display_num = source_id.split('_').last().unwrap_or("1");
    
    // Build FFmpeg command for macOS screen capture
    // Format: ffmpeg -f avfoundation -i "DISPLAY:AUDIO" -r 30 output.mp4
    let mut ffmpeg_args = vec![
        "-f", "avfoundation",
        "-capture_cursor", "1",  // Show cursor
        "-capture_mouse_clicks", "1",  // Show clicks
        "-r", "30",  // 30 FPS
    ];
    
    // Input format: "DISPLAY:AUDIO" or "DISPLAY" if no audio
    let input_device = if options.include_audio {
        format!("{}:0", display_num)  // Display + default audio device
    } else {
        display_num.to_string()  // Display only
    };
    
    ffmpeg_args.extend_from_slice(&["-i", &input_device]);
    
    // Video codec settings
    ffmpeg_args.extend_from_slice(&[
        "-c:v", "libx264",
        "-preset", "ultrafast",  // Fast encoding for real-time
        "-crf", "23",  // Quality
        "-pix_fmt", "yuv420p",  // Compatibility
    ]);
    
    // Audio codec if enabled
    if options.include_audio {
        ffmpeg_args.extend_from_slice(&[
            "-c:a", "aac",
            "-b:a", "128k",
        ]);
    }
    
    // Output file
    ffmpeg_args.push(&output_path);
    
    println!("🔧 FFmpeg command: ffmpeg {}", ffmpeg_args.join(" "));
    
    // Start FFmpeg process
    let ffmpeg_process = Command::new("ffmpeg")
        .args(&ffmpeg_args)
        .spawn()
        .map_err(|e| format!("Failed to start FFmpeg: {}. Make sure FFmpeg is installed.", e))?;
    
    state.is_recording = true;
    state.output_path = Some(output_path.clone());
    state.start_time = Some(std::time::Instant::now());
    state.ffmpeg_process = Some(ffmpeg_process);
    
    println!("✅ FFmpeg recording started");
    
    Ok(())
}

#[cfg(not(target_os = "macos"))]
pub fn start_screen_recording(
    _source_id: String,
    _options: RecordingOptions,
    _output_path: String,
) -> Result<(), String> {
    Err("Screen recording not supported on this platform".to_string())
}

/// Stop recording and return file path
pub fn stop_recording() -> Result<String, String> {
    let mut state = RECORDING_STATE.lock().unwrap();
    
    if !state.is_recording {
        return Err("No recording in progress".to_string());
    }
    
    let output_path = state.output_path.clone()
        .ok_or("No output path set")?;
    
    let duration = state.start_time
        .map(|start| start.elapsed().as_secs())
        .unwrap_or(0);
    
    // Stop FFmpeg process gracefully by sending 'q' command
    if let Some(mut process) = state.ffmpeg_process.take() {
        println!("⏹️ Stopping FFmpeg process...");
        
        // Try to terminate gracefully first
        #[cfg(unix)]
        {
            unsafe {
                // Send SIGINT to FFmpeg (equivalent to pressing 'q')
                libc::kill(process.id() as i32, libc::SIGINT);
            }
        }
        
        // Wait a bit for graceful shutdown
        std::thread::sleep(std::time::Duration::from_millis(500));
        
        // Force kill if still running
        let _ = process.kill();
        let _ = process.wait();
        
        println!("✅ FFmpeg process stopped");
    }
    
    state.is_recording = false;
    state.output_path = None;
    state.start_time = None;
    
    // Wait a moment for file to be fully written
    std::thread::sleep(std::time::Duration::from_secs(1));
    
    println!("⏹️ Stopped recording after {}s", duration);
    println!("✅ Saved to: {}", output_path);
    
    // Verify file exists
    if !std::path::Path::new(&output_path).exists() {
        return Err(format!("Recording file was not created: {}", output_path));
    }
    
    Ok(output_path)
}

/// Check if currently recording
pub fn is_recording() -> bool {
    RECORDING_STATE.lock().unwrap().is_recording
}

/// Get recording duration in seconds
pub fn get_recording_duration() -> f64 {
    let state = RECORDING_STATE.lock().unwrap();
    if let Some(start) = state.start_time {
        start.elapsed().as_secs_f64()
    } else {
        0.0
    }
}
