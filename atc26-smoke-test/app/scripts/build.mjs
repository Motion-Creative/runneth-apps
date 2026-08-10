import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const markerPath = path.resolve(appRoot, "..", "smoke-marker.md");
const templatePath = path.join(appRoot, "src", "index.html");
const outputPath = path.join(appRoot, "dist", "index.html");

const [marker, template] = await Promise.all([
  readFile(markerPath, "utf8"),
  readFile(templatePath, "utf8"),
]);
const version = marker.match(/ATC26_SMOKE_V\d+/)?.[0];

if (version === undefined) {
  throw new Error(`No ATC26 smoke marker found in ${markerPath}`);
}

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  template.replaceAll("{{ATC26_SMOKE_VERSION}}", version),
  "utf8",
);

console.log(`Built ${outputPath} with ${version}`);
