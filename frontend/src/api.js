async function jsonFetch(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      msg = data.error || msg;
    } catch {
      /* keep default */
    }
    throw new Error(msg);
  }
  return res.json();
}

export const getHealth = () => jsonFetch("/api/health");

export const getDocuments = () => jsonFetch("/api/documents");

export const deleteDocument = (id) =>
  jsonFetch(`/api/documents/${id}`, { method: "DELETE" });

export const clearAll = () =>
  jsonFetch("/api/documents/clear", { method: "POST" });

export const submitLead = (leadData) =>
  jsonFetch("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(leadData),
  });

export const getLeads = () => jsonFetch("/api/leads");

export async function uploadFiles(files) {
  const fd = new FormData();
  files.forEach((f) => fd.append("files", f));
  return jsonFetch("/api/documents/upload", { method: "POST", body: fd });
}

export async function uploadLink(url, name) {
  return jsonFetch("/api/documents/link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, name }),
  });
}

/**
 * Stream a chat answer over SSE.
 * Events: { sources: [] }, { token }, { done }, { error }
 */
export async function streamChat({ message, history, language, onSources, onToken }) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history, language }),
  });
  if (!res.ok || !res.body) {
    let msg = "Chat request failed";
    try {
      const d = await res.json();
      msg = d.error || msg;
    } catch {
      /* keep default */
    }
    throw new Error(msg);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      let evt;
      try {
        evt = JSON.parse(payload);
      } catch {
        continue;
      }
      if (evt.error) throw new Error(evt.error);
      if (evt.sources) onSources?.(evt.sources);
      if (evt.token) onToken?.(evt.token);
    }
  }
}
