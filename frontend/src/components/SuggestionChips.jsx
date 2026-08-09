export default function SuggestionChips({ suggestions, onPick, disabled }) {
  return (
    <div className="suggestions">
      {suggestions.map((s) => (
        <button
          key={s.text}
          className="suggestion"
          disabled={disabled}
          onClick={() => onPick(s.text)}
        >
          <span className="suggestion-ico">{s.icon}</span>
          <span>{s.text}</span>
        </button>
      ))}
    </div>
  );
}
