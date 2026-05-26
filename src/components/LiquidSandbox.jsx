import React, { useState, useEffect } from 'react';
import { parseLiquid } from '../utils/liquidParser';
import { Code2, Database, Eye, AlertTriangle, RefreshCw, Sparkles } from 'lucide-react';

const MOCK_PROFILES = [
  {
    name: "Alice (VIP Gold)",
    description: "Loyal customer with a favorite flavor & high points balance.",
    tagClass: "tag-gold",
    tagText: "Gold VIP",
    data: {
      user: {
        first_name: "Alice",
        is_vip: true,
        membership_tier: "Gold",
        points_balance: 1250,
        favorite_flavor: "Oreo Cookie",
        points_needed: 0
      }
    }
  },
  {
    name: "Bob (Silver Tier)",
    description: "Mid-tier member with a different favorite flavor.",
    tagClass: "tag-silver",
    tagText: "Silver",
    data: {
      user: {
        first_name: "Bob",
        is_vip: false,
        membership_tier: "Silver",
        points_balance: 350,
        favorite_flavor: "Mint Chocolate Chip",
        points_needed: 150
      }
    }
  },
  {
    name: "Charlie (New User)",
    description: "Unauthenticated name and no favorite flavor set.",
    tagClass: "tag-standard",
    tagText: "Standard",
    data: {
      user: {
        first_name: "",
        is_vip: false,
        membership_tier: "Standard",
        points_balance: 0,
        favorite_flavor: "",
        points_needed: 500
      }
    }
  }
];

const DEFAULT_CODE = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: sans-serif; background-color: #0f172a; padding: 20px; color: #f8fafc; margin: 0; }
    .card { background-color: #1e293b; border-radius: 12px; padding: 30px; border: 1px solid #334155; text-align: center; }
    h1 { color: #f8fafc; margin-bottom: 10px; }
    p { color: #94a3b8; }
    .badge { display: inline-block; padding: 6px 12px; background-color: #6366f1; border-radius: 6px; font-weight: bold; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Welcome, {{ user.first_name | default: "Valued Customer" }}!</h1>
    
    {% if user.is_vip %}
      <div class="badge">👑 VIP PLATINUM MEMBER</div>
      <p>Enjoy your premium 15% discount code: <strong>VIP15OFF</strong></p>
    {% else %}
      <div class="badge">⭐ LOYALTY MEMBER</div>
      <p>You have <strong>{{ user.points_balance | default: "0" }}</strong> points. Earn {{ user.points_needed | default: "100" }} more points to upgrade to VIP!</p>
    {% endif %}

    {% if user.favorite_flavor %}
      <p>🍦 P.S. We noticed your favorite flavor is <strong>{{ user.favorite_flavor }}</strong>. Come try our new seasonal twist today!</p>
    {% endif %}
  </div>
</body>
</html>`;

export default function LiquidSandbox({ campaignData, setCampaignData, triggerToast }) {
  // Use campaign HTML if available, otherwise fallback to default
  const [code, setCode] = useState(campaignData.emailTemplateHtml || DEFAULT_CODE);
  const [activeProfileIdx, setActiveProfileIdx] = useState(0);
  const [jsonText, setJsonText] = useState(JSON.stringify(MOCK_PROFILES[0].data, null, 2));
  const [parsedHtml, setParsedHtml] = useState('');
  const [jsonError, setJsonError] = useState('');

  // Update current code when shared campaignData changes
  useEffect(() => {
    if (campaignData.emailTemplateHtml) {
      setCode(campaignData.emailTemplateHtml);
    }
  }, [campaignData.emailTemplateHtml]);

  // Sync JSON text when active profile selection changes
  const selectProfile = (idx) => {
    setActiveProfileIdx(idx);
    setJsonText(JSON.stringify(MOCK_PROFILES[idx].data, null, 2));
    setJsonError('');
    triggerToast(`Applied mock profile: ${MOCK_PROFILES[idx].name}`);
  };

  // Re-evaluate template whenever code, json text, or JSON validation status changes
  useEffect(() => {
    try {
      const parsedContext = JSON.parse(jsonText);
      setJsonError('');
      
      // Update local setCampaignData structure so other components can fetch the latest sandbox code
      setCampaignData(prev => ({
        ...prev,
        emailTemplateHtml: code
      }));

      // Parse HTML with Liquid engine
      const rendered = parseLiquid(code, parsedContext);
      setParsedHtml(rendered);
    } catch (e) {
      if (e instanceof SyntaxError) {
        setJsonError('Invalid JSON structure');
      } else {
        console.error(e);
      }
    }
  }, [code, jsonText]);

  const handleJsonChange = (val) => {
    setJsonText(val);
  };

  const resetTemplate = () => {
    if (window.confirm("Reset editor to default template?")) {
      setCode(DEFAULT_CODE);
      triggerToast("Reset editor to default.");
    }
  };

  return (
    <div className="fade-in split-view-triple" style={{ flex: 1, height: 'calc(100vh - 12rem)', minHeight: '550px' }}>
      
      {/* Panel 1: Code Editor */}
      <div className="editor-container">
        <div className="editor-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Code2 size={16} style={{ color: 'var(--accent-primary)' }} />
            <span className="editor-title">HTML & Liquid Editor</span>
          </div>
          <button 
            onClick={resetTemplate} 
            className="btn btn-secondary" 
            style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', borderColor: 'transparent' }}
          >
            Reset
          </button>
        </div>
        <textarea
          className="editor-textarea"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Write your HTML and Liquid tags here..."
          style={{ border: 'none', borderRadius: '0' }}
        />
      </div>

      {/* Panel 2: User Profiles & JSON Editor */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '520px' }}>
        
        {/* Profile Selector */}
        <div className="panel" style={{ padding: '1rem', overflowY: 'auto', flex: '1.2' }}>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Database size={14} style={{ color: 'var(--accent-secondary)' }} />
            Mock Profiles
          </h4>
          <div style={{ maxHeight: '190px', overflowY: 'auto' }}>
            {MOCK_PROFILES.map((profile, idx) => (
              <div
                key={idx}
                className={`profile-pill ${activeProfileIdx === idx ? 'active' : ''}`}
                onClick={() => selectProfile(idx)}
              >
                <div style={{ marginRight: '0.5rem' }}>
                  <div className="profile-name">{profile.name}</div>
                  <div className="profile-desc">{profile.description}</div>
                </div>
                <span className={`profile-tag ${profile.tagClass}`}>
                  {profile.tagText}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* JSON Editor Box */}
        <div className="editor-container" style={{ flex: '1' }}>
          <div className="editor-header">
            <span className="editor-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Database size={12} />
              JSON Variables Context
            </span>
            {jsonError && (
              <span style={{ fontSize: '0.75rem', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <AlertTriangle size={12} />
                {jsonError}
              </span>
            )}
          </div>
          <textarea
            className="editor-textarea"
            value={jsonText}
            onChange={(e) => handleJsonChange(e.target.value)}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              backgroundColor: '#06060a',
              border: 'none',
              borderRadius: '0'
            }}
          />
        </div>
      </div>

      {/* Panel 3: Live Preview Render */}
      <div className="preview-container">
        <div className="preview-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Eye size={16} />
            <span className="preview-title">Personalized Preview</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span>Live Rendering</span>
            <span className="indicator" style={{ backgroundColor: 'var(--success)', width: '6px', height: '6px' }}></span>
          </div>
        </div>
        
        {jsonError ? (
          <div style={{
            flex: 1,
            backgroundColor: '#0f172a',
            color: 'var(--text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center',
            gap: '0.75rem'
          }}>
            <AlertTriangle size={32} style={{ color: 'var(--warning)' }} />
            <h4>Cannot render preview</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '240px' }}>
              Fix the syntax errors in your JSON variables context panel to resume live updates.
            </p>
          </div>
        ) : (
          <iframe
            title="Liquid Live Render Preview"
            className="preview-frame"
            srcDoc={parsedHtml}
          />
        )}
      </div>

    </div>
  );
}
