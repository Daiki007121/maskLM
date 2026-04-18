import * as Icon from "./Icons";

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: "lock" | "unlock";
  footer: string;
  actionLabel: string;
  actionIcon: "sparkle" | "play";
  onAction: () => void;
  disabled: boolean;
  loading: boolean;
}

export default function TextInput({
  value,
  onChange,
  placeholder,
  icon,
  footer,
  actionLabel,
  actionIcon,
  onAction,
  disabled,
  loading,
}: TextInputProps) {
  const IconComp = icon === "lock" ? Icon.Lock : Icon.Unlock;
  const ActionIcon = actionIcon === "sparkle" ? Icon.Sparkle : Icon.Play;

  return (
    <div className="field">
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="field-footer">
        <div className="left">
          <IconComp />
          <span>{footer}</span>
        </div>
        <div className="right">
          <button
            className="btn btn-primary"
            onClick={onAction}
            disabled={disabled || loading}
          >
            {loading ? (
              <span>Processing…</span>
            ) : (
              <>
                <ActionIcon /> {actionLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
