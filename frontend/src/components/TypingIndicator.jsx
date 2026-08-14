import { CarIcon } from "./Icons.jsx";

export default function TypingIndicator() {
  return (
    <div className="msg msg--bot">
      <div className="msg-avatar">
        <CarIcon size={18} />
      </div>
      <div className="bubble bubble--bot typing">
        <span className="tdot" />
        <span className="tdot" />
        <span className="tdot" />
      </div>
    </div>
  );
}
