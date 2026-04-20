import * as Icon from "./Icons";
import { useAuth } from "../contexts/AuthContext";

interface NavbarProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onOpenHistory: () => void;
}

export default function Navbar({
  theme,
  onToggleTheme,
  onOpenHistory,
}: NavbarProps) {
  const { signOut, user } = useAuth();

  return (
    <header className="topbar liquid liquid-capsule">
      <div className="brand">
        <div className="brand-mark">M</div>
        <div className="brand-name">MaskLM</div>
        <div className="brand-tag">Privacy proxy for LLMs</div>
      </div>
      <div className="topbar-actions">
        {user && (
          <span
            className="user-email"
            title={user.email}
          >
            {user.email}
          </span>
        )}
        <button
          className="icon-btn"
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
        <button
          className="icon-btn"
          onClick={signOut}
          title="Sign out"
        >
          <Icon.LogOut />
        </button>
      </div>
    </header>
  );
}
