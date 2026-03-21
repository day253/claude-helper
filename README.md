# Claude Helper

Save **API keys** for multiple providers locally, run **health checks**, and merge **`ANTHROPIC_*`** into **Claude Code** `~/.claude/settings.json`.  
**npm**: [`claude-helper`](https://www.npmjs.com/package/claude-helper) · **CLI**: `claude-helper` (no subcommand opens the interactive wizard, same as `init`).

| Doc | Description |
|-----|-------------|
| **This file** | Install and day-to-day usage |
| [README.zh-CN.md](README.zh-CN.md) | 简体中文使用指南 |
| [doc/overview-zh.md](doc/overview-zh.md) | Project overview, vs official helpers, provider table, dev/release/GitHub |
| [doc/vendor-docs-zh.md](doc/vendor-docs-zh.md) | Vendor doc links and built-in bases |
| [doc/technical-guide-zh.md](doc/technical-guide-zh.md) | Modules and data flow (maintainers) |
| [doc/github-npm-publish-zh.md](doc/github-npm-publish-zh.md) | Publish to npm with GitHub Actions + tags |

---

## Install

```bash
# Global
npm install -g claude-helper

# Or run without installing (first resolve can be slow; prefer global for daily use)
npx claude-helper --help
```

From source: `git clone`, then `npm install && npm run build` — see [doc/overview-zh.md](doc/overview-zh.md).

---

## Usage

### 1. First run (wizard)

Run with **no subcommand**:

```bash
claude-helper
```

Flow: optional **guide language** (`zh` / `en`) → if no keys yet, a **short path**: pick provider → paste **API Key** (doc links in the terminal) → optionally **sync to Claude Code**. Main menu: **check**, **switch language**, see whether **settings match the active provider**.

Config file: **`~/.llm-providers/config.yaml`** (optional **`wizard_lang`**).

### 2. Claude Code: write env into settings

```bash
claude-helper set glm --key <YOUR_KEY>   # or another provider; see --help
claude-helper active glm
claude-helper claude apply              # merge into ~/.claude/settings.json (backup first)
```

Then run **`claude`** in your project terminal ([Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code/overview) required).

### 3. Export for current shell only (no settings file)

```bash
claude-helper claude export
# or:
eval "$(claude-helper claude export)"
```

### 4. OpenAI-compatible clients (LiteLLM, OpenAI SDK, etc.)

```bash
claude-helper active <provider>
eval "$(claude-helper export)"
# or JSON: claude-helper export -f json
```

### 5. Check connectivity and config

```bash
claude-helper check
claude-helper check --verbose     # full detail (footnotes, doc links)
claude-helper doctor              # same as check
claude-helper check --json        # machine-readable
claude-helper check --try-models glm-4.7,glm-5,glm-4.5-air   # probe models (POST /v1/messages)
```

Default output is **concise**; the wizard’s “run check” matches the CLI and suggests `--verbose` for the full report. `--try-models` helps debug multiple model IDs (e.g. Zhipu); it does **not** change `config.yaml`; with `--json`, results include a `model_probes` array.

---

## Command cheat sheet

| Command | Purpose |
|---------|---------|
| `claude-helper` / `init` | Interactive menu / first-time short path |
| `check` / `doctor` | Keys, active provider, Anthropic root probe, settings alignment; optional `--try-models` |
| `set <id>` | Set key / `--base` / `--anthropic-base` / `--model`; interactive key entry if no flags |
| `active [id]` | Show or set default provider |
| `list` / `show <id>` | List or show one item (secrets redacted) |
| `export` | `OPENAI_*` shell or JSON |
| `claude export` / `claude apply` | Print or write `ANTHROPIC_*` settings |

Provider IDs: see `claude-helper --help`.

---

## Notes

- **Not a replacement** for Zhipu’s official `npx @z_ai/coding-helper` (install, MCP, marketplace, etc.); this tool only handles keys, checks, export, and **`claude apply`**. Comparison: [doc/overview-zh.md](doc/overview-zh.md).
- **Security**: `settings.json` holds secrets in plain text — do not commit; mind permissions on `settings.json.bak.*`.
