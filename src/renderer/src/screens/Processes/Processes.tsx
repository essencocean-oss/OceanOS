import { useEffect, useState } from "react";
import { tauri } from "../../shared/tauri";

export interface ProcessesProps {
  visible?: boolean;
}

interface ManagedProcessRow {
  id: string;
  label: string;
  command: string;
  args: string[];
  cwd: string;
  pid: number;
  status: "running" | "stopped" | "error";
  startedAt: number;
  exitCode: number | null;
  error: string | null;
}

function Processes({ visible = true }: ProcessesProps) {
  const [rows, setRows] = useState<ManagedProcessRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = (await tauri.processesList()) as ManagedProcessRow[];
      setRows(list ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!visible) return;
    load();
  }, [visible]);

  const handleKill = async (id: string) => {
    await tauri.processesKill(id);
    await load();
  };

  const handleRestart = async (id: string) => {
    await tauri.processesRestart(id);
    await load();
  };

  return (
    <div className="processes-container">
      <div className="processes-toolbar">
        <span className="processes-title">Managed processes</span>
        <button
          type="button"
          onClick={load}
          className="ghost-btn"
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      {error ? <div className="processes-error">{error}</div> : null}

      {loading && rows.length === 0 ? (
        <div className="processes-empty">Loading process list...</div>
      ) : null}

      {!loading && rows.length === 0 ? (
        <div className="processes-empty">No managed processes yet.</div>
      ) : null}

      <div className="processes-table">
        <div className="processes-row header">
          <span>Label</span>
          <span>Status</span>
          <span>Command</span>
          <span>CWD</span>
          <span>PID</span>
          <span>Exit</span>
          <span>Actions</span>
        </div>
        {rows.map((row) => (
          <div key={row.id} className={`processes-row ${row.status}`}>
            <span className="cell-label">{row.label}</span>
            <span className="cell-status">{row.status}</span>
            <span className="cell-command">
              {row.command}
              {row.args.length ? " " + row.args.join(" ") : ""}
            </span>
            <span className="cell-cwd">{row.cwd}</span>
            <span className="cell-pid">{row.pid || "-"}</span>
            <span className="cell-exit">{row.exitCode ?? "-"}</span>
            <span className="cell-actions">
              <button
                type="button"
                onClick={() => handleKill(row.id)}
                disabled={row.status !== "running"}
                className="ghost-btn"
              >
                Stop
              </button>
              <button
                type="button"
                onClick={() => handleRestart(row.id)}
                disabled={row.status !== "running"}
                className="ghost-btn"
              >
                Restart
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Processes;
