# `hh config` — Reference

Read and write your his-and-hers configuration from the command line.

The config file lives at `~/.his-and-hers/config.json` and holds all node
settings (names, IPs, ports, roles, etc.). **Sensitive secrets** — API keys and
gateway tokens — are **never stored here**; they live in the OS keychain
(Keychain Access on macOS, `secret-tool` / `libsecret` on Linux, Credential
Manager on Windows).

---

## Synopsis

```bash
hh config <subcommand> [key] [value]
```

Running `hh config` with no subcommand is the same as `hh config show`.

---

## Subcommands

| Subcommand | Description |
|------------|-------------|
| `show` | Pretty-print the full config (secrets redacted) |
| `get <key>` | Read a single value (dot-notation) |
| `set <key> <value>` | Write a value (auto type-coerced) |
| `path` | Print the config file path |

---

## `hh config show`

Prints the full configuration with sensitive fields (tokens, keys, passwords)
replaced by `[redacted]`.

```bash
hh config show
```

```
Config — ~/.his-and-hers/config.json
─────────────────────────────────────────────────────
role:              h1
name:              Calcifer
emoji:             🔥
gateway_token:     [redacted]
gateway_port:      18790
gateway_bind:      loopback

peer_nodes:
  - name:          h2-home
    emoji:         🤖
    tailscale_ip:  100.64.0.2
    gateway_port:  18790
    ssh_user:      nic
    ssh_key:       ~/.ssh/id_ed25519
    gateway_token: [redacted]
    wol_mac:       AA:BB:CC:DD:EE:FF

provider:          anthropic
model:             claude-sonnet-4-5
─────────────────────────────────────────────────────
Secrets are redacted above. Keys live in the OS keychain.
```

---

## `hh config get <key>`

Read a single value using dot-notation for nested fields.

```bash
hh config get role
# h1

hh config get peer_nodes.0.tailscale_ip
# 100.64.0.2

hh config get provider
# anthropic
```

Returns the raw value or pretty-printed JSON for objects/arrays.
Exits with code 1 if the key is not found.

---

## `hh config set <key> <value>`

Write a single value. The value is automatically coerced:

| Input | Coerced type |
|-------|-------------|
| `true` / `false` | boolean |
| `42`, `3.14` | number |
| `{"a":1}` or `[1,2]` | JSON object/array |
| anything else | string |

```bash
hh config set gateway_port 19000
hh config set provider openai
hh config set peer_nodes.0.tailscale_ip 100.64.0.5
hh config set peer_nodes.0.wol_mac "AA:BB:CC:DD:EE:FF"
```

::: warning
`hh config set` writes directly to the config file without full schema
validation. For guided initial setup, use `hh onboard` instead.
:::

---

## `hh config path`

Print the absolute path to the config file (no trailing newline). Useful for
scripting.

```bash
hh config path
# /home/nic/.his-and-hers/config.json

# Open in your editor
$EDITOR "$(hh config path)"
```

---

## About secrets

API keys (Anthropic, OpenAI, etc.) and gateway tokens are **never stored in
`config.json`**. They are loaded at runtime from the OS keychain:

- **macOS** — Keychain Access (`security` CLI)
- **Linux** — `libsecret` / `secret-tool`
- **Windows** — Windows Credential Manager (`cmdkey`)

To update a secret, run `hh onboard` (full wizard) or update the relevant
keychain entry directly.

---

## Config file location

- Linux/macOS: `~/.his-and-hers/config.json`
- Windows: `%USERPROFILE%\.his-and-hers\config.json`

---

## See also

- [hh onboard](/reference/onboard) — guided setup wizard
- [hh status](/reference/status) — live peer and gateway status
