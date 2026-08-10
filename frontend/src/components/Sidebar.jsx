import UploadZone from "./UploadZone.jsx";
import DocumentList from "./DocumentList.jsx";

export default function Sidebar({ docs, status, onUpload, onLink, onDelete, onClear, onNewChat }) {
  const chromaOk = Boolean(status.chroma);
  const llmOk = Boolean(status.llmConfigured);
  const totalChunks = docs.reduce((acc, d) => acc + (d.chunkCount || 0), 0);

  return (
    <aside className="sidebar glass">
      <div className="brand">
        <div className="brand-logo">🚗</div>
        <div className="brand-text">
          <strong>SGA MOTORS</strong>
          <span>Sales Advisor</span>
        </div>
        <button className="icon-btn" title="New chat" onClick={onNewChat}>
          ✦
        </button>
      </div>

      <div className="status-row">
        <span className={`pill ${chromaOk ? "pill-ok" : "pill-warn"}`}>
          <i className="dot" />
          {chromaOk ? "ChromaDB online" : "ChromaDB offline"}
        </span>
        <span className={`pill ${llmOk ? "pill-ok" : "pill-warn"}`}>
          <i className="dot" />
          {llmOk ? status.llmModel : "No LLM key"}
        </span>
      </div>

      <UploadZone onUpload={onUpload} onLink={onLink} busy={false} />

      <DocumentList docs={docs} totalChunks={totalChunks} onDelete={onDelete} onClear={onClear} />

      <div className="sidebar-foot">
        <span className="foot-dot" />
        <span>
          Free embeddings · <em>Xenova/all-MiniLM-L6-v2</em>
        </span>
      </div>
    </aside>
  );
}
