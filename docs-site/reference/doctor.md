# `hh doctor`

Comprehensive health diagnostics for a his-and-hers node. Checks local and peer connectivity, configuration, and capability freshness — and gives actionable remediation hints when something is wrong.

## Usage

```bash
hh doctor
hh doctor --peer <name>
hh doctor --json
```

## Flags

| Flag | Description |
|------|-------------|
| `--peer <name>` | Run checks only for a specific peer by name |
| `--json` | Output results as machine-readable JSON |

## Checks performed

### Local
- Node.js version (≥22 required)
- OpenClaw installed and reachable
- Local gateway health (HTTP /health)

### Per peer
- Tailscale reachability (ping)
- SSH connectivity
- Peer gateway health
- Wake-on-LAN configuration
- Capability file freshness (`~/.his-and-hers/peer-capabilities.json`)

### Summary
- Pass / Warn / Fail counts
- Suggested next steps for any failed checks

## Examples

```bash
# Full diagnostic for all configured peers
hh doctor

# Focus on a single peer
hh doctor --peer glados

# Pipe results to jq
hh doctor --json | jq '.checks[] | select(.status == "fail")'
```

## Notes

- `hh doctor` is a read-only command — it doesn't modify any configuration.
- For a quicker connectivity check, see `hh test` (subset of doctor checks, CI-friendly exit codes).
- Capability staleness is flagged when the peer capabilities file is older than 24 hours.

## See also

- [`hh test`](/reference/test) — subset of checks with CI-friendly exit codes
- [`hh status`](/reference/status) — live node status at a glance
- [`hh peers`](/reference/peers) — list all peers with reachability info
