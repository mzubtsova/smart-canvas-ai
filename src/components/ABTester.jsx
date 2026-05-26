import React, { useState } from 'react';
import { simulateABTest } from '../services/gemini';
import { Users, AlertTriangle, Send, Loader2, Sparkles, Check, CheckCircle2 } from 'lucide-react';

export default function ABTester({ apiKey, campaignData, triggerToast }) {
  const [objective, setObjective] = useState(
    "Re-engage Dairy Queen customers who haven't ordered in 30 days."
  );
  
  const [subjectA, setSubjectA] = useState(campaignData.subjectLineA || '');
  const [copyA, setCopyA] = useState(campaignData.pushNotificationA || '');
  
  const [subjectB, setSubjectB] = useState(campaignData.subjectLineB || '');
  const [copyB, setCopyB] = useState(campaignData.pushNotificationB || '');

  const [isLoading, setIsLoading] = useState(false);
  const [simResults, setSimResults] = useState(null);

  const handleAutofill = () => {
    if (!campaignData.subjectLineA && !campaignData.subjectLineB) {
      triggerToast("No generated campaign found! Go to Campaign Copilot first.");
      return;
    }
    
    setSubjectA(campaignData.subjectLineA || '');
    setCopyA(campaignData.pushNotificationA || '');
    
    setSubjectB(campaignData.subjectLineB || '');
    setCopyB(campaignData.pushNotificationB || '');
    
    triggerToast("Autofilled copy variants from Campaign Copilot!");
  };

  const handleSimulate = async (e) => {
    e.preventDefault();
    if (!subjectA || !subjectB) {
      triggerToast("Please provide subject lines for both Variant A and Variant B.");
      return;
    }

    setIsLoading(true);
    try {
      const results = await simulateABTest({
        objective,
        subjectA,
        subjectB,
        copyA,
        copyB
      }, apiKey);
      
      setSimResults(results.personas || []);
      triggerToast("Simulation complete!");
    } catch (error) {
      console.error(error);
      triggerToast(`Simulation failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColorClass = (score) => {
    if (score >= 80) return 'score-high';
    if (score >= 50) return 'score-medium';
    return 'score-low';
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '2rem' }}>
        
        {/* Left Inputs Section */}
        <div className="panel" style={{ height: 'fit-content' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={16} style={{ color: 'var(--accent-secondary)' }} />
              Test Setup
            </h3>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleAutofill}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            >
              Autofill from Copilot
            </button>
          </div>

          <form onSubmit={handleSimulate}>
            <div className="form-group">
              <label className="form-label" htmlFor="sim-objective">Campaign Context / Product</label>
              <input
                id="sim-objective"
                type="text"
                className="form-input"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="E.g., Dairy Queen free Blizzard, clothing brand fall discount..."
                required
              />
            </div>

            {/* Variant A Card */}
            <div style={{
              padding: '1rem',
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--border-radius-md)',
              marginBottom: '1rem'
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.75rem' }}>
                Variant A
              </span>
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Subject Line</label>
                <input
                  type="text"
                  className="form-input"
                  value={subjectA}
                  onChange={(e) => setSubjectA(e.target.value)}
                  placeholder="Paste subject line A..."
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Push or Body Text (Optional)</label>
                <textarea
                  className="form-textarea"
                  value={copyA}
                  onChange={(e) => setCopyA(e.target.value)}
                  placeholder="Paste additional body/push notification copy..."
                  rows={2}
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem', minHeight: '60px' }}
                />
              </div>
            </div>

            {/* Variant B Card */}
            <div style={{
              padding: '1rem',
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--border-radius-md)',
              marginBottom: '1rem'
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.75rem' }}>
                Variant B
              </span>
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Subject Line</label>
                <input
                  type="text"
                  className="form-input"
                  value={subjectB}
                  onChange={(e) => setSubjectB(e.target.value)}
                  placeholder="Paste subject line B..."
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Push or Body Text (Optional)</label>
                <textarea
                  className="form-textarea"
                  value={copyB}
                  onChange={(e) => setCopyB(e.target.value)}
                  placeholder="Paste additional body/push notification copy..."
                  rows={2}
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem', minHeight: '60px' }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem' }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="spin" size={16} /> Simulating Audience...
                </>
              ) : (
                <>
                  Run A/B Simulation <Send size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Simulation Feedback */}
        <div className="panel" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
          {!simResults && !isLoading ? (
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
              <Users size={48} style={{ color: 'var(--border-color)', marginBottom: '1rem' }} />
              <h4>Simulate Target Audience Response</h4>
              <p style={{ fontSize: '0.875rem', marginTop: '0.25rem', maxWidth: '340px' }}>
                Define copy variants on the left, then click Simulate to run them by AI consumer profiles and compare predicted open score metrics.
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
              <Loader2 className="spin" size={48} style={{ color: 'var(--accent-secondary)', marginBottom: '1rem' }} />
              <h4>Assembling AI panel...</h4>
              <p style={{ fontSize: '0.875rem', marginTop: '0.25rem', maxWidth: '320px' }}>
                Simulating click and open decisions across diverse buyer persona profiles based on your campaign's context.
              </p>
            </div>
          ) : (
            <div className="fade-in" style={{ display: 'flex', flex: 1, flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={16} style={{ color: 'var(--accent-tertiary)' }} />
                A/B Simulator Audience Report
              </h3>
              
              <div className="persona-grid" style={{ flex: 1, overflowY: 'auto', maxHeight: '490px', paddingRight: '0.5rem' }}>
                {simResults.map((persona, index) => (
                  <div key={index} className="persona-card">
                    <div className="persona-header">
                      <div className="persona-avatar">
                        {persona.name.charAt(0)}
                      </div>
                      <div className="persona-info">
                        <h4>{persona.name}</h4>
                        <p>{persona.role}</p>
                      </div>
                    </div>

                    {/* Progress bars comparing A and B scores */}
                    <div style={{ margin: '1rem 0' }}>
                      <div style={{ marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem', fontWeight: 500 }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Variant A Open Chance</span>
                          <span className={getScoreColorClass(persona.scoreA)}>{persona.scoreA}%</span>
                        </div>
                        <div style={{ height: '6px', backgroundColor: 'var(--bg-primary)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${persona.scoreA}%`,
                            background: 'var(--accent-primary)',
                            borderRadius: '3px'
                          }}></div>
                        </div>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem', fontWeight: 500 }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Variant B Open Chance</span>
                          <span className={getScoreColorClass(persona.scoreB)}>{persona.scoreB}%</span>
                        </div>
                        <div style={{ height: '6px', backgroundColor: 'var(--bg-primary)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${persona.scoreB}%`,
                            background: 'var(--accent-secondary)',
                            borderRadius: '3px'
                          }}></div>
                        </div>
                      </div>
                    </div>

                    {/* Critique detail summaries */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                      <div className="critique-box" style={{ borderLeftColor: 'var(--accent-primary)' }}>
                        <strong style={{ fontSize: '0.7rem', textTransform: 'uppercase', display: 'block', color: 'var(--accent-primary)', marginBottom: '0.2rem' }}>Variant A Feedback</strong>
                        {persona.critiqueA}
                      </div>
                      <div className="critique-box" style={{ borderLeftColor: 'var(--accent-secondary)' }}>
                        <strong style={{ fontSize: '0.7rem', textTransform: 'uppercase', display: 'block', color: 'var(--accent-secondary)', marginBottom: '0.2rem' }}>Variant B Feedback</strong>
                        {persona.critiqueB}
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
