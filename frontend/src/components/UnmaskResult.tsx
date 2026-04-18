import * as Icon from "./Icons";

interface UnmaskResultProps {
  output: string;
  onCopy: () => void;
}

/** Renders the unmasked (restored) output. */
export default function UnmaskResult({ output, onCopy }: UnmaskResultProps) {
  const hasOutput = output.length > 0;

  return (
    <div className="field" style={{ flex: 0.9 }}>
      {hasOutput ? (
        <div className="output-view">{output}</div>
      ) : (
        <div className="output-view empty">
          <div className="hint">
            Restored text shows here.<br />
            Paste the LLM reply above and press <strong>Unmask</strong>.
          </div>
        </div>
      )}
      <div className="field-footer">
        <div className="left">
          {hasOutput ? (
            <>
              <Icon.Check />
              <span style={{ color: "var(--success)" }}>Restored</span>
            </>
          ) : (
            <span>Awaiting unmask</span>
          )}
        </div>
        <div className="right">
          <button className="btn" disabled={!hasOutput} onClick={onCopy}>
            <Icon.Copy /> Copy
          </button>
        </div>
      </div>
    </div>
  );
}
