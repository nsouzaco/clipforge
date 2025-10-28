use serde::{Deserialize, Serialize};
use std::process::Command;
use std::fs;
use std::path::PathBuf;

mod recording;
mod video;

#[derive(Debug, Serialize, Deserialize)]
struct ClipData {
    source_path: String,
    in_sec: f64,
    out_sec: f64,
}

#[derive(Debug, Serialize)]
struct ExportProgress {
    status: String,
    message: String,
}

#[tauri::command]
fn export_video(clips: Vec<ClipData>, output_path: String) -> Result<String, String> {
    println!("🎬 Starting export with {} clips", clips.len());
    println!("📁 Output path: {}", output_path);

    if clips.is_empty() {
        return Err("No clips to export".to_string());
    }

    // Create temp directory for intermediate files
    let temp_dir = std::env::temp_dir().join("clipforge_export");
    fs::create_dir_all(&temp_dir).map_err(|e| format!("Failed to create temp dir: {}", e))?;

    // Step 1: Trim each clip to a temporary file
    let mut trimmed_files: Vec<PathBuf> = Vec::new();
    
    for (i, clip) in clips.iter().enumerate() {
        let temp_output = temp_dir.join(format!("clip_{}.mp4", i));
        println!("✂️ Trimming clip {}: {}s to {}s", i, clip.in_sec, clip.out_sec);

        let duration = clip.out_sec - clip.in_sec;

        let output = Command::new("ffmpeg")
            .args(&[
                "-y", // Overwrite output files
                "-ss", &clip.in_sec.to_string(),
                "-i", &clip.source_path,
                "-t", &duration.to_string(),
                "-c:v", "libx264",
                "-preset", "fast",
                "-crf", "22",
                "-c:a", "aac",
                "-movflags", "+faststart",
                temp_output.to_str().unwrap(),
            ])
            .output()
            .map_err(|e| format!("Failed to execute ffmpeg: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("FFmpeg trim failed for clip {}: {}", i, stderr));
        }

        trimmed_files.push(temp_output);
    }

    // Step 2: Create concat file list
    let concat_list = temp_dir.join("concat_list.txt");
    let concat_content: String = trimmed_files
        .iter()
        .map(|p| format!("file '{}'", p.to_str().unwrap()))
        .collect::<Vec<String>>()
        .join("\n");

    fs::write(&concat_list, concat_content.clone())
        .map_err(|e| format!("Failed to write concat list: {}", e))?;

    println!("📋 Concat list created with {} files", trimmed_files.len());
    println!("📄 Concat list content:\n{}", concat_content);

    // Step 3: Concatenate all trimmed clips
    println!("🔗 Concatenating clips with re-encoding for compatibility...");
    let output = Command::new("ffmpeg")
        .args(&[
            "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", concat_list.to_str().unwrap(),
            "-c:v", "libx264",      // Re-encode video to ensure compatibility
            "-preset", "fast",
            "-crf", "22",
            "-c:a", "aac",          // Re-encode audio
            "-movflags", "+faststart",
            &output_path,
        ])
        .output()
        .map_err(|e| format!("Failed to execute ffmpeg concat: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let stdout = String::from_utf8_lossy(&output.stdout);
        println!("❌ FFmpeg stderr:\n{}", stderr);
        println!("📤 FFmpeg stdout:\n{}", stdout);
        return Err(format!("FFmpeg concat failed: {}", stderr));
    }
    
    println!("✅ Concat completed successfully");

    // Step 4: Clean up temp files
    println!("🧹 Cleaning up temp files...");
    for file in trimmed_files {
        let _ = fs::remove_file(file);
    }
    let _ = fs::remove_file(concat_list);
    let _ = fs::remove_dir(temp_dir);

    println!("✅ Export completed successfully!");
    Ok(format!("Export completed: {}", output_path))
}

#[tauri::command]
fn get_screen_sources() -> Result<Vec<recording::ScreenSource>, String> {
    println!("📺 Getting available screen sources...");
    let sources = recording::get_screen_sources();
    println!("✅ Found {} screen sources", sources.len());
    Ok(sources)
}

#[tauri::command]
fn start_recording(
    source_id: String,
    options: recording::RecordingOptions,
    output_path: String,
) -> Result<(), String> {
    recording::start_screen_recording(source_id, options, output_path)
}

#[tauri::command]
fn stop_recording() -> Result<String, String> {
    recording::stop_recording()
}

#[tauri::command]
fn is_recording() -> bool {
    recording::is_recording()
}

#[tauri::command]
fn get_recording_duration() -> f64 {
    recording::get_recording_duration()
}

#[tauri::command]
fn import_video(path: String) -> Result<video::VideoMetadata, String> {
    video::import_video(path).map_err(|e| e.message)
}

#[tauri::command]
fn generate_thumbnail(path: String) -> Result<String, String> {
    video::generate_thumbnail(path).map_err(|e| e.message)
}

#[tauri::command]
fn save_blob_to_file(data: Vec<u8>, file_path: String) -> Result<String, String> {
    use std::io::Write;
    
    println!("💾 Saving blob to file: {}", file_path);
    println!("📦 Blob size: {} bytes", data.len());
    
    let path = std::path::Path::new(&file_path);
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directory: {}", e))?;
    }
    
    let mut file = std::fs::File::create(&file_path)
        .map_err(|e| format!("Failed to create file: {}", e))?;
    
    file.write_all(&data)
        .map_err(|e| format!("Failed to write file: {}", e))?;
    
    println!("✅ Blob saved successfully to: {}", file_path);
    Ok(file_path)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .invoke_handler(tauri::generate_handler![
      export_video,
      get_screen_sources,
      start_recording,
      stop_recording,
      is_recording,
      get_recording_duration,
      import_video,
      generate_thumbnail,
      save_blob_to_file
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
