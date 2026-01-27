use crate::ui::Ui;
use anyhow::Result;
use colored::Colorize;
use rhinolabs_core::Deploy;

/// Sync configuration from GitHub (CLI-only, read-only operation)
/// Deploy and export are GUI-only to prevent team devs from modifying config
pub async fn sync() -> Result<()> {
    Ui::header("Syncing Configuration");

    Ui::step("Fetching latest configuration from GitHub...");

    match Deploy::sync().await {
        Ok(result) => {
            println!();
            Ui::success("Configuration synced successfully!");
            println!();

            println!("  Version: {}", result.version.cyan());
            println!();

            Ui::section("Installed");
            println!("  {} Profiles:      {}", "✓".green(), result.profiles_installed);
            println!("  {} Skills:        {}", "✓".green(), result.skills_installed);
            println!(
                "  {} Instructions:  {}",
                if result.instructions_installed { "✓".green() } else { "○".dimmed() },
                if result.instructions_installed { "Updated" } else { "Skipped" }
            );
            println!(
                "  {} Settings:      {}",
                if result.settings_installed { "✓".green() } else { "○".dimmed() },
                if result.settings_installed { "Updated" } else { "Skipped" }
            );
            println!("  {} Output Styles: {}", "✓".green(), result.output_styles_installed);
            println!();

            Ui::info("Restart Claude Code to apply changes.");
            println!();
        }
        Err(e) => {
            Ui::error(&format!("Sync failed: {}", e));
            println!();
            Ui::info("Make sure:");
            println!("  1. GitHub repository is configured in Project Settings");
            println!("  2. A configuration has been deployed first");
            println!("  3. You have internet access");
            println!();
        }
    }

    Ok(())
}
