const ICONS = { success: "✅", error: "⚠️", info: "💡" };

export default function Toasts({ toasts }) {
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.type}`}>
          <span className="toast-ico">{ICONS[t.type] || ICONS.info}</span>
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
}
