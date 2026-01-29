---
name: Pre-Push Validation
description: Validations to run before pushing to GitHub to avoid CI failures
---

# Pre-Push Validation

Before pushing code to GitHub, run these validations locally to catch issues before CI.

**CRITICAL: NEVER skip ANY validation step. ALL checks must pass before pushing.**

## Validation Checklist

### 1. Clippy (Linting)

```bash
cargo clippy --workspace -- -D warnings
```

**Common clippy errors to watch for:**

| Error                    | Fix                                                                      |
| ------------------------ | ------------------------------------------------------------------------ |
| `clone_on_copy`          | Remove `.clone()` on Copy types (e.g., `FileOptions`)                    |
| `derivable_impls`        | Use `#[derive(Default)]` + `#[default]` attribute instead of manual impl |
| `only_used_in_recursion` | Change `&self` methods to associated functions (`Self::method()`)        |
| `ptr_arg`                | Use `&Path` instead of `&PathBuf` in function parameters                 |
| `redundant_closure`      | Replace `\|x\| Foo::from(x)` with `Foo::from`                            |
| `unnecessary_filter_map` | Use `.map()` when closure always returns `Some`                          |
| `doc_lazy_continuation`  | Add blank line (`///`) before continued doc list items                   |
| `needless_late_init`     | Initialize variables at declaration point                                |

### 2. Formatting

```bash
cargo fmt --all -- --check
```

If it fails, run:

```bash
cargo fmt --all
```

### 3. Rust Tests

```bash
cargo test --workspace
```

### 4. TypeScript Type Check

```bash
cd gui && npx tsc --noEmit
```

### 5. E2E Tests (Playwright)

```bash
cd gui/tests && pnpm test
```

If tests fail, check:

- Mock file (`mocks/tauri-mock.js`) has all required commands
- New UI elements have proper test coverage
- Selectors match actual component structure

### 6. Local CI with Act (Optional)

For full CI simulation:

```bash
# Run specific job
act -j test --matrix os:ubuntu-latest -P ubuntu-latest=catthehacker/ubuntu:act-latest

# View only last N lines
act -j test --matrix os:ubuntu-latest -P ubuntu-latest=catthehacker/ubuntu:act-latest 2>&1 | tail -50
```

**Note:** Ensure your workflow has explicit components:

```yaml
- name: Install Rust
  uses: dtolnay/rust-toolchain@stable
  with:
    components: clippy, rustfmt
```

## Full Validation Sequence

**Run ALL checks before push (in order):**

```bash
# 1. Rust: format, lint, test
cargo fmt --all && cargo clippy --workspace -- -D warnings && cargo test --workspace

# 2. TypeScript: type check
cd gui && npx tsc --noEmit && cd ..

# 3. E2E: Playwright tests
cd gui/tests && pnpm test && cd ../..
```

**CRITICAL: ALL tests must pass. Do NOT skip ANY TEST.**

## Fixing Common Issues

### Copy Types Don't Need Clone

```rust
// Bad - FileOptions implements Copy
zip.start_file("file.txt", options.clone())?;

// Good
zip.start_file("file.txt", options)?;

// If parameter is &FileOptions, dereference it
zip.start_file("file.txt", *options)?;
```

### Enum Default with Derive

```rust
// Bad - Manual implementation
impl Default for MyEnum {
    fn default() -> Self {
        Self::Variant
    }
}

// Good - Derive with attribute
#[derive(Default)]
enum MyEnum {
    Other,
    #[default]
    Variant,
}
```

### Associated Functions vs Methods

```rust
// Bad - &self only used in recursion
fn process(&self, items: &[Item]) -> Result<()> {
    // ...
    self.process(&remaining)?;  // Only use of self
}

// Good - Associated function
fn process(items: &[Item]) -> Result<()> {
    // ...
    Self::process(&remaining)?;
}
```

### Path Parameters

```rust
// Bad
fn get_version(dir: &PathBuf) -> Option<String>

// Good
fn get_version(dir: &Path) -> Option<String>
```

## GitHub Actions Workflow Template

```yaml
- name: Install Rust
  uses: dtolnay/rust-toolchain@stable
  with:
    components: clippy, rustfmt

- name: Run tests
  run: cargo test --workspace --verbose

- name: Run clippy
  run: cargo clippy --workspace -- -D warnings

- name: Check formatting
  run: cargo fmt --all -- --check
```

## Tauri-Specific Dependencies

For Tauri projects on Ubuntu, ensure these dependencies:

```yaml
- name: Install Linux dependencies (Tauri)
  if: matrix.os == 'ubuntu-latest'
  run: |
    sudo apt-get update
    sudo apt-get install -y libwebkit2gtk-4.1-dev librsvg2-dev patchelf libgtk-3-dev libayatana-appindicator3-dev
```

**Note:** Use `libayatana-appindicator3-dev` (not `libappindicator3-dev`) to avoid package conflicts.
