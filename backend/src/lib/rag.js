import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { config } from "../config.js";
import { searchWithScores } from "./vectorStore.js";

const PERSONA = `You are "SGA", a warm, enthusiastic and professional senior automobile sales consultant at SGA Motors. Your only job is to help customers explore and buy the vehicles described in the dealership's brochure documents: models, variants, prices, specifications, colors, payment and financing terms, warranty, and test drives. You never rely on outside knowledge — every claim you make must come from those documents.`;

const STRICT_RULES = `
STRICT RULES — follow them without exception:
1. The <reference documents> below were retrieved specifically for THIS question. Treat them as your only source of truth and answer the question DIRECTLY from them — extract the facts, prices, variants, specs, colors, and payment terms they contain and present them clearly (short lists/bullets help).
2. If the question is about a topic the reference documents DO cover (prices, models, variants, specs, colors, payment terms, financing, warranty, test drives, delivery), answer it fully from the documents — never say the information is missing when it is present in the text.
3. Only if the reference documents genuinely do NOT address the question, say you could not find that detail in our current catalog, then briefly list what the documents DO cover and invite a follow-up.
4. Never answer general/off-topic questions (weather, news, programming, math, health, travel, history, jokes, personal advice, or anything unrelated to the documents). Politely decline and steer the conversation back to the vehicles in the documents.
5. If asked about competitor brands or models not in the documents, explain that we focus on our own lineup and ask which of our vehicles they would like to compare.
6. Be concise but helpful, use a friendly sales tone, and always ground every claim in the reference documents.`;

const ANSWER_TEMPLATE = ChatPromptTemplate.fromMessages([
  ["system", PERSONA + STRICT_RULES],
  ["human", "Reference documents:\n{context}\n\nPrevious conversation:\n{history}\n\nCustomer question:\n{input}\n\n{language}Your answer:"],
]);

const REFUSAL_TEMPLATE = ChatPromptTemplate.fromMessages([
  ["system", `${PERSONA}\nThe customer's question is NOT covered by your brochure documents. Politely decline to answer it, explain that you can only answer questions about the vehicles in our catalog (models, specs, colors, variants, prices, financing, warranty, test drives), and warmly invite them to ask about our lineup. Do not answer the question itself.`],
  ["human", "Customer question: {input}\n\n{language}Your reply:"],
]);

const LANGUAGE_MAP = {
  English: "",
  Tamil: "Answer the customer in Tamil (தமிழ்) — write your entire reply in Tamil.",
  Hindi: "Answer the customer in Hindi (हिन्दी) — write your entire reply in Hindi.",
  Malayalam: "Answer the customer in Malayalam (മലയാളം) — write your entire reply in Malayalam.",
};

/** Returns an instruction for the LLM, or empty string for English (no instruction needed). */
export function languageInstruction(language) {
  const ins = LANGUAGE_MAP[language] || "";
  if (!ins) return "";
  return `\nLANGUAGE — the customer wants the reply in a specific language. Follow it strictly:\n- ${ins}\n- You may keep model names, prices and technical terms in English where natural.\n`;
}

let llm;

function getLlm() {
  if (!llm) {
    llm = new ChatOpenAI({
      apiKey: config.openaiApiKey,
      model: config.openaiModel,
      temperature: 0.3,
      maxRetries: 2,
    });
  }
  return llm;
}

export function formatContext(docs) {
  return docs
    .map((d, i) => `[${i + 1}] ${d.metadata?.source || "document"}\n${d.pageContent}`)
    .join("\n\n---\n\n");
}

/**
 * Retrieve the most relevant chunks and apply the relevance gate.
 * If nothing is close enough to the question, the sales agent refuses to answer.
 */
export async function retrieveRelevantContext(query) {
  const scored = await searchWithScores(query, config.topK);
  const docs = scored
    .filter(([, score]) => score <= config.relevanceThreshold)
    .map(([doc]) => doc);
  return { docs, scored };
}

export async function* streamAnswer({ input, history, contextDocs, signal, language }) {
  const prompt = await ANSWER_TEMPLATE.invoke({
    context: formatContext(contextDocs),
    history: history || "",
    input,
    language: languageInstruction(language),
  });
  const stream = await getLlm().stream(prompt, { signal });
  for await (const chunk of stream) {
    const text = typeof chunk.content === "string" ? chunk.content : "";
    if (text) yield text;
  }
}

export async function* streamRefusal(input, signal, language) {
  const prompt = await REFUSAL_TEMPLATE.invoke({
    input,
    language: languageInstruction(language),
  });
  const stream = await getLlm().stream(prompt, { signal });
  for await (const chunk of stream) {
    const text = typeof chunk.content === "string" ? chunk.content : "";
    if (text) yield text;
  }
}
