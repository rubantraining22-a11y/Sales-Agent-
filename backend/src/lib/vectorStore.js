import { Chroma } from "@langchain/community/vectorstores/chroma";
import { getEmbeddings } from "./embeddings.js";
import { config } from "../config.js";

let vectorStore;

/** @returns {Promise<import("@langchain/community/vectorstores/chroma").Chroma>} */
export async function getVectorStore() {
  if (!vectorStore) {
    try {
      const store = new Chroma(getEmbeddings(), {
        collectionName: config.chromaCollection,
        url: config.chromaUrl,
        collectionMetadata: { "hnsw:space": "cosine" },
      });
      // Creates the collection if it does not exist yet.
      await store.ensureCollection();
      vectorStore = store;
    } catch (err) {
      vectorStore = null;
      if (err && err.message && err.message.includes("Unexpected token '<'")) {
        throw new Error(
          `CHROMA_URL (${config.chromaUrl}) returned HTML instead of ChromaDB JSON. Make sure CHROMA_URL is set to your Chroma service (e.g. https://sales-agent-chroma.onrender.com or http://sales-agent-chroma:8000)`
        );
      }
      throw err;
    }
  }
  return vectorStore;
}

export async function isChromaAvailable() {
  try {
    await getVectorStore();
    return true;
  } catch {
    return false;
  }
}

export async function addDocuments(docs, ids) {
  const store = await getVectorStore();
  // Chroma rejects batches above 5461 records per call — stay well under it
  // so large PDFs are ingested in safe slices.
  const BATCH = 500;
  for (let i = 0; i < docs.length; i += BATCH) {
    await store.addDocuments(docs.slice(i, i + BATCH), { ids: ids.slice(i, i + BATCH) });
  }
  return ids.length;
}

export async function deleteByIds(ids) {
  if (!ids || ids.length === 0) return;
  const store = await getVectorStore();
  await store.delete({ ids });
}

export async function searchWithScores(query, k = config.topK) {
  const store = await getVectorStore();
  return store.similaritySearchWithScore(query, k);
}

export async function clearCollection() {
  await Chroma.deleteCollection(getEmbeddings(), {
    collectionName: config.chromaCollection,
    url: config.chromaUrl,
  });
  vectorStore = null;
}
