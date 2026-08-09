export default function TypingIndicator() {
  return (
    <div className="msg msg--bot">
      <div className="msg-avatar">🛞</div>
      <div className="bubble bubble--bot typing">
        <span className="tdot" />
        <span className="tdot" />
        <span className="tdot" />
      </div>
    </div>
  );
}
