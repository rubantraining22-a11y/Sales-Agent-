import { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble.jsx";
import TypingIndicator from "./TypingIndicator.jsx";
import { CAR_IMAGES } from "../cars.js";

const LANGUAGES = [
  { code: "Auto", label: "Auto detect" },
  { code: "English", label: "English" },
  { code: "Tamil", label: "தமிழ் (Tamil)" },
  { code: "Hindi", label: "हिन्दी (Hindi)" },
  { code: "Malayalam", label: "മലയാളം (Malayalam)" },
];

/** Guess the language from the script used in the message text. */
function detectLanguage(text) {
  const t = text || "";
  if (/[\u0D00-\u0D7F]/.test(t)) return "Malayalam";
  if (/[\u0B80-\u0BFF]/.test(t)) return "Tamil";
  if (/[\u0900-\u097F]/.test(t)) return "Hindi";
  return "English";
}

const SPEECH_LANG = {
  English: "en-IN",
  Tamil: "ta-IN",
  Hindi: "hi-IN",
  Malayalam: "ml-IN",
};

const SpeechRecognition =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

export default function ChatArea({ messages, streaming, bgCar, onSend, status, onNewChat, onOpenLeadModal }) {
  const [draft, setDraft] = useState("");
  const [language, setLanguage] = useState("Auto");
  const [attachOpen, setAttachOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const fileRef = useRef(null);
  const scrollRef = useRef(null);
  const taRef = useRef(null);
  const recognitionRef = useRef(null);
  const voiceTextRef = useRef("");
  const streamingRef = useRef(streaming);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streaming]);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  useEffect(() => {
    streamingRef.current = streaming;
  }, [streaming]);

  const autosize = () => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 180) + "px";
  };

  const submitText = (text) => {
    const clean = (text || "").trim();
    if (!clean || streamingRef.current) return;
    const lang = language === "Auto" ? detectLanguage(clean) : language;
    onSend(clean, lang);
    setDraft("");
    voiceTextRef.current = "";
    requestAnimationFrame(() => {
      if (taRef.current) taRef.current.style.height = "auto";
    });
  };

  const submit = () => submitText(draft);

  const toggleVoice = () => {
    if (!SpeechRecognition) return;
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    voiceTextRef.current = "";
    const rec = new SpeechRecognition();
    recognitionRef.current = rec;
    if (language !== "Auto") rec.lang = SPEECH_LANG[language] || "en-IN";
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    let gotFinal = false;
    rec.onresult = (e) => {
      let final = "";
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        const t = res[0].transcript;
        if (res.isFinal) {
          final += t;
          gotFinal = true;
        } else {
          interim += t;
        }
      }
      const text = (final || interim).trim();
      if (text) {
        voiceTextRef.current = text;
        setDraft(text);
        requestAnimationFrame(autosize);
      }
    };
    rec.onend = () => {
      setListening(false);
      const text = voiceTextRef.current;
      if (gotFinal && text) submitText(text);
    };
    rec.onerror = () => setListening(false);

    setListening(true);
    try {
      rec.start();
    } catch {
      setListening(false);
    }
  };

  const chromaDown = !status.chroma;

  return (
    <main className="chat">
      <div className="chat-bg" key={bgCar} aria-hidden="true">
        <img src={CAR_IMAGES[bgCar]} alt="" className="chat-bg-img" />
      </div>
      <header className="chat-head glass">
        <div className="chat-head-info">
          <div className="chat-avatar">🛞</div>
          <div>
            <strong>SGA</strong>
            <span className="chat-sub">Your car sales advisor</span>
          </div>
        </div>
        <div className="chat-head-actions">
          <button
            className="btn btn-primary btn-sm lead-trigger-btn"
            onClick={() => onOpenLeadModal?.()}
            title="Book a Test Drive or Request Callback"
          >
            🚗 Book Test Drive / Callback
          </button>
          <span className={`pill ${chromaDown ? "pill-warn" : "pill-ok"}`}>
            <i className="dot" />
            {chromaDown ? "Chroma offline" : "Chroma ready"}
          </span>
          <label className="lang-select" title="Answer language">
            🌐
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
            <span className="lang-caret">▾</span>
          </label>
          <button className="btn btn-ghost btn-sm" onClick={onNewChat}>
            ✦ New chat
          </button>
        </div>
      </header>

      <div className="chat-scroll" ref={scrollRef}>
        <div className="chat-inner">
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} onOpenLeadModal={onOpenLeadModal} />
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
          {SpeechRecognition && (
            <button
              className={`btn-mic ${listening ? "btn-mic--live" : ""}`}
              title={listening ? "Stop listening" : "Speak your question"}
              aria-label={listening ? "Stop listening" : "Speak your question"}
              onClick={toggleVoice}
              disabled={streaming}
            >
              {listening ? (
                <svg
                  className="btn-mic-ico"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <rect x="6.5" y="6.5" width="11" height="11" rx="2.5" />
                </svg>
              ) : (
                <svg
                  className="btn-mic-ico"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="9" y="2.5" width="6" height="11.5" rx="3" />
                  <path d="M5 11a7 7 0 0 0 14 0" />
                  <path d="M12 18v3.5" />
                  <path d="M8.5 21.5h7" />
                </svg>
              )}
            </button>
          )}
          {listening && (
            <div className="voice-hint">
              <span className="waveform" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
              </span>
              Listening… speak now
            </div>
          )}
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
