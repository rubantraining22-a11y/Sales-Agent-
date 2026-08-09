import { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble.jsx";
import TypingIndicator from "./TypingIndicator.jsx";
import SuggestionChips from "./SuggestionChips.jsx";

const SUGGESTIONS = [
  { icon: "🚙", text: "Which SUV models do you have?" },
  { icon: "💸", text: "What are the prices and variants of the Sedan?" },
  { icon: "🎨", text: "What colors are available for the EV Car?" },
  { icon: "🔋", text: "Compare the Hatchback and the UV Car." },
  { icon: "📄", text: "What financing offers are running right now?" },
  { icon: "🛡️", text: "Tell me about the warranty coverage." },
];

export default function ChatArea({ messages, streaming, onSend, docs, status, onNewChat }) {
  const [draft, setDraft] = useState("");
  const [attachOpen, setAttachOpen] = useState(false);
  const fileRef = useRef(null);
  const scrollRef = useRef(null);
  const taRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streaming]);

  const autosize = () => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 180) + "px";
  };

  const submit = () => {
    const text = draft.trim();
    if (!text || streaming) return;
    onSend(text);
    setDraft("");
    requestAnimationFrame(() => {
      if (taRef.current) taRef.current.style.height = "auto";
    });
  };

  const chromaDown = !status.chroma;
  const noDocs = docs.length === 0;
  const showHero = messages.length === 0 && !streaming;

  return (
    <main className="chat">
      <header className="chat-head glass">
        <div className="chat-head-info">
          <div className="chat-avatar">🛞</div>
          <div>
            <strong>SGA</strong>
            <span className="chat-sub">
              Your AI car sales advisor · answers only from our catalog
            </span>
          </div>
        </div>
        <div className="chat-head-actions">
          <span className={`pill ${chromaDown ? "pill-warn" : "pill-ok"}`}>
            <i className="dot" />
            {chromaDown ? "Chroma offline" : "Chroma ready"}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={onNewChat}>
            ✦ New chat
          </button>
        </div>
      </header>

      <div className="chat-scroll" ref={scrollRef}>
        <div className="chat-inner">
          {showHero && (
            <div className="hero">
              <div className="hero-badge">✨ Powered by RAG · LangChain + ChromaDB</div>
              <h1 className="hero-title">
                Find your <span className="grad-text">perfect car</span> today
              </h1>
              <p className="hero-sub">
                Ask SGA about our lineup — models, specs, colors, variants, prices,
                financing and test drives. Everything is grounded in the brochures
                you upload.
              </p>
              {chromaDown && (
                <div className="warn-banner">
                  ⚠️ ChromaDB is offline — start it with <code>docker compose up -d</code>,
                  then upload your brochures.
                </div>
              )}
              {!chromaDown && noDocs && (
                <div className="warn-banner warn-banner--info">
                  💡 No brochures in the knowledge base yet — upload one from the sidebar,
                  or try the included sample: <code>npm run ingest -- ../sample-data</code>
                </div>
              )}
              <SuggestionChips
                suggestions={SUGGESTIONS}
                onPick={(t) => onSend(t)}
                disabled={chromaDown || noDocs || streaming}
              />
            </div>
          )}

          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          {streaming && <TypingIndicator />}
        </div>
      </div>

      <footer className="composer-wrap">
        <div className="composer glass">
          <button
            className="icon-btn composer-attach"
            title="Upload a brochure"
            onClick={() => {
              setAttachOpen(!attachOpen);
              if (attachOpen) fileRef.current?.click();
            }}
          >
            ＋
          </button>
          {attachOpen && (
            <div className="attach-hint">
              Use the sidebar to upload PDF, DOCX, TXT, images or links
            </div>
          )}
          <textarea
            ref={taRef}
            className="composer-input"
            rows={1}
            placeholder="Ask about our vehicles… (Enter to send)"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              autosize();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
          />
          <button
            className="btn-send"
            title="Send"
            disabled={!draft.trim() || streaming}
            onClick={submit}
          >
            ➤
          </button>
        </div>
        <p className="composer-foot">
          SGA only answers from the uploaded documents — off-topic questions are declined.
        </p>
      </footer>
    </main>
  );
}
