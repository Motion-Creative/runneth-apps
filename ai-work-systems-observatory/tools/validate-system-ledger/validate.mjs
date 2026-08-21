#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { validateDocument } from "./lib.mjs";

const args = process.argv.slice(2);
const inputIndex = args.indexOf("--input");
const inputs = inputIndex >= 0 ? args.slice(inputIndex + 1).filter((value) => !value.startsWith("--")) : args.filter((value) => !value.startsWith("--"));
if (inputs.length === 0) {
  console.error("Usage: validate.mjs --input <document.json> [more.json]");
  process.exit(2);
}

let valid = true;
const documents = [];
for (const input of inputs) {
  try {
    const file = resolve(input);
    const document = JSON.parse(readFileSync(file, "utf8"));
    const result = validateDocument(document);
    documents.push({ file, documentType: document?.documentType ?? "unknown", ...result });
    if (!result.valid) valid = false;
  } catch (error) {
    valid = false;
    documents.push({ file: resolve(input), documentType: "unreadable", valid: false, errors: [error instanceof Error ? error.message : String(error)], warnings: [] });
  }
}
process.stdout.write(`${JSON.stringify({ valid, documents }, null, 2)}\n`);
if (!valid) process.exit(1);
