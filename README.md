# 🚗 SGA MOTORS — AI Car Sales Agent (Advanced RAG)

A complete **Retrieval-Augmented Generation (RAG)** application built with **LangChain (JavaScript)**, a **free on-device Hugging Face embedding model (Xenova)**, **ChromaDB** (open-source vector database in Docker) and **OpenAI** as the LLM — wrapped in a **premium, bright React UI**.

The agent is a strictly document-grounded **automobile sales consultant**: it only answers questions about the vehicles in the brochures you upload (models, specs, colors, variants, prices, financing, warranty) and politely declines everything else.

---

## ✨ Features

| Requirement | Implementation |
|---|---|
| **Document loaders** | PDF · DOCX · TXT/MD · **Images (OCR via tesseract.js)** · **Web links / brochure URLs** (Cheerio) |
| **Free embeddings** | `Xenova/all-MiniLM-L6-v2` from Hugging Face — runs **100% locally** via `@huggingface/transformers` (no API key, no cost, no data leaves your machine) |
| **Vector store** | **ChromaDB** open source, run in **Docker** (`docker-compose.yml`), cosine space, persistent volume |
| **LLM** | OpenAI (configurable model, default `gpt-4o-mini`) via `@langchain/openai` |
| **Sales-agent guard** | Retrieval relevance gate + strict system prompt → answers **only from documents**, refuses off-topic questions |
| **Frontend** | React 19 + Vite — premium bright UI, glassmorphism, gradient accents, drag & drop upload, streaming chat with source citations, typing indicator, suggestion chips, toasts |

## 🏗️ Architecture

```
┌────────────────────────────┐        ┌───────────────────────────────┐
│  React + Vite (frontend)   │  /api  │  Express (backend :3002)       │
│  · sidebar + upload zone   │ ─────► │  · loaders: PDF/DOCX/TXT/IMG/URL│
│  · chat + streaming (SSE)  │        │  · text splitter               │
│  · source citations        │        │  · relevance guard             │
└────────────────────────────┘        │  · OpenAI ChatOpenAI (stream)  │
                                      └──────┬────────────┬────────────┘
                                             │            │
                          embed (local,      │            │  tokens (streamed)
                          Xenova MiniLM)     ▼            ▼
                                      ┌──────────┐   ┌──────────────┐
                                      │ ChromaDB │   │ OpenAI API   │
                                      │ :8000    │   │ (LLM)        │
                                      │ (Docker) │   └──────────────┘
                                      └──────────┘
```

## 🧱 Tech stack

| Layer | Tech |
|---|---|
| Backend | Node.js (ESM), Express 5, `langchain@1.x`, `@langchain/community`, `@langchain/openai`, `@langchain/textsplitters`, `@langchain/classic` |
| Embeddings | `@huggingface/transformers` + model `Xenova/all-MiniLM-L6-v2` (local, free) |
| Vector DB | ChromaDB (Docker) via `chromadb` JS client (`@langchain/community/vectorstores/chroma`) |
| OCR | `tesseract.js` (local, free) |
| Document parsing | `pdf-parse`, `mammoth`, `cheerio` |
| Frontend | React 19, Vite 8, plain CSS design system (no UI framework needed) |

---

## 🚀 Quick start

### Prerequisites
- **Node.js ≥ 20** (tested on v24)
- **Docker + Docker Compose** (for ChromaDB)
- **OpenAI API key** (already set in `backend/.env`)
- Internet on first run only — downloads the embedding model (~90 MB) once

### 1 · Start ChromaDB (Docker)

```bash
docker compose up -d
```

> **Port already in use?** If you already have a ChromaDB instance on port `8000`
> (e.g. an older `chroma_db` container), the app will use it as-is — just make
> sure `CHROMA_URL` in `backend/.env` points at the running instance. Otherwise
> change the port in `docker-compose.yml` **and** `CHROMA_URL` to match.

### 2 · Start the backend API (terminal 1)

```bash
cd backend
npm install
npm run dev          # http://localhost:3002
```

On first run, the server downloads the Xenova embedding model to a local cache
(one time). Verify: `curl http://localhost:3002/api/health` → `"chroma":true`.

### 3 · Start the frontend (terminal 2)

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

Open **http://localhost:5173**, upload a brochure from the sidebar (or paste a
link) and start chatting. 🎉

### 4 · Upload brochures and start chatting

Open **http://localhost:5173**, upload your vehicle brochure (PDF, TXT, DOCX) or paste a brochure link from the sidebar, and start chatting. 🎉

Now ask the agent: *"Which SUV models do you have?"*, *"What are the prices of the Sedan?"*, or *"What colors are available?"* — or ask an off-topic question like *"What is the capital of France?"* to see the guard politely decline.

---

## ⚙️ Configuration (`backend/.env`)

| Variable | Default | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | *(set)* | OpenAI key for the LLM |
| `OPENAI_MODEL` | `gpt-4o-mini` | LLM model (e.g. `gpt-4o`, `gpt-4o-mini`) |
| `CHROMA_URL` | `http://localhost:8000` | ChromaDB server URL |
| `CHROMA_COLLECTION` | `sales_agent` | Chroma collection name |
| `EMBEDDING_MODEL` | `Xenova/all-MiniLM-L6-v2` | Free local Hugging Face embedding model |
| `TOP_K` | `8` | Number of chunks retrieved per question |
| `RELEVANCE_THRESHOLD` | `0.70` | Max cosine distance for a chunk to count as relevant (0 = exact, 1 = unrelated). Lower = stricter guard |
| `CHUNK_SIZE` / `CHUNK_OVERLAP` | `1000` / `150` | Text splitter settings |
| `PORT` | `3002` | Backend port |

Copy `backend/.env.example` → `backend/.env` on a fresh machine and fill in your
own `OPENAI_API_KEY`.

---

## 🧠 How the pipeline works

1. **Ingest** — a file (PDF/DOCX/TXT/image) or URL is loaded with the matching
   LangChain loader (images are OCR'd with tesseract.js), then split into
   ~1000-char chunks with overlap.
2. **Embed** — every chunk is embedded **locally** with the free
   `Xenova/all-MiniLM-L6-v2` model via `@huggingface/transformers`.
3. **Store** — vectors go into **ChromaDB** (Docker, cosine space), tagged with
   source + chunk metadata. `backend/data/registry.json` tracks each document.
4. **Ask** — the question is embedded and the top-`K` nearest chunks are
   retrieved. Chunks whose distance exceeds `RELEVANCE_THRESHOLD` are discarded
   — if nothing qualifies, the agent **refuses** (relevance gate).
5. **Answer** — the retained chunks are injected into a strict sales-persona
   prompt (`src/lib/rag.js`): *answer only from these documents, never invent,
   decline off-topic questions*. Tokens stream back to the UI over SSE, with
   the source documents shown as citation chips.

## 📡 API reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service status: chroma up? LLM key? doc count |
| `POST` | `/api/documents/upload` | Multipart upload (`files` field, up to 10) — PDF/DOCX/TXT/MD/PNG/JPG/JPEG |
| `POST` | `/api/documents/link` | `{ url, name? }` — ingest a web brochure |
| `GET` | `/api/documents` | List ingested documents |
| `DELETE` | `/api/documents/:id` | Delete a document (vectors + file) |
| `POST` | `/api/documents/clear` | Wipe the whole knowledge base |
| `POST` | `/api/chat` | SSE stream — `{ message, history? }` → `data: {sources}` , `data: {token}`… , `data: {done}` |

### CLI ingest

```bash
cd backend
node src/scripts/ingest.js <file | folder | url> [...]
```

## 🏭 Production build

```bash
cd frontend && npm run build        # outputs frontend/dist
cd backend && npm start             # serves the API on :3002
```

Serve `frontend/dist` with any static host and point its `/api` proxy at the
backend (see `frontend/vite.config.js` for the dev proxy settings).

## 🛠️ Troubleshooting

- **`chroma: false` in `/api/health`** — ChromaDB isn't reachable: check
  `docker compose ps` and `CHROMA_URL`.
- **Slow first upload/chat** — the embedding model (and OCR language data) are
downloaded on first use; subsequent runs are fast.
- **`ERR_PACKAGE_PATH_NOT_EXPORTED`** — wrong import path for a LangChain 1.x
  module. Reference: embeddings live at
  `@langchain/community/embeddings/huggingface_transformers`, `TextLoader` at
  `@langchain/classic/document_loaders/fs/text`.
- **Windows / Git Bash notes** — start the server with
  `node backend/src/server.js` from the project root, and kill stale processes
  with `taskkill //F //PID <pid>` (`netstat -ano | grep :3002`).
- **Off-topic answers slip through?** Lower `RELEVANCE_THRESHOLD` (e.g. `0.5`)
  in `backend/.env` for a stricter guard.

## 🔐 Security note

The OpenAI API key in `backend/.env` was provided for this project. Because it
was shared in plain text, **consider rotating it** in the OpenAI dashboard and
updating `backend/.env`. Never commit `.env` (it is git-ignored).

---

Built with ❤️ using LangChain · ChromaDB · Hugging Face (Xenova) · OpenAI · React.
