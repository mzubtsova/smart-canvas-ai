import React, { useState, useEffect } from 'react';
import { Sparkles, Code, Users, Settings as SettingsIcon, Check, Moon, Sun, Trophy, ShieldCheck } from 'lucide-react';
import CampaignCopilot from './components/CampaignCopilot';
import LiquidSandbox from './components/LiquidSandbox';
import ABTester from './components/ABTester';
import Settings from './components/Settings';

export default function App() {
  const [activeTab, setActiveTab] = useState('copilot');
  const [apiKey, setApiKey] = useState('');
  const [toast, setToast] = useState('');
  const [theme, setTheme] = useState('dark');
  
  // Shared campaign data to pass between Copilot and Liquid Sandbox
  const [campaignData, setCampaignData] = useState({
    subjectLines: [],
    pushNotifications: [],
    smsMessages: [],
    inAppMessages: [],
    contentCards: [],
    emailTemplateHtml: '',
    subjectLineA: '',
    subjectLineB: '',
    pushNotificationA: '',
    pushNotificationB: ''
  });

  // Shared variables list state
  const [variablesList, setVariablesList] = useState([
    { id: 'user.first_name', label: 'First Name' },
    { id: 'user.membership_tier', label: 'Membership Tier' },
    { id: 'user.points_balance', label: 'Points Balance' },
    { id: 'user.favorite_category', label: 'Favorite Category' },
    { id: 'user.points_needed', label: 'Points Needed' }
  ]);

  // Load API Key from LocalStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key') || '';
    setApiKey(savedKey);
    const savedTheme = localStorage.getItem('smart_canvas_theme') || 'dark';
    setTheme(savedTheme);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('smart_canvas_theme', theme);
  }, [theme]);

  // Global Toast function
  const triggerToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 2500);
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'copilot':
        return (
          <CampaignCopilot
            apiKey={apiKey}
            campaignData={campaignData}
            setCampaignData={setCampaignData}
            variablesList={variablesList}
            setVariablesList={setVariablesList}
            triggerToast={triggerToast}
            setActiveTab={setActiveTab}
          />
        );
      case 'sandbox':
        return (
          <LiquidSandbox
            campaignData={campaignData}
            setCampaignData={setCampaignData}
            variablesList={variablesList}
            setVariablesList={setVariablesList}
            triggerToast={triggerToast}
          />
        );
      case 'tester':
        return (
          <ABTester
            apiKey={apiKey}
            campaignData={campaignData}
            triggerToast={triggerToast}
          />
        );
      case 'settings':
        return (
          <Settings
            apiKey={apiKey}
            setApiKey={setApiKey}
          />
        );
      default:
        return (
          <CampaignCopilot
            apiKey={apiKey}
            campaignData={campaignData}
            setCampaignData={setCampaignData}
            variablesList={variablesList}
            setVariablesList={setVariablesList}
            triggerToast={triggerToast}
            setActiveTab={setActiveTab}
          />
        );
    }
  };

  const getHeaderDetails = () => {
    switch (activeTab) {
      case 'copilot':
        return { title: 'Campaign AI Copilot', desc: 'Draft multi-channel campaigns, email copies, and Liquid HTML templates using AI' };
      case 'sandbox':
        return { title: 'Interactive Liquid Sandbox', desc: 'Write templates, toggle mock customer profiles, and preview Liquid personalization live' };
      case 'tester':
        return { title: 'A/B Persona Simulator', desc: 'Simulate user behavior and run copy concepts through AI agent buyer personas' };
      case 'settings':
        return { title: 'Settings', desc: 'Configure developer API keys and options' };
      default:
        return { title: 'SmartCanvas AI', desc: 'AI-Powered Personalization Copilot' };
    }
  };

  const { title, desc } = getHeaderDetails();
  const missionStats = [
    { label: '1 Brief', done: true, tip: 'Step 1: write the campaign objective, choose tone, and select channels/tags.' },
    { label: '2 Copy', done: campaignData.subjectLines.length > 0 || !!campaignData.subjectLineA, tip: 'Step 2: generate copy variants for email, push, SMS, IAM, and content cards.' },
    { label: '3 QA', done: activeTab === 'sandbox' || activeTab === 'tester', tip: 'Step 3: preview Liquid with mock profiles and compare variants before launch.' },
    { label: '4 Export', done: !!campaignData.emailTemplateHtml, tip: 'Step 4: download the HTML or export a Braze-ready template.' }
  ];
  const completedMissions = missionStats.filter(item => item.done).length;
  const progress = Math.round((completedMissions / missionStats.length) * 100);
  const guideSteps = [
    { label: 'Brief', text: 'Write the goal, tone, variants, and tags.', active: activeTab === 'copilot' },
    { label: 'Generate', text: 'Create email, push, SMS, IAM, and card copy.', active: campaignData.subjectLines.length > 0 },
    { label: 'QA', text: 'Preview Liquid with mock users and JSON.', active: activeTab === 'sandbox' },
    { label: 'Test', text: 'Autofill variants and compare personas.', active: activeTab === 'tester' },
    { label: 'Export', text: 'Download HTML or send to Braze.', active: activeTab === 'sandbox' && !!campaignData.emailTemplateHtml }
  ];

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <nav className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Sparkles size={16} fill="white" />
          </div>
          <span className="sidebar-logo-text">SmartCanvas AI</span>
        </div>

        <div className="sidebar-menu">
          <button
            onClick={() => setActiveTab('copilot')}
            className={`sidebar-item ${activeTab === 'copilot' ? 'active' : ''}`}
            data-tip="Start here: describe the campaign goal, pick tone, and generate copy plus email HTML."
          >
            <Sparkles size={18} />
            Campaign Copilot
          </button>
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`sidebar-item ${activeTab === 'sandbox' ? 'active' : ''}`}
            data-tip="QA station: preview Liquid personalization against mock customer JSON before launch."
          >
            <Code size={18} />
            Liquid Sandbox
          </button>
          <button
            onClick={() => setActiveTab('tester')}
            className={`sidebar-item ${activeTab === 'tester' ? 'active' : ''}`}
            data-tip="Compare variants with simulated buyer personas before spending real audience attention."
          >
            <Users size={18} />
            A/B Persona Tester
          </button>
        </div>

        <div className="sidebar-footer">
          <div className="mission-card">
            <div className="mission-card-top">
              <Trophy size={15} />
              <span>Launch Quest</span>
              <strong>{progress}%</strong>
            </div>
            <p className="mission-card-desc">A 4-step launch checklist: brief, generate, QA, export.</p>
            <div className="mission-progress">
              <span style={{ width: `${progress}%` }}></span>
            </div>
            <div className="mission-steps">
              {missionStats.map(item => (
                <span key={item.label} className={item.done ? 'done' : ''} data-tip={item.tip}>{item.label}</span>
              ))}
            </div>
          </div>
          <button
            onClick={() => setActiveTab('settings')}
            className={`sidebar-item ${activeTab === 'settings' ? 'active' : ''}`}
            style={{ width: '100%' }}
            data-tip="Add optional Gemini and Braze keys. Without keys, SmartCanvas runs in demo mode."
          >
            <SettingsIcon size={18} />
            Settings
          </button>
        </div>
      </nav>

      {/* Main Workspace Area */}
      <main className="main-content">
        <header className="header">
          <div>
            <h1>{title}</h1>
            <p className="header-title-desc">{desc}</p>
          </div>

          {/* Connected API Status indicator */}
          <div className="header-actions">
            <button
              className="icon-btn"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              data-tip={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <div className={`api-badge ${apiKey ? 'connected' : 'simulated'}`} data-tip={apiKey ? 'Gemini requests use your saved browser API key.' : 'No API key needed: demo mode uses local campaign simulations.'}>
              <span className="indicator"></span>
              <span>{apiKey ? 'Live API Mode' : 'Simulated Mock Mode'}</span>
            </div>
            <div className="api-badge qa" data-tip="Parser checks Liquid conditions, variables, fallbacks, and sandbox preview health.">
              <ShieldCheck size={14} />
              <span>{completedMissions}/4 Quest Steps</span>
            </div>
          </div>
        </header>

        <section className="workflow-guide" aria-label="SmartCanvas workflow guide">
          {guideSteps.map((step, index) => (
            <div
              key={step.label}
              className={`workflow-step ${step.active ? 'active' : ''}`}
              data-tip={`Step ${index + 1}: ${step.text}`}
            >
              <strong>{index + 1}</strong>
              <span>{step.label}</span>
              <small>{step.text}</small>
            </div>
          ))}
        </section>

        {/* Content Render */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {renderActiveView()}
        </div>
      </main>

      {/* Global Toast Notification */}
      {toast && (
        <div className="toast">
          <Check size={16} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
