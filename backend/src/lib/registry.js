import fs from "node:fs";
import { config } from "../config.js";

/**
 * Lightweight JSON-file registry of ingested documents.
 * Always reads from disk so multiple processes (server + ingest CLI)
 * see the same state; writes are atomic (tmp file + rename).
 */

function ensureDataDir() {
  fs.mkdirSync(config.dataDir, { recursive: true });
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

export function getRegistry() {
  ensureDataDir();
  try {
    return JSON.parse(fs.readFileSync(config.registryFile, "utf8"));
  } catch {
    return { documents: [] };
  }
}

function save(reg) {
  ensureDataDir();
  const tmp = `${config.registryFile}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(reg ?? { documents: [] }, null, 2));
  fs.renameSync(tmp, config.registryFile);
}

export function addDocument(entry) {
  const reg = getRegistry();
  reg.documents.push(entry);
  save(reg);
  return entry;
}

export function removeDocument(id) {
  const reg = getRegistry();
  const idx = reg.documents.findIndex((d) => d.id === id);
  if (idx === -1) return null;
  const [removed] = reg.documents.splice(idx, 1);
  save(reg);
  return removed;
}

export function listDocuments() {
  return getRegistry().documents;
}

export function getDocument(id) {
  return getRegistry().documents.find((d) => d.id === id) || null;
}

export function clearDocuments() {
  save({ documents: [] });
}

/** Chunk ids are deterministic: `<docId>-<i>` - used to delete a document's vectors. */
export function chunkIdsFor(entry) {
  return Array.from({ length: entry.chunkCount || 0 }, (_, i) => `${entry.id}-${i}`);
}
