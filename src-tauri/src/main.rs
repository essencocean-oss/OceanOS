// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Serialize, Deserialize)]
struct AgentRequest {
    agent: String,
    input: String,
    profile: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct SkillRequest {
    name: String,
    args: Option<Vec<String>>,
}

#[derive(Debug, Serialize)]
struct OkResponse<T: Serialize> {
    ok: bool,
    data: T,
}

#[derive(Debug, Serialize)]
struct ErrorResponse {
    ok: bool,
    error: String,
}

static HOME_DIR: Lazy<Option<std::path::PathBuf>> = Lazy::new(|| dirs::home_dir());

#[tauri::command]
fn get_home_dir() -> Result<String, String> {
    HOME_DIR
        .as_ref()
        .map(|p| p.to_string_lossy().to_string())
        .ok_or_else(|| "Could not resolve home directory".to_string())
}

#[tauri::command]
fn ping() -> Result<String, String> {
    Ok("pong".to_string())
}

#[tauri::command]
fn run_agent(req: AgentRequest) -> Result<OkResponse<String>, ErrorResponse> {
    println!("[tauri] run_agent: {} input='{}'", req.agent, req.input);

    let python = std::env::var("PYTHON").unwrap_or_else(|_| "python".to_string());
    let home = HOME_DIR.as_ref().ok_or_else(|| ErrorResponse {
        ok: false,
        error: "No home dir".to_string(),
    })?;

    let cli_path = home.join(".hermes").join("hermes");
    if !cli_path.exists() {
        return Err(ErrorResponse {
            ok: false,
            error: format!("CLI not found at {}", cli_path.display()),
        });
    }

    let output = Command::new(&cli_path)
        .args([
            "ask",
            &req.agent,
            &req.input,
            "--json",
            "--profile",
            req.profile.as_deref().unwrap_or("default"),
        ])
        .output()
        .map_err(|e| ErrorResponse {
            ok: false,
            error: format!("Failed to spawn agent: {}", e),
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        return Err(ErrorResponse {
            ok: false,
            error: format!("Agent failed: {}", stderr),
        });
    }

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    Ok(OkResponse {
        ok: true,
        data: stdout,
    })
}

#[tauri::command]
fn run_skill(req: SkillRequest) -> Result<OkResponse<String>, ErrorResponse> {
    println!("[tauri] run_skill: {} args={:?}", req.name, req.args);

    let python = std::env::var("PYTHON").unwrap_or_else(|_| "python".to_string());
    let home = HOME_DIR.as_ref().ok_or_else(|| ErrorResponse {
        ok: false,
        error: "No home dir".to_string(),
    })?;

    let cli_path = home.join(".hermes").join("hermes");
    if !cli_path.exists() {
        return Err(ErrorResponse {
            ok: false,
            error: format!("CLI not found at {}", cli_path.display()),
        });
    }

    let mut args = vec!["skills", "run", &req.name];
    if let Some(ref extra) = req.args {
        args.extend(extra.iter().map(|s| s.as_str()));
    }

    let output = Command::new(&cli_path)
        .args(&args)
        .output()
        .map_err(|e| ErrorResponse {
            ok: false,
            error: format!("Failed to spawn skill: {}", e),
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        return Err(ErrorResponse {
            ok: false,
            error: format!("Skill failed: {}", stderr),
        });
    }

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    Ok(OkResponse {
        ok: true,
        data: stdout,
    })
}

#[tauri::command]
fn load_registry() -> Result<OkResponse<serde_json::Value>, ErrorResponse> {
    let home = HOME_DIR.as_ref().ok_or_else(|| ErrorResponse {
        ok: false,
        error: "No home dir".to_string(),
    })?;

    let registry_dir = home.join(".hermes").join("skills");
    let entries = std::fs::read_dir(&registry_dir)
        .map_err(|e| ErrorResponse {
            ok: false,
            error: format!("Failed to read registry: {}", e),
        })?
        .filter_map(|e| e.ok())
        .filter(|e| e.path().is_dir())
        .map(|e| e.file_name().to_string_lossy().to_string())
        .collect::<Vec<_>>();

    Ok(OkResponse {
        ok: true,
        data: serde_json::json!({ "skills": entries }),
    })
}

#[tauri::command]
fn get_version() -> Result<String, String> {
    Ok(env!("CARGO_PKG_VERSION").to_string())
}

#[tauri::command]
fn gateway_status() -> Result<OkResponse<String>, ErrorResponse> {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs().to_string())
        .unwrap_or_default();

    Ok(OkResponse {
        ok: true,
        data: format!("gateway-check-{}", now),
    })
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            ping,
            get_home_dir,
            get_version,
            run_agent,
            run_skill,
            load_registry,
            gateway_status
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
