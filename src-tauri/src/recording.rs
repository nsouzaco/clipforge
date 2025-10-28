use serde::{Deserialize, Serialize};

/// Screen source for recording
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScreenSource {
    pub id: String,
    pub name: String,
    pub is_window: bool,
}

/// Get available screen sources
pub fn get_screen_sources() -> Vec<ScreenSource> {
    // TODO: Implement platform-specific screen capture API
    // macOS: AVFoundation
    // Windows: Windows.Graphics.Capture
    // Linux: PipeWire/X11
    vec![]
}

/// Start screen recording
pub fn start_screen_recording(source_id: String, output_path: String) -> Result<(), String> {
    // TODO: Implement recording
    Ok(())
}

/// Stop recording and return file path
pub fn stop_recording() -> Result<String, String> {
    // TODO: Implement
    Ok("".to_string())
}
