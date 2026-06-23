import { useState } from "react";
import OceanLogo from "../../components/common/OceanLogo";
import { ArrowRight, Loader2 } from "lucide-react";

const SPLASH_BG =
  "/src/assets/brand-assets/ocean-cinematic.mp4";
const HERO_IMAGE =
  "/src/assets/brand-assets/cyan-grid-wave.jpg";
const SIDE_IMAGE =
  "/src/assets/brand-assets/mesh-wave.jpg";
const TEXTURE_IMAGE =
  "/src/assets/brand-assets/wave-diagram.jpg";

interface WelcomeProps {
  error: string | null;
  connectionMode: "local" | "remote" | "ssh";
  onStart: () => void;
  onRecheck: () => void;
  onSwitchToLocal: () => void;
}

type ConnectionPanel = "none" | "remote" | "ssh";

function Welcome({
  error: _error,
  connectionMode: _connectionMode,
  onStart,
  onRecheck,
  onSwitchToLocal: _onSwitchToLocal,
}: WelcomeProps): React.JSX.Element {
  const [panel, setPanel] = useState<ConnectionPanel>("none");
  const [remoteUrl, setRemoteUrl] = useState("");
  const [remoteApiKey, setRemoteApiKey] = useState("");
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [remoteTesting, setRemoteTesting] = useState(false);
  const [sshHost, setSshHost] = useState("");
  const [sshPort, setSshPort] = useState("");
  const [sshUser, setSshUser] = useState("");
  const [sshKeyPath, setSshKeyPath] = useState("");
  const [sshRemotePort, setSshRemotePort] = useState("");
  const [sshError, setSshError] = useState<string | null>(null);
  const [sshTesting, setSshTesting] = useState(false);

  async function handleConnectRemote() {
    const url = remoteUrl.trim();
    const key = remoteApiKey.trim();
    if (!url) {
      setRemoteError("Remote server URL is required.");
      return;
    }
    setRemoteTesting(true);
    setRemoteError(null);
    try {
      const ok = typeof window !== "undefined" && typeof window.hermesAPI?.testRemoteConnection === "function"
        ? await window.hermesAPI.testRemoteConnection(url, key)
        : true;
      if (ok) {
        if (typeof window !== "undefined" && typeof window.hermesAPI?.setConnectionConfig === "function") {
          await window.hermesAPI.setConnectionConfig("remote", url, key);
        }
        onRecheck();
      } else {
        setRemoteError("Remote connection test failed.");
      }
    } catch {
      setRemoteError("Remote setup failed.");
    } finally {
      setRemoteTesting(false);
    }
  }

  async function handleConnectSsh() {
    const host = sshHost.trim();
    const user = sshUser.trim();
    if (!host || !user) {
      setSshError("Host and username are required.");
      return;
    }
    const port = parseInt(sshPort, 10) || 22;
    const remotePort = parseInt(sshRemotePort, 10) || 8642;
    setSshTesting(true);
    setSshError(null);
    try {
      const ok = typeof window !== "undefined" && typeof window.hermesAPI?.testSshConnection === "function"
        ? await window.hermesAPI.testSshConnection(host, port, user, sshKeyPath.trim(), remotePort)
        : true;
      if (ok) {
        if (typeof window !== "undefined" && typeof window.hermesAPI?.setSshConfig === "function") {
          await window.hermesAPI.setSshConfig(host, port, user, sshKeyPath.trim(), remotePort, 18642);
        }
        onRecheck();
      } else {
        setSshError("SSH connection test failed.");
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown SSH configuration error";
      setSshError(`SSH setup failed: ${message}`);
    } finally {
      setSshTesting(false);
    }
  }

  if (panel === "remote") {
    return (
      <div className="screen welcome-screen">
        <OceanLogo size={36} />
        <h1 className="welcome-title" style={{ fontSize: 22 }}>Connect to Remote OceanOS</h1>
        <p className="welcome-subtitle" style={{ marginBottom: 24 }}>Point the desktop client at another OceanOS instance.</p>
        <div className="welcome-remote-card">
          <label className="welcome-remote-label">Remote server URL</label>
          <input type="url" className="welcome-remote-input" placeholder="http://192.168.1.100:8642" value={remoteUrl} onChange={(e) => setRemoteUrl(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleConnectRemote(); }} autoFocus />
          <label className="welcome-remote-label" style={{ marginTop: 12 }}>API key</label>
          <input type="password" className="welcome-remote-input" placeholder="••••••••" value={remoteApiKey} onChange={(e) => setRemoteApiKey(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleConnectRemote(); }} />
          <div className="welcome-remote-row" style={{ marginTop: 12 }}>
            <button className="btn btn-primary" onClick={handleConnectRemote} disabled={remoteTesting} style={{ whiteSpace: "nowrap", width: "100%" }}> {remoteTesting ? <>Testing connection<Loader2 size={14} className="animate-spin" /></> : <>Connect<ArrowRight size={16} /></>} </button>
          </div>
          {remoteError && <p className="welcome-remote-error" style={{ whiteSpace: "pre-line" }}>{remoteError}</p>}
        </div>
        <button className="btn-ghost" onClick={() => setPanel("none")} style={{ marginTop: 8, fontSize: 13, color: "var(--text-muted)" }}>Back</button>
      </div>
    );
  }

  if (panel === "ssh") {
    return (
      <div className="screen welcome-screen">
        <OceanLogo size={36} />
        <h1 className="welcome-title" style={{ fontSize: 22 }}>SSH Connection</h1>
        <p className="welcome-subtitle" style={{ marginBottom: 24 }}>Connect to OceanOS through an existing SSH jump host.</p>
        <div className="welcome-remote-card">
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 3 }}>
              <label className="welcome-remote-label">Host</label>
              <input type="text" className="welcome-remote-input" placeholder="host" value={sshHost} onChange={(e) => setSshHost(e.target.value)} autoFocus />
            </div>
            <div style={{ flex: 1 }}>
              <label className="welcome-remote-label">Port</label>
              <input type="number" className="welcome-remote-input" placeholder="22" value={sshPort} onChange={(e) => setSshPort(e.target.value)} />
            </div>
          </div>
          <label className="welcome-remote-label" style={{ marginTop: 12 }}>Username</label>
          <input type="text" className="welcome-remote-input" placeholder="user" value={sshUser} onChange={(e) => setSshUser(e.target.value)} />
          <label className="welcome-remote-label" style={{ marginTop: 12 }}>Key path <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span></label>
          <input type="text" className="welcome-remote-input" placeholder="~/.ssh/id_rsa" value={sshKeyPath} onChange={(e) => setSshKeyPath(e.target.value)} />
          <label className="welcome-remote-label" style={{ marginTop: 12 }}>Remote port <span style={{ fontWeight: 400, opacity: 0.6 }}>(default 8642)</span></label>
          <input type="number" className="welcome-remote-input" placeholder="8642" value={sshRemotePort} onChange={(e) => setSshRemotePort(e.target.value)} />
          <div className="welcome-remote-row" style={{ marginTop: 16 }}>
            <button className="btn btn-primary" onClick={handleConnectSsh} disabled={sshTesting || !sshHost.trim() || !sshUser.trim()} style={{ whiteSpace: "nowrap", width: "100%" }}> {sshTesting ? <>Testing SSH<Loader2 size={14} className="animate-spin" /></> : <>Connect via SSH<ArrowRight size={16} /></>} </button>
          </div>
          {sshError && <p className="welcome-remote-error" style={{ whiteSpace: "pre-line" }}>{sshError}</p>}
        </div>
        <button className="btn-ghost" onClick={() => setPanel("none")} style={{ marginTop: 8, fontSize: 13, color: "var(--text-muted)" }}>Back</button>
      </div>
    );
  }

  return (
    <div className="screen welcome-screen">
      <style>{`
        .welcome-landing {
          position: relative;
          overflow: hidden;
          text-align: left;
          min-height: 600px;
        }
        .welcome-bg-video,
        .welcome-bg-image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }
        .welcome-bg-video {
          object-fit: cover;
          filter: brightness(0.45) saturate(1.1);
        }
        .welcome-bg-overlay {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(850px circle at 20% 35%, rgba(255,255,255,0.04) 0%, transparent 45%),
            linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.65) 85%);
          pointer-events: none;
        }
        .welcome-bg-texture {
          position: absolute;
          inset: 0;
          background: url(${TEXTURE_IMAGE}) center/cover no-repeat;
          opacity: 0.08;
          mix-blend-mode: overlay;
        }
        .welcome-landing-content {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 60px;
          padding: 60px;
          max-width: 1380px;
        }
        .welcome-landing-shell {
          position: relative;
          z-index: 3;
          min-height: 680px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .welcome-logo-anchor {
          filter: drop-shadow(0 12px 32px rgba(0,0,0,0.5));
          transition: transform 0.6s cubic-bezier(.25,.8,.25,1.0);
        }
        .welcome-logo-anchor:hover {
          transform: translateY(-6px);
        }
        .welcome-brand-title {
          font-size: 44px;
          line-height: 1.05;
          font-weight: 800;
          color: #f7f7f7;
          margin-top: 18px;
          letter-spacing: -0.6px;
        }
        .welcome-brand-sub {
          color: #d9d9d9;
          margin-top: 12px;
          font-size: 15.5px;
          line-height: 1.6;
          max-width: 540px;
        }
        .welcome-brand-actions {
          margin-top: 28px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
        }
        .welcome-hero-visuals {
          position: relative;
          height: 380px;
          min-width: 520px;
        }
        .welcome-hero-card {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.45);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          overflow: hidden;
        }
        .welcome-hero-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.9;
          filter: saturate(0.9) brightness(0.85);
        }
        .welcome-mission-strip {
          position: relative;
          z-index: 3;
          margin-top: 24px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          max-width: 1380px;
        }
        .welcome-mission-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 18px;
          backdrop-filter: saturate(1.2);
          transition: transform 0.4s ease, border-color 0.4s ease;
        }
        .welcome-mission-card:hover {
          transform: translateY(-3px);
          border-color: rgba(255,255,255,0.2);
        }
        .welcome-mission-label {
          margin-top: 14px;
          font-weight: 650;
          color: #f6f6f6;
          font-size: 14px;
          letter-spacing: 0.2px;
        }
        .welcome-mission-desc {
          margin-top: 6px;
          color: #c1c1c1;
          font-size: 12px;
          line-height: 1.5;
        }
        .welcome-recheck-btn {
          background: rgba(255,255,255,0.06);
          color: #ececec;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 999px;
        }
        .welcome-recheck-btn:hover {
          background: rgba(255,255,255,0.09);
        }
      `}</style>

      <div className="welcome-landing">
        <video
          className="welcome-bg-video"
          src={SPLASH_BG}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
        />
        <div className="welcome-bg-overlay" />
        <div className="welcome-bg-texture" />

        <div className="welcome-landing-shell">
          <div className="welcome-landing-content">
            <div>
              <div className="welcome-logo-anchor">
                <OceanLogo size={52} />
              </div>
              <div className="welcome-brand-title">The desktop runtime for OceanOS Agent</div>
              <div className="welcome-brand-sub">
                One installation. One desktop: chat, agents, skills marketplace, schedules, models,
                profiles, memory, and tools.
              </div>
              <div className="welcome-brand-actions">
                <button className="btn btn-primary welcome-button" onClick={onStart}>
                  Get started <ArrowRight size={16} />
                </button>
                <button className="btn-ghost welcome-recheck-btn" onClick={onRecheck}>
                  Re-check install
                </button>
              </div>
            </div>
            <div className="welcome-hero-visuals">
              <div className="welcome-hero-card">
                <img src={HERO_IMAGE} alt="OceanOS surface" />
              </div>
            </div>
          </div>

          <div className="welcome-mission-strip">
            {[
              {
                title: "Mission Control",
                desc: "Config, chat, automation, marketplace, agents, memory, and tools unified.",
                src: HERO_IMAGE,
              },
              {
                title: "Marketplace",
                desc: "Browse skills, agents, and workflows from the community.",
                src: SIDE_IMAGE,
              },
              {
                title: "Secure runtime",
                desc: "Sandboxed installation, guardrails, and layered intent checks.",
                src: SIDE_IMAGE,
              },
            ].map((c) => (
              <div className="welcome-mission-card" key={c.title}>
                <img
                  src={c.src}
                  alt={c.title}
                  style={{ width: "100%", height: "120px", objectFit: "cover", borderRadius: 10, opacity: 0.9 }}
                />
                <div className="welcome-mission-label">{c.title}</div>
                <div className="welcome-mission-desc">{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Welcome;
