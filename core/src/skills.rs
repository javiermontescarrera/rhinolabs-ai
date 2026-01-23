use crate::{Paths, Result, RhinolabsError};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum SkillCategory {
    Corporate,
    Frontend,
    Testing,
    AiSdk,
    Utilities,
    Custom,
}

impl Default for SkillCategory {
    fn default() -> Self {
        Self::Custom
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Skill {
    pub id: String,
    pub name: String,
    pub description: String,
    pub enabled: bool,
    pub category: SkillCategory,
    pub path: String,
    pub content: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub created_at: Option<String>,
    pub is_custom: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateSkillInput {
    pub id: String,
    pub name: String,
    pub description: String,
    pub category: SkillCategory,
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateSkillInput {
    pub name: Option<String>,
    pub description: Option<String>,
    pub content: Option<String>,
    pub enabled: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct SkillFrontmatter {
    name: String,
    description: String,
}

/// Configuration for skill states (enabled/disabled)
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
struct SkillsConfig {
    disabled: Vec<String>,
    custom: Vec<String>,
}

/// Built-in skill categories
const CORPORATE_SKILLS: &[&str] = &["rhinolabs-standards", "rhinolabs-architecture", "rhinolabs-security"];
const FRONTEND_SKILLS: &[&str] = &["react-patterns", "typescript-best-practices", "tailwind-4", "zod-4", "zustand-5"];
const TESTING_SKILLS: &[&str] = &["testing-strategies", "playwright"];
const AI_SDK_SKILLS: &[&str] = &["ai-sdk-core", "ai-sdk-react", "nextjs-integration"];
const UTILITIES_SKILLS: &[&str] = &["skill-creator"];

pub struct Skills;

impl Skills {
    /// Get the skills directory path
    fn skills_dir() -> Result<PathBuf> {
        Ok(Paths::plugin_dir()?.join("skills"))
    }

    /// Get the skills config file path
    fn config_path() -> Result<PathBuf> {
        Ok(Paths::plugin_dir()?.join(".skills-config.json"))
    }

    /// Load skills config
    fn load_config() -> Result<SkillsConfig> {
        let path = Self::config_path()?;

        if !path.exists() {
            return Ok(SkillsConfig::default());
        }

        let content = fs::read_to_string(&path)?;
        let config: SkillsConfig = serde_json::from_str(&content)?;

        Ok(config)
    }

    /// Save skills config
    fn save_config(config: &SkillsConfig) -> Result<()> {
        let path = Self::config_path()?;
        let content = serde_json::to_string_pretty(config)?;
        fs::write(&path, content)?;
        Ok(())
    }

    /// Determine the category of a skill by id
    fn get_category(id: &str) -> SkillCategory {
        if CORPORATE_SKILLS.contains(&id) {
            SkillCategory::Corporate
        } else if FRONTEND_SKILLS.contains(&id) {
            SkillCategory::Frontend
        } else if TESTING_SKILLS.contains(&id) {
            SkillCategory::Testing
        } else if AI_SDK_SKILLS.contains(&id) {
            SkillCategory::AiSdk
        } else if UTILITIES_SKILLS.contains(&id) {
            SkillCategory::Utilities
        } else {
            SkillCategory::Custom
        }
    }

    /// Parse frontmatter from a SKILL.md file
    fn parse_skill_file(content: &str) -> Result<(SkillFrontmatter, String)> {
        let content = content.trim();

        if !content.starts_with("---") {
            return Err(RhinolabsError::ConfigError(
                "Skill file must start with YAML frontmatter".into()
            ));
        }

        let parts: Vec<&str> = content.splitn(3, "---").collect();
        if parts.len() < 3 {
            return Err(RhinolabsError::ConfigError(
                "Invalid frontmatter format".into()
            ));
        }

        let frontmatter_str = parts[1].trim();
        let markdown_content = parts[2].trim();

        let frontmatter: SkillFrontmatter = serde_yaml::from_str(frontmatter_str)
            .map_err(|e| RhinolabsError::ConfigError(format!("Invalid YAML frontmatter: {}", e)))?;

        Ok((frontmatter, markdown_content.to_string()))
    }

    /// Generate SKILL.md content
    fn generate_skill_file(name: &str, description: &str, content: &str) -> String {
        format!(
            "---\nname: {}\ndescription: {}\n---\n\n{}",
            name, description, content
        )
    }

    /// Load a skill from a directory
    fn load_from_dir(dir: &PathBuf, config: &SkillsConfig) -> Result<Skill> {
        let skill_file = dir.join("SKILL.md");

        if !skill_file.exists() {
            return Err(RhinolabsError::ConfigError(
                format!("SKILL.md not found in {:?}", dir)
            ));
        }

        let id = dir
            .file_name()
            .and_then(|s| s.to_str())
            .ok_or_else(|| RhinolabsError::ConfigError("Invalid skill directory name".into()))?
            .to_string();

        let file_content = fs::read_to_string(&skill_file)?;
        let (frontmatter, markdown_content) = Self::parse_skill_file(&file_content)?;

        let is_custom = config.custom.contains(&id);
        let enabled = !config.disabled.contains(&id);
        let category = if is_custom {
            SkillCategory::Custom
        } else {
            Self::get_category(&id)
        };

        // Get created_at for custom skills
        let created_at = if is_custom {
            skill_file.metadata()
                .ok()
                .and_then(|m| m.created().ok())
                .map(|t| chrono::DateTime::<chrono::Utc>::from(t).to_rfc3339())
        } else {
            None
        };

        Ok(Skill {
            id,
            name: frontmatter.name,
            description: frontmatter.description,
            enabled,
            category,
            path: skill_file.display().to_string(),
            content: markdown_content,
            created_at,
            is_custom,
        })
    }

    /// List all skills
    pub fn list() -> Result<Vec<Skill>> {
        let dir = Self::skills_dir()?;

        if !dir.exists() {
            return Ok(vec![]);
        }

        let config = Self::load_config()?;
        let mut skills = Vec::new();

        for entry in fs::read_dir(&dir)? {
            let entry = entry?;
            let path = entry.path();

            if path.is_dir() {
                if let Ok(skill) = Self::load_from_dir(&path, &config) {
                    skills.push(skill);
                }
            }
        }

        // Sort: corporate first, then by category, then by name
        skills.sort_by(|a, b| {
            let cat_order = |cat: &SkillCategory| match cat {
                SkillCategory::Corporate => 0,
                SkillCategory::Frontend => 1,
                SkillCategory::Testing => 2,
                SkillCategory::AiSdk => 3,
                SkillCategory::Utilities => 4,
                SkillCategory::Custom => 5,
            };

            cat_order(&a.category)
                .cmp(&cat_order(&b.category))
                .then_with(|| a.name.cmp(&b.name))
        });

        Ok(skills)
    }

    /// Get a specific skill by id
    pub fn get(id: &str) -> Result<Option<Skill>> {
        let dir = Self::skills_dir()?.join(id);

        if !dir.exists() {
            return Ok(None);
        }

        let config = Self::load_config()?;
        Ok(Some(Self::load_from_dir(&dir, &config)?))
    }

    /// Create a new custom skill
    pub fn create(input: CreateSkillInput) -> Result<Skill> {
        let skill_dir = Self::skills_dir()?.join(&input.id);

        if skill_dir.exists() {
            return Err(RhinolabsError::ConfigError(
                format!("Skill '{}' already exists", input.id)
            ));
        }

        // Create skill directory
        fs::create_dir_all(&skill_dir)?;

        // Create SKILL.md
        let file_content = Self::generate_skill_file(&input.name, &input.description, &input.content);
        let skill_file = skill_dir.join("SKILL.md");
        fs::write(&skill_file, &file_content)?;

        // Update config to mark as custom
        let mut config = Self::load_config()?;
        config.custom.push(input.id.clone());
        Self::save_config(&config)?;

        // Return the created skill
        let config = Self::load_config()?;
        Self::load_from_dir(&skill_dir, &config)
    }

    /// Update an existing skill
    pub fn update(id: &str, input: UpdateSkillInput) -> Result<()> {
        let skill_dir = Self::skills_dir()?.join(id);

        if !skill_dir.exists() {
            return Err(RhinolabsError::ConfigError(
                format!("Skill '{}' not found", id)
            ));
        }

        let config = Self::load_config()?;
        let mut skill = Self::load_from_dir(&skill_dir, &config)?;

        // Update fields
        if let Some(name) = input.name {
            skill.name = name;
        }
        if let Some(description) = input.description {
            skill.description = description;
        }
        if let Some(content) = input.content {
            skill.content = content;
        }

        // Write updated SKILL.md
        let file_content = Self::generate_skill_file(&skill.name, &skill.description, &skill.content);
        let skill_file = skill_dir.join("SKILL.md");
        fs::write(&skill_file, &file_content)?;

        // Handle enabled toggle
        if let Some(enabled) = input.enabled {
            Self::toggle(id, enabled)?;
        }

        Ok(())
    }

    /// Toggle skill enabled state
    pub fn toggle(id: &str, enabled: bool) -> Result<()> {
        let skill_dir = Self::skills_dir()?.join(id);

        if !skill_dir.exists() {
            return Err(RhinolabsError::ConfigError(
                format!("Skill '{}' not found", id)
            ));
        }

        let mut config = Self::load_config()?;

        if enabled {
            config.disabled.retain(|s| s != id);
        } else if !config.disabled.contains(&id.to_string()) {
            config.disabled.push(id.to_string());
        }

        Self::save_config(&config)
    }

    /// Delete a custom skill
    pub fn delete(id: &str) -> Result<()> {
        let config = Self::load_config()?;

        if !config.custom.contains(&id.to_string()) {
            return Err(RhinolabsError::ConfigError(
                format!("Cannot delete built-in skill '{}'. You can only disable it.", id)
            ));
        }

        let skill_dir = Self::skills_dir()?.join(id);

        if !skill_dir.exists() {
            return Err(RhinolabsError::ConfigError(
                format!("Skill '{}' not found", id)
            ));
        }

        // Remove directory
        fs::remove_dir_all(&skill_dir)?;

        // Update config
        let mut config = Self::load_config()?;
        config.custom.retain(|s| s != id);
        config.disabled.retain(|s| s != id);
        Self::save_config(&config)?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_skill_file() {
        let content = r#"---
name: test-skill
description: A test skill for testing
---

# Test Skill

This is the content.
"#;

        let result = Skills::parse_skill_file(content);
        assert!(result.is_ok());

        let (frontmatter, markdown) = result.unwrap();
        assert_eq!(frontmatter.name, "test-skill");
        assert!(frontmatter.description.contains("test skill"));
        assert!(markdown.contains("# Test Skill"));
    }

    #[test]
    fn test_get_category() {
        assert_eq!(Skills::get_category("rhinolabs-standards"), SkillCategory::Corporate);
        assert_eq!(Skills::get_category("react-patterns"), SkillCategory::Frontend);
        assert_eq!(Skills::get_category("playwright"), SkillCategory::Testing);
        assert_eq!(Skills::get_category("ai-sdk-core"), SkillCategory::AiSdk);
        assert_eq!(Skills::get_category("skill-creator"), SkillCategory::Utilities);
        assert_eq!(Skills::get_category("unknown-skill"), SkillCategory::Custom);
    }

    #[test]
    fn test_generate_skill_file() {
        let content = Skills::generate_skill_file("My Skill", "Description", "# Content");

        assert!(content.starts_with("---"));
        assert!(content.contains("name: My Skill"));
        assert!(content.contains("description: Description"));
        assert!(content.contains("# Content"));
    }

    #[test]
    fn test_skills_config_default() {
        let config = SkillsConfig::default();

        assert!(config.disabled.is_empty());
        assert!(config.custom.is_empty());
    }
}
