import fs from "node:fs";
import path from "node:path";
import { ingestLocalFile, ingestUrl } from "../lib/ingest.js";
import { SUPPORTED_EXTENSIONS } from "../lib/loaders.js";

const args = process.argv.slice(2);

function collectPaths(input) {
  if (/^https?:\/\//i.test(input)) return [{ kind: "url", value: input }];
  const stat = fs.statSync(input);
  if (stat.isDirectory()) {
    const out = [];
    for (const name of fs.readdirSync(input)) {
      const p = path.join(input, name);
      if (fs.statSync(p).isFile() && SUPPORTED_EXTENSIONS.includes(path.extname(p).toLowerCase())) {
        out.push({ kind: "file", value: p });
      }
    }
    return out;
  }
  return [{ kind: "file", value: input }];
}

if (!args.length) {
  console.log("Usage: node src/scripts/ingest.js <file | folder | url> [...]");
  console.log(`Supported: ${SUPPORTED_EXTENSIONS.join(" ")} and http(s) links`);
  process.exit(0);
}

for (const input of args) {
  let items;
  try {
    items = collectPaths(input);
  } catch (err) {
    console.error(`ERR ${input}: ${err.message}`);
    continue;
  }
  for (const item of items) {
    try {
      const entry =
        item.kind === "url"
          ? await ingestUrl(item.value)
          : await ingestLocalFile(item.value, path.basename(item.value));
      console.log(`OK  ${entry.name}  (${entry.chunkCount} chunks)`);
    } catch (err) {
      console.error(`ERR ${item.value}: ${err.message}`);
    }
  }
}

console.log("Ingestion finished.");
