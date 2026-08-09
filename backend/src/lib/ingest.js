import path from "node:path";
import crypto from "node:crypto";
import { Document } from "@langchain/core/documents";
import { loadLocalFile, loadUrl, getSplitter, SUPPORTED_EXTENSIONS } from "./loaders.js";
import { addDocuments } from "./vectorStore.js";
import { addDocument } from "./registry.js";

export function makeDocId() {
  return crypto.randomUUID();
}

/**
 * ChromaDB only accepts SCALAR metadata values (string / number / boolean).
 * Loaders such as the PDF loader attach nested objects (e.g. `pdf.info`), which
 * make Chroma reject the upsert with HTTP 422. Flatten anything non-scalar to a
 * JSON string (and drop null/undefined) so every loader's docs index cleanly.
 */
function flattenMetadata(meta) {
  const out = {};
  for (const [k, v] of Object.entries(meta || {})) {
    if (v === null || v === undefined) continue;
    const t = typeof v;
    if (t === "string" || t === "number" || t === "boolean") {
      out[k] = v;
    } else {
      try {
        out[k] = JSON.stringify(v);
      } catch {
        /* un-serializable value - drop it */
      }
    }
  }
  return out;
}

export async function ingestLocalFile(filePath, displayName) {
  const ext = path.extname(filePath).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    throw new Error(`Unsupported file type: ${ext} (supported: ${SUPPORTED_EXTENSIONS.join(", ")})`);
  }
  const rawDocs = await loadLocalFile(filePath);
  return ingestRaw(rawDocs, displayName, "file", filePath, null);
}

export async function ingestUrl(url, displayName) {
  let name = displayName;
  if (!name) {
    try {
      const u = new URL(url);
      name = u.host + u.pathname.replace(/\/+$/, "");
    } catch {
      name = url;
    }
  }
  const rawDocs = await loadUrl(url);
  return ingestRaw(rawDocs, name, "link", null, url);
}

async function ingestRaw(rawDocs, displayName, type, filePath, url) {
  if (!rawDocs || rawDocs.length === 0) {
    throw new Error("No readable text could be extracted from this document.");
  }
  const splitter = getSplitter();
  const chunks = await splitter.splitDocuments(rawDocs);
  if (!chunks.length) {
    throw new Error("No readable text could be extracted from this document.");
  }

  const docId = makeDocId();
  const ids = chunks.map((_, i) => `${docId}-${i}`);
  const prepared = chunks.map((chunk, i) =>
    new Document({
      pageContent: chunk.pageContent,
      metadata: { ...flattenMetadata(chunk.metadata), source: displayName, docId, chunk: i },
    })
  );

  const count = await addDocuments(prepared, ids);
  const entry = addDocument({
    id: docId,
    name: displayName,
    type,
    url: url || null,
    filePath: filePath || null,
    chunkCount: count,
    createdAt: new Date().toISOString(),
  });
  return entry;
}
