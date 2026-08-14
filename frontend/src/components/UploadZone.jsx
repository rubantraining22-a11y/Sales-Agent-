import { useRef, useState } from "react";
import {
  LockIcon,
  UploadIcon,
  FolderIcon,
  LinkIcon,
  AlertTriangleIcon,
  ArrowRightIcon
} from "./Icons.jsx";

const ACCEPT = ".pdf,.docx,.txt,.md,.png,.jpg,.jpeg";

const FILE_TYPES = [
  { ext: "PDF", label: "Brochures / catalogs" },
  { ext: "DOCX", label: "Word documents" },
  { ext: "TXT", label: "Plain text" },
  { ext: "IMG", label: "Brochure images (OCR)" },
  { ext: "LINK", label: "Web pages" },
];

export default function UploadZone({
  onUpload,
  onLink,
  busy,
  isAuthenticated,
  onLoginSuccess,
}) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkName, setLinkName] = useState("");
  const [sendingLink, setSendingLink] = useState(false);

  /* Inline Login State */
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const cleanUser = username.trim();
    if (!cleanUser || !password) {
      setLoginError("Please enter both username and password.");
      return;
    }

    if (cleanUser.toLowerCase() === "ruban" && password === "12345") {
      setLoginError("");
      onLoginSuccess("Ruban");
    } else {
      setLoginError("Invalid username or password.");
    }
  };

  const pick = () => inputRef.current?.click();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length) onUpload(files);
  };

  const submitLink = async (e) => {
    e.preventDefault();
    const url = linkUrl.trim();
    if (!url || sendingLink) return;
    setSendingLink(true);
    try {
      await onLink(url, linkName.trim() || undefined);
      setLinkUrl("");
      setLinkName("");
    } catch {
      /* toast handled upstream */
    } finally {
      setSendingLink(false);
    }
  };

  /* UNAUTHENTICATED: Show ONLY the Admin Login Form */
  if (!isAuthenticated) {
    return (
      <div className="upload-card inline-login-card">
        <div className="upload-title">
          <span className="upload-ico">
            <LockIcon size={20} />
          </span>
          <div>
            <strong>Admin Authentication</strong>
            <span>Log in to manage knowledge base & vector store</span>
          </div>
        </div>

        {loginError && (
          <div className="login-error-msg">
            <AlertTriangleIcon size={16} />
            <span>{loginError}</span>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="inline-login-form">
          <div className="input-group">
            <label htmlFor="inline-username">Username</label>
            <input
              id="inline-username"
              type="text"
              className="input inline-input"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label htmlFor="inline-password">Password</label>
            <input
              id="inline-password"
              type="password"
              className="input inline-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block">
            <span>Log In</span>
            <ArrowRightIcon size={16} />
          </button>
        </form>
      </div>
    );
  }

  /* AUTHENTICATED: Show Document Upload Controls */
  return (
    <div className="upload-card">
      <div className="upload-title">
        <span className="upload-ico">
          <FolderIcon size={20} />
        </span>
        <div>
          <strong>Knowledge Base Uploader</strong>
          <span>Feed vector search engine vehicle brochures</span>
        </div>
      </div>

      <div
        className={`dropzone ${dragOver ? "dropzone--over" : ""}`}
        onClick={pick}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="dropzone-ico">
          <UploadIcon size={28} />
        </div>
        <p>
          <strong>Drop brochure files here</strong> or <em>click to browse</em>
        </p>
        <span className="dropzone-hint">
          {busy ? "Uploading…" : "PDF · DOCX · TXT · Images"}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files?.length) onUpload(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <form className="link-row" onSubmit={submitLink}>
        <div className="link-input-wrap">
          <LinkIcon size={16} className="link-ico-prefix" />
          <input
            className="input link-input"
            type="url"
            placeholder="Paste brochure URL (https://…)"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
          />
        </div>
        <button
          className="btn btn-primary btn-sm"
          type="submit"
          disabled={!linkUrl.trim() || sendingLink}
        >
          {sendingLink ? "…" : "Add"}
        </button>
      </form>
      {linkUrl.trim() && (
        <input
          className="input link-input"
          type="text"
          placeholder="Optional: display name"
          value={linkName}
          onChange={(e) => setLinkName(e.target.value)}
        />
      )}

      <div className="file-types">
        {FILE_TYPES.map((t) => (
          <span className="ft-chip" key={t.ext} title={t.label}>
            {t.ext}
          </span>
        ))}
      </div>
    </div>
  );
}
