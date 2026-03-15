# `hh web`

Launch a local web dashboard for your H1 node. Provides a browser UI with a
live task feed, peer status cards, budget summary, and a send-task form.

```
hh web                 # start on default port 3847
hh web --port 8080     # custom port
hh web --no-open       # don't auto-open browser
```

---

## What's in the dashboard

| Panel | Description |
|-------|-------------|
| **Task feed** | Live list of all tasks — status badges, peer, cost, output. Updates via SSE (no polling). |
| **Peer cards** | One card per configured peer: gateway health, Tailscale reachability, capabilities badge. |
| **Budget bar** | This week's cloud spend and token usage at a glance. |
| **Send form** | Dispatch a new task to any peer without leaving the browser. |

---

## Server details

`hh web` runs a lightweight HTTP server using only Node built-ins (`http`, `fs`, `path`, `os`) —
no extra npm dependencies are installed.

The dashboard uses **Server-Sent Events (SSE)** for live updates. When a task
state file changes in `~/.his-and-hers/state/tasks/`, the new state is pushed to
all open browser tabs immediately.

Default port: **3847** (`hh` on a phone keypad).

---

## Flags

| Flag | Description |
|------|-------------|
| `--port <n>` | Port to listen on (default: 3847) |
| `--no-open` | Don't automatically open the browser after starting |

---

## Examples

**Start the dashboard:**

```sh
hh web
# ✔ Dashboard running at http://localhost:3847
```

**Run on a remote H1 node and forward the port:**

```sh
# On H1:
hh web --no-open --port 3847

# On your laptop:
ssh -L 3847:localhost:3847 h1-node
# Then open http://localhost:3847 in your browser
```

**Background the server while doing other work:**

```sh
hh web --no-open &
hh send "analyse this codebase" --wait
```

---

## API endpoints

The dashboard also exposes a JSON REST API for scripting:

| Endpoint | Description |
|----------|-------------|
| `GET /api/tasks` | All task states as JSON array |
| `GET /api/tasks/:id` | Single task state by ID |
| `GET /api/peers` | Peer list with health status |
| `GET /api/budget` | This week's `BudgetSummary` |
| `POST /api/send` | Dispatch a task (body: `{ task, peer? }`) |
| `GET /events` | SSE stream for live task + peer updates |

---

## See also

- [`hh logs`](./logs.md) — CLI task history viewer
- [`hh budget`](./budget.md) — CLI cost summary
- [`hh status`](./cli.md) — check peer reachability from the terminal
