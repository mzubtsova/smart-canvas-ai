import React, { useState, useEffect } from 'react';
import { parseLiquid } from '../utils/liquidParser';
import { exportTemplateToBraze } from '../services/braze';
import { Code2, Database, Eye, AlertTriangle, RefreshCw, Sparkles, Send, X, Loader2, Server, Info } from 'lucide-react';

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

export default function LiquidSandbox({ campaignData, setCampaignData, variablesList, triggerToast }) {
  const [code, setCode] = useState(campaignData.emailTemplateHtml || DEFAULT_CODE);
  const [activeProfileIdx, setActiveProfileIdx] = useState(0);
  const [jsonText, setJsonText] = useState(JSON.stringify(MOCK_PROFILES[0].data, null, 2));
  const [parsedHtml, setParsedHtml] = useState('');
  const [jsonError, setJsonError] = useState('');

  // Braze Export Modal State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportName, setExportName] = useState('SmartCanvas Campaign Template');
  const [exportSubject, setExportSubject] = useState(campaignData.subjectLineA || 'Special Offer for You!');
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  
  const hasBrazeKey = !!localStorage.getItem('braze_api_key');

  // Update current code when shared campaignData changes
  useEffect(() => {
    if (campaignData.emailTemplateHtml) {
      setCode(campaignData.emailTemplateHtml);
    }
    if (campaignData.subjectLineA) {
      setExportSubject(campaignData.subjectLineA);
    }
  }, [campaignData.emailTemplateHtml, campaignData.subjectLineA]);

  // Helper to inject missing customization variables into profile JSON
  const syncCustomVariables = (jsonStr, varsList) => {
    try {
      const obj = JSON.parse(jsonStr);
      let modified = false;

      varsList.forEach(variable => {
        const parts = variable.id.split('.');
        let current = obj;

        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          if (i === parts.length - 1) {
            if (current[part] === undefined) {
              if (part.includes('points') || part.includes('balance') || part.includes('count') || part.includes('needed') || part.includes('multiplier')) {
                current[part] = 100;
              } else if (part.includes('is_') || part.includes('has_') || part.includes('vip')) {
                current[part] = true;
              } else {
                current[part] = `[${part.replace(/_/g, ' ')}]`;
              }
              modified = true;
            }
          } else {
            if (current[part] === undefined || typeof current[part] !== 'object') {
              current[part] = {};
              modified = true;
            }
            current = current[part];
          }
        }
      });

      if (modified) {
        return JSON.stringify(obj, null, 2);
      }
    } catch (e) {
      // Ignore JSON parsing errors
    }
    return jsonStr;
  };

  // Sync variables list to JSON editor
  useEffect(() => {
    setJsonText(prev => syncCustomVariables(prev, variablesList));
  }, [variablesList, activeProfileIdx]);

  // Sync JSON text when active profile selection changes
  const selectProfile = (idx) => {
    setActiveProfileIdx(idx);
    setJsonText(JSON.stringify(MOCK_PROFILES[idx].data, null, 2));
    setJsonError('');
    triggerToast(`Applied mock profile: ${MOCK_PROFILES[idx].name}`);
  };

  // Re-evaluate template whenever code or json text changes
  useEffect(() => {
    try {
      const parsedContext = JSON.parse(jsonText);
      setJsonError('');
      
      setCampaignData(prev => ({
        ...prev,
        emailTemplateHtml: code
      }));

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

  const handleOpenExport = () => {
    setExportError('');
    // Dynamically set default template name based on context
    const timestamp = new Date().toLocaleDateString();
    setExportName(`SmartCanvas Campaign - ${timestamp}`);
    setExportSubject(campaignData.subjectLineA || 'Special Offer for You!');
    setShowExportModal(true);
  };

  const handleConfirmExport = async (e) => {
    e.preventDefault();
    if (!exportName.trim() || !exportSubject.trim()) return;

    setIsExporting(true);
    setExportError('');

    try {
      const apiKey = localStorage.getItem('braze_api_key');
      const endpoint = localStorage.getItem('braze_api_endpoint') || 'rest.iad-01.braze.com';

      const result = await exportTemplateToBraze({
        templateName: exportName,
        subject: exportSubject,
        body: code,
        apiKey,
        endpoint
      });

      if (result.success) {
        setShowExportModal(false);
        if (result.simulated) {
          triggerToast(`Simulated Export Successful! (Template ID: ${result.templateId})`);
        } else {
          triggerToast(`Successfully exported template to Braze! (ID: ${result.templateId})`);
        }
      }
    } catch (err) {
      console.error(err);
      setExportError(err.message || "Failed to export template to Braze.");
    } finally {
      setIsExporting(false);
    }
  };

  const insertTagAtCursor = (tagId) => {
    const textarea = document.getElementById('sandbox-html-editor');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const insertText = `{{ ${tagId} }}`;
    const newText = text.substring(0, start) + insertText + text.substring(end);

    setCode(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + insertText.length, start + insertText.length);
    }, 50);
  };

  return (
    <div className="fade-in split-view-triple" style={{ flex: 1, height: 'calc(100vh - 12rem)', minHeight: '550px', position: 'relative' }}>
      
      {/* Panel 1: Code Editor */}
      <div className="editor-container">
        <div className="editor-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Code2 size={16} style={{ color: 'var(--accent-primary)' }} />
            <span className="editor-title">HTML & Liquid Editor</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={handleOpenExport}
              className="btn btn-success" 
              style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <Send size={12} /> Export to Braze
            </button>
            <button 
              onClick={resetTemplate} 
              className="btn btn-secondary" 
              style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', borderColor: 'transparent' }}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Quick-Insert Pill Buttons */}
        <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Click tag to insert at cursor:</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', maxHeight: '60px', overflowY: 'auto' }}>
            {variablesList.map(tag => (
              <button
                key={tag.id}
                type="button"
                onClick={() => insertTagAtCursor(tag.id)}
                className="btn btn-secondary"
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', textTransform: 'none', background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.1)', cursor: 'pointer' }}
              >
                {tag.id}
              </button>
            ))}
          </div>
        </div>

        <textarea
          id="sandbox-html-editor"
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

      {/* Export to Braze Overlay Modal */}
      {showExportModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="panel fade-in" style={{
            width: '100%',
            maxWidth: '500px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            position: 'relative'
          }}>
            <button 
              onClick={() => setShowExportModal(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Server size={18} style={{ color: 'var(--success)' }} />
              <h3 style={{ fontSize: '1.15rem' }}>Export HTML Template to Braze</h3>
            </div>

            {/* Notification if simulated */}
            {!hasBrazeKey && (
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                padding: '0.75rem',
                backgroundColor: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.15)',
                borderRadius: 'var(--border-radius-sm)',
                color: 'var(--warning)',
                fontSize: '0.8rem',
                lineHeight: '1.4',
                marginBottom: '1.25rem'
              }}>
                <Info size={14} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                <span>
                  **Demo Mode**: No Braze REST credentials saved. The app will perform a **simulated export** for interview presentation purposes. To connect to your real workspace, set keys in Settings.
                </span>
              </div>
            )}

            <form onSubmit={handleConfirmExport}>
              <div className="form-group">
                <label className="form-label" htmlFor="export-name">Template Name (in Braze)</label>
                <input
                  id="export-name"
                  type="text"
                  className="form-input"
                  value={exportName}
                  onChange={(e) => setExportName(e.target.value)}
                  placeholder="E.g., SmartCanvas Win-back v1"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="export-subject">Email Subject Line</label>
                <input
                  id="export-subject"
                  type="text"
                  className="form-input"
                  value={exportSubject}
                  onChange={(e) => setExportSubject(e.target.value)}
                  placeholder="Subject line text..."
                  required
                />
              </div>

              {exportError && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  backgroundColor: 'rgba(244,63,94,0.1)',
                  border: '1px solid rgba(244,63,94,0.2)',
                  borderRadius: 'var(--border-radius-sm)',
                  color: 'var(--error)',
                  fontSize: '0.85rem',
                  marginBottom: '1.25rem'
                }}>
                  <AlertTriangle size={14} />
                  <span>{exportError}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowExportModal(false)}
                  style={{ flex: 1 }}
                  disabled={isExporting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1 }}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="spin" size={16} /> Exporting...
                    </>
                  ) : (
                    <>
                      Confirm Export <Send size={14} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
