import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface RegistryItem {
  name: string;
  description?: string;
  version?: string;
  tags?: string[];
}

interface LocalSkill {
  name: string;
  description: string;
  category: string;
  path: string;
}

interface TauriResponse<T> {
  ok: boolean;
  data: T;
}

export default function Marketplace(): React.ReactElement {
  const [remoteItems, setRemoteItems] = useState<RegistryItem[]>([]);
  const [localSkills, setLocalSkills] = useState<LocalSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const loadData = async () => {
      try {
        const res = await fetch('http://localhost:8000/skills');
        if (res.ok) {
          const json = await res.json();
          if (!cancelled) setRemoteItems(json.items ?? []);
        }
      } catch {}

      try {
        const response = await invoke<TauriResponse<LocalSkill[]>>('discover_local_skills');
        if (!cancelled && response.ok) {
          setLocalSkills(response.data);
        }
      } catch (err) {
        console.error('Failed to load local skills:', err);
      }

      if (!cancelled) setLoading(false);
    };

    loadData();
    return () => { cancelled = true; };
  }, []);

  const testStripe = async () => {
    setTestResult(null);
    try {
      const response = await invoke<{ checkout_url: string }>('create_stripe_checkout', {
        req: {
          price_id: "price_1YourTestPriceID", // Replace with real test Price ID
          user_id: "user_123",
        }
      });

      // Open Stripe Checkout
      window.open(response.checkout_url, '_blank');
      setTestResult("Checkout opened successfully!");
    } catch (err: any) {
      setTestResult("Error: " + (err.message || err));
    }
  };

  if (loading) {
    return (
      <div className="marketplace">
        <div className="page-header"><h1>Marketplace</h1></div>
        <div className="empty-state">Loading skills...</div>
      </div>
    );
  }

  return (
    <div className="marketplace">
      <div className="page-header"><h1>Marketplace</h1></div>

      {error && <div className="empty-state error">{error}</div>}

      {/* Local Skills */}
      <div className="skills-section">
        <h2>Local Skills ({localSkills.length})</h2>
        {localSkills.length > 0 ? (
          <div className="skills-grid">
            {localSkills.map((skill, idx) => (
              <div className="skill-card local" key={`${skill.name}-${idx}`}>
                <div className="skill-name">{skill.name}</div>
                <div className="skill-desc">{skill.description}</div>
                <div className="skill-meta">
                  <span className="tag">local</span>
                  <span className="tag muted">{skill.category}</span>
                </div>
                <div className="skill-path" style={{ fontSize: '11px', opacity: 0.6, marginTop: '6px' }}>
                  {skill.path}
                </div>

                {skill.name === 'stripe' && (
                  <button 
                    onClick={testStripe}
                    style={{ marginTop: '10px', padding: '6px 12px', background: '#00c853', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Test Stripe
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">No local skills found.</div>
        )}
      </div>

      {/* Remote Skills */}
      <div className="skills-section">
        <h2>Remote / Bundled ({remoteItems.length})</h2>
        {remoteItems.length > 0 ? (
          <div className="skills-grid">
            {remoteItems.map((item, idx) => (
              <div className="skill-card" key={`${item.name}-${item.version ?? '0'}-${idx}`}>
                <div className="skill-name">{item.name}</div>
                <div className="skill-desc">{item.description ?? ''}</div>
                <div className="skill-meta">
                  {item.version && <span className="tag">{item.version}</span>}
                  {(item.tags ?? []).slice(0, 3).map((tag) => (
                    <span className="tag muted" key={tag}>{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">No remote skills available.</div>
        )}
      </div>

      {testResult && (
        <div className="test-result" style={{ marginTop: '20px', padding: '15px', background: '#1e1e1e', borderRadius: '6px' }}>
          <h3>Test Result</h3>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '13px' }}>{testResult}</pre>
        </div>
      )}
    </div>
  );
}
