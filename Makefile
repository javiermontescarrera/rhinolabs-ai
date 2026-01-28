.PHONY: test test-rust test-e2e test-quick build clean help

# Default target
help:
	@echo "Available commands:"
	@echo "  make test       - Run ALL tests (Rust + E2E)"
	@echo "  make test-rust  - Run Rust tests only (core + cli)"
	@echo "  make test-e2e   - Run E2E tests only (GUI)"
	@echo "  make test-quick - Run quick tests (Rust only, no E2E)"
	@echo "  make build      - Build all components"
	@echo "  make clean      - Clean build artifacts"

# Run all tests
test: test-rust test-e2e
	@echo "✓ All tests completed"

# Rust tests (core + cli + gui-tauri)
test-rust:
	@echo "Running Rust tests..."
	cargo test --workspace
	@echo "✓ Rust tests completed"

# E2E tests (GUI with Playwright)
test-e2e:
	@echo "Running E2E tests..."
	cd gui/tests && pnpm test
	@echo "✓ E2E tests completed"

# Quick tests (skip slow E2E)
test-quick: test-rust
	@echo "✓ Quick tests completed (E2E skipped)"

# Build all
build:
	@echo "Building Rust workspace..."
	cargo build --workspace
	@echo "Building GUI..."
	cd gui && pnpm build
	@echo "✓ Build completed"

# Clean
clean:
	cargo clean
	rm -rf gui/dist
	@echo "✓ Cleaned"
