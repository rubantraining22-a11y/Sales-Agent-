import { useState } from "react";
import UploadZone from "./UploadZone.jsx";
import DocumentList from "./DocumentList.jsx";
import {
  LockIcon,
  ShieldIcon,
  ServerIcon,
  UserIcon,
  LogOutIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
  XIcon,
  CheckCircleIcon,
  SparklesIcon
} from "./Icons.jsx";

export default function LoginModal({
  isOpen,
  onClose,
  currentUser,
  isAuthenticated,
  onLoginSuccess,
  onLogout,
  status,
  docs,
  onUpload,
  onLink,
  onDelete,
  onClear,
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const chromaOk = Boolean(status?.chroma);
  const llmOk = Boolean(status?.llmConfigured);
  const totalChunks = (docs || []).reduce((acc, d) => acc + (d.chunkCount || 0), 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanUser = username.trim();
    if (!cleanUser || !password) {
      setError("Please enter both username and password.");
      return;
    }

    if (cleanUser.toLowerCase() === "ruban" && password === "12345") {
      setError("");
      onLoginSuccess("Ruban");
    } else {
      setError("Invalid username or password.");
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={`admin-modal glass ${isAuthenticated ? "admin-modal--authed" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} title="Close Admin Portal">
          <XIcon size={18} />
        </button>

        {/* Modal Header */}
        <div className="admin-header">
          <div className="admin-icon-box">
            <ShieldIcon size={24} />
          </div>
          <div className="admin-header-title">
            <h2>Admin Portal & Vector DB</h2>
            <p>
              {isAuthenticated
                ? "Manage ChromaDB vector embeddings, models, and catalog"
                : "System administration and knowledge base management"}
            </p>
          </div>
        </div>

        {/* IF NOT AUTHENTICATED: Show Login Form */}
        {!isAuthenticated ? (
          <div className="admin-login-body">
            {error && (
              <div className="login-error-msg">
                <AlertTriangleIcon size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="input-group">
                <label htmlFor="login-username">Username</label>
                <input
                  id="login-username"
                  type="text"
                  className="input"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="input-group">
                <label htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="login-actions">
                <button type="button" className="btn btn-ghost" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <span>Log In</span>
                  <ArrowRightIcon size={16} />
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* IF AUTHENTICATED: Show Admin Panel with Chroma Readiness Status & Management */
          <div className="admin-dashboard-body">
            {/* User Profile Bar */}
            <div className="admin-user-bar">
              <div className="admin-user-info">
                <span className="admin-user-avatar">
                  <UserIcon size={16} />
                </span>
                <div>
                  <strong>{currentUser}</strong>
                  <span className="admin-role-badge">System Administrator</span>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm btn-logout" onClick={onLogout} title="Log out">
                <LogOutIcon size={14} />
                <span>Logout</span>
              </button>
            </div>

            {/* System Readiness & Vector Store Health Panel */}
            <div className="admin-system-card">
              <div className="admin-sys-head">
                <ServerIcon size={18} className="icon-accent" />
                <strong>ChromaDB Vector Store & AI Engine Status</strong>
              </div>

              <div className="admin-stats-grid">
                <div className="stat-card">
                  <span className="stat-label">Vector DB Status</span>
                  <div className={`pill ${chromaOk ? "pill-ok" : "pill-warn"}`}>
                    <i className="dot" />
                    <span>{chromaOk ? "Chroma ready & online" : "ChromaDB offline"}</span>
                  </div>
                </div>

                <div className="stat-card">
                  <span className="stat-label">Active LLM Model</span>
                  <div className={`pill ${llmOk ? "pill-ok" : "pill-warn"}`}>
                    <i className="dot" />
                    <span>{llmOk ? status.llmModel : "No LLM Key"}</span>
                  </div>
                </div>

                <div className="stat-card">
                  <span className="stat-label">Vector Embeddings</span>
                  <span className="stat-val-sm">Xenova/all-MiniLM-L6-v2</span>
                </div>

                <div className="stat-card">
                  <span className="stat-label">Catalog Summary</span>
                  <span className="stat-val-sm">
                    <strong>{(docs || []).length}</strong> files · <strong>{totalChunks}</strong> chunks
                  </span>
                </div>
              </div>
            </div>

            {/* Upload Zone */}
            <UploadZone
              onUpload={onUpload}
              onLink={onLink}
              busy={false}
              isAuthenticated={isAuthenticated}
              onLoginSuccess={onLoginSuccess}
            />

            {/* Document List Management */}
            <DocumentList
              docs={docs || []}
              totalChunks={totalChunks}
              isAuthenticated={isAuthenticated}
              onDelete={onDelete}
              onClear={onClear}
            />
          </div>
        )}
      </div>
    </div>
  );
}
