use std::fs;
use std::path::PathBuf;

use chrono::Utc;

use crate::errors::AppError;
use crate::models::cs2::{BackupEntry, OperationResult, ResourcePackInfo};

const BUNDLED_ZIP_NAME: &str = "CS2BotImprover.zip";

fn resource_dir() -> PathBuf {
    let exe = std::env::current_exe().unwrap_or_default();
    let exe_dir = exe.parent().map(|p| p.to_path_buf()).unwrap_or_default();
    let candidates = vec![
        exe_dir.join("_upstream_resources").join(BUNDLED_ZIP_NAME),
        exe_dir.join("resources").join(BUNDLED_ZIP_NAME),
        exe_dir.join(BUNDLED_ZIP_NAME),
    ];
    for c in &candidates {
        if c.exists() {
            return c.parent().map(|p| p.to_path_buf()).unwrap_or(exe_dir);
        }
    }
    exe_dir
}

fn bundled_zip_path() -> PathBuf {
    let dir = resource_dir();
    let candidates = vec![
        dir.join(BUNDLED_ZIP_NAME),
        dir.join("resources").join(BUNDLED_ZIP_NAME),
        dir.join("_upstream_resources").join(BUNDLED_ZIP_NAME),
    ];
    for c in &candidates {
        if c.exists() {
            return c.clone();
        }
    }
    dir.join(BUNDLED_ZIP_NAME)
}

pub fn get_resource_pack_info() -> Result<ResourcePackInfo, AppError> {
    let path = bundled_zip_path();
    if !path.exists() {
        return Err(AppError::runtime("[RESOURCE_NOT_FOUND]\n未找到资源包文件"));
    }

    let metadata = fs::metadata(&path).map_err(|e| {
        AppError::runtime(format!("[RESOURCE_READ_FAILED]\n读取资源包失败：{}", e))
    })?;

    let file = fs::File::open(&path).map_err(|e| {
        AppError::runtime(format!("[RESOURCE_OPEN_FAILED]\n打开资源包失败：{}", e))
    })?;

    let archive = zip::ZipArchive::new(file).map_err(|e| {
        AppError::runtime(format!("[RESOURCE_PARSE_FAILED]\n解析资源包失败：{}", e))
    })?;

    let plugin_count = archive
        .file_names()
        .filter(|n| n.contains("plugins/") && n.ends_with(".deps.json"))
        .count();

    let version = "1.4.2".to_string();

    Ok(ResourcePackInfo {
        version: version.clone(),
        file_size: metadata.len(),
        plugin_count,
        bundled_version: version,
    })
}

fn backup_dir() -> PathBuf {
    let mut dir = std::env::current_exe()
        .unwrap_or_default()
        .parent()
        .map(|p| p.to_path_buf())
        .unwrap_or_default();
    dir.push("backups");
    dir
}

pub fn create_backup(root_path: &str, label: &str) -> Result<BackupEntry, AppError> {
    let root = PathBuf::from(root_path);
    let game_csgo = root.join("game").join("csgo");
    if !game_csgo.exists() {
        return Err(AppError::runtime("[BACKUP_FAILED]\nCS2 目录不存在"));
    }

    let dir = backup_dir();
    let timestamp = Utc::now().format("%Y%m%d_%H%M%S").to_string();
    let id = format!("backup_{}", timestamp);
    let backup_path = dir.join(&id);

    fs::create_dir_all(&backup_path).map_err(|e| {
        AppError::runtime(format!("[BACKUP_CREATE_DIR_FAILED]\n{}", e))
    })?;

    let dirs_to_backup = [
        "addons",
        "cfg/plugins",
    ];

    let mut file_count = 0;
    for rel in &dirs_to_backup {
        let src = game_csgo.join(rel);
        let dst = backup_path.join(rel);
        if src.exists() {
            let _ = copy_dir(&src, &dst);
            file_count += 1;
        }
    }

    let gameinfo_src = game_csgo.join("gameinfo.gi");
    if gameinfo_src.exists() {
        let _ = fs::copy(&gameinfo_src, backup_path.join("gameinfo.gi"));
        file_count += 1;
    }

    let created_at = Utc::now().format("%Y-%m-%dT%H:%M:%S%.3fZ").to_string();

    Ok(BackupEntry {
        id,
        created_at,
        root_path: root_path.to_string(),
        label: label.to_string(),
        file_count,
    })
}

pub fn list_backups() -> Result<Vec<BackupEntry>, AppError> {
    let dir = backup_dir();
    if !dir.exists() {
        return Ok(Vec::new());
    }

    let mut entries = Vec::new();
    let mut dirs: Vec<_> = fs::read_dir(&dir)
        .map_err(|e| AppError::runtime(format!("[BACKUP_LIST_FAILED]\n{}", e)))?
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().map(|t| t.is_dir()).unwrap_or(false))
        .collect();

    dirs.sort_by_key(|e| e.file_name());

    for entry in dirs {
        let id = entry.file_name().to_string_lossy().to_string();
        let meta = entry.metadata().ok();
        let file_count = meta.map(|_m| {
            count_files(entry.path())
        }).unwrap_or(0);

        entries.push(BackupEntry {
            id,
            created_at: String::new(),
            root_path: String::new(),
            label: String::new(),
            file_count,
        });
    }

    entries.reverse();
    Ok(entries)
}

pub fn restore_backup(backup_id: &str, root_path: &str) -> Result<OperationResult, AppError> {
    let dir = backup_dir().join(backup_id);
    if !dir.exists() {
        return Err(AppError::runtime("[BACKUP_NOT_FOUND]\n未找到备份"));
    }

    let root = PathBuf::from(root_path);
    let game_csgo = root.join("game").join("csgo");
    if !game_csgo.exists() {
        return Err(AppError::runtime("[BACKUP_RESTORE_FAILED]\nCS2 目录不存在"));
    }

    let restore_dirs = ["addons", "cfg/plugins"];
    for rel in &restore_dirs {
        let src = dir.join(rel);
        let dst = game_csgo.join(rel);
        if src.exists() {
            if dst.exists() {
                let _ = fs::remove_dir_all(&dst);
            }
            let _ = copy_dir(&src, &dst);
        }
    }

    let gameinfo_src = dir.join("gameinfo.gi");
    if gameinfo_src.exists() {
        let _ = fs::copy(&gameinfo_src, game_csgo.join("gameinfo.gi"));
    }

    Ok(OperationResult {
        success: true,
        message: format!("已从备份 {} 恢复", backup_id),
    })
}

fn copy_dir(src: &PathBuf, dst: &PathBuf) -> std::io::Result<()> {
    if !dst.exists() {
        fs::create_dir_all(dst)?;
    }
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let file_type = entry.file_type()?;
        let dst_path = dst.join(entry.file_name());
        if file_type.is_dir() {
            copy_dir(&entry.path(), &dst_path)?;
        } else {
            let _ = fs::copy(&entry.path(), &dst_path);
        }
    }
    Ok(())
}

fn count_files(path: PathBuf) -> usize {
    let mut count = 0;
    if let Ok(entries) = fs::read_dir(&path) {
        for entry in entries.flatten() {
            if entry.file_type().map(|t| t.is_dir()).unwrap_or(false) {
                count += count_files(entry.path());
            } else {
                count += 1;
            }
        }
    }
    count
}
