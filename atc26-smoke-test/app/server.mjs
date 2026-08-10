import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.join(appRoot, "dist", "index.html");
const port = Number.parseInt(process.env.PORT ?? "4173", 10);

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error(`Invalid PORT: ${process.env.PORT ?? ""}`);
}

await stat(indexPath);

const server = http.createServer((request, response) => {
  if (request.url !== "/" && request.url !== "/index.html") {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found\n");
    return;
  }

  response.writeHead(200, {
    "cache-control": "no-store",
    "content-type": "text/html; charset=utf-8",
  });
  createReadStream(indexPath).pipe(response);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`ATC26 smoke dashboard: http://127.0.0.1:${port}`);
});
