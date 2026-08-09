/**
 * Tiny markdown-ish renderer: **bold**, `code`, bullet lines and links.
 * Keeps the UI dependency-free and fast while streaming.
 */
function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return (
        <strong key={i}>{part.slice(2, -2)}</strong>
      );
    }
    if (/^`[^`]+`$/.test(part)) {
      return (
        <code key={i}>{part.slice(1, -1)}</code>
      );
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      return (
        <a key={i} href={link[2]} target="_blank" rel="noreferrer">
          {link[1]}
        </a>
      );
    }
    return part;
  });
}

function Content({ text }) {
  const lines = (text || "").split("\n");
  const out = [];
  let list = [];

  const flush = (key) => {
    if (list.length) {
      out.push(
        <ul className="md-list" key={key}>
          {list.map((li, i) => (
            <li key={i}>{renderInline(li)}</li>
          ))}
        </ul>
      );
      list = [];
    }
  };

  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (/^[-*•]\s+/.test(line)) {
      list.push(line.replace(/^[-*•]\s+/, ""));
      return;
    }
    flush(`k${i}`);
    if (line === "") return;
    out.push(<p key={`p${i}`}>{renderInline(line)}</p>);
  });
  flush("end");

  return <div className="msg-content">{out}</div>;
}

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={`msg ${isUser ? "msg--user" : "msg--bot"}`}>
      {!isUser && <div className="msg-avatar">🛞</div>}
      <div className="msg-body">
        <div className={`bubble ${isUser ? "bubble--user" : "bubble--bot"}`}>
          <Content text={message.content} />
          {isUser && !message.content && ""}
        </div>
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="sources">
            <span className="sources-label">📚 Sources</span>
            {message.sources.map((s) => (
              <span className="source-chip" key={s}>
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
