import React, { useState } from 'react';
import { Key, Eye, EyeOff, CheckCircle, HelpCircle, Info, Trash2 } from 'lucide-react';

export default function Settings({ apiKey, setApiKey }) {
  const [keyInput, setKeyInput] = useState(apiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

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

  return (
    <div className="fade-in" style={{ maxWidth: '650px', margin: '0 auto' }}>
      <div className="panel" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div className="sidebar-logo-icon" style={{ background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)' }}>
            <Key size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem' }}>Gemini API Settings</h2>
            <p className="header-title-desc">Configure your API Key to enable real-time AI generation</p>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div className="form-group" style={{ position: 'relative' }}>
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
              Save API Key
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
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: 'var(--border-radius-md)',
            color: 'var(--success)',
            fontSize: '0.9rem'
          }}>
            <CheckCircle size={16} /> API Key saved successfully. SmartCanvas is now in **Live AI mode**.
          </div>
        )}

        {saveStatus === 'cleared' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginTop: '1rem',
            padding: '0.75rem 1rem',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: 'var(--border-radius-md)',
            color: 'var(--warning)',
            fontSize: '0.9rem'
          }}>
            <Info size={16} /> API Key deleted. SmartCanvas is now running in **Simulated Mock mode**.
          </div>
        )}
      </div>

      <div className="panel" style={{ backgroundColor: 'rgba(99, 102, 241, 0.03)', borderColor: 'rgba(99, 102, 241, 0.1)' }}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <HelpCircle size={20} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: '0.1rem' }} />
          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>How to get a free Gemini API Key?</h3>
            <ol style={{
              paddingLeft: '1.25rem',
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
              lineHeight: '1.6',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <li>Go to <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-tertiary)', textDecoration: 'none' }}>Google AI Studio</a>.</li>
              <li>Sign in with your Google account.</li>
              <li>Click the blue <strong>"Get API key"</strong> button in the top left.</li>
              <li>Click <strong>"Create API key"</strong>, search/select a Google Cloud project, and copy the generated key.</li>
              <li>Paste it into the form above and hit Save!</li>
            </ol>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              marginTop: '1rem',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              lineHeight: '1.4'
            }}>
              <Info size={14} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
              <span>
                Your API key is saved directly inside your browser's local storage and is never uploaded to any server. Calls are made directly to the official Google Gemini API from your machine.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
