import React, { useState } from 'react';
import { generateCampaign } from '../services/gemini';
import { Sparkles, Copy, ArrowRight, CheckCircle, Mail, MessageSquare, Code, Loader2 } from 'lucide-react';

export default function CampaignCopilot({ apiKey, campaignData, setCampaignData, triggerToast, setActiveTab }) {
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

  const variablesList = [
    { id: 'user.first_name', label: 'First Name' },
    { id: 'user.membership_tier', label: 'Membership Tier' },
    { id: 'user.points_balance', label: 'Points Balance' },
    { id: 'user.favorite_flavor', label: 'Favorite Flavor' },
    { id: 'user.points_needed', label: 'Points Needed' }
  ];

  const handleCheckboxChange = (id) => {
    if (selectedVariables.includes(id)) {
      setSelectedVariables(selectedVariables.filter(v => v !== id));
    } else {
      setSelectedVariables([...selectedVariables, id]);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!objective.trim()) return;
    
    setIsLoading(true);
    try {
      const result = await generateCampaign({
        objective,
        voice,
        variables: selectedVariables
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
            
            <div className="form-group">
              <label className="form-label" htmlFor="voice">Brand Voice & Tone</label>
              <select
                id="voice"
                className="form-select"
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
              >
                <option value="Playful">🍦 Playful & Fun (e.g. Dairy Queen)</option>
                <option value="Bold">⚡ Bold & Urgent (e.g. Flash Sale)</option>
                <option value="Professional">💼 Professional & Direct</option>
                <option value="Warm">❤️ Warm & Empathetic</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Personalization Tags (Liquid)</label>
              <div className="form-checkbox-group">
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ padding: '1.25rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>Variant A (Direct Value)</span>
                        <button onClick={() => handleCopy(campaignData.subjectLineA, 'Subject Line A')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                          <Copy size={16} />
                        </button>
                      </div>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: '#fff' }}>{campaignData.subjectLineA}</p>
                    </div>

                    <div style={{ padding: '1.25rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-secondary)', textTransform: 'uppercase' }}>Variant B (Personalized/Curious)</span>
                        <button onClick={() => handleCopy(campaignData.subjectLineB, 'Subject Line B')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                          <Copy size={16} />
                        </button>
                      </div>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: '#fff' }}>{campaignData.subjectLineB}</p>
                    </div>
                  </div>
                )}

                {activeSubTab === 'push' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ padding: '1.25rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>Variant A</span>
                        <button onClick={() => handleCopy(campaignData.pushNotificationA, 'Push Variant A')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                          <Copy size={16} />
                        </button>
                      </div>
                      <p style={{ fontSize: '0.95rem', color: '#fff' }}>{campaignData.pushNotificationA}</p>
                    </div>

                    <div style={{ padding: '1.25rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-secondary)', textTransform: 'uppercase' }}>Variant B</span>
                        <button onClick={() => handleCopy(campaignData.pushNotificationB, 'Push Variant B')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                          <Copy size={16} />
                        </button>
                      </div>
                      <p style={{ fontSize: '0.95rem', color: '#fff' }}>{campaignData.pushNotificationB}</p>
                    </div>
                  </div>
                )}

                {activeSubTab === 'html' && (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                        className="editor-textarea"
                        readOnly
                        value={campaignData.emailTemplateHtml}
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
