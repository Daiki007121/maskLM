import { useState, useCallback, useEffect } from "react";
import Navbar from "../components/Navbar";
import TextInput from "../components/TextInput";
import MaskResult from "../components/MaskResult";
import UnmaskResult from "../components/UnmaskResult";
import Toast from "../components/Toast";
import * as Icon from "../components/Icons";
import { maskText, unmaskText } from "../api/client";

interface MaskState {
  input: string;
  output: string;
  mapping: Record<string, string>;
}

interface UnmaskState {
  input: string;
  output: string;
  mapping: Record<string, string>;
}

interface HistoryEntry {
  id: string;
  createdAt: number;
  original: string;
  masked: string;
  mapping: Record<string, string>;
}

const HISTORY_KEY = "masklm.history.v1";
const THEME_KEY = "masklm.theme.v1";

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded — ignore */
  }
}

export default function MaskPage() {
  // Theme
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    loadJSON<"light" | "dark">(
      THEME_KEY,
      window.matchMedia?.("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light",
    ),
  );

  // App state
  const [mask, setMask] = useState<MaskState>({
    input: "",
    output: "",
    mapping: {},
  });
  const [unmaskState, setUnmaskState] = useState<UnmaskState>({
    input: "",
    output: "",
    mapping: {},
  });
  const [history, setHistory] = useState<HistoryEntry[]>(() =>
    loadJSON<HistoryEntry[]>(HISTORY_KEY, []),
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [maskLoading, setMaskLoading] = useState(false);
  const [unmaskLoading, setUnmaskLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Persist
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    saveJSON(THEME_KEY, theme);
  }, [theme]);
  useEffect(() => {
    saveJSON(HISTORY_KEY, history);
  }, [history]);

  // Toast helper
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  const copyText = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        showToast("Copied to clipboard");
      } catch {
        showToast("Copy failed");
      }
    },
    [showToast],
  );

  // --- Actions ---
  const doMask = useCallback(async () => {
    if (!mask.input.trim() || maskLoading) return;
    setError(null);
    setMaskLoading(true);
    try {
      const resp = await maskText(mask.input);
      setMask((prev) => ({
        ...prev,
        output: resp.masked_text,
        mapping: resp.mapping,
      }));
      setUnmaskState((prev) => ({ ...prev, mapping: resp.mapping }));

      const entry: HistoryEntry = {
        id: crypto.randomUUID?.() || String(Date.now()),
        createdAt: Date.now(),
        original: mask.input,
        masked: resp.masked_text,
        mapping: resp.mapping,
      };
      setHistory((h) => [entry, ...h].slice(0, 50));

      const count = Object.keys(resp.mapping).length;
      showToast(`Masked ${count} item${count === 1 ? "" : "s"}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Mask failed";
      setError(msg);
    } finally {
      setMaskLoading(false);
    }
  }, [mask.input, maskLoading, showToast]);

  const doUnmask = useCallback(async () => {
    if (!unmaskState.input.trim() || unmaskLoading) return;
    setError(null);
    setUnmaskLoading(true);
    try {
      const resp = await unmaskText(unmaskState.input, unmaskState.mapping);
      setUnmaskState((prev) => ({ ...prev, output: resp.text }));
      showToast("Unmasked");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unmask failed";
      setError(msg);
    } finally {
      setUnmaskLoading(false);
    }
  }, [unmaskState.input, unmaskState.mapping, unmaskLoading, showToast]);

  // History actions
  const onLoadMask = useCallback(
    (h: HistoryEntry) => {
      setMask({ input: h.original, output: h.masked, mapping: h.mapping });
      setUnmaskState((prev) => ({ ...prev, mapping: h.mapping }));
      setDrawerOpen(false);
      showToast("Loaded into Mask panel");
    },
    [showToast],
  );
  const onDelete = useCallback((id: string) => {
    setHistory((h) => h.filter((x) => x.id !== id));
  }, []);
  const onClear = useCallback(() => {
    setHistory([]);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (mask.input && !mask.output) doMask();
        else if (unmaskState.input) doUnmask();
        else doMask();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setDrawerOpen((v) => !v);
      } else if (e.key === "Escape") {
        setDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [doMask, doUnmask, mask.input, mask.output, unmaskState.input]);

  const maskFooter = `${mask.input.length} chars · ${mask.input.trim() ? mask.input.trim().split(/\s+/).length : 0} words`;
  const unmaskFooter = `${unmaskState.input.length} chars`;

  return (
    <>
      <div className="wallpaper">
        <div className="blob b1" />
        <div className="blob b2" />
        <div className="blob b3" />
        <div className="blob b4" />
        <div className="blob b5" />
        <div className="grain" />
      </div>

      <div className="app">
        <Navbar
          theme={theme}
          onToggleTheme={() =>
            setTheme((t) => (t === "dark" ? "light" : "dark"))
          }
          historyCount={history.length}
          onOpenHistory={() => setDrawerOpen(true)}
        />

        {error && (
          <div className="error-banner">
            <span>{error}</span>
            <button onClick={() => setError(null)}>
              <Icon.X />
            </button>
          </div>
        )}

        <div className="work layout-split">
          {/* Mask Panel */}
          <div className="panel liquid">
            <div className="panel-header">
              <div>
                <div className="panel-title">
                  <span className="panel-step">1</span>
                  Mask sensitive content
                </div>
                <div className="panel-sub">
                  Paste text → detect PII → replace with tokens.
                </div>
              </div>
              <button
                className="btn btn-ghost"
                onClick={() =>
                  setMask({ input: "", output: "", mapping: {} })
                }
                title="Clear"
              >
                <Icon.X /> Clear
              </button>
            </div>
            <div className="panel-body">
              <TextInput
                value={mask.input}
                onChange={(v) => setMask((prev) => ({ ...prev, input: v }))}
                placeholder="e.g. Hi, my name is Jane Doe. My phone is 415-555-0137 and my email is jane@example.com."
                icon="lock"
                footer={maskFooter}
                actionLabel="Mask"
                actionIcon="sparkle"
                onAction={doMask}
                disabled={!mask.input.trim()}
                loading={maskLoading}
              />
              <MaskResult
                maskedText={mask.output}
                mapping={mask.mapping}
                onCopy={() => copyText(mask.output)}
              />
            </div>
          </div>

          {/* Unmask Panel */}
          <div className="panel liquid">
            <div className="panel-header">
              <div>
                <div className="panel-title">
                  <span className="panel-step">2</span>
                  Unmask LLM response
                </div>
                <div className="panel-sub">
                  Paste the LLM's reply → tokens swap back to originals.
                </div>
              </div>
              <button
                className="btn btn-ghost"
                onClick={() =>
                  setUnmaskState((prev) => ({
                    ...prev,
                    input: "",
                    output: "",
                  }))
                }
                title="Clear response"
              >
                <Icon.X /> Clear
              </button>
            </div>
            <div className="panel-body">
              <TextInput
                value={unmaskState.input}
                onChange={(v) =>
                  setUnmaskState((prev) => ({ ...prev, input: v }))
                }
                placeholder="Paste the LLM response that still contains [NAME_1], [EMAIL_1], etc."
                icon="unlock"
                footer={unmaskFooter}
                actionLabel="Unmask"
                actionIcon="play"
                onAction={doUnmask}
                disabled={!unmaskState.input.trim()}
                loading={unmaskLoading}
              />
              <UnmaskResult
                output={unmaskState.output}
                onCopy={() => copyText(unmaskState.output)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* History Drawer */}
      <div
        className={`drawer-backdrop ${drawerOpen ? "open" : ""}`}
        onClick={() => setDrawerOpen(false)}
      />
      <div className={`drawer liquid ${drawerOpen ? "open" : ""}`}>
        <div className="drawer-header">
          <span className="drawer-title">History</span>
          <button
            className="icon-btn"
            onClick={() => setDrawerOpen(false)}
          >
            <Icon.X />
          </button>
        </div>
        <div className="history-list">
          {history.length === 0 ? (
            <div className="history-empty">
              No masking history yet.<br />
              Mask some text to get started.
            </div>
          ) : (
            history.map((h) => (
              <div key={h.id} className="history-item">
                <div className="history-item-top">
                  <div className="meta">
                    <span className="dot" />
                    <span>
                      {new Date(h.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="history-preview">
                  {h.original.slice(0, 120)}
                </div>
                <div className="history-actions">
                  <button
                    className="history-action"
                    onClick={() => onLoadMask(h)}
                  >
                    Load
                  </button>
                  <button
                    className="history-action danger"
                    onClick={() => onDelete(h.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        {history.length > 0 && (
          <div style={{ padding: "12px 16px" }}>
            <button className="btn btn-ghost btn-danger" onClick={onClear}>
              <Icon.Trash /> Clear all
            </button>
          </div>
        )}
      </div>

      <Toast message={toast} />
    </>
  );
}
