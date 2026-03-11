import * as p from "@clack/prompts";
import pc from "picocolors";
import { randomUUID } from "node:crypto";
import { loadConfig } from "../config/store.ts";
import { wakeAgent } from "@tom-and-jerry/core";
import { pingPeer } from "@tom-and-jerry/core";
import { checkGatewayHealth } from "@tom-and-jerry/core";
import { sendMagicPacket, wakeAndWait } from "@tom-and-jerry/core";
import { suggestRouting } from "@tom-and-jerry/core";
import type { TJMessage } from "@tom-and-jerry/core";

const WAKE_TIMEOUT_MS = 90_000; // 90s max to wait for Jerry to boot

export async function send(task: string) {
  const config = await loadConfig();

  if (!config) {
    p.log.error("No configuration found. Run `tj onboard` first.");
    return;
  }

  const peer = config.peer_node;
  p.intro(`${pc.bold("Sending task")} → ${peer.emoji ?? ""} ${peer.name}`);
  p.log.info(`Task: ${pc.italic(task)}`);

  // Routing hint
  const routing = suggestRouting(task);
  if (routing === "jerry-local") {
    p.log.info(`Routing hint: ${pc.yellow("heavy task")} → recommended for ${peer.name} (local GPU)`);
  }

  // Step 1: check if peer is awake
  const s = p.spinner();
  s.start(`Checking if ${peer.name} is reachable...`);
  const reachable = await pingPeer(peer.tailscale_ip, 5000);

  if (!reachable) {
    if (peer.wol_enabled && peer.wol_mac && peer.wol_broadcast) {
      s.stop(pc.yellow(`${peer.name} is offline — sending Wake-on-LAN...`));

      // Step 2: WOL
      const wakeS = p.spinner();
      wakeS.start(`Sending magic packet to ${peer.wol_mac}...`);
      await sendMagicPacket({ mac: peer.wol_mac, broadcastIP: peer.wol_broadcast });
      wakeS.message(`Waiting for ${peer.name} to come online (up to ${WAKE_TIMEOUT_MS / 1000}s)...`);

      const woke = await wakeAndWait(
        { mac: peer.wol_mac, broadcastIP: peer.wol_broadcast },
        peer.tailscale_ip,
        { timeoutMs: WAKE_TIMEOUT_MS },
      );

      if (!woke) {
        wakeS.stop(pc.red(`✗ ${peer.name} didn't come online in time`));
        p.outro("Send failed. Try again once the node is running.");
        return;
      }
      wakeS.stop(pc.green(`✓ ${peer.name} is online`));
    } else {
      s.stop(pc.red(`✗ ${peer.name} is offline and WOL is not configured`));
      p.log.warn(`Start ${peer.name} manually and try again.`);
      p.outro("Send failed.");
      return;
    }
  } else {
    s.stop(pc.green(`✓ ${peer.name} is reachable`));
  }

  // Step 3: check gateway is up
  const gwS = p.spinner();
  gwS.start("Checking peer gateway...");
  const gwHealthy = await checkGatewayHealth(
    `http://${peer.tailscale_ip}:${peer.gateway_port ?? 18789}/health`,
  );
  if (!gwHealthy) {
    gwS.stop(pc.yellow("Gateway not responding yet — waiting up to 30s..."));
    // Short retry loop for gateway startup
    let ready = false;
    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      ready = await checkGatewayHealth(
        `http://${peer.tailscale_ip}:${peer.gateway_port ?? 18789}/health`,
      );
      if (ready) break;
    }
    if (!ready) {
      gwS.stop(pc.red("Gateway didn't become healthy in time"));
      p.outro("Send failed.");
      return;
    }
  }
  gwS.stop(pc.green("✓ Gateway ready"));

  // Step 4: build and send TJMessage
  const msg: TJMessage = {
    version: "0.1.0",
    id: randomUUID(),
    from: config.this_node.name,
    to: peer.name,
    turn: 0,
    type: "task",
    payload: task,
    context_summary: null,
    budget_remaining: null,
    done: false,
    wake_required: false,
    shutdown_after: false,
    timestamp: new Date().toISOString(),
  };

  const sendS = p.spinner();
  sendS.start("Delivering task...");
  const result = await wakeAgent({
    url: `ws://${peer.tailscale_ip}:${peer.gateway_port ?? 18789}`,
    token: peer.gateway_token,
    text: `[TJMessage from ${msg.from}] ${task}`,
    mode: "now",
  });

  if (result.ok) {
    sendS.stop(pc.green(`✓ Task delivered to ${peer.name}`));
    p.log.info(`Message ID: ${pc.dim(msg.id)}`);
    p.log.info("Waiting for result... (press Ctrl+C to detach, result will appear when ready)");
    // Phase 3.1: streaming result listener — GLaDOS will send back via wakeAgent
    // TODO: subscribe to incoming wake events and display result when done: true
  } else {
    sendS.stop(pc.red(`✗ Delivery failed: ${result.error}`));
  }

  p.outro(result.ok ? "Task sent." : "Send failed.");
}
