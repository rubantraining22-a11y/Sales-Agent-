import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function formatChromaUrl(rawUrl) {
  let url = (rawUrl || "http://localhost:8000").trim().replace(/\/+$/, "");
  if (url.startsWith("https://")) {
    url = url.replace(":8000", "");
  }
  return url;
}

export const config = {
  port: Number(process.env.PORT || 3002),
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  openaiModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
  chromaUrl: formatChromaUrl(process.env.CHROMA_URL),
  chromaCollection: process.env.CHROMA_COLLECTION || "sales_agent",
  embeddingModel: process.env.EMBEDDING_MODEL || "Xenova/all-MiniLM-L6-v2",
  topK: Number(process.env.TOP_K || 8),
  relevanceThreshold: Number(process.env.RELEVANCE_THRESHOLD || 0.7),
  chunkSize: Number(process.env.CHUNK_SIZE || 1000),
  chunkOverlap: Number(process.env.CHUNK_OVERLAP || 150),
  uploadDir: path.join(__dirname, "../data/uploads"),
  dataDir: path.join(__dirname, "../data"),
  registryFile: path.join(__dirname, "../data/registry.json"),
  maxHistoryTurns: 8,
};
