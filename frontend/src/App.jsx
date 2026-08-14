import { useCallback, useEffect, useRef, useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import ChatArea from "./components/ChatArea.jsx";
import Toasts from "./components/Toasts.jsx";
import LoginModal from "./components/LoginModal.jsx";
import LeadModal from "./components/LeadModal.jsx";
import * as api from "./api.js";
import { CAR_IMAGES } from "./cars.js";

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function App() {
  const [docs, setDocs] = useState([]);
  const [status, setStatus] = useState({
    chroma: false,
    llmConfigured: false,
    llmModel: "gpt-4o-mini",
    embeddingModel: "",
  });
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [bgCar, setBgCar] = useState(0);

  /* Admin Portal Sheet Drawer State */
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  /* Auth State */
  const [currentUser, setCurrentUser] = useState(
    () => localStorage.getItem("sga_user") || ""
  );
  const isAuthenticated = Boolean(currentUser);

  /* Lead Capture Modal State */
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [leadDefaultModel, setLeadDefaultModel] = useState("");

  const historyRef = useRef([]);

  const handleOpenLeadModal = useCallback((modelName = "") => {
    setLeadDefaultModel(modelName);
    setIsLeadModalOpen(true);
  }, []);

  const handleOpenAdminModal = useCallback(() => {
    setIsAdminModalOpen(true);
  }, []);

  const pushToast = useCallback((type, text) => {
    const id = uid();
    setToasts((t) => [...t, { id, type, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5200);
  }, []);

  const handleLoginSuccess = useCallback(
    (username) => {
      setCurrentUser(username);
      localStorage.setItem("sga_user", username);
      pushToast("success", `Welcome back, ${username}! Admin vector store unlocked.`);
    },
    [pushToast]
  );

  const handleLogout = useCallback(() => {
    setCurrentUser("");
    localStorage.removeItem("sga_user");
    pushToast("info", "Logged out of admin document management.");
  }, [pushToast]);

  const refresh = useCallback(async () => {
    try {
      const [h, d] = await Promise.all([api.getHealth(), api.getDocuments()]);
      setStatus((prev) => ({ ...prev, ...h }));
      setDocs(d.documents || []);
    } catch {
      setStatus((prev) => ({ ...prev, chroma: false }));
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 15000);
    return () => clearInterval(t);
  }, [refresh]);

  const handleFiles = useCallback(
    async (files) => {
      const list = Array.from(files || []);
      if (!list.length) return;
      try {
        const res = await api.uploadFiles(list);
        (res.results || []).forEach((r) =>
          pushToast(
            r.ok ? "success" : "error",
            r.ok
              ? `"${r.name}" added · ${r.chunkCount} chunks`
              : `"${r.name}" failed: ${r.error}`
          )
        );
        await refresh();
      } catch (e) {
        pushToast("error", e.message);
      }
    },
    [pushToast, refresh]
  );

  const handleLink = useCallback(
    async (url, name) => {
      const res = await api.uploadLink(url, name);
      pushToast("success", `"${res.name}" added · ${res.chunkCount} chunks`);
      await refresh();
    },
    [pushToast, refresh]
  );

  const handleDelete = useCallback(
    async (id) => {
      try {
        await api.deleteDocument(id);
        await refresh();
        pushToast("success", "Document removed from the knowledge base");
      } catch (e) {
        pushToast("error", e.message);
      }
    },
    [pushToast, refresh]
  );

  const handleClear = useCallback(async () => {
    try {
      await api.clearAll();
      setMessages([]);
      historyRef.current = [];
      await refresh();
      pushToast("success", "Knowledge base cleared");
    } catch (e) {
      pushToast("error", e.message);
    }
  }, [pushToast, refresh]);

  const handleNewChat = useCallback(() => {
    setMessages([]);
    historyRef.current = [];
  }, []);

  const handleSend = useCallback(
    async (text, language = "Auto") => {
      const clean = (text || "").trim();
      if (!clean || streaming) return;

      const userMsg = { id: uid(), role: "user", content: clean, time: Date.now() };
      const botMsg = { id: uid(), role: "assistant", content: "", sources: [], time: Date.now() };
      setMessages((m) => [...m, userMsg, botMsg]);
      setBgCar((i) => (i + 1) % CAR_IMAGES.length);
      historyRef.current = [...historyRef.current, { role: "user", content: clean }];
      setStreaming(true);

      let answer = "";
      try {
        await api.streamChat({
          message: clean,
          history: historyRef.current.slice(0, -1),
          language,
          onSources: (sources) =>
            setMessages((m) =>
              m.map((msg) => (msg.id === botMsg.id ? { ...msg, sources } : msg))
            ),
          onToken: (token) => {
            answer += token;
            setMessages((m) =>
              m.map((msg) =>
                msg.id === botMsg.id ? { ...msg, content: answer } : msg
              )
            );
          },
        });
        historyRef.current = [...historyRef.current, { role: "assistant", content: answer }];
      } catch (e) {
        setMessages((m) =>
          m.map((msg) =>
            msg.id === botMsg.id
              ? { ...msg, content: msg.content || `Something went wrong: ${e.message}` }
              : msg
          )
        );
      } finally {
        setStreaming(false);
      }
    },
    [streaming]
  );

  const handleLeadSubmit = useCallback(
    async (leadData) => {
      const res = await api.submitLead(leadData);
      pushToast("success", `Thank you, ${leadData.name}! Our team will contact you shortly.`);

      const botConfirmMsg = {
        id: uid(),
        role: "assistant",
        content: `Thank you **${leadData.name}**! Your request for a test drive / callback regarding **${leadData.model || "our vehicle lineup"}** has been received. Our senior sales consultant will reach out to you at **${leadData.phone}** shortly!`,
        sources: [],
        time: Date.now(),
      };
      setMessages((m) => [...m, botConfirmMsg]);
      historyRef.current = [
        ...historyRef.current,
        { role: "assistant", content: botConfirmMsg.content },
      ];
      return res;
    },
    [pushToast]
  );

  return (
    <div className="app">
      <Sidebar
        onNewChat={handleNewChat}
        onOpenLeadModal={handleOpenLeadModal}
        onSendPrompt={handleSend}
        onOpenAdminModal={handleOpenAdminModal}
      />
      <ChatArea
        messages={messages}
        streaming={streaming}
        bgCar={bgCar}
        onSend={handleSend}
        onNewChat={handleNewChat}
        onOpenLeadModal={handleOpenLeadModal}
      />
      <Toasts toasts={toasts} />
      <LoginModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        currentUser={currentUser}
        isAuthenticated={isAuthenticated}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
        status={status}
        docs={docs}
        onUpload={handleFiles}
        onLink={handleLink}
        onDelete={handleDelete}
        onClear={handleClear}
      />
      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        defaultModel={leadDefaultModel}
        onSubmitSuccess={handleLeadSubmit}
      />
    </div>
  );
}
