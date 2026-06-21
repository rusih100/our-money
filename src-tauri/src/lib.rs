use encoding_rs::{UTF_8, WINDOWS_1251};
use serde::Serialize;

/// Result of reading a CSV file: decoded text + the encoding we detected.
#[derive(Serialize)]
pub struct CsvFile {
    content: String,
    encoding: String,
}

/// Read a bank-export CSV from disk and decode it.
///
/// Bank exports come either as UTF-8 (sometimes with a BOM) or legacy
/// Windows-1251. We try UTF-8 first; if the bytes are not valid UTF-8 we
/// fall back to Windows-1251, which is the only other realistic encoding for
/// these Cyrillic exports. The decoded string is always valid UTF-8 for the
/// frontend.
#[tauri::command]
fn read_csv(path: String) -> Result<CsvFile, String> {
    let bytes = std::fs::read(&path).map_err(|e| format!("Не удалось прочитать файл: {e}"))?;

    // Strip a UTF-8 BOM if present and treat as UTF-8.
    if bytes.starts_with(&[0xEF, 0xBB, 0xBF]) {
        let (text, _, _) = UTF_8.decode(&bytes[3..]);
        return Ok(CsvFile {
            content: text.into_owned(),
            encoding: "utf-8".into(),
        });
    }

    // Try strict UTF-8: if there are no malformed sequences, it's UTF-8.
    let (text, _, had_errors) = UTF_8.decode(&bytes);
    if !had_errors {
        return Ok(CsvFile {
            content: text.into_owned(),
            encoding: "utf-8".into(),
        });
    }

    // Fall back to Windows-1251.
    let (text, _, _) = WINDOWS_1251.decode(&bytes);
    Ok(CsvFile {
        content: text.into_owned(),
        encoding: "windows-1251".into(),
    })
}

/// Write a CSV string back to disk in the requested encoding so the export
/// round-trips with the same encoding as the source file.
#[tauri::command]
fn write_csv(path: String, content: String, encoding: String) -> Result<(), String> {
    let bytes = match encoding.as_str() {
        "windows-1251" => {
            let (out, _, _) = WINDOWS_1251.encode(&content);
            out.into_owned()
        }
        // Default to UTF-8 (no BOM).
        _ => content.into_bytes(),
    };
    std::fs::write(&path, bytes).map_err(|e| format!("Не удалось записать файл: {e}"))?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![read_csv, write_csv])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
