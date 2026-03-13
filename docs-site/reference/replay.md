# `hh replay`

Re-send a previously dispatched task with the same objective and constraints. Useful when a task fails, times out, or you want to retry with a different peer — without re-typing the full task description.

The original task is left untouched; `replay` creates a brand new task ID so the retry appears as its own entry in `hh logs`.

## Usage

```bash
hh replay <id>
```

`<id>` is a task ID or unambiguous prefix (from `hh logs`).

## Flags

| Flag | Description |
|------|-------------|
| `--peer <name>` | Override the target peer by name |
| `--wait` | Block until the result arrives |
| `--wait-timeout <seconds>` | Max seconds to wait (default: 300) |
| `--no-webhook` | Disable result webhook server (polling only) |
| `--notify <url>` | Webhook URL for task completion notification (Discord/Slack/generic) |
| `--dry-run` | Show what would be sent without actually sending |
| `--json` | Output replay plan as JSON (dry-run only) |

## Examples

```bash
# Re-send the most recent failed task
hh replay abc123

# Retry on a different peer
hh replay abc123 --peer gpu-beast

# Preview what would be sent
hh replay abc123 --dry-run --json

# Replay and wait for the result
hh replay abc123 --wait
```

## Notes

- Only tasks stored in `~/.his-and-hers/tasks/` can be replayed (i.e., those sent without `--no-state`).
- The peer, model, and flags from the original task are reused unless overridden.
- Use `hh cancel` before replaying if you want to mark the original task as cancelled.

## See also

- [`hh send`](/reference/send) — send a new task
- [`hh cancel`](/reference/cancel) — cancel a pending or running task
- [`hh logs`](/reference/logs) — view task history and find IDs
