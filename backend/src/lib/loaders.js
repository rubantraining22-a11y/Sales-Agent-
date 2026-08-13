import fs from "node:fs/promises";
import pdfParse from "pdf-parse";
import path from "node:path";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { TextLoader } from "@langchain/classic/document_loaders/fs/text";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { createWorker } from "tesseract.js";
import { config } from "../config.js";

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg"];

export const SUPPORTED_EXTENSIONS = [".pdf", ".docx", ".txt", ".md", ...IMAGE_EXTENSIONS];

export function getSplitter() {
  return new RecursiveCharacterTextSplitter({
    chunkSize: config.chunkSize,
    chunkOverlap: config.chunkOverlap,
    separators: ["\n\n", "\n", ". ", " ", ""],
  });
}

async function loadPdf(filePath) {
  const buffer = await fs.readFile(filePath);
  const data = await pdfParse(buffer);
  const text = (data.text || "").trim();
  return text
    ? [{ pageContent: text, metadata: { source: path.basename(filePath) } }]
    : [];
}

async function loadWithLangChain(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".pdf":
      return loadPdf(filePath);
    case ".docx":
      return new DocxLoader(filePath).load();
    case ".txt":
    case ".md":
      return new TextLoader(filePath).load();
    default:
      throw new Error(`Unsupported file type: ${ext}`);
  }
}

/** OCR an image (brochure scan / photo) into text with tesseract.js — free & local. */
async function loadImage(filePath) {
  const worker = await createWorker("eng");
  try {
    const { data } = await worker.recognize(filePath);
    const text = (data.text || "").trim();
    return text
      ? [{ pageContent: text, metadata: { source: path.basename(filePath) } }]
      : [];
  } finally {
    await worker.terminate();
  }
}

export async function loadLocalFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (IMAGE_EXTENSIONS.includes(ext)) {
    return loadImage(filePath);
  }
  return loadWithLangChain(filePath);
}

export async function loadUrl(url, timeoutMs = 45000) {
  const loader = new CheerioWebBaseLoader(url);
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timed out loading URL after ${timeoutMs / 1000}s`)), timeoutMs);
  });
  try {
    return await Promise.race([loader.load(), timeout]);
  } finally {
    clearTimeout(timer);
  }
}
