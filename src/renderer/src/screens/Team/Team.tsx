import { useEffect, useState } from "react";
import { useI18n } from "../../components/useI18n";
import { tauri } from "../../shared/tauri";

type AgentId = "titan" | "maelstrom" | "aegis" | "oracle";

interface BuiltInAgent {
  id: AgentId;
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
    description: "Plans tasks and delegates to the squad.",
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

type WorkflowStep =
  | { stage: "idle" }
  | { stage: "planning"; agent: BuiltInAgent }
  | { stage: "executing"; agent: BuiltInAgent; plan?: string }
  | { stage: "reviewing"; agent: BuiltInAgent; plan?: string; result?: string }
  | { stage: "securing"; agent: BuiltInAgent; plan?: string; result?: string; review?: string }
  | { stage: "done"; plan: string; result: string; review: string; approved: boolean };

function StatusDot({
  status,
}: {
  status: BuiltInAgent["status"];
}): React.JSX.Element {
  const map: Record<BuiltInAgent["status"], string> = {
    idle: "var(--text-muted, #64748b)",
    running: "var(--success, #22c55e)",
    error: "var(--error, #ef4444)",
  };
  return (
    <span className="team-status-dot" style={{ background: map[status] }} />
  );
}

function WorkflowPanel({
  workflow,
  onReset,
}: {
  workflow: WorkflowStep;
  onReset: () => void;
}): React.JSX.Element {
  const steps: { label: string; value: string }[] = [];
  if (workflow.stage === "done") {
    steps.push(
      { label: "Plan", value: workflow.plan },
      { label: "Execute", value: workflow.result },
      { label: "Review", value: workflow.review },
      { label: "Security", value: workflow.approved ? "Approved" : "Rejected" },
    );
  } else if (workflow.stage === "securing") {
    steps.push(
      { label: "Plan", value: workflow.plan ?? "…" },
      { label: "Execute", value: workflow.result ?? "…" },
      { label: "Review", value: workflow.review ?? "…" },
    );
  } else if (workflow.stage === "reviewing") {
    steps.push(
      { label: "Plan", value: workflow.plan ?? "…" },
      { label: "Execute", value: workflow.result ?? "…" },
    );
  } else if (workflow.stage === "executing") {
    steps.push(
      { label: "Plan", value: workflow.plan ?? "…" },
      { label: "Execute", value: "…" },
    );
  } else if (workflow.stage === "planning") {
    steps.push({ label: "Plan", value: "…" });
  }

  return (
    <div className="team-workflow">
      <div className="team-workflow-header">
        <span>Live workflow</span>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onReset}
        >
          Reset
        </button>
      </div>
      <ol className="team-workflow-steps">
        {steps.map((step, idx) => (
          <li key={idx} className="team-workflow-step">
            <span className="team-workflow-step-label">{step.label}</span>
            <span className="team-workflow-step-value">{step.value}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function Team(): React.JSX.Element {
  const { t } = useI18n();
  const [agents, setAgents] = useState<BuiltInAgent[]>(DEFAULT_AGENTS);
  const [workflow, setWorkflow] = useState<WorkflowStep>({ stage: "idle" });
  const [log, setLog] = useState<string>("");

  const setAgent = (id: AgentId, patch: Partial<BuiltInAgent>) =>
    setAgents((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    );

  const appendLog = (line: string) =>
    setLog((prev) => (prev ? `${prev}\n${line}` : line));

  const runAgent = async (
    id: AgentId,
    input: string,
    profile = "default",
  ): Promise<string> => {
    setAgent(id, { status: "running" });
    try {
      const res = await tauri.runAgent(id, input, profile);
      const text =
        typeof res === "string"
          ? res
          : res && typeof res === "object" && "output" in res
            ? String((res as { output?: unknown }).output ?? "")
            : JSON.stringify(res);
      setAgent(id, { status: "idle" });
      return text;
    } catch (e) {
      setAgent(id, { status: "error" });
      throw e;
    }
  };

  const runDemoWorkflow = async () => {
    setWorkflow({ stage: "planning", agent: DEFAULT_AGENTS[0] });
    setLog("");
    appendLog("Titan: planning a simple task…");
    try {
      const plan = await runAgent(
        "titan",
        "Plan a simple 3-step task: write a hello-world skill, run it, review the result.",
      );
      appendLog(`Titan: ${plan}`);

      setWorkflow({
        stage: "executing",
        agent: DEFAULT_AGENTS[1],
        plan,
      });
      const result = await runAgent(
        "maelstrom",
        `Execute this plan: ${plan}`,
      );
      appendLog(`Maelstrom: ${result}`);

      setWorkflow({
        stage: "reviewing",
        agent: DEFAULT_AGENTS[3],
        plan,
        result,
      });
      const review = await runAgent(
        "oracle",
        `Review this result: ${result}`,
      );
      appendLog(`Oracle: ${review}`);

      setWorkflow({
        stage: "securing",
        agent: DEFAULT_AGENTS[2],
        plan,
        result,
        review,
      });
      const approved = await runAgent(
        "aegis",
        `Security check for plan: ${plan}\nReview: ${review}`,
      );
      const isApproved = /approve|safe|ok|pass/i.test(String(approved));

      setWorkflow({
        stage: "done",
        plan,
        result,
        review,
        approved: isApproved,
      });
      appendLog(
        `Aegis: ${isApproved ? "Approved" : "Flagged"} — ${approved}`,
      );
    } catch (e) {
      appendLog(`Workflow error: ${e}`);
      setWorkflow({ stage: "idle" });
    }
  };

  return (
    <div className="team-container">
      <div className="team-header">
        <div>
          <h2 className="team-title">Agent Team</h2>
          <p className="team-subtitle">
            Built-in squad with specialized roles and guardrails.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={runDemoWorkflow}
        >
          Run demo workflow
        </button>
      </div>

      {workflow.stage !== "idle" && (
        <WorkflowPanel
          workflow={workflow}
          onReset={() => setWorkflow({ stage: "idle" })}
        />
      )}

      {log && <pre className="team-log">{log}</pre>}

      <div className="team-grid">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="team-card"
            style={{ borderTop: `3px solid ${agent.color}` }}
          >
            <div className="team-card-head">
              <div
                className="team-avatar"
                style={{ background: `${agent.color}22`, color: agent.color }}
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
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={async () => {
                  const prompt =
                    agent.id === "titan"
                      ? "Break down this goal into 3 steps: build a simple calculator skill"
                      : agent.id === "maelstrom"
                        ? "Run the calculator skill end-to-end"
                        : agent.id === "oracle"
                          ? "Review the calculator output for correctness"
                          : "Check the calculator workflow for risks";
                  try {
                    await runAgent(agent.id, prompt);
                  } catch {
                    // status already updated to error in runAgent
                  }
                }}
              >
                Run check
              </button>
              <span
                className="team-card-badge"
                style={{
                  background: `${agent.color}18`,
                  color: agent.color,
                }}
              >
                {agent.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
