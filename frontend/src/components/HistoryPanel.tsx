import { useState } from "react";
import type { HistoryEntry } from "../types";
import * as Icon from "./Icons";

interface HistoryPanelProps {
  open: boolean;
  onClose: () => void;
  entries: HistoryEntry[];
  filteredEntries: HistoryEntry[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onLoad: (entry: HistoryEntry) => void;
  onReUnmask: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  onUpdateMapping: (id: string, mapping: Record<string, string>) => void;
}

export default function HistoryPanel({
  open,
  onClose,
  entries,
  filteredEntries,
  searchQuery,
  onSearchChange,
  onLoad,
  onReUnmask,
  onDelete,
  onClear,
  onUpdateMapping,
}: HistoryPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMapping, setEditMapping] = useState<Record<string, string>>({});

  const startEditing = (entry: HistoryEntry) => {
    setEditingId(entry.id);
    setEditMapping({ ...entry.mapping });
  };

  const saveMapping = () => {
    if (editingId) {
      onUpdateMapping(editingId, editMapping);
      setEditingId(null);
      setEditMapping({});
    }
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditMapping({});
  };

  return (
    <>
      <div
        className={`drawer-backdrop ${open ? "open" : ""}`}
        onClick={onClose}
      />
      <div className={`drawer liquid ${open ? "open" : ""}`}>
        <div className="drawer-header">
          <span className="drawer-title">History</span>
          <button className="icon-btn" onClick={onClose}>
            <Icon.X />
          </button>
        </div>

        {entries.length > 0 && (
          <div className="history-search">
            <Icon.Search />
            <input
              type="text"
              className="history-search-input"
              placeholder="Search history…"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {searchQuery && (
              <button
                className="icon-btn icon-btn-sm"
                onClick={() => onSearchChange("")}
              >
                <Icon.X />
              </button>
            )}
          </div>
        )}

        <div className="history-list">
          {entries.length === 0 ? (
            <div className="history-empty">
              No masking history yet.
              <br />
              Mask some text to get started.
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="history-empty">
              No results for &ldquo;{searchQuery}&rdquo;
            </div>
          ) : (
            filteredEntries.map((h) => (
              <div key={h.id} className="history-item">
                <div className="history-item-top">
                  <div className="meta">
                    <span className="dot" />
                    <span>{new Date(h.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                <div className="history-preview">
                  {h.original.slice(0, 120)}
                  {h.original.length > 120 ? "…" : ""}
                </div>

                {editingId === h.id ? (
                  <div className="mapping-editor">
                    <div className="mapping-editor-title">Edit mapping</div>
                    {Object.entries(editMapping).map(([token, value]) => (
                      <div key={token} className="mapping-row">
                        <span className="mapping-token">{token}</span>
                        <span className="mapping-arrow">&rarr;</span>
                        <input
                          className="mapping-value-input"
                          value={value}
                          onChange={(e) =>
                            setEditMapping((prev) => ({
                              ...prev,
                              [token]: e.target.value,
                            }))
                          }
                        />
                      </div>
                    ))}
                    <div className="mapping-editor-actions">
                      <button
                        className="history-action"
                        onClick={saveMapping}
                      >
                        Save
                      </button>
                      <button
                        className="history-action"
                        onClick={cancelEditing}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="history-actions">
                    <button
                      className="history-action"
                      onClick={() => onLoad(h)}
                      title="Re-edit original text in Mask panel"
                    >
                      Edit
                    </button>
                    <button
                      className="history-action"
                      onClick={() => onReUnmask(h)}
                      title="Load masked text + mapping into Unmask panel"
                    >
                      Re-unmask
                    </button>
                    <button
                      className="history-action"
                      onClick={() => startEditing(h)}
                      title="Edit the PII mapping values"
                    >
                      Mapping
                    </button>
                    <button
                      className="history-action danger"
                      onClick={() => onDelete(h.id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {entries.length > 0 && (
          <div style={{ padding: "12px 16px" }}>
            <button className="btn btn-ghost btn-danger" onClick={onClear}>
              <Icon.Trash /> Clear all
            </button>
          </div>
        )}
      </div>
    </>
  );
}
