import { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble.jsx";
import TypingIndicator from "./TypingIndicator.jsx";
import { CAR_IMAGES } from "../cars.js";
import {
  CarIcon,
  GlobeIcon,
  PlusIcon,
  ShieldIcon,
  SendIcon,
  MicIcon,
  ChevronDownIcon,
  SparklesIcon
} from "./Icons.jsx";

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

export default function ChatArea({
  messages,
  streaming,
  bgCar,
  onSend,
  onNewChat,
  onOpenLeadModal,
  onOpenAdminModal,
}) {
  const [draft, setDraft] = useState("");
  const [language, setLanguage] = useState("Auto");
  const [attachOpen, setAttachOpen] = useState(false);
  const [listening, setListening] = useState(false);
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

  return (
    <main className="chat">
      <div className="chat-bg" key={bgCar} aria-hidden="true">
        <img src={CAR_IMAGES[bgCar]} alt="" className="chat-bg-img" />
      </div>
      <header className="chat-head glass">
        <div className="chat-head-info">
          <div className="chat-avatar">
            <CarIcon size={22} />
          </div>
          <div>
            <strong>SGA MOTORS</strong>
            <span className="chat-sub">Your AI Vehicle Sales Advisor</span>
          </div>
        </div>

        <div className="chat-head-actions">
          <button
            className="btn btn-primary btn-sm lead-trigger-btn"
            onClick={() => onOpenLeadModal?.()}
            title="Book a Test Drive or Request Callback"
          >
            <CarIcon size={16} />
            <span>Book Test Drive / Callback</span>
          </button>

          <label className="lang-select" title="Answer language">
            <GlobeIcon size={15} />
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
            <ChevronDownIcon size={12} className="lang-caret" />
          </label>

          <button className="btn btn-ghost btn-sm" onClick={onNewChat} title="Start new conversation">
            <PlusIcon size={15} />
            <span>New chat</span>
          </button>

          <button
            className="btn btn-ghost btn-sm btn-admin-shortcut"
            onClick={onOpenAdminModal}
            title="Open Admin Portal & Vector DB Settings"
          >
            <ShieldIcon size={15} />
            <span>Admin Portal</span>
          </button>
        </div>
      </header>

      <div className="chat-scroll" ref={scrollRef}>
        <div className="chat-inner">
          {messages.length === 0 && (
            <div className="welcome-banner glass">
              <div className="welcome-avatar">
                <CarIcon size={32} />
              </div>
              <h2>Welcome to SGA Motors Sales Experience</h2>
              <p>
                Ask about our 2026 vehicle lineup, key specifications, pricing, financing, warranty, or book a test drive!
              </p>
            </div>
          )}
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
            title="Knowledge base documents managed via Admin Portal"
            onClick={() => {
              setAttachOpen(!attachOpen);
            }}
          >
            <PlusIcon size={18} />
          </button>
          {attachOpen && (
            <div className="attach-hint">
              <span>Brochures & URLs are managed via the </span>
              <button className="attach-link-btn" onClick={onOpenAdminModal}>
                Admin Portal
              </button>
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
              <MicIcon size={18} />
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
            title="Send Message"
            disabled={!draft.trim() || streaming}
            onClick={submit}
          >
            <SendIcon size={16} />
          </button>
        </div>
        <p className="composer-foot">
          SGA Motors AI Advisor provides accurate answers based on our verified brochure catalog.
        </p>
      </footer>
    </main>
  );
}
