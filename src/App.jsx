import React, { useState, useEffect } from 'react';
import { Sparkles, Code, Users, Settings as SettingsIcon, Terminal, Copy, Check } from 'lucide-react';
import CampaignCopilot from './components/CampaignCopilot';
import LiquidSandbox from './components/LiquidSandbox';
import ABTester from './components/ABTester';
import Settings from './components/Settings';

export default function App() {
  const [activeTab, setActiveTab] = useState('copilot');
  const [apiKey, setApiKey] = useState('');
  const [toast, setToast] = useState('');
  
  // Shared campaign data to pass between Copilot and Liquid Sandbox
  const [campaignData, setCampaignData] = useState({
    subjectLines: [],
    pushNotifications: [],
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
    { id: 'user.favorite_flavor', label: 'Favorite Flavor' },
    { id: 'user.points_needed', label: 'Points Needed' }
  ]);

  // Load API Key from LocalStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key') || '';
    setApiKey(savedKey);
  }, []);

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
          >
            <Sparkles size={18} />
            Campaign Copilot
          </button>
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`sidebar-item ${activeTab === 'sandbox' ? 'active' : ''}`}
          >
            <Code size={18} />
            Liquid Sandbox
          </button>
          <button
            onClick={() => setActiveTab('tester')}
            className={`sidebar-item ${activeTab === 'tester' ? 'active' : ''}`}
          >
            <Users size={18} />
            A/B Persona Tester
          </button>
        </div>

        <div className="sidebar-footer">
          <button
            onClick={() => setActiveTab('settings')}
            className={`sidebar-item ${activeTab === 'settings' ? 'active' : ''}`}
            style={{ width: '100%' }}
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
          <div className={`api-badge ${apiKey ? 'connected' : 'simulated'}`}>
            <span className="indicator"></span>
            <span>{apiKey ? 'Live API Mode' : 'Simulated Mock Mode'}</span>
          </div>
        </header>

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
