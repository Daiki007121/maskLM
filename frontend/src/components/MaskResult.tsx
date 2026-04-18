import * as Icon from "./Icons";

interface MaskResultProps {
  maskedText: string;
  mapping: Record<string, string>;
  onCopy: () => void;
}

/** Renders masked output with styled token chips. */
export default function MaskResult({
  maskedText,
  mapping,
  onCopy,
}: MaskResultProps) {
  const tokens = Object.keys(mapping);
  const hasOutput = maskedText.length > 0;

  return (
    <div className="field" style={{ flex: 0.9 }}>
      {hasOutput ? (
        <TokenizedText text={maskedText} tokens={tokens} />
      ) : (
        <div className="output-view empty">
          <div className="hint">
            Paste sensitive text above and press <strong>Mask</strong>.<br />
            Detected entities will appear here as tokens.
          </div>
        </div>
      )}
      <div className="field-footer">
        <div className="left">
          {hasOutput ? (
            <>
              <span className="pulse-dot" />
              <span>Safe to paste into any LLM</span>
            </>
          ) : (
            <span>Output appears here</span>
          )}
        </div>
        <div className="right">
          <button
            className="btn"
            disabled={!hasOutput}
            onClick={onCopy}
            title="Copy masked text"
          >
            <Icon.Copy /> Copy
          </button>
        </div>
      </div>
    </div>
  );
}

function TokenizedText({
  text,
  tokens,
}: {
  text: string;
  tokens: string[];
}) {
  if (!tokens.length) {
    return <div className="output-view">{text}</div>;
  }

  const escaped = tokens.map((t) =>
    t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  );
  const re = new RegExp(`(${escaped.join("|")})`, "g");
  const parts = text.split(re);

  const tokenSet = new Set(tokens);

  return (
    <div className="output-view">
      {parts.map((part, i) =>
        tokenSet.has(part) ? (
          <span key={i} className="chip">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </div>
  );
}
