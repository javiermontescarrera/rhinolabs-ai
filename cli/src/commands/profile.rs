use crate::ui::Ui;
use anyhow::Result;
use colored::Colorize;
use rhinolabs_core::{Profiles, ProfileType};
use std::io::{self, Write};
use std::path::Path;

/// Prompt user for yes/no confirmation
fn prompt_yes_no(prompt: &str, default_yes: bool) -> bool {
    let suffix = if default_yes { "[Y/n]" } else { "[y/N]" };
    print!("{} {}: ", prompt, suffix);
    io::stdout().flush().unwrap();

    let mut input = String::new();
    if io::stdin().read_line(&mut input).is_err() {
        return default_yes;
    }

    let input = input.trim().to_lowercase();
    if input.is_empty() {
        return default_yes;
    }

    matches!(input.as_str(), "y" | "yes" | "si" | "sí")
}

/// List all profiles
pub fn list() -> Result<()> {
    Ui::header("Profiles");

    let profiles = Profiles::list()?;

    if profiles.is_empty() {
        Ui::info("No profiles configured yet.");
        Ui::info("Create profiles in the GUI to organize your skills.");
        return Ok(());
    }

    let default_user = Profiles::get_default_user_profile()?.map(|p| p.id);

    for profile in profiles {
        let type_badge = match profile.profile_type {
            ProfileType::User => "[User]",
            ProfileType::Project => "[Project]",
        };

        let default_badge = if Some(&profile.id) == default_user.as_ref() {
            " (default)"
        } else {
            ""
        };

        let skill_count = profile.skills.len();

        println!();
        println!(
            "  {} {} {}{}",
            "•".cyan(),
            profile.name.bold(),
            type_badge.dimmed(),
            default_badge.green()
        );
        println!("    ID: {}", profile.id);
        println!("    Skills: {}", skill_count);
        if !profile.description.is_empty() {
            println!("    {}", profile.description.dimmed());
        }
    }

    println!();
    Ok(())
}

/// Show details of a specific profile
pub fn show(profile_id: &str) -> Result<()> {
    let profile = Profiles::get(profile_id)?;

    match profile {
        Some(profile) => {
            Ui::header(&format!("Profile: {}", profile.name));

            let type_str = match profile.profile_type {
                ProfileType::User => "User (installs to ~/.claude/)",
                ProfileType::Project => "Project (installs to project/.claude/)",
            };

            println!("  ID:          {}", profile.id);
            println!("  Name:        {}", profile.name);
            println!("  Type:        {}", type_str);
            println!("  Description: {}", profile.description);
            println!("  Created:     {}", profile.created_at);
            println!("  Updated:     {}", profile.updated_at);
            println!();

            if profile.skills.is_empty() {
                Ui::info("No skills assigned to this profile.");
            } else {
                Ui::section("Assigned Skills");
                for skill_id in &profile.skills {
                    println!("  • {}", skill_id);
                }
            }

            println!();
        }
        None => {
            Ui::error(&format!("Profile '{}' not found", profile_id));
        }
    }

    Ok(())
}

/// Install a profile to a target path
pub fn install(profile_id: &str, target_path: Option<String>) -> Result<()> {
    Ui::header("Installing Profile");

    let profile = Profiles::get(profile_id)?;

    match profile {
        Some(profile) => {
            Ui::step(&format!("Profile: {} ({})", profile.name, profile.id));

            // For Project profiles: use current directory if no path specified
            let effective_path = if profile.profile_type == ProfileType::Project {
                let path = target_path
                    .map(|p| std::path::PathBuf::from(p))
                    .unwrap_or_else(|| std::env::current_dir().unwrap_or_default());

                let path_display = path.display().to_string();
                println!();
                println!("  {} Profile '{}' will be installed as a plugin in:", "→".cyan(), profile.name);
                println!("    {}", path_display.bold());
                println!();
                println!("  This will create:");
                println!("    • .claude-plugin/plugin.json");
                println!("    • .claude/skills/ ({} skills)", profile.skills.len());
                println!("    • CLAUDE.md");
                println!();

                if !prompt_yes_no("Continue?", true) {
                    Ui::info("Installation cancelled.");
                    return Ok(());
                }
                println!();

                Some(path)
            } else {
                // User profile - path is ignored, installs to ~/.claude/
                if target_path.is_some() {
                    Ui::warning("User profiles ignore --path and install to ~/.claude/");
                }
                None
            };

            if profile.skills.is_empty() {
                Ui::warning("This profile has no skills assigned.");
                Ui::info("Assign skills to this profile in the GUI first.");
                return Ok(());
            }

            Ui::step(&format!("Installing {} skills...", profile.skills.len()));

            let path = effective_path.as_deref();
            let result = Profiles::install(profile_id, path)?;

            println!();
            Ui::success(&format!("Installed to: {}", result.target_path));

            // Show what was created based on profile type
            if profile.profile_type == ProfileType::Project {
                Ui::section("Plugin Structure Created");
                println!("  {} .claude-plugin/plugin.json", "✓".green());
                println!("  {} .claude/skills/", "✓".green());
                println!("  {} CLAUDE.md", "✓".green());
            }

            if !result.skills_installed.is_empty() {
                Ui::section("Skills Installed");
                for skill in &result.skills_installed {
                    println!("  {} {}", "✓".green(), skill);
                }
            }

            if !result.skills_failed.is_empty() {
                Ui::section("Failed Skills");
                for error in &result.skills_failed {
                    println!("  {} {} - {}", "✗".red(), error.skill_id, error.error);
                }
            }

            println!();
            if profile.profile_type == ProfileType::Project {
                Ui::info("Profile installed as a project plugin.");
                Ui::info("Claude Code will automatically load it when working in this directory.");
            } else {
                Ui::info("Claude Code will automatically load skills from this location.");
            }
        }
        None => {
            Ui::error(&format!("Profile '{}' not found", profile_id));
            Ui::info("Use 'rhinolabs-ai profile list' to see available profiles.");
        }
    }

    Ok(())
}

/// Update installed profile (re-install with latest skill versions)
pub fn update(profile_id: &str, target_path: Option<String>) -> Result<()> {
    Ui::header("Updating Profile");

    let profile = Profiles::get(profile_id)?;

    match profile {
        Some(profile) => {
            Ui::step(&format!("Profile: {} ({})", profile.name, profile.id));

            // For Project profiles: use current directory if no path specified
            let effective_path = if profile.profile_type == ProfileType::Project {
                let path = target_path
                    .map(|p| std::path::PathBuf::from(p))
                    .unwrap_or_else(|| std::env::current_dir().unwrap_or_default());

                let path_display = path.display().to_string();
                println!();
                println!("  {} Profile '{}' will be updated in:", "→".cyan(), profile.name);
                println!("    {}", path_display.bold());
                println!();

                if !prompt_yes_no("Continue?", true) {
                    Ui::info("Update cancelled.");
                    return Ok(());
                }
                println!();

                Some(path)
            } else {
                None
            };

            Ui::step("Updating skills to latest versions...");

            let path = effective_path.as_deref();
            let result = Profiles::update_installed(profile_id, path)?;

            println!();
            Ui::success("Profile updated!");

            println!("  Updated: {} skills", result.skills_installed.len());
            if !result.skills_failed.is_empty() {
                println!("  Failed: {} skills", result.skills_failed.len());
            }

            println!();
        }
        None => {
            Ui::error(&format!("Profile '{}' not found", profile_id));
        }
    }

    Ok(())
}

/// Uninstall profile from a target path
pub fn uninstall(target_path: Option<String>) -> Result<()> {
    Ui::header("Uninstalling Profile");

    // Use current directory if no path specified
    let path = target_path
        .map(|p| std::path::PathBuf::from(p))
        .unwrap_or_else(|| std::env::current_dir().unwrap_or_default());

    let path_display = path.display().to_string();

    println!();
    println!("  {} Profile will be uninstalled from:", "→".cyan());
    println!("    {}", path_display.bold());
    println!();

    if !path.exists() {
        Ui::error("Target path does not exist");
        return Ok(());
    }

    let claude_dir = path.join(".claude");
    let plugin_dir = path.join(".claude-plugin");

    if !claude_dir.exists() && !plugin_dir.exists() {
        Ui::warning("No profile installation found at this location.");
        return Ok(());
    }

    println!("  This will remove:");
    if claude_dir.exists() {
        println!("    • .claude/ (skills)");
    }
    if plugin_dir.exists() {
        println!("    • .claude-plugin/ (plugin manifest)");
    }
    println!("    • CLAUDE.md (if generated by rhinolabs-ai)");
    println!();

    if !prompt_yes_no("Continue?", false) {
        Ui::info("Uninstall cancelled.");
        return Ok(());
    }
    println!();

    Profiles::uninstall(&path)?;

    Ui::success("Profile uninstalled!");

    Ok(())
}
