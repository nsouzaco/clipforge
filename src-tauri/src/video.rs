use serde::{Deserialize, Serialize};
use std::process::Command;

/// Video metadata extracted from file
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoMetadata {
    pub path: String,
    pub duration: f64,
    pub width: u32,
    pub height: u32,
    pub fps: f64,
    pub codec: String,
    pub size: u64,
}

/// Error type for video operations
#[derive(Debug, Serialize, Deserialize)]
pub struct VideoError {
    pub message: String,
}

impl From<std::io::Error> for VideoError {
    fn from(err: std::io::Error) -> Self {
        VideoError {
            message: err.to_string(),
        }
    }
}

impl std::fmt::Display for VideoError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl std::error::Error for VideoError {}

/// Import a video file and extract metadata using FFmpeg
pub fn import_video(path: String) -> Result<VideoMetadata, VideoError> {
    println!("📹 Importing video: {}", path);

    // Check if file exists
    let file_path = std::path::Path::new(&path);
    if !file_path.exists() {
        return Err(VideoError {
            message: "Video file not found".to_string(),
        });
    }

    // Check if ffprobe is available
    let ffprobe_check = Command::new("ffprobe").arg("-version").output();

    if ffprobe_check.is_err() {
        println!("⚠️ FFmpeg not found, using fallback metadata");
        return Ok(VideoMetadata {
            path: path.clone(),
            duration: 60.0,
            width: 1920,
            height: 1080,
            fps: 30.0,
            codec: "h264".to_string(),
            size: 0,
        });
    }

    // Check if we need to convert MOV to MP4 for WebView compatibility
    let extension = file_path
        .extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("")
        .to_lowercase();

    let final_path = if extension == "mov" {
        println!("🔄 Converting MOV to MP4 for WebView compatibility...");
        convert_mov_to_mp4(&path)?
    } else {
        path.clone()
    };

    // Get file size of final file
    let size = std::fs::metadata(&final_path).map(|m| m.len()).unwrap_or(0);

    // Use ffprobe to extract metadata
    let output = Command::new("ffprobe")
        .args([
            "-v",
            "error",
            "-select_streams",
            "v:0",
            "-show_entries",
            "stream=width,height,r_frame_rate,codec_name:format=duration",
            "-of",
            "json",
            &final_path,
        ])
        .output()
        .map_err(|e| VideoError {
            message: format!("FFprobe execution error: {}", e),
        })?;

    if !output.status.success() {
        let error_msg = String::from_utf8_lossy(&output.stderr);
        println!("❌ ffprobe error: {}", error_msg);
        return Err(VideoError {
            message: format!("FFprobe failed: {}", error_msg),
        });
    }

    let json_output = String::from_utf8_lossy(&output.stdout);
    println!("📊 FFprobe output: {}", json_output);

    // Parse JSON output
    let parsed: serde_json::Value = serde_json::from_str(&json_output).map_err(|e| VideoError {
        message: format!("JSON parse error: {}", e),
    })?;

    // Extract metadata
    let stream = parsed["streams"]
        .as_array()
        .and_then(|arr| arr.get(0))
        .ok_or_else(|| VideoError {
            message: "No video stream found".to_string(),
        })?;

    let width = stream["width"].as_u64().unwrap_or(1920) as u32;

    let height = stream["height"].as_u64().unwrap_or(1080) as u32;

    let codec = stream["codec_name"].as_str().unwrap_or("h264").to_string();

    // Parse frame rate (e.g., "30/1" or "30000/1001")
    let frame_rate_str = stream["r_frame_rate"].as_str().unwrap_or("30/1");

    let fps = parse_frame_rate(frame_rate_str);

    // Get duration
    let duration = parsed["format"]["duration"]
        .as_str()
        .and_then(|s| s.parse::<f64>().ok())
        .unwrap_or(60.0);

    println!(
        "✅ Metadata extracted: {}x{} @ {:.2}fps, duration: {:.2}s",
        width, height, fps, duration
    );

    Ok(VideoMetadata {
        path: final_path,
        duration,
        width,
        height,
        fps,
        codec,
        size,
    })
}

/// Convert MOV file to MP4 for WebView compatibility
pub fn convert_mov_to_mp4(input_path: &str) -> Result<String, VideoError> {
    println!("🔄 Converting MOV to MP4: {}", input_path);

    // Create temp directory for converted files
    let temp_dir = std::env::temp_dir().join("clipforge_converted");
    std::fs::create_dir_all(&temp_dir).map_err(|e| VideoError {
        message: format!("Failed to create temp directory: {}", e),
    })?;

    // Generate output filename
    let input_file = std::path::Path::new(input_path);
    let file_stem = input_file
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("converted");
    let output_path = temp_dir.join(format!("{}.mp4", file_stem));

    // Check if converted file already exists
    if output_path.exists() {
        println!(
            "✅ Converted file already exists: {}",
            output_path.display()
        );
        return Ok(output_path.to_string_lossy().to_string());
    }

    // Use ffmpeg to convert MOV to MP4
    let output = Command::new("ffmpeg")
        .args([
            "-y", // Overwrite output file
            "-i",
            input_path,
            "-c:v",
            "libx264", // Video codec
            "-crf",
            "23", // Quality (lower = better quality)
            "-preset",
            "veryfast", // Encoding speed
            "-c:a",
            "aac", // Audio codec
            "-movflags",
            "+faststart", // Optimize for streaming
            output_path.to_str().unwrap(),
        ])
        .output()
        .map_err(|e| VideoError {
            message: format!("FFmpeg execution error: {}", e),
        })?;

    if !output.status.success() {
        let error_msg = String::from_utf8_lossy(&output.stderr);
        println!("❌ ffmpeg conversion error: {}", error_msg);
        return Err(VideoError {
            message: format!("FFmpeg conversion failed: {}", error_msg),
        });
    }

    println!("✅ Conversion complete: {}", output_path.display());
    Ok(output_path.to_string_lossy().to_string())
}

/// Generate a thumbnail for a video file
pub fn generate_thumbnail(path: String) -> Result<String, VideoError> {
    println!("🖼️ Generating thumbnail for: {}", path);

    // Check if file exists
    let file_path = std::path::Path::new(&path);
    if !file_path.exists() {
        return Err(VideoError {
            message: "Video file not found".to_string(),
        });
    }

    // Check if ffmpeg is available
    let ffmpeg_check = Command::new("ffmpeg").arg("-version").output();

    if ffmpeg_check.is_err() {
        return Err(VideoError {
            message: "FFmpeg not found. Please install FFmpeg to generate thumbnails.".to_string(),
        });
    }

    // Create temp directory for thumbnails
    let temp_dir = std::env::temp_dir().join("clipforge_thumbnails");
    std::fs::create_dir_all(&temp_dir).map_err(|e| VideoError {
        message: format!("Failed to create temp directory: {}", e),
    })?;

    // Generate a unique filename for the thumbnail
    let file_hash = format!("{:x}", md5::compute(&path));
    let thumbnail_path = temp_dir.join(format!("{}.jpg", file_hash));

    // Check if thumbnail already exists
    if thumbnail_path.exists() {
        println!("✅ Thumbnail already exists: {}", thumbnail_path.display());
        return Ok(thumbnail_path.to_string_lossy().to_string());
    }

    // Use ffmpeg to extract thumbnail at 1 second mark
    let output = Command::new("ffmpeg")
        .args([
            "-y", // Overwrite output file
            "-i",
            &path,
            "-ss",
            "1.0", // Seek to 1 second
            "-vframes",
            "1", // Extract only 1 frame
            "-q:v",
            "2", // High quality
            "-vf",
            "scale=320:180", // Scale to 320x180
            thumbnail_path.to_str().unwrap(),
        ])
        .output()
        .map_err(|e| VideoError {
            message: format!("FFmpeg execution error: {}", e),
        })?;

    if !output.status.success() {
        let error_msg = String::from_utf8_lossy(&output.stderr);
        println!("❌ ffmpeg thumbnail error: {}", error_msg);
        return Err(VideoError {
            message: format!("FFmpeg thumbnail generation failed: {}", error_msg),
        });
    }

    println!("✅ Thumbnail generated: {}", thumbnail_path.display());
    Ok(thumbnail_path.to_string_lossy().to_string())
}

fn parse_frame_rate(rate_str: &str) -> f64 {
    let parts: Vec<&str> = rate_str.split('/').collect();
    if parts.len() == 2 {
        if let (Ok(num), Ok(den)) = (parts[0].parse::<f64>(), parts[1].parse::<f64>()) {
            if den != 0.0 {
                return num / den;
            }
        }
    }
    30.0 // Default
}

/// Export video with given configuration
pub fn export_video(config: ExportConfig) -> Result<(), VideoError> {
    println!("🎬 Starting video export to: {}", config.output_path);

    // Check if ffmpeg is available
    let ffmpeg_check = Command::new("ffmpeg").arg("-version").output();

    if ffmpeg_check.is_err() {
        return Err(VideoError {
            message: "FFmpeg not found. Please install FFmpeg to export videos.".to_string(),
        });
    }

    if config.clips.is_empty() {
        return Err(VideoError {
            message: "No clips to export".to_string(),
        });
    }

    // For single clip, use simple ffmpeg command
    if config.clips.len() == 1 {
        export_single_clip(&config.clips[0], &config.output_path)?;
    } else {
        // For multiple clips, use concat
        export_multiple_clips(&config.clips, &config.output_path)?;
    }

    println!("✅ Export complete: {}", config.output_path);
    Ok(())
}

fn export_single_clip(clip: &ClipConfig, output_path: &str) -> Result<(), VideoError> {
    println!("📹 Exporting single clip from: {}", clip.source_file);

    let mut args = vec![
        "-y".to_string(), // Overwrite output file
        "-i".to_string(),
        clip.source_file.clone(),
    ];

    // Add trim parameters if needed
    if clip.trim_start > 0.0 || clip.trim_end < clip.duration {
        args.push("-ss".to_string());
        args.push(clip.trim_start.to_string());

        let trimmed_duration = clip.trim_end - clip.trim_start;
        args.push("-t".to_string());
        args.push(trimmed_duration.to_string());
    }

    // Output settings
    args.push("-c:v".to_string());
    args.push("libx264".to_string());
    args.push("-preset".to_string());
    args.push("fast".to_string());
    args.push("-crf".to_string());
    args.push("23".to_string());
    args.push("-c:a".to_string());
    args.push("aac".to_string());
    args.push(output_path.to_string());

    println!("🔧 FFmpeg command: ffmpeg {}", args.join(" "));

    let output = Command::new("ffmpeg")
        .args(&args)
        .output()
        .map_err(|e| VideoError {
            message: format!("FFmpeg execution failed: {}", e),
        })?;

    if !output.status.success() {
        let error_msg = String::from_utf8_lossy(&output.stderr);
        return Err(VideoError {
            message: format!("FFmpeg export failed: {}", error_msg),
        });
    }

    Ok(())
}

fn export_multiple_clips(clips: &[ClipConfig], output_path: &str) -> Result<(), VideoError> {
    println!("📹 Exporting {} clips", clips.len());

    // Create a temporary directory for intermediate files
    let temp_dir = std::env::temp_dir().join("clipforge_export");
    std::fs::create_dir_all(&temp_dir).map_err(|e| VideoError {
        message: format!("Failed to create temp directory: {}", e),
    })?;

    // Process each clip and create intermediate files
    let mut processed_files = Vec::new();
    for (i, clip) in clips.iter().enumerate() {
        let temp_file = temp_dir.join(format!("clip_{}.mp4", i));
        export_single_clip(clip, temp_file.to_str().unwrap())?;
        processed_files.push(temp_file);
    }

    // Create concat file list
    let concat_file = temp_dir.join("concat_list.txt");
    let mut concat_content = String::new();
    for file in &processed_files {
        concat_content.push_str(&format!("file '{}'\n", file.display()));
    }
    std::fs::write(&concat_file, concat_content).map_err(|e| VideoError {
        message: format!("Failed to write concat file: {}", e),
    })?;

    // Concatenate all clips
    let args = vec![
        "-y",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        concat_file.to_str().unwrap(),
        "-c",
        "copy",
        output_path,
    ];

    println!("🔧 FFmpeg concat command: ffmpeg {}", args.join(" "));

    let output = Command::new("ffmpeg")
        .args(&args)
        .output()
        .map_err(|e| VideoError {
            message: format!("FFmpeg concat failed: {}", e),
        })?;

    if !output.status.success() {
        let error_msg = String::from_utf8_lossy(&output.stderr);
        return Err(VideoError {
            message: format!("FFmpeg concat failed: {}", error_msg),
        });
    }

    // Clean up temp files
    for file in processed_files {
        let _ = std::fs::remove_file(file);
    }
    let _ = std::fs::remove_file(concat_file);

    Ok(())
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportConfig {
    pub clips: Vec<ClipConfig>,
    pub output_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClipConfig {
    pub source_file: String,
    pub start_time: f64,
    pub duration: f64,
    pub trim_start: f64,
    pub trim_end: f64,
}
