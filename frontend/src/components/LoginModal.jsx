import { useState } from "react";

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

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
      onClose();
    } else {
      setError("Invalid username or password.");
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="login-modal glass" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} title="Close">
          ✕
        </button>

        <div className="login-header">
          <div className="login-icon">🔒</div>
          <h2>Admin Login</h2>
          <p>Login required to access knowledge base and upload documents</p>
        </div>

        {error && <div className="login-error-msg">⚠️ {error}</div>}

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
              Log In ➔
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
