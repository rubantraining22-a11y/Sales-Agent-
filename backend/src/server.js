import express from "express";
import cors from "cors";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { config } from "./config.js";
import { ingestLocalFile, ingestUrl } from "./lib/ingest.js";
import { deleteByIds, clearCollection, isChromaAvailable } from "./lib/vectorStore.js";
import { listDocuments, removeDocument, clearDocuments, chunkIdsFor } from "./lib/registry.js";
import { retrieveRelevantContext, streamAnswer, streamRefusal } from "./lib/rag.js";
import { saveLead, getLeads } from "./lib/leads.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

fs.mkdirSync(config.uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, config.uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".bin";
    cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 30 * 1024 * 1024 } });

/** Only delete files that live inside the app's uploads dir (never source files). */
const isManagedFile = (p) =>
  Boolean(p) && path.resolve(p).startsWith(path.resolve(config.uploadDir) + path.sep);

/* Health */
app.get("/api/health", async (_req, res) => {
  const chroma = await isChromaAvailable().catch(() => false);
  res.json({
    ok: true,
    chroma,
    embeddingModel: config.embeddingModel,
    llmConfigured: Boolean(config.openaiApiKey),
    llmModel: config.openaiModel,
    documentCount: listDocuments().length,
  });
});

/* Ingest: file upload */
app.post("/api/documents/upload", upload.array("files", 10), async (req, res) => {
  const files = req.files || [];
  if (!files.length) return res.status(400).json({ error: "No files received." });
  const results = [];
  for (const file of files) {
    try {
      const entry = await ingestLocalFile(file.path, file.originalname);
      results.push({ id: entry.id, name: entry.name, chunkCount: entry.chunkCount, ok: true });
    } catch (err) {
      results.push({ name: file.originalname, error: err.message, ok: false });
      try { fs.unlinkSync(file.path); } catch { /* ignore */ }
    }
  }
  res.json({ results });
});

/* Ingest: link / brochure URL */
app.post("/api/documents/link", async (req, res) => {
  const { url, name } = req.body || {};
  if (!url || typeof url !== "string" || !/^https?:\/\//i.test(url)) {
    return res.status(400).json({ error: "A valid http(s) URL is required." });
  }
  try {
    const entry = await ingestUrl(url, name);
    res.json({ id: entry.id, name: entry.name, chunkCount: entry.chunkCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* Documents: list / delete / clear */
app.get("/api/documents", (_req, res) => {
  res.json({ documents: listDocuments() });
});

app.delete("/api/documents/:id", async (req, res) => {
  const entry = removeDocument(req.params.id);
  if (!entry) return res.status(404).json({ error: "Document not found." });
  try {
    await deleteByIds(chunkIdsFor(entry));
  } catch { /* vector db may be down - registry entry is still removed */ }
  if (isManagedFile(entry.filePath)) {
    try { fs.unlinkSync(entry.filePath); } catch { /* ignore */ }
  }
  res.json({ ok: true });
});

app.post("/api/documents/clear", async (_req, res) => {
  try {
    await clearCollection();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
  for (const d of listDocuments()) {
    if (isManagedFile(d.filePath)) {
      try { fs.unlinkSync(d.filePath); } catch { /* ignore */ }
    }
  }
  clearDocuments();
  res.json({ ok: true });
});

/* Leads: Submit callback / test drive lead details */
app.post("/api/leads", async (req, res) => {
  const { name, phone, email, model, notes } = req.body || {};
  if (!name || !phone) {
    return res.status(400).json({ error: "Name and Mobile number are required." });
  }
  try {
    const result = await saveLead({ name, phone, email, model, notes });
    res.json({ ok: true, lead: result.lead, googleSheet: result.googleSheet });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/leads", (_req, res) => {
  res.json({ leads: getLeads() });
});

/* Chat (SSE streaming) */
app.post("/api/chat", async (req, res) => {
  const { message, history = [], language } = req.body || {};
  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "message is required" });
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  const send = (obj) => {
    if (!res.writableEnded && !res.destroyed) {
      res.write(`data: ${JSON.stringify(obj)}\n\n`);
    }
  };
  const controller = new AbortController();
  res.on("close", () => controller.abort());
  res.on("error", () => controller.abort());
  const heartbeat = setInterval(() => {
    if (!res.writableEnded && !res.destroyed) res.write(": ping\n\n");
  }, 15000);

  try {
    const { docs } = await retrieveRelevantContext(message).catch((err) => {
      console.warn("[sales-agent] Chroma DB offline/error, falling back to direct LLM:", err.message);
      return { docs: [] };
    });
    const sources = [...new Set(docs.map((d) => d.metadata?.source || "document"))];
    send({ sources });

    const historyText = history
      .slice(-config.maxHistoryTurns)
      .map((m) => `${m.role === "user" ? "Customer" : "SGA"}: ${typeof m.content === "string" ? m.content : ""}`)
      .join("\n");

    const gen =
      docs.length > 0
        ? streamAnswer({ input: message, history: historyText, contextDocs: docs, signal: controller.signal, language })
        : streamRefusal(message, controller.signal, language);

    for await (const token of gen) send({ token });
    send({ done: true });
  } catch (err) {
    console.error("[sales-agent] chat error:", err.message);
    if (!controller.signal.aborted) send({ error: "Something went wrong while answering. Please try again." });
  } finally {
    clearInterval(heartbeat);
    res.end();
  }
});

/* Serve frontend static files in production if built */
const frontendDist = path.resolve(__dirname, "../../frontend/dist");
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(frontendDist, "index.html"));
  });
} else {
  app.get("/", (_req, res) => {
    res.json({
      service: "sales-agent-backend",
      endpoints: ["/api/health", "/api/documents/upload", "/api/documents/link", "/api/documents", "/api/documents/:id", "/api/documents/clear", "/api/chat"],
    });
  });
}

/* JSON error handler (multer limits, unexpected errors, async route throws) */
app.use((err, _req, res, _next) => {
  const status = err?.code === "LIMIT_FILE_SIZE" ? 413 : err?.status || 500;
  console.error("[sales-agent] error:", err.message);
  if (res.headersSent) return res.end();
  res.status(status).json({ error: err.message || "Internal server error" });
});

const server = app.listen(config.port, () => {
  console.log(`[sales-agent] API listening on http://localhost:${config.port}`);
  console.log(`[sales-agent] embedding model : ${config.embeddingModel}`);
  console.log(`[sales-agent] llm              : ${config.openaiModel} (${config.openaiApiKey ? "key configured" : "NO KEY - set OPENAI_API_KEY in backend/.env"})`);
  console.log(`[sales-agent] chroma           : ${config.chromaUrl}`);
});
server.on("error", (err) => {
  if (err?.code === "EADDRINUSE") {
    console.error(`\n[ERROR] Port ${config.port} is already in use.`);
    console.error("Another backend instance is already running. Stop it first,");
    console.error("then run `npm start` again. To kill stray node processes:");
    console.error("  taskkill /F /IM node.exe\n");
    process.exit(1);
  }
  throw err;
});
