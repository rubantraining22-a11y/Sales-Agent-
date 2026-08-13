import { useState } from "react";

export default function LeadModal({ isOpen, onClose, defaultModel = "", onSubmitSuccess }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [model, setModel] = useState(defaultModel || "");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim();

    if (!cleanName) {
      setError("Please enter your full name.");
      return;
    }

    if (!cleanPhone || !/^[0-9+\-\s()]{7,15}$/.test(cleanPhone)) {
      setError("Please enter a valid mobile number.");
      return;
    }

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setSubmitting(true);
      await onSubmitSuccess({
        name: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        model: model.trim() || "General Inquiry",
        notes: notes.trim(),
      });
      // Reset form
      setName("");
      setPhone("");
      setEmail("");
      setModel("");
      setNotes("");
      onClose();
    } catch (err) {
      setError(err.message || "Failed to submit details. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box lead-modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          ✕
        </button>

        <div className="modal-header-badge">
          <span>🚗</span> Test Drive & Callback Request
        </div>

        <h2 className="modal-title">Experience Your Next Car</h2>
        <p className="modal-subtitle">
          Share your details below to schedule a test drive, get instant pricing quotes, or request a call back from our senior sales consultant.
        </p>

        {error && <div className="modal-error-alert">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="lead-name">
              Full Name <span className="req">*</span>
            </label>
            <input
              id="lead-name"
              type="text"
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={submitting}
              autoFocus
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="lead-phone">
                Mobile Number <span className="req">*</span>
              </label>
              <input
                id="lead-phone"
                type="tel"
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="lead-email">
                Email Address <span className="req">*</span>
              </label>
              <input
                id="lead-email"
                type="email"
                placeholder="e.g. rahul@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="lead-model">Car Model of Interest</label>
            <input
              id="lead-model"
              type="text"
              placeholder="e.g. SUV Electric, Sedan Prime, Hatchback VX"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="lead-notes">Preferred Date / Any Specific Questions</label>
            <textarea
              id="lead-notes"
              rows={2}
              placeholder="e.g. Interested in test drive this weekend or EMI options"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit & Request Callback"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
