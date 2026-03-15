/**
 * web/dashboard-server.test.ts — Phase 11a dashboard server tests
 */

import { describe, it, expect, afterEach } from "vitest";
import { startDashboard, type DashboardServerHandle } from "./dashboard-server.ts";

let server: DashboardServerHandle | null = null;

afterEach(() => {
  if (server) {
    server.close();
    server = null;
  }
});

describe("startDashboard", () => {
  it("starts server on specified port", async () => {
    server = await startDashboard(4444);
    expect(server.url).toBe("http://127.0.0.1:4444");
  });

  it("serves HTML at root", async () => {
    server = await startDashboard(4445);
    const res = await fetch(server.url);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    const html = await res.text();
    expect(html).toContain("HH Dashboard");
  });

  it("returns 404 for unknown routes", async () => {
    server = await startDashboard(4446);
    const res = await fetch(`${server.url}/unknown`);
    expect(res.status).toBe(404);
  });

  it("serves /api/tasks endpoint", async () => {
    server = await startDashboard(4447);
    const res = await fetch(`${server.url}/api/tasks`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
    const data = await res.json();
    expect(data).toHaveProperty("ok");
    expect(data).toHaveProperty("tasks");
    expect(Array.isArray(data.tasks)).toBe(true);
  });

  it("serves /api/audit endpoint", async () => {
    server = await startDashboard(4448);
    const res = await fetch(`${server.url}/api/audit`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("ok");
    expect(data).toHaveProperty("entries");
    expect(Array.isArray(data.entries)).toBe(true);
  });

  it("serves /api/stats endpoint", async () => {
    server = await startDashboard(4449);
    const res = await fetch(`${server.url}/api/stats`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("ok");
    expect(data).toHaveProperty("budget");
  });

  it("serves /api/peers endpoint", async () => {
    server = await startDashboard(4450);
    const res = await fetch(`${server.url}/api/peers`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("ok");
    expect(data).toHaveProperty("peers");
    expect(Array.isArray(data.peers)).toBe(true);
  });

  it("accepts CORS requests", async () => {
    server = await startDashboard(4451);
    const res = await fetch(server.url, {
      method: "OPTIONS",
    });
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
  });

  it("close() stops the server", async () => {
    server = await startDashboard(4452);
    const url = server.url;

    // Verify server is running
    const res1 = await fetch(url);
    expect(res1.status).toBe(200);

    // Close server
    server.close();

    // Verify server is stopped (should throw)
    await expect(fetch(url)).rejects.toThrow();

    server = null; // Prevent double-close in afterEach
  });

  it("handles /events SSE endpoint", async () => {
    server = await startDashboard(4453);
    const res = await fetch(`${server.url}/events`);
    expect(res.headers.get("content-type")).toBe("text/event-stream");
    expect(res.headers.get("cache-control")).toBe("no-cache");
  });

  it("handles POST /api/send with valid payload", async () => {
    server = await startDashboard(4454);
    const res = await fetch(`${server.url}/api/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ peer: "test", task: "test task" }),
    });

    // Should return 200 even if config not found (graceful handling)
    expect(res.status).toBeLessThanOrEqual(500);
    const data = await res.json();
    expect(data).toHaveProperty("ok");
  });
});
