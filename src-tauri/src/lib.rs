use serde::{Deserialize, Serialize};
use std::process::Command;
use std::fs;
use std::path::PathBuf;

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

    fs::write(&concat_list, concat_content)
        .map_err(|e| format!("Failed to write concat list: {}", e))?;

    println!("📋 Concat list created with {} files", trimmed_files.len());

    // Step 3: Concatenate all trimmed clips
    println!("🔗 Concatenating clips...");
    let output = Command::new("ffmpeg")
        .args(&[
            "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", concat_list.to_str().unwrap(),
            "-c", "copy", // Copy streams without re-encoding
            &output_path,
        ])
        .output()
        .map_err(|e| format!("Failed to execute ffmpeg concat: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("FFmpeg concat failed: {}", stderr));
    }

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .invoke_handler(tauri::generate_handler![export_video])
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
