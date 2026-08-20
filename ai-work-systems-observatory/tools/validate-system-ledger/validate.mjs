#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { validateLedger } from "./lib.mjs";

const args = process.argv.slice(2);
const inputIndex = args.indexOf("--input");
const input = inputIndex >= 0 ? args[inputIndex + 1] : args[0];
if (!input) {
  console.error("Usage: validate.mjs --input <ledger.json>");
  process.exit(2);
}

try {
  const file = resolve(input);
  const ledger = JSON.parse(readFileSync(file, "utf8"));
  const result = validateLedger(ledger);
  process.stdout.write(`${JSON.stringify({ file, ...result }, null, 2)}\n`);
  if (!result.valid) process.exit(1);
} catch (error) {
  process.stdout.write(`${JSON.stringify({
    file: resolve(input),
    valid: false,
    errors: [error instanceof Error ? error.message : String(error)],
    warnings: [],
  }, null, 2)}\n`);
  process.exit(1);
}
