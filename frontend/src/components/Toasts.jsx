import { CheckCircleIcon, AlertTriangleIcon, SparklesIcon } from "./Icons.jsx";

export default function Toasts({ toasts }) {
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.type}`}>
          <span className="toast-ico">
            {t.type === "success" && <CheckCircleIcon size={18} className="icon--txt" />}
            {t.type === "error" && <AlertTriangleIcon size={18} className="icon--pdf" />}
            {t.type !== "success" && t.type !== "error" && <SparklesIcon size={18} className="icon--link" />}
          </span>
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
}
