// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
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

#[derive(Debug, Serialize, Deserialize)]
struct SkillManifest {
    name: String,
    version: String,
    description: String,
    author: String,
    tags: Vec<String>,
    price_cents: Option<i64>,
    license_key_required: Option<bool>,
    entrypoint: Option<String>,
    permissions: Option<Vec<String>>,
    source_repo: Option<String>,
}

#[derive(Debug, Serialize)]
struct InstalledSkill {
    name: String,
    path: String,
    description: String,
    category: String,
}

#[derive(Debug, Serialize)]
struct BundledSkill {
    name: String,
    description: String,
    category: String,
    source: String,
    installed: bool,
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

    let _python = std::env::var("PYTHON").unwrap_or_else(|_| "python".to_string());
    let home = HOME_DIR.as_ref().ok_or_else(|| ErrorResponse {
        ok: false,
        error: "No home dir".to_string(),
    })?;

    let cli_path = home.join(".oceanos").join("oceanos");
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

    let _python = std::env::var("PYTHON").unwrap_or_else(|_| "python".to_string());
    let home = HOME_DIR.as_ref().ok_or_else(|| ErrorResponse {
        ok: false,
        error: "No home dir".to_string(),
    })?;

    let cli_path = home.join(".oceanos").join("oceanos");
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

    let registry_dir = home.join(".oceanos").join("skills");
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

fn skill_metadata(path: &Path) -> Option<(String, String, String, bool)> {
    let manifest_path = path.join("manifest.json");
    let skill_md_path = path.join("SKILL.md");

    let mut name = path.file_name()?.to_string_lossy().to_string();
    let mut description = String::new();
    let mut category = "general".to_string();
    let mut has_manifest = false;

    if manifest_path.exists() {
        if let Ok(content) = fs::read_to_string(&manifest_path) {
            if let Ok(manifest) = serde_json::from_str::<SkillManifest>(&content) {
                if !manifest.description.is_empty() {
                    description = manifest.description;
                }
                name = manifest.name;
                category = manifest.tags.first().map(|s| s.as_str()).unwrap_or("general").to_string();
                has_manifest = true;
            }
        }
    }

    if description.is_empty() && skill_md_path.exists() {
        if let Ok(content) = fs::read_to_string(&skill_md_path) {
            let first_line = content.lines().next().unwrap_or("");
            if let Some(desc) = first_line
                .strip_prefix("description: ")
                .or_else(|| first_line.strip_prefix("name: "))
            {
                description = desc.trim_matches('"').to_string();
            }
            if description.is_empty() {
                description = first_line.to_string();
            }
        }
    }

    Some((name, description, category, has_manifest))
}

#[tauri::command]
fn list_bundled_skills() -> Result<OkResponse<Vec<BundledSkill>>, ErrorResponse> {
    let manifest_dir = Path::new(env!("CARGO_MANIFEST_DIR"));
    let bundled_dir = manifest_dir.parent().unwrap().join("skills");

    if !bundled_dir.exists() {
        return Ok(OkResponse {
            ok: true,
            data: vec![],
        });
    }

    let installed = list_installed_skills_internal()?
        .into_iter()
        .map(|s| s.name.to_lowercase())
        .collect::<std::collections::HashSet<_>>();

    let mut skills = Vec::new();
    for entry in fs::read_dir(&bundled_dir).map_err(|e| ErrorResponse {
        ok: false,
        error: format!("Failed to read bundled skills: {}", e),
    })? {
        let entry = entry.map_err(|e| ErrorResponse {
            ok: false,
            error: format!("Dir entry error: {}", e),
        })?;
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }
        if let Some((name, description, category, _)) = skill_metadata(&path) {
            let name_lower = name.to_lowercase();
            skills.push(BundledSkill {
                name,
                description,
                category,
                source: path.to_string_lossy().to_string(),
                installed: installed.contains(&name_lower),
            });
        }
    }

    skills.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(OkResponse { ok: true, data: skills })
}

fn list_installed_skills_internal()
-> Result<Vec<InstalledSkill>, ErrorResponse> {
    let home = HOME_DIR.as_ref().ok_or_else(|| ErrorResponse {
        ok: false,
        error: "No home dir".to_string(),
    })?;
    let skills_dir = home.join(".oceanos").join("skills");

    if !skills_dir.exists() {
        return Ok(vec![]);
    }

    let mut skills = Vec::new();
    for entry in fs::read_dir(&skills_dir).map_err(|e| ErrorResponse {
        ok: false,
        error: format!("Failed to read installed skills: {}", e),
    })? {
        let entry = entry.map_err(|e| ErrorResponse {
            ok: false,
            error: format!("Dir entry error: {}", e),
        })?;
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }
        if let Some((name, description, category, _)) = skill_metadata(&path) {
            skills.push(InstalledSkill {
                name,
                description,
                category,
                path: path.to_string_lossy().to_string(),
            });
        }
    }

    skills.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(skills)
}

#[tauri::command]
fn list_installed_skills(_profile: Option<String>)
-> Result<OkResponse<Vec<InstalledSkill>>, ErrorResponse> {
    let skills = list_installed_skills_internal()?;
    Ok(OkResponse { ok: true, data: skills })
}

#[tauri::command]
fn install_skill(item: Option<serde_json::Value>, _profile: Option<String>)
-> Result<OkResponse<String>, ErrorResponse> {
    let manifest_dir = Path::new(env!("CARGO_MANIFEST_DIR"));
    let bundled_dir = manifest_dir.parent().unwrap().join("skills");
    let home = HOME_DIR.as_ref().ok_or_else(|| ErrorResponse {
        ok: false,
        error: "No home dir".to_string(),
    })?;
    let install_dir = home.join(".oceanos").join("skills");

    // Determine skill name from item or default to "unknown"
    let skill_name = item
        .as_ref()
        .and_then(|v| v.get("name").and_then(|s| s.as_str()))
        .unwrap_or("unknown")
        .to_string();

    let source = bundled_dir.join(&skill_name);
    if !source.exists() {
        return Err(ErrorResponse {
            ok: false,
            error: format!("Bundled skill not found: {}", skill_name),
        });
    }

    fs::create_dir_all(&install_dir).map_err(|e| ErrorResponse {
        ok: false,
        error: format!("Failed to create skills dir: {}", e),
    })?;

    let target = install_dir.join(&skill_name);
    if target.exists() {
        return Err(ErrorResponse {
            ok: false,
            error: format!("Skill already installed: {}", skill_name),
        });
    }

    copy_dir_all(&source, &target).map_err(|e| ErrorResponse {
        ok: false,
        error: format!("Failed to install skill: {}", e),
    })?;

    Ok(OkResponse {
        ok: true,
        data: format!("Installed {}", skill_name),
    })
}

#[tauri::command]
fn uninstall_skill(item: Option<serde_json::Value>, _profile: Option<String>)
-> Result<OkResponse<String>, ErrorResponse> {
    let skill_name = item
        .as_ref()
        .and_then(|v| v.get("name").and_then(|s| s.as_str()))
        .unwrap_or("unknown")
        .to_string();

    let home = HOME_DIR.as_ref().ok_or_else(|| ErrorResponse {
        ok: false,
        error: "No home dir".to_string(),
    })?;
    let installed = home.join(".oceanos").join("skills").join(&skill_name);

    if !installed.exists() {
        return Err(ErrorResponse {
            ok: false,
            error: format!("Skill not installed: {}", skill_name),
        });
    }

    fs::remove_dir_all(&installed).map_err(|e| ErrorResponse {
        ok: false,
        error: format!("Failed to uninstall skill: {}", e),
    })?;

    Ok(OkResponse {
        ok: true,
        data: format!("Uninstalled {}", skill_name),
    })
}

#[tauri::command]
fn get_skill_content(name: String, _profile: Option<String>)
-> Result<OkResponse<String>, ErrorResponse> {
    let manifest_dir = Path::new(env!("CARGO_MANIFEST_DIR"));
    let bundled_dir = manifest_dir.parent().unwrap().join("skills").join(&name);
    let home = HOME_DIR.as_ref().ok_or_else(|| ErrorResponse {
        ok: false,
        error: "No home dir".to_string(),
    })?;
    let installed = home.join(".oceanos").join("skills").join(&name);

    let base = if installed.exists() {
        installed
    } else if bundled_dir.exists() {
        bundled_dir
    } else {
        return Err(ErrorResponse {
            ok: false,
            error: format!("Skill not found: {}", name),
        });
    };

    let skill_md = base.join("SKILL.md");
    let manifest = base.join("manifest.json");
    let content = if skill_md.exists() {
        fs::read_to_string(&skill_md).map_err(|e| ErrorResponse {
            ok: false,
            error: format!("Failed to read SKILL.md: {}", e),
        })?
    } else if manifest.exists() {
        fs::read_to_string(&manifest).map_err(|e| ErrorResponse {
            ok: false,
            error: format!("Failed to read manifest.json: {}", e),
        })?
    } else {
        String::new()
    };

    Ok(OkResponse {
        ok: true,
        data: content,
    })
}

fn copy_dir_all(src: &Path, dst: &Path) -> std::io::Result<()> {
    if !dst.exists() {
        fs::create_dir_all(dst)?;
    }
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());
        if src_path.is_dir() {
            copy_dir_all(&src_path, &dst_path)?;
        } else {
            fs::copy(&src_path, &dst_path)?;
        }
    }
    Ok(())
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
            gateway_status,
            list_bundled_skills,
            list_installed_skills,
            install_skill,
            uninstall_skill,
            get_skill_content
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
