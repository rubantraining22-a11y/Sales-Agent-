import React from "react";
import {
  PdfIcon,
  DocIcon,
  TxtIcon,
  ImageIcon,
  LinkIcon,
  FolderIcon,
  InboxIcon,
  TrashIcon,
  XIcon
} from "./Icons.jsx";

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

function renderDocIcon(type, name) {
  const ext = (type || extOf(name)).toLowerCase();
  if (ext === "pdf") return <PdfIcon className="icon icon--pdf" size={18} />;
  if (ext === "docx" || ext === "doc") return <DocIcon className="icon icon--doc" size={18} />;
  if (ext === "txt" || ext === "md") return <TxtIcon className="icon icon--txt" size={18} />;
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) return <ImageIcon className="icon icon--img" size={18} />;
  if (ext === "link") return <LinkIcon className="icon icon--link" size={18} />;
  return <PdfIcon className="icon" size={18} />;
}

export default function DocumentList({
  docs,
  totalChunks,
  onDelete,
  onClear,
  isAuthenticated,
}) {
  return (
    <div className="doc-list-wrap">
      <div className="doc-list-head">
        <div className="doc-list-head-title">
          <FolderIcon size={16} className="icon-accent" />
          <strong>Available Catalog</strong>
        </div>
        <span className="doc-count">
          {docs.length} files · {totalChunks} chunks
        </span>
      </div>

      <div className="doc-list">
        {docs.length === 0 && (
          <div className="doc-empty">
            <InboxIcon size={28} className="doc-empty-ico" />
            <p>No documents uploaded yet in catalog.</p>
          </div>
        )}
        {docs.map((d) => (
          <div className="doc-item" key={d.id}>
            <span className="doc-ico-box">
              {renderDocIcon(d.type, d.name)}
            </span>
            <div className="doc-meta">
              <strong title={d.name}>{d.name}</strong>
              <span>
                {d.chunkCount || 0} chunks · {fmtDate(d.createdAt)}
              </span>
            </div>
            {isAuthenticated && (
              <button
                className="icon-btn icon-btn--danger"
                title="Remove document"
                onClick={() => onDelete(d.id)}
              >
                <XIcon size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      {isAuthenticated && docs.length > 0 && (
        <button className="btn btn-ghost btn-block btn-sm btn-danger-ghost" onClick={onClear}>
          <TrashIcon size={14} />
          Clear knowledge base
        </button>
      )}
    </div>
  );
}
