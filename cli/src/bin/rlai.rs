//! Short alias for rhinolabs-ai CLI

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    rhinolabs_ai_cli::run().await
}
