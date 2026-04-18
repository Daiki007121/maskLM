import * as Icon from "./Icons";

interface NavbarProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  historyCount: number;
  onOpenHistory: () => void;
}

export default function Navbar({
  theme,
  onToggleTheme,
  historyCount,
  onOpenHistory,
}: NavbarProps) {
  return (
    <header className="topbar liquid liquid-capsule">
      <div className="brand">
        <div className="brand-mark">M</div>
        <div className="brand-name">MaskLM</div>
        <div className="brand-tag">Privacy proxy for LLMs</div>
      </div>
      <div className="topbar-actions">
        <button
          className="icon-btn badge"
          data-count={historyCount || undefined}
          onClick={onOpenHistory}
          title="History (⌘K)"
        >
          <Icon.History />
        </button>
        <button
          className="icon-btn"
          onClick={onToggleTheme}
          title="Toggle theme"
        >
          {theme === "dark" ? <Icon.Sun /> : <Icon.Moon />}
        </button>
      </div>
    </header>
  );
}
