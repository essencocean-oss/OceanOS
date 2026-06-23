import {useEffect, useState} from "react";
import {useI18n} from "../../components/useI18n";
import {tauri} from "../../shared/tauri";

interface BuiltInAgent {
  id: string;
  name: string;
  role: string;
  description: string;
  status: "idle" | "running" | "error";
  color: string;
}

const DEFAULT_AGENTS: BuiltInAgent[] = [
  {
    id: "titan",
    name: "Titan",
    role: "orchestrator",
    description: "Plans tasks and coordinates the squad.",
    status: "idle",
    color: "#6366f1",
  },
  {
    id: "maelstrom",
    name: "Maelstrom",
    role: "executor",
    description: "Runs skills, workflows, and tool calls.",
    status: "idle",
    color: "#10b981",
  },
  {
    id: "aegis",
    name: "Aegis",
    role: "security",
    description: "Enforces guardrails and risk limits.",
    status: "idle",
    color: "#f59e0b",
  },
  {
    id: "oracle",
    name: "Oracle",
    role: "reviewer",
    description: "Reviews, verifies, and self-critiques outputs.",
    status: "idle",
    color: "#ec4899",
  },
];

function StatusDot({status}: {status: BuiltInAgent["status"]}): React.JSX.Element {
  const map: Record<BuiltInAgent["status"], string> = {
    idle: "var(--text-muted, #64748b)",
    running: "var(--success, #22c55e)",
    error: "var(--error, #ef4444)",
  };
  return <span className="team-status-dot" style={{background: map[status]}} />;
}

export default function Team(): React.JSX.Element {
  const {t} = useI18n();
  const [agents, setAgents] = useState<BuiltInAgent[]>(DEFAULT_AGENTS);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const gateway = await tauri.gatewayStatus();
      if (cancelled) return;
      const running = gateway.success;
      setAgents((prev) =>
        prev.map((a) => ({
          ...a,
          status: running ? ("idle" as const) : ("error" as const),
        })),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="team-container">
      <div className="team-header">
        <div>
          <h2 className="team-title">{t("team.title", "Agent Team")}</h2>
          <p className="team-subtitle">
            {t(
              "team.subtitle",
              "Built-in squad with specialized roles and guardrails.",
            )}
          </p>
        </div>
      </div>

      <div className="team-grid">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="team-card"
            style={{borderTop: `3px solid ${agent.color}`}}
          >
            <div className="team-card-head">
              <div
                className="team-avatar"
                style={{background: `${agent.color}22`, color: agent.color}}
              >
                {agent.name.charAt(0)}
              </div>
              <div className="team-card-meta">
                <div className="team-card-name">{agent.name}</div>
                <div className="team-card-role">{agent.role}</div>
              </div>
              <StatusDot status={agent.status} />
            </div>

            <p className="team-card-desc">{agent.description}</p>

            <div className="team-card-actions">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  void tauri.runAgent(agent.id, `status-summary:${agent.id}`, "");
                }}
              >
                {"Run status check"}
              </button>
              <span className="team-card-badge" style={{background: `${agent.color}18`, color: agent.color}}>
                {agent.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
