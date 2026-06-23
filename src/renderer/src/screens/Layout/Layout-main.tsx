import { useState, useCallback, useEffect } from "react";
import { useI18n } from "../../components/useI18n";

type View =
  | "chat"
  | "sessions"
  | "discover"
  | "agents"
  | "office"
  | "models"
  | "providers"
  | "skills"
  | "memory"
  | "tools"
  | "schedules"
  | "kanban"
  | "gateway"
  | "marketplace"
  | "orchestrator"
  | "settings";

const Layout = ({ initialView = "chat" as View }: { initialView?: View }) => {
  const { t } = useI18n();
  const [view, setView] = useState<View>(initialView);
  const navigate = useCallback((v: View) => setView(v), []);

  useEffect(() => {
    document.title = t?.("navigation.settings") ?? "OceanOS";
  }, [t, view]);

  return (
    <div data-testid="layout" style={{ padding: 24 }}>
      <nav>{view}</nav>
      <button onClick={() => navigate("marketplace")}>Marketplace</button>
      <button onClick={() => navigate("orchestrator")}>Orchestrator</button>
    </div>
  );
};

export default Layout;
