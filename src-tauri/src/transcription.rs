use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::process::Command;

#[derive(Debug, Serialize, Deserialize)]
pub struct TranscriptionResponse {
    pub text: String,
}

#[derive(Debug, Serialize)]
struct OpenAITranscriptionRequest {
    model: String,
}

/// Check if video has an audio stream
fn has_audio_stream(video_path: &str) -> Result<bool, String> {
    let output = Command::new("ffprobe")
        .args(&[
            "-v", "error",
            "-select_streams", "a:0",
            "-show_entries", "stream=codec_type",
            "-of", "default=noprint_wrappers=1:nokey=1",
            video_path,
        ])
        .output()
        .map_err(|e| format!("Failed to run ffprobe: {}", e))?;
    
    let result = String::from_utf8_lossy(&output.stdout);
    Ok(result.trim() == "audio")
}

/// Extract audio from video file using FFmpeg
pub fn extract_audio(video_path: &str) -> Result<String, String> {
    println!("🎵 Extracting audio from: {}", video_path);
    
    // Check if video has audio stream
    if !has_audio_stream(video_path)? {
        return Err("This video has no audio track to transcribe. Please use a video with audio.".to_string());
    }
    
    // Create temp audio file path
    let audio_path = format!("/tmp/clipforge_audio_{}.mp3", 
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis()
    );
    
    // Extract audio using FFmpeg
    let output = Command::new("ffmpeg")
        .args(&[
            "-i", video_path,
            "-vn", // No video
            "-acodec", "libmp3lame", // MP3 codec
            "-ac", "1", // Mono
            "-ar", "16000", // 16kHz sample rate (optimal for Whisper)
            "-b:a", "64k", // 64kbps bitrate
            "-y", // Overwrite output file
            &audio_path,
        ])
        .output()
        .map_err(|e| format!("Failed to run FFmpeg: {}", e))?;
    
    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        return Err(format!("FFmpeg audio extraction failed: {}", error));
    }
    
    println!("✅ Audio extracted to: {}", audio_path);
    Ok(audio_path)
}

/// Call OpenAI Whisper API to transcribe audio
pub async fn transcribe_audio(audio_path: &str, api_key: &str) -> Result<String, String> {
    println!("🤖 Transcribing audio with OpenAI Whisper...");
    
    // Read audio file
    let audio_data = fs::read(audio_path)
        .map_err(|e| format!("Failed to read audio file: {}", e))?;
    
    // Create multipart form
    let part = reqwest::multipart::Part::bytes(audio_data)
        .file_name("audio.mp3")
        .mime_str("audio/mpeg")
        .map_err(|e| format!("Failed to create multipart: {}", e))?;
    
    let form = reqwest::multipart::Form::new()
        .part("file", part)
        .text("model", "whisper-1");
    
    // Make API request
    let client = reqwest::Client::new();
    let response = client
        .post("https://api.openai.com/v1/audio/transcriptions")
        .header("Authorization", format!("Bearer {}", api_key))
        .multipart(form)
        .send()
        .await
        .map_err(|e| format!("API request failed: {}", e))?;
    
    if !response.status().is_success() {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("OpenAI API error ({}): {}", status, error_text));
    }
    
    let transcription: TranscriptionResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;
    
    println!("✅ Transcription completed: {} characters", transcription.text.len());
    
    // Clean up temp audio file
    let _ = fs::remove_file(audio_path);
    
    Ok(transcription.text)
}

/// Full transcription pipeline: extract audio -> transcribe -> return text
pub async fn transcribe_video(video_path: &str) -> Result<String, String> {
    // Load API key from environment
    let api_key = std::env::var("OPENAI_API_KEY")
        .map_err(|_| "OPENAI_API_KEY not set in environment. Please add it to .env file.".to_string())?;
    
    if api_key == "your_openai_api_key_here" || api_key.is_empty() {
        return Err("Please set a valid OpenAI API key in your .env file".to_string());
    }
    
    // Extract audio from video
    let audio_path = extract_audio(video_path)?;
    
    // Transcribe audio
    let transcript = transcribe_audio(&audio_path, &api_key).await?;
    
    Ok(transcript)
}


