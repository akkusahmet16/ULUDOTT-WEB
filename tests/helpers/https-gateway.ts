import type { Server } from "node:https";
import type { Duplex } from "node:stream";

export function trackHttpsGateway(server: Server) {
  const sockets = new Set<Duplex>();
  let closing: Promise<void> | undefined;
  // Raw connections may still be waiting for TLS and absent from HTTP tracking.
  server.on("connection", (socket) => {
    sockets.add(socket);
    socket.once("close", () => sockets.delete(socket));
    if (closing) socket.destroy();
  });
  return function close() {
    return (closing ??= new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (
          error &&
          (error as NodeJS.ErrnoException).code !== "ERR_SERVER_NOT_RUNNING"
        )
          reject(error);
        else resolve();
      });
      server.closeAllConnections();
      for (const socket of sockets) socket.destroy();
    }));
  };
}
