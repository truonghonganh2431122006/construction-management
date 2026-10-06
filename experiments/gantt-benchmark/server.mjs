import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { networkInterfaces } from "node:os";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const files = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/benchmark.js", ["benchmark.js", "text/javascript; charset=utf-8"]]
]);

// Serve only benchmark assets, including when exposed to a phone on the LAN.
export function createBenchmarkServer() {
  return createServer(async (request, response) => {
    const path = new URL(request.url, "http://localhost").pathname;
    const asset = files.get(path);
    if (!asset || !["GET", "HEAD"].includes(request.method)) {
      response.writeHead(404).end("Not found");
      return;
    }
    try {
      const body = await readFile(new URL(asset[0], import.meta.url));
      response.writeHead(200, { "Content-Type": asset[1], "Cache-Control": "no-store" });
      response.end(request.method === "HEAD" ? undefined : body);
    } catch {
      response.writeHead(500).end("Unable to read benchmark asset");
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  let host = "127.0.0.1";
  let port = 8080;
  for (let index = 0; index < args.length; index += 2) {
    const [option, value] = args.slice(index, index + 2);
    if (option === "--host" && value) host = value;
    else if (option === "--port" && /^\d+$/.test(value)) port = Number(value);
    else throw new Error("Usage: node server.mjs [--host 0.0.0.0] [--port 8080]");
  }
  if (port < 1 || port > 65535) throw new Error("Port must be between 1 and 65535");
  const server = createBenchmarkServer();
  server.on("error", (error) => { console.error(error.message); process.exitCode = 1; });
  server.listen(port, host, () => {
    console.log(`Benchmark: http://127.0.0.1:${port}`);
    if (host === "0.0.0.0") {
      for (const addresses of Object.values(networkInterfaces())) {
        for (const address of addresses || []) {
          if (address.family === "IPv4" && !address.internal) console.log(`Phone on the same Wi-Fi: http://${address.address}:${port}`);
        }
      }
    }
  });
}
