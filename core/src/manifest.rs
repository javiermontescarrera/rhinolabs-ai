use crate::{Paths, Result, RhinolabsError};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Author {
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginManifest {
    pub name: String,
    pub description: String,
    pub version: String,
    pub author: Author,
}

impl Default for PluginManifest {
    fn default() -> Self {
        Self {
            name: "rhinolabs-claude".into(),
            description: "Rhinolabs agency standards and best practices for Claude Code".into(),
            version: "1.0.0".into(),
            author: Author {
                name: "Rhinolabs".into(),
            },
        }
    }
}

pub struct Manifest;

impl Manifest {
    /// Get the path to plugin.json
    fn manifest_path() -> Result<PathBuf> {
        Ok(Paths::plugin_dir()?.join(".claude-plugin").join("plugin.json"))
    }

    /// Read the plugin manifest
    pub fn get() -> Result<PluginManifest> {
        let path = Self::manifest_path()?;

        if !path.exists() {
            return Err(RhinolabsError::PluginNotInstalled);
        }

        let content = fs::read_to_string(&path)?;
        let manifest: PluginManifest = serde_json::from_str(&content)?;

        Ok(manifest)
    }

    /// Update the plugin manifest
    pub fn update(manifest: &PluginManifest) -> Result<()> {
        let path = Self::manifest_path()?;

        if !path.exists() {
            return Err(RhinolabsError::PluginNotInstalled);
        }

        let content = serde_json::to_string_pretty(manifest)?;
        fs::write(&path, content)?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_plugin_manifest_default() {
        let manifest = PluginManifest::default();

        assert_eq!(manifest.name, "rhinolabs-claude");
        assert_eq!(manifest.version, "1.0.0");
        assert_eq!(manifest.author.name, "Rhinolabs");
    }

    #[test]
    fn test_plugin_manifest_serialization() {
        let manifest = PluginManifest {
            name: "test-plugin".into(),
            description: "Test description".into(),
            version: "2.0.0".into(),
            author: Author {
                name: "Test Author".into(),
            },
        };

        let json = serde_json::to_string(&manifest).unwrap();
        let deserialized: PluginManifest = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.name, "test-plugin");
        assert_eq!(deserialized.version, "2.0.0");
        assert_eq!(deserialized.author.name, "Test Author");
    }

    #[test]
    fn test_manifest_path() {
        let path = Manifest::manifest_path();
        assert!(path.is_ok());

        let path = path.unwrap();
        assert!(path.to_str().unwrap().contains("plugin.json"));
        assert!(path.to_str().unwrap().contains(".claude-plugin"));
    }
}
