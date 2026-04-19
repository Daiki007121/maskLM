import { useState, useCallback, useEffect } from "react";
import Navbar from "../components/Navbar";
import TextInput from "../components/TextInput";
import MaskResult from "../components/MaskResult";
import UnmaskResult from "../components/UnmaskResult";
import HistoryPanel from "../components/HistoryPanel";
import Toast from "../components/Toast";
import * as Icon from "../components/Icons";
import { maskText, unmaskText } from "../api/client";
import { useLocalHistory } from "../hooks/useLocalHistory";
import type { HistoryEntry } from "../types";

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
  const history = useLocalHistory();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [maskLoading, setMaskLoading] = useState(false);
  const [unmaskLoading, setUnmaskLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Persist theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    saveJSON(THEME_KEY, theme);
  }, [theme]);

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

      history.add({
        original: mask.input,
        masked: resp.masked_text,
        mapping: resp.mapping,
      });

      const count = Object.keys(resp.mapping).length;
      showToast(`Masked ${count} item${count === 1 ? "" : "s"}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Mask failed";
      setError(msg);
    } finally {
      setMaskLoading(false);
    }
  }, [mask.input, maskLoading, showToast, history]);

  const doUnmask = useCallback(async () => {
    if (!unmaskState.input.trim() || unmaskLoading) return;
    setError(null);
    setUnmaskLoading(true);
    try {
      const resp = await unmaskText(unmaskState.input, unmaskState.mapping);
      setUnmaskState((prev) => ({ ...prev, output: resp.text }));

      // Save unmask result to the most recent history entry with matching mapping
      const match = history.entries.find(
        (e) => JSON.stringify(e.mapping) === JSON.stringify(unmaskState.mapping),
      );
      if (match) {
        history.updateUnmask(match.id, unmaskState.input, resp.text);
      }

      showToast("Restored");
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
      setUnmaskState({
        input: h.unmaskInput ?? "",
        output: h.unmaskOutput ?? "",
        mapping: h.mapping,
      });
      setDrawerOpen(false);
      showToast("Session restored");
    },
    [showToast],
  );

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
                  Restore response
                </div>
                <div className="panel-sub">
                  Paste the LLM's reply → restore original names &amp; details.
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
                actionLabel="Restore"
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

      <HistoryPanel
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        entries={history.entries}
        filteredEntries={history.filteredEntries}
        searchQuery={history.searchQuery}
        onSearchChange={history.setSearchQuery}
        onLoad={onLoadMask}
        onDelete={history.remove}
        onClear={history.clear}
        onUpdateMapping={history.updateMapping}
      />

      <Toast message={toast} />
    </>
  );
}
