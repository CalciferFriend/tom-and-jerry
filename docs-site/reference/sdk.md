# `@his-and-hers/sdk`

Programmatic Node.js/TypeScript API for **his-and-hers**. Use it when you want to dispatch tasks, stream results, or query peer status from your own code — without shelling out to the CLI.

## Installation

```bash
npm install @his-and-hers/sdk
# or
pnpm add @his-and-hers/sdk
```

`@his-and-hers/sdk` requires Node.js ≥ 22 and an existing `hh.json` config (created by `hh onboard`).

---

## Quick Start

```ts
import { HH } from "@his-and-hers/sdk";

const hh = new HH();

// Fire-and-forget — returns task id immediately
const { id } = await hh.send("Summarise the weekly diff and post it to Discord.");
console.log("Dispatched:", id);

// Wait for result
const result = await hh.send("Generate test coverage report", { wait: true });
console.log(result.output);

// Stream partial output while waiting
const result = await hh.send("Write a 2,000-word short story", {
  wait: true,
  onChunk: (chunk) => process.stdout.write(chunk),
});
```

---

## `new HH(options?)`

Creates an HH client instance.

| Option | Type | Default | Description |
|---|---|---|---|
| `configPath` | `string` | `~/.his-and-hers/hh.json` | Override config file path |
| `config` | `SDKConfig` | — | Inject config directly (skips disk read; useful in tests) |
| `stateDirOverride` | `string` | `~/.his-and-hers/state` | Override state directory |

```ts
// Default — reads ~/.his-and-hers/hh.json
const hh = new HH();

// Custom path
const hh = new HH({ configPath: "/etc/hh/config.json" });

// Injected config (no disk I/O — ideal for tests)
const hh = new HH({
  config: {
    this_node: { name: "calcifer", tailscale_ip: "100.1.2.3" },
    peer_node: { name: "glados", tailscale_ip: "100.5.5.5", gateway_port: 18790, gateway_token: "..." },
  },
});
```

---

## `createHH(options?)`

Factory function — equivalent to `new HH(options)`.

```ts
import { createHH } from "@his-and-hers/sdk";
const hh = createHH();
```

---

## `hh.config()`

Load and return the parsed config. Throws if config is missing.

```ts
const cfg = await hh.config();
console.log(cfg.this_node.name, "→", cfg.peer_node.name);
```

**Throws:** `Error: his-and-hers config not found at ...` if the config file doesn't exist and no config was injected.

---

## `hh.send(objective, options?)`

Dispatch a task to a peer node.

```ts
const result = await hh.send("Run nightly benchmarks");
```

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `peer` | `string` | primary peer | Target a specific peer by name |
| `wait` | `boolean` | `false` | Block until the peer delivers a result |
| `timeoutMs` | `number` | `300_000` | Max wait time when `wait: true` (ms) |
| `onChunk` | `(chunk: string) => void` | — | Called for each streaming partial output chunk |
| `routingHint` | `string` | — | Hint for model/capability selection (`"prefer-local"`, `"gpu"`, `"cheap"`, …) |
| `constraints` | `string[]` | `[]` | Additional constraints appended to the task payload |

### `SendResult`

```ts
interface SendResult {
  id: string;              // Stable task UUID
  peer: string;            // Peer name that received the task
  status: "pending" | "completed" | "failed" | "timeout" | "cancelled";
  output?: string;         // Set when status is "completed"
  error?: string;          // Set when status is "failed"
  tokensUsed?: number;
  durationMs?: number;
  costUsd?: number;
}
```

### Examples

```ts
// Fire-and-forget
const { id } = await hh.send("Index the new data files");

// Wait for result with 10-minute timeout
const result = await hh.send("Train small LoRA on dataset", {
  wait: true,
  timeoutMs: 600_000,
});

// Route to a specific peer
const result = await hh.send("Run GPU diffusion job", {
  peer: "glados",
  wait: true,
  routingHint: "gpu",
});

// Stream output while waiting
await hh.send("Write detailed architecture doc", {
  wait: true,
  onChunk: (c) => process.stdout.write(c),
});
```

---

## `hh.status(options?)`

Check peer reachability and gateway health.

```ts
const status = await hh.status();
// { online: true, gatewayHealthy: true, peer: { name: "glados", ... }, latencyMs: 12 }
```

### Options

| Option | Type | Description |
|---|---|---|
| `peer` | `string` | Target a specific peer by name (defaults to primary) |

### `StatusResult`

```ts
interface StatusResult {
  online: boolean;
  gatewayHealthy: boolean;
  peer: { name: string; emoji?: string; tailscale_ip: string; gateway_port: number; };
  latencyMs?: number;       // Only set when online is true
}
```

---

## `hh.ping(options?)`

Lightweight reachability probe (Tailscale ping only, no gateway check).

```ts
const { reachable, latencyMs } = await hh.ping();
```

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `peer` | `string` | primary | Target peer by name |
| `timeoutMs` | `number` | `5000` | Probe timeout (ms) |

---

## `hh.peers()`

List all configured peers.

```ts
const peers = await hh.peers();
// [{ name: "glados", primary: true, tailscale_ip: "100.5.5.5", gateway_port: 18790, ... }]
```

Returns `PeerInfo[]`:

```ts
interface PeerInfo {
  name: string;
  emoji?: string;
  tailscale_ip: string;
  gateway_port: number;
  os?: "linux" | "windows" | "macos";
  primary: boolean;
}
```

---

## `hh.tasks(options?)`

List local task history (reads from `~/.his-and-hers/state/tasks/`).

```ts
const tasks = await hh.tasks({ status: "completed", limit: 10 });
```

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `status` | `TaskStatus \| TaskStatus[]` | all | Filter by one or more statuses |
| `peer` | `string` | — | Filter by peer name |
| `limit` | `number` | `50` | Max results (most recent first) |

### `TaskSummary`

```ts
interface TaskSummary {
  id: string;
  from: string;
  to: string;
  objective: string;
  status: "pending" | "running" | "completed" | "failed" | "timeout" | "cancelled";
  createdAt: string;
  updatedAt: string;
  output?: string;
  tokensUsed?: number;
  durationMs?: number;
  costUsd?: number;
}
```

---

## `hh.getTask(id)`

Look up a single task by full UUID or prefix.

```ts
const task = await hh.getTask("7fe36af8");
if (!task) console.log("Not found");
```

Returns `TaskSummary | null`.

---

## `hh.waitFor(id, options?)`

Poll until a task reaches a terminal status.

```ts
const task = await hh.waitFor("7fe36af8", { timeoutMs: 60_000, intervalMs: 2_000 });
```

| Option | Type | Default | Description |
|---|---|---|---|
| `timeoutMs` | `number` | `300_000` | Give up after this many ms |
| `intervalMs` | `number` | `2_000` | Polling interval (ms) |

Returns `TaskSummary | null` (null on timeout or task not found).

---

## Error Handling

All methods throw on unrecoverable errors (no `process.exit`). Wrap in try/catch:

```ts
try {
  const result = await hh.send("Heavy job", { wait: true });
} catch (err) {
  if (err.message.includes("config not found")) {
    console.error("Run `hh onboard` first");
  } else if (err.message.includes("Failed to deliver")) {
    console.error("Peer unreachable — check `hh status`");
  } else {
    throw err;
  }
}
```

---

## TypeScript

Full type definitions are bundled. Import types directly:

```ts
import type {
  HHOptions,
  SDKConfig,
  SendOptions,
  SendResult,
  StatusResult,
  PeerInfo,
  PingOptions,
  PingResult,
  TaskSummary,
  TasksOptions,
} from "@his-and-hers/sdk";
```

---

## Testing with the SDK

Use `config` injection to avoid disk I/O in tests:

```ts
import { createHH } from "@his-and-hers/sdk";
import { vi } from "vitest";

vi.mock("@his-and-hers/core"); // mock transport

const hh = createHH({
  config: {
    this_node: { name: "test-h1", tailscale_ip: "100.0.0.1" },
    peer_node: { name: "test-h2", tailscale_ip: "100.0.0.2", gateway_port: 18789, gateway_token: "secret" },
  },
});
```

---

## Related

- [`hh send`](/reference/send) — CLI equivalent of `hh.send()`
- [`hh status`](/reference/status) — CLI equivalent of `hh.status()`
- [`hh logs`](/reference/logs) — CLI equivalent of `hh.tasks()`
- [`hh chat`](/reference/chat) — interactive multi-turn REPL (CLI only)
