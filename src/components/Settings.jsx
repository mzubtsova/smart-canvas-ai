import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, CheckCircle, HelpCircle, Info, Trash2, Server } from 'lucide-react';

const BRAZE_ENDPOINTS = [
  { value: 'rest.iad-01.braze.com', label: 'US-01 (rest.iad-01.braze.com)' },
  { value: 'rest.iad-02.braze.com', label: 'US-02 (rest.iad-02.braze.com)' },
  { value: 'rest.iad-03.braze.com', label: 'US-03 (rest.iad-03.braze.com)' },
  { value: 'rest.iad-05.braze.com', label: 'US-05 (rest.iad-05.braze.com)' },
  { value: 'rest.iad-06.braze.com', label: 'US-06 (rest.iad-06.braze.com)' },
  { value: 'rest.iad-08.braze.com', label: 'US-08 (rest.iad-08.braze.com)' },
  { value: 'rest.eu-rest-01.braze.com', label: 'EU-01 (rest.eu-rest-01.braze.com)' },
  { value: 'rest.eu-rest-02.braze.com', label: 'EU-02 (rest.eu-rest-02.braze.com)' },
];

export default function Settings({ apiKey, setApiKey }) {
  // Gemini State
  const [keyInput, setKeyInput] = useState(apiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  // Braze State
  const [brazeKeyInput, setBrazeKeyInput] = useState('');
  const [brazeEndpointInput, setBrazeEndpointInput] = useState('rest.iad-01.braze.com');
  const [showBrazeKey, setShowBrazeKey] = useState(false);
  const [brazeSaveStatus, setBrazeSaveStatus] = useState('');

  // Load saved Braze credentials on mount
  useEffect(() => {
    const savedBrazeKey = localStorage.getItem('braze_api_key') || '';
    const savedBrazeEndpoint = localStorage.getItem('braze_api_endpoint') || 'rest.iad-01.braze.com';
    setBrazeKeyInput(savedBrazeKey);
    setBrazeEndpointInput(savedBrazeEndpoint);
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    const cleanKey = keyInput.trim();
    localStorage.setItem('gemini_api_key', cleanKey);
    setApiKey(cleanKey);
    setSaveStatus('success');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const handleClear = () => {
    localStorage.removeItem('gemini_api_key');
    setKeyInput('');
    setApiKey('');
    setSaveStatus('cleared');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const handleBrazeSave = (e) => {
    e.preventDefault();
    const cleanKey = brazeKeyInput.trim();
    localStorage.setItem('braze_api_key', cleanKey);
    localStorage.setItem('braze_api_endpoint', brazeEndpointInput);
    setBrazeSaveStatus('success');
    setTimeout(() => setBrazeSaveStatus(''), 3000);
  };

  const handleBrazeClear = () => {
    localStorage.removeItem('braze_api_key');
    localStorage.removeItem('braze_api_endpoint');
    setBrazeKeyInput('');
    setBrazeEndpointInput('rest.iad-01.braze.com');
    setBrazeSaveStatus('cleared');
    setTimeout(() => setBrazeSaveStatus(''), 3000);
  };

  return (
    <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Gemini Settings Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div className="sidebar-logo-icon" style={{ background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)' }}>
              <Key size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem' }}>Gemini API Settings</h2>
              <p className="header-title-desc">Configure your API Key for real-time generation</p>
            </div>
          </div>

          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label" htmlFor="api-key">Gemini API Key</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  id="api-key"
                  type={showKey ? 'text' : 'password'}
                  className="form-input"
                  placeholder="AIzaSy..."
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  style={{ paddingRight: '3rem', fontFamily: 'monospace' }}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                Save Gemini Key
              </button>
              {apiKey && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleClear}
                  style={{ color: 'var(--error)' }}
                >
                  <Trash2 size={16} /> Delete Key
                </button>
              )}
            </div>
          </form>

          {saveStatus === 'success' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: 'var(--border-radius-md)',
              color: 'var(--success)',
              fontSize: '0.85rem'
            }}>
              <CheckCircle size={14} /> Gemini API Key saved. **Live AI mode** active.
            </div>
          )}

          {saveStatus === 'cleared' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              borderRadius: 'var(--border-radius-md)',
              color: 'var(--warning)',
              fontSize: '0.85rem'
            }}>
              <Info size={14} /> Gemini Key deleted. Running in **Simulated Mode**.
            </div>
          )}
        </div>

        {/* Instructions Panel */}
        <div className="panel" style={{ backgroundColor: 'rgba(99, 102, 241, 0.02)', borderColor: 'rgba(99, 102, 241, 0.1)' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <HelpCircle size={20} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: '0.1rem' }} />
            <div>
              <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>How to get a free Gemini API Key?</h3>
              <ol style={{
                paddingLeft: '1.25rem',
                color: 'var(--text-secondary)',
                fontSize: '0.825rem',
                lineHeight: '1.6',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem'
              }}>
                <li>Go to <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-tertiary)', textDecoration: 'none' }}>Google AI Studio</a>.</li>
                <li>Click **"Get API key"** in the top left.</li>
                <li>Click **"Create API key"** and copy the code.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Braze Settings Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div className="sidebar-logo-icon" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' }}>
              <Server size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem' }}>Braze Integration Settings</h2>
              <p className="header-title-desc">Configure credentials to export templates to Braze</p>
            </div>
          </div>

          <form onSubmit={handleBrazeSave}>
            <div className="form-group">
              <label className="form-label" htmlFor="braze-key">Braze REST API Key</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  id="braze-key"
                  type={showBrazeKey ? 'text' : 'password'}
                  className="form-input"
                  placeholder="braze-rest-api-key-here..."
                  value={brazeKeyInput}
                  onChange={(e) => setBrazeKeyInput(e.target.value)}
                  style={{ paddingRight: '3rem', fontFamily: 'monospace' }}
                />
                <button
                  type="button"
                  onClick={() => setShowBrazeKey(!showBrazeKey)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showBrazeKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="braze-endpoint">Braze REST Endpoint</label>
              <select
                id="braze-endpoint"
                className="form-select"
                value={brazeEndpointInput}
                onChange={(e) => setBrazeEndpointInput(e.target.value)}
              >
                {BRAZE_ENDPOINTS.map((endpoint) => (
                  <option key={endpoint.value} value={endpoint.value}>
                    {endpoint.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1, background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)', boxShadow: '0 0 20px rgba(6, 182, 212, 0.15)' }}>
                Save Braze Config
              </button>
              {localStorage.getItem('braze_api_key') && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleBrazeClear}
                  style={{ color: 'var(--error)' }}
                >
                  <Trash2 size={16} /> Clear Config
                </button>
              )}
            </div>
          </form>

          {brazeSaveStatus === 'success' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: 'var(--border-radius-md)',
              color: 'var(--success)',
              fontSize: '0.85rem'
            }}>
              <CheckCircle size={14} /> Braze settings saved. **Live Export active**.
            </div>
          )}

          {brazeSaveStatus === 'cleared' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              borderRadius: 'var(--border-radius-md)',
              color: 'var(--warning)',
              fontSize: '0.85rem'
            }}>
              <Info size={14} /> Braze credentials cleared. Exports will run in **Simulated Mode**.
            </div>
          )}
        </div>

        {/* Instructions Panel */}
        <div className="panel" style={{ backgroundColor: 'rgba(6, 182, 212, 0.02)', borderColor: 'rgba(6, 182, 212, 0.1)' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <HelpCircle size={20} style={{ color: 'var(--accent-tertiary)', flexShrink: 0, marginTop: '0.1rem' }} />
            <div>
              <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>How to get a Braze REST API Key?</h3>
              <ul style={{
                paddingLeft: '1.25rem',
                color: 'var(--text-secondary)',
                fontSize: '0.825rem',
                lineHeight: '1.6',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem'
              }}>
                <li>Go to Braze Dashboard $\rightarrow$ **Settings** $\rightarrow$ **API Settings**.</li>
                <li>Under REST API Keys, click **"Create New API Key"**.</li>
                <li>Enable the **`templates.email.create`** permission scope.</li>
                <li>Copy the key and save it here. You must also select your correct instance cluster (e.g. US-01, EU-01) from the dropdown.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
