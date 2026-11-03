import { once } from "node:events";
import { createServer } from "node:https";
import { connect, type AddressInfo, type Socket } from "node:net";
import type { Duplex } from "node:stream";
import { expect, it } from "vitest";
import { trackHttpsGateway } from "../helpers/https-gateway";

it("closes an HTTPS gateway while a connected client has not started TLS", async () => {
  const server = createServer();
  const close = trackHttpsGateway(server);
  let client: Socket | undefined;
  let rawSocket: Duplex | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const listening = once(server, "listening");
    server.listen(0, "127.0.0.1");
    await listening;
    const accepted = once(server, "connection");
    client = connect((server.address() as AddressInfo).port, "127.0.0.1");
    await once(client, "connect");
    [rawSocket] = await accepted;
    // Intentionally send no TLS handshake. Forced shutdown may reset the client.
    client.on("error", () => {});
    const clientClosed = new Promise<void>((resolve) =>
      client!.once("close", () => resolve()),
    );
    await Promise.race([
      Promise.all([close(), close(), clientClosed]),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(Error("GATEWAY_CLOSE_TIMEOUT")), 500);
      }),
    ]);
    expect(server.listening).toBe(false);
    expect(client.destroyed).toBe(true);
    await close();
  } finally {
    clearTimeout(timeout);
    client?.destroy();
    rawSocket?.destroy();
    await close();
  }
});
