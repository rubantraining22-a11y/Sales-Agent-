import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";
import { config } from "../config.js";

let embeddings;

/**
 * Free local embeddings — the Xenova/all-MiniLM-L6-v2 model from Hugging Face,
 * running fully on-device via @huggingface/transformers (no API key, no cost).
 * The model weights download once to a local cache on first use.
 */

/**
 * ChromaDB rejects vectors that contain NaN or Infinity (HTTP 500 on upsert).
 * The on-device MiniLM model can occasionally emit NaN for unusual input text
 * (e.g. symbol-only or malformed page content), so replace any non-finite
 * value with 0 before the vector ever reaches the database. A zero vector is
 * harmless for search and keeps the whole ingest from failing.
 */
function sanitize(vectors) {
  return (vectors || []).map((v) =>
    Array.isArray(v) ? v.map((x) => (Number.isFinite(x) ? x : 0)) : v
  );
}

export function getEmbeddings() {
  if (!embeddings) {
    const raw = new HuggingFaceTransformersEmbeddings({
      model: config.embeddingModel,
    });
    embeddings = {
      model: config.embeddingModel,
      embedDocuments: async (docs) => sanitize(await raw.embedDocuments(docs)),
      embedQuery: async (doc) => sanitize(await raw.embedQuery(doc)),
    };
  }
  return embeddings;
}
