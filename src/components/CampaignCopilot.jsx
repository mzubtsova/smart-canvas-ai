import React, { useState } from 'react';
import { generateCampaign } from '../services/gemini';
import { Sparkles, Copy, ArrowRight, CheckCircle, Mail, MessageSquare, Code, Loader2 } from 'lucide-react';

export default function CampaignCopilot({ apiKey, campaignData, setCampaignData, variablesList, setVariablesList, triggerToast, setActiveTab }) {
  const [objective, setObjective] = useState(
    "Win-back campaign for Dairy Queen customers who haven't ordered in 30 days. Highlight a free small Blizzard coupon and urge them to download the app."
  );
  const [voice, setVoice] = useState('Playful');
  const [selectedVariables, setSelectedVariables] = useState([
    'user.first_name',
    'user.favorite_flavor',
    'user.membership_tier'
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('subject');
  const [hasGenerated, setHasGenerated] = useState(!!campaignData.emailTemplateHtml);
  
  const [variantsCount, setVariantsCount] = useState(2);
  const [newTagName, setNewTagName] = useState('');

  const handleCheckboxChange = (id) => {
    if (selectedVariables.includes(id)) {
      setSelectedVariables(selectedVariables.filter(v => v !== id));
    } else {
      setSelectedVariables([...selectedVariables, id]);
    }
  };

  const handleAddCustomTag = (e) => {
    e?.preventDefault();
    let cleaned = newTagName.trim().toLowerCase();
    if (!cleaned) return;

    // Sanitize: allow lowercase letters, numbers, underscores, periods
    cleaned = cleaned.replace(/[^a-z0-9_\.]/g, '');
    if (!cleaned) {
      triggerToast("Invalid format! Use a-z, 0-9, underscores, and periods.");
      return;
    }

    // Default prefix if none is specified
    if (!cleaned.includes('.')) {
      cleaned = 'user.' + cleaned;
    }

    // Check duplicate
    if (variablesList.some(v => v.id === cleaned)) {
      triggerToast("Personalization tag already exists!");
      return;
    }

    const parts = cleaned.split('.');
    const baseName = parts[parts.length - 1];
    const label = baseName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());

    const newVar = { id: cleaned, label };
    setVariablesList([...variablesList, newVar]);
    setSelectedVariables([...selectedVariables, cleaned]);
    setNewTagName('');
    triggerToast(`Added custom tag: {{ ${cleaned} }}`);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!objective.trim()) return;
    
    setIsLoading(true);
    try {
      const result = await generateCampaign({
        objective,
        voice,
        variables: selectedVariables,
        variantsCount
      }, apiKey);
      
      setCampaignData(result);
      setHasGenerated(true);
      triggerToast("Campaign drafted successfully!");
    } catch (error) {
      console.error(error);
      triggerToast(`Error: ${error.message || "Failed to generate campaign"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    triggerToast(`Copied ${type} to clipboard!`);
  };

  const sendToSandbox = () => {
    setActiveTab('sandbox');
    triggerToast("Loaded HTML into Liquid Sandbox!");
  };

  const insertTagAtCursor = (tagId) => {
    const textarea = document.getElementById('copilot-html-editor');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const insertText = `{{ ${tagId} }}`;
    const newText = text.substring(0, start) + insertText + text.substring(end);

    setCampaignData(prev => ({
      ...prev,
      emailTemplateHtml: newText
    }));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + insertText.length, start + insertText.length);
    }, 50);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.9fr', gap: '2rem' }}>
        
        {/* Left Panel - Inputs Form */}
        <div className="panel" style={{ height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={16} style={{ color: 'var(--accent-primary)' }} />
            Campaign Parameters
          </h3>
          
          <form onSubmit={handleGenerate}>
            <div className="form-group">
              <label className="form-label" htmlFor="objective">Campaign Objective</label>
              <textarea
                id="objective"
                className="form-textarea"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="What is the goal of this campaign? E.g., Promote birthday discounts, re-engage cold users..."
                rows={4}
                required
              />
            </div>
            
            <div className="form-group-row" style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label className="form-label" htmlFor="voice">Brand Voice & Tone</label>
                <select
                  id="voice"
                  className="form-select"
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="Playful">🍦 Playful & Fun (e.g. DQ)</option>
                  <option value="Bold">⚡ Bold & Urgent</option>
                  <option value="Professional">💼 Professional</option>
                  <option value="Warm">❤️ Warm & Empathetic</option>
                </select>
              </div>

              <div>
                <label className="form-label" htmlFor="variants-count">Variants Count</label>
                <select
                  id="variants-count"
                  className="form-select"
                  value={variantsCount}
                  onChange={(e) => setVariantsCount(Number(e.target.value))}
                  style={{ width: '100%' }}
                >
                  <option value={2}>2 (A/B Test)</option>
                  <option value={10}>10 Options</option>
                  <option value={20}>20 Options</option>
                  <option value={50}>50 Options</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Personalization Tags (Liquid)</label>
              <div className="form-checkbox-group" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                {variablesList.map((variable) => (
                  <label key={variable.id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={selectedVariables.includes(variable.id)}
                      onChange={() => handleCheckboxChange(variable.id)}
                    />
                    {variable.label}
                  </label>
                ))}
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <input
                  type="text"
                  className="form-input"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="e.g. user.loyalty_tier"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', flex: 1 }}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleAddCustomTag}
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                >
                  + Add Tag
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1rem' }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="spin" size={16} /> Drafting Campaign...
                </>
              ) : (
                <>
                  Generate Campaign <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Panel - Generated Results */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', minHeight: '400px' }}>
          {!hasGenerated && !isLoading ? (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              textAlign: 'center',
              padding: '2rem'
            }}>
              <Sparkles size={48} style={{ color: 'var(--border-color)', marginBottom: '1rem' }} />
              <h4>Waiting for Generation</h4>
              <p style={{ fontSize: '0.875rem', marginTop: '0.25rem', maxWidth: '320px' }}>
                Fill out the campaign parameters on the left and click Generate to draft your AI-powered campaign elements.
              </p>
            </div>
          ) : isLoading ? (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              textAlign: 'center',
              padding: '2rem'
            }}>
              <Loader2 className="spin" size={48} style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }} />
              <h4>Gemini is thinking...</h4>
              <p style={{ fontSize: '0.875rem', marginTop: '0.25rem', maxWidth: '320px' }}>
                Writing optimized copy, crafting push messages, and coding a personalized Liquid HTML template.
              </p>
            </div>
          ) : (
            <div className="fade-in" style={{ display: 'flex', flex: 1, flexDirection: 'column' }}>
              <div className="tab-container">
                <button
                  className={`sub-tab ${activeSubTab === 'subject' ? 'active' : ''}`}
                  onClick={() => setActiveSubTab('subject')}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Mail size={14} /> Subject Lines
                </button>
                <button
                  className={`sub-tab ${activeSubTab === 'push' ? 'active' : ''}`}
                  onClick={() => setActiveSubTab('push')}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <MessageSquare size={14} /> Push Notifications
                </button>
                <button
                  className={`sub-tab ${activeSubTab === 'html' ? 'active' : ''}`}
                  onClick={() => setActiveSubTab('html')}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Code size={14} /> HTML Template
                </button>
              </div>

              {/* Subtab Contents */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {activeSubTab === 'subject' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                    {(campaignData.subjectLines && campaignData.subjectLines.length > 0
                      ? campaignData.subjectLines
                      : [campaignData.subjectLineA, campaignData.subjectLineB].filter(Boolean)
                    ).map((subject, idx) => {
                      const isEven = idx % 2 === 0;
                      const accentColor = isEven ? 'var(--accent-primary)' : 'var(--accent-secondary)';
                      return (
                        <div key={idx} style={{ padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: accentColor, textTransform: 'uppercase' }}>Option #{idx + 1}</span>
                            <button onClick={() => handleCopy(subject, `Subject Line #${idx + 1}`)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Copy size={14} /> <span style={{ fontSize: '0.7rem' }}>Copy</span>
                            </button>
                          </div>
                          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: '#fff', margin: 0 }}>{subject}</p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {activeSubTab === 'push' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                    {(campaignData.pushNotifications && campaignData.pushNotifications.length > 0
                      ? campaignData.pushNotifications
                      : [campaignData.pushNotificationA, campaignData.pushNotificationB].filter(Boolean)
                    ).map((push, idx) => {
                      const isEven = idx % 2 === 0;
                      const accentColor = isEven ? 'var(--accent-primary)' : 'var(--accent-secondary)';
                      return (
                        <div key={idx} style={{ padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: accentColor, textTransform: 'uppercase' }}>Option #{idx + 1}</span>
                            <button onClick={() => handleCopy(push, `Push Variant #${idx + 1}`)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Copy size={14} /> <span style={{ fontSize: '0.7rem' }}>Copy</span>
                            </button>
                          </div>
                          <p style={{ fontSize: '0.9rem', color: '#fff', margin: 0 }}>{push}</p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {activeSubTab === 'html' && (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    
                    {/* Quick-Insert Pill Buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Insert Personalization Tag at Cursor:</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', maxHeight: '60px', overflowY: 'auto' }}>
                        {selectedVariables.map(tagId => (
                          <button
                            key={tagId}
                            type="button"
                            onClick={() => insertTagAtCursor(tagId)}
                            className="btn btn-secondary"
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', textTransform: 'none', background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.1)', cursor: 'pointer' }}
                          >
                            {tagId}
                          </button>
                        ))}
                        {selectedVariables.length === 0 && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No tags selected. Select tags in parameters panel.</span>
                        )}
                      </div>
                    </div>

                    <div className="editor-container" style={{ height: '240px' }}>
                      <div className="editor-header">
                        <span className="editor-title">Responsive HTML with Liquid logic</span>
                        <button
                          onClick={() => handleCopy(campaignData.emailTemplateHtml, 'HTML Email Template')}
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        >
                          <Copy size={12} /> Copy Code
                        </button>
                      </div>
                      <textarea
                        id="copilot-html-editor"
                        className="editor-textarea"
                        value={campaignData.emailTemplateHtml}
                        onChange={(e) => setCampaignData(prev => ({ ...prev, emailTemplateHtml: e.target.value }))}
                        style={{ fontSize: '0.75rem', backgroundColor: '#060609' }}
                      />
                    </div>
                    
                    <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto' }}>
                      <button
                        onClick={sendToSandbox}
                        className="btn btn-success"
                        style={{ flex: 1 }}
                      >
                        <Code size={16} /> Send to Liquid Sandbox
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
