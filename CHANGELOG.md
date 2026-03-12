# Changelog

All notable changes to tom-and-jerry will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### Phase 1: Foundation (2026-03-11)
- Protocol design: `TJMessage`, `TJHandoff`, `TJHeartbeat`, `TJPair` Zod schemas
- Core transport layer: Tailscale discovery, SSH execution, WOL magic packets
- Gateway wake implementation via reverse-engineered OpenClaw WebSocket protocol
- Socat proxy pattern for Tom (loopback + Tailscale bridge)
- Reference implementation: Calcifer (AWS/Linux) ↔ GLaDOS (Windows home PC)
- First successful bidirectional agent-to-agent message
- First inter-agent code review completed

#### Phase 2: Plug & Play (2026-03-12)
- **Onboard wizard** — 12-step setup flow via @clack/prompts:
  1. `welcome.ts` — Node >= 22, OpenClaw, Tailscale prerequisite checks
  2. `role.ts` — Tom (orchestrator) or Jerry (executor) selection
  3. `identity.ts` — Name, emoji, persona customization
  4. `provider.ts` — LLM provider setup (5 providers: Anthropic, OpenAI, Ollama, OpenRouter, Gemini) with keytar credential storage
  5. `peer.ts` — Remote Tailscale hostname/IP, SSH user/key, OS detection, live connectivity test
  6. `wol.ts` — MAC address, broadcast IP, router port, timeout configuration
  7. `gateway_bind.ts` — Bind mode selection + remote peer config update via SSH
  8. `autologin.ts` — Windows AutoAdminLogon registry setup (if Jerry is Windows + WOL)
  9. `startup.ts` — Install `start-gateway.bat` (Windows) or `.sh` (Linux) on Jerry
  10. `soul.ts` — Copy personalized SOUL/IDENTITY/AGENTS templates
  11. `validate.ts` — End-to-end validation: WOL → Tailscale ping → SSH → gateway health
  12. `finalize.ts` — Write `tj.json`, generate pairing code, print setup summary
- **Provider abstraction** — Unified interface for 5 LLM providers with keytar credential storage and cost routing
- **`tj send` command** — Delegate tasks to peer with WOL wake, `--wait` polling, `--peer` targeting, `--auto` capability routing
- **`tj status` command** — Tailscale ping, gateway health, heartbeat timestamp, WOL indicator
- **`tj doctor` command** — 5-check diagnostic suite for troubleshooting
- **`tj heartbeat` command** — Send, show, and record heartbeats
- **`tj result` command** — Mark tasks complete (Jerry calls via SSH after task execution)
- **`tj peers` command** — List all peers with GPU/Ollama/skill info, `--ping` for live check, `--json` output
- **Docker Tom template** — Alpine-based image with Tailscale + OpenClaw + tom-and-jerry
- **TJMessage discriminated union** — Typed envelopes for `TJTaskMessage`, `TJResultMessage`, `TJHeartbeatMessage`, `TJLatentMessage`
- **Full test suite** — 81 passing tests via Vitest covering protocol, transport, trust, and gateway
- **`send-to-agent.js` relay script** — Standalone Node script for agent-to-agent messaging without build step

#### Phase 3: Intelligence Layer (2026-03-12)
- **Capability registry** — `TJCapabilityReport` Zod schema with GPU info (nvidia-smi/rocm-smi/Metal), Ollama model list, skill tags
- **Auto-scanner** — Probes hardware/software capabilities on startup
- **Capability routing** — `selectBestPeer()` function with keyword heuristic fallback
- **Budget tracking** — Per-task token/cost tracking with provider-specific pricing tables
- **`tj budget` command** — Cloud vs local breakdown, savings estimates, `--today/week/month/all`, `--tasks`, `--json`
- **Handoff continuity (Tom side)** — Per-peer context ring buffer (N=10), template-based summarizer, auto-summarize on task complete, `context_summary` field in outbound messages
- **Multi-Jerry support** — `peer_nodes[]` array in config (backwards-compatible), `--peer <name>` and `--auto` flags on `tj send`
- **`tj capabilities` command** — `scan`, `advertise`, `fetch`, `show`, `route` subcommands

#### Phase 4: Community (2026-03-12)
- **Community registry** — `tj publish` to GitHub Gist, `tj discover` with GPU/skill/provider/OS filters
- **`TJNodeCard` schema** — Anonymous node cards with capabilities, WOL support, tags, description
- **Jerry Docker images**:
  - `docker/jerry/Dockerfile` — CPU/Ollama variant (Debian + Node 22 + Ollama)
  - `docker/jerry/Dockerfile.cuda` — NVIDIA CUDA variant (tested: RTX 3070 Ti+)
  - `docker/jerry/entrypoint.sh` — Tailscale auth, SSH server, Ollama start, config generation
  - `docker/jerry/pull-models.sh` — Pull comma-separated models at startup
- **`docker-compose.yml` profiles** — `jerry-cpu` and `jerry-cuda` alongside Tom
- **Hardware profile docs**:
  - M2 Mac setup guide (`docs/jerry-profiles/m2-mac.md`)
  - Raspberry Pi 5 variant (ARM64 + quantized Ollama models)
  - RTX 4090 profile (`docs/jerry-profiles/rtx-4090.md`)
- **`tj logs` command** — Pretty-printed task history with status badges, relative timestamps, `--status`, `--peer`, `--since`, `--limit`, `--output`, `--json`, `--follow` (live tail)
- **Docs site** — 34 pages via VitePress across guide/reference/protocol/hardware sections

#### Phase 5: Resilience & Developer Experience (2026-03-12)
- **`tj config` command** — `show` (redact secrets), `get <key>` (dot-notation), `set <key> <value>` (auto type coercion), `path`
- **`tj test` command** — Tailscale reachability + RTT, gateway health, round-trip wake message + RTT, summary table, `--json`, exit code 1 on failure
- **Webhook result push** — Tom exposes POST /result (token-gated, one-shot), `deliverResultWebhook()` helper, `startResultServer()` auto-binds to Tailscale IP, fallback to polling
- **Exponential backoff + retry** — `withRetry()` wrapper, `--max-retries` CLI flag, backoff state persistence (`~/.tom-and-jerry/retry/<id>.json`), `cronRetryDecision()` for cron safety
- **Tests** — 28 new tests covering retry logic, webhook auth, timeout, one-shot close, URL parsing

#### Phase 6: Latent Communication (2026-03-12, Experimental)
- **`TJLatentMessage` type** — Added to `TJMessage` discriminated union for latent space communication
- **Vision Wormhole codec path** — Heterogeneous model support via visual encoder pathway
- **LatentMAS KV-cache path** — Same-family model support, training-free
- **Mandatory text fallback** — `fallback_text` field for backwards compatibility
- **Serialization helpers** — `serializeLatent()` and `deserializeLatent()`
- **Type guards** — `isLatentMessage()` and `createLatentMessage()` factory
- **Tests** — 9 tests covering parsing, round-trip serialization, edge cases
- **Implementation guide** — `docs/latent-communication.md` with full protocol spec and integration examples
- **ROADMAP Phase 6 section** — Detailed implementation roadmap with upstream research dependencies

### Infrastructure

- **CI/CD pipeline** — GitHub Actions `ci.yml` (runs on both master and main branches)
- **npm publish workflow** — `publish.yml` auto-publishes to npm on `v*` tags (requires `NPM_TOKEN` secret)
- **Vitest config** — `@tom-and-jerry/core` alias for CLI tests without build step
- **Monorepo structure** — pnpm workspaces: `packages/core`, `packages/cli`, `packages/skills`, `templates/`, `docs/`
- **Build tooling** — tsdown for fast TypeScript compilation, oxlint/oxfmt for linting

### Fixed

- Tailscale ping flag parsing
- Wake ID tracking for duplicate detection
- systemd path resolution on Linux
- GitHub Actions branch filters (master + main support)

## [0.1.0] - TBD

Initial release (pending Phase 2 completion).

---

**Repository:** https://github.com/CalciferFriend/tom-and-jerry
**Authors:** Calcifer 🔥 (Tom/Linux) + GLaDOS 🤖 (Jerry/Windows)
**License:** MIT
