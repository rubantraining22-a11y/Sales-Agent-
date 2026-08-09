import { useRef, useState } from "react";

const ACCEPT = ".pdf,.docx,.txt,.md,.png,.jpg,.jpeg";

const FILE_TYPES = [
  { ext: "PDF", label: "Brochures / catalogs" },
  { ext: "DOCX", label: "Word documents" },
  { ext: "TXT", label: "Plain text" },
  { ext: "IMG", label: "Brochure images (OCR)" },
  { ext: "LINK", label: "Web pages" },
];

export default function UploadZone({ onUpload, onLink, busy }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkName, setLinkName] = useState("");
  const [sendingLink, setSendingLink] = useState(false);

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

  return (
    <div className="upload-card">
      <div className="upload-title">
        <span className="upload-ico">🗂️</span>
        <div>
          <strong>Knowledge base</strong>
          <span>Feed the sales agent your brochures</span>
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
        <div className="dropzone-ico">📤</div>
        <p>
          <strong>Drop files here</strong> or <em>click to browse</em>
        </p>
        <span className="dropzone-hint">{busy ? "Uploading…" : "PDF · DOCX · TXT · Images"}</span>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          hidden
          onChange={(e) => {
            onUpload(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <form className="link-row" onSubmit={submitLink}>
        <input
          className="input link-input"
          type="url"
          placeholder="Paste brochure link (https://…)"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
        />
        <button className="btn btn-primary btn-sm" type="submit" disabled={!linkUrl.trim() || sendingLink}>
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
