const ICONS = {
  pdf: "📄",
  docx: "📘",
  txt: "📝",
  md: "📝",
  png: "🖼️",
  jpg: "🖼️",
  jpeg: "🖼️",
  link: "🔗",
};

function extOf(name) {
  const i = (name || "").lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export default function DocumentList({ docs, totalChunks, onDelete, onClear }) {
  return (
    <div className="doc-list-wrap">
      <div className="doc-list-head">
        <strong>Documents</strong>
        <span className="doc-count">
          {docs.length} · {totalChunks} chunks
        </span>
      </div>

      <div className="doc-list">
        {docs.length === 0 && (
          <div className="doc-empty">
            <span>📭</span>
            <p>No documents yet. Upload a brochure to start selling!</p>
          </div>
        )}
        {docs.map((d) => (
          <div className="doc-item" key={d.id}>
            <span className="doc-ico">{ICONS[d.type] || ICONS[extOf(d.name)] || "📄"}</span>
            <div className="doc-meta">
              <strong title={d.name}>{d.name}</strong>
              <span>
                {d.chunkCount || 0} chunks · {fmtDate(d.createdAt)}
              </span>
            </div>
            <button
              className="icon-btn icon-btn--danger"
              title="Remove"
              onClick={() => onDelete(d.id)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {docs.length > 0 && (
        <button className="btn btn-ghost btn-block btn-sm" onClick={onClear}>
          🗑️ Clear knowledge base
        </button>
      )}
    </div>
  );
}
