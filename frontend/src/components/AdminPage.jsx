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
  CarIcon,
  SparklesIcon
} from "./Icons.jsx";

export default function AdminPage({
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
  onGoToCustomerView,
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

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
    <div className="admin-page-wrap">
      <header className="admin-top-nav glass">
        <div className="admin-top-brand">
          <div className="admin-logo-box">
            <ShieldIcon size={22} />
          </div>
          <div>
            <strong>SGA MOTORS</strong>
            <span className="admin-nav-sub">System & Knowledge Base Administration</span>
          </div>
        </div>

        <button className="btn btn-ghost btn-sm" onClick={onGoToCustomerView}>
          <CarIcon size={16} />
          <span>Back to Sales Advisor UI</span>
        </button>
      </header>

      <main className="admin-page-container">
        {!isAuthenticated ? (
          /* Unauthenticated Admin Login Card */
          <div className="admin-login-card glass">
            <div className="admin-header">
              <div className="admin-icon-box">
                <LockIcon size={26} />
              </div>
              <div className="admin-header-title">
                <h2>Admin Portal Access</h2>
                <p>Log in to access ChromaDB vector embeddings & brochure uploader</p>
              </div>
            </div>

            {error && (
              <div className="login-error-msg">
                <AlertTriangleIcon size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="input-group">
                <label htmlFor="admin-page-username">Username</label>
                <input
                  id="admin-page-username"
                  type="text"
                  className="input"
                  placeholder="Username (Ruban)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="input-group">
                <label htmlFor="admin-page-password">Password</label>
                <input
                  id="admin-page-password"
                  type="password"
                  className="input"
                  placeholder="•••••••• (12345)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="login-actions">
                <button type="button" className="btn btn-ghost" onClick={onGoToCustomerView}>
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
          /* Authenticated Admin Dashboard Workspace */
          <div className="admin-dashboard-grid">
            {/* Left Column: Admin Profile & System Readiness */}
            <div className="admin-dash-col">
              <div className="admin-user-card glass">
                <div className="admin-user-info">
                  <span className="admin-user-avatar">
                    <UserIcon size={18} />
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

              <div className="admin-system-card glass">
                <div className="admin-sys-head">
                  <ServerIcon size={20} className="icon-accent" />
                  <strong>ChromaDB & AI Engine Readiness</strong>
                </div>

                <div className="admin-stats-grid">
                  <div className="stat-card">
                    <span className="stat-label">Vector Store Status</span>
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
                    <span className="stat-label">Embeddings Engine</span>
                    <span className="stat-val-sm">Xenova/all-MiniLM-L6-v2</span>
                  </div>

                  <div className="stat-card">
                    <span className="stat-label">Vector Catalog</span>
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
            </div>

            {/* Right Column: Catalog Document List */}
            <div className="admin-dash-col glass admin-catalog-panel">
              <DocumentList
                docs={docs || []}
                totalChunks={totalChunks}
                isAuthenticated={isAuthenticated}
                onDelete={onDelete}
                onClear={onClear}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
