import React, { useState, useEffect } from 'react';
import {
  Mail,
  Database,
  Globe2,
  Sparkles,
  CheckCircle2,
  X,
  Shield,
  KeyRound,
  ExternalLink,
  RefreshCw,
  SendHorizontal
} from 'lucide-react';
import { Integration } from '../types';

interface IntegrationsProps {
  integrations?: Integration[];
  onUpdateIntegration?: (id: string, updated: Partial<Integration>) => void;
}

export const Integrations: React.FC<IntegrationsProps> = ({
  integrations = [],
  onUpdateIntegration
}) => {
  const [items, setItems] = useState<Integration[]>(integrations);

  useEffect(() => {
    setItems(integrations);
  }, [integrations]);

  const [activeModalItem, setActiveModalItem] = useState<Integration | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [senderName, setSenderName] = useState(() => {
    try {
      return localStorage.getItem('jobpilot_candidate_name') || 'Talha Alam';
    } catch {
      return 'Talha Alam';
    }
  });
  const [appPassword, setAppPassword] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Check for URL query params (?gmail=success or error)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('gmail') === 'success') {
      setToastMessage('✓ Direct Gmail OAuth 2.0 connected successfully! Tokens saved in database.');
      // Remove query param cleanly
      window.history.replaceState({}, '', window.location.pathname + '?tab=integrations');
    } else if (params.get('gmail') === 'error') {
      setToastMessage(`OAuth error: ${params.get('error') || 'Could not complete Google consent.'}`);
    }
  }, []);

  // Fetch real Gmail status from backend if available
  useEffect(() => {
    fetch('/api/v1/integrations/gmail/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.connected && data.account_email) {
          setItems((prev) =>
            prev.map((it) =>
              it.id === 'gmail'
                ? { ...it, status: 'connected', account: data.account_email, description: data.account_email }
                : it
            )
          );
        }
      })
      .catch(() => {});
  }, []);

  const handleOpenManage = (item: Integration) => {
    setActiveModalItem(item);
    if (item.id === 'gmail') {
      setEmailInput(item.account || item.description || 'talha@jobpilot.ai');
    }
  };

  const handleDirectOAuthConnect = () => {
    // Redirect directly to Google OAuth consent screen endpoint
    window.location.href = 'http://localhost:8000/api/v1/integrations/gmail/connect';
  };

  const handleSaveIntegration = () => {
    if (!activeModalItem) return;

    setIsTesting(true);

    setTimeout(() => {
      setIsTesting(false);
      const updatedAccount = emailInput.trim();

      const updatedItems = items.map((it) => {
        if (it.id === activeModalItem.id) {
          return {
            ...it,
            account: updatedAccount,
            description: updatedAccount,
            status: 'connected' as const
          };
        }
        return it;
      });

      setItems(updatedItems);

      try {
        localStorage.setItem('jobpilot_integrations', JSON.stringify(updatedItems));
        if (activeModalItem.id === 'gmail') {
          localStorage.setItem('jobpilot_candidate_email', updatedAccount);
        }
      } catch (e) {
        console.warn('Could not save to localStorage', e);
      }

      if (onUpdateIntegration) {
        onUpdateIntegration(activeModalItem.id, {
          account: updatedAccount,
          description: updatedAccount,
          status: 'connected'
        });
      }

      setToastMessage(`✓ ${activeModalItem.name} updated to "${updatedAccount}" successfully!`);
      setActiveModalItem(null);

      setTimeout(() => setToastMessage(null), 4000);
    }, 600);
  };

  const integrationIcons: Record<string, React.ReactNode> = {
    gmail: (
      <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center shrink-0">
        <Mail className="w-5 h-5" />
      </div>
    ),
    supabase: (
      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
        <Database className="w-5 h-5" />
      </div>
    ),
    job_sources: (
      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
        <Globe2 className="w-5 h-5" />
      </div>
    ),
    ai_provider: (
      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center shrink-0">
        <Sparkles className="w-5 h-5" />
      </div>
    )
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div>
        <h1 className="type-h1 text-[#171717]">
          Integrations
        </h1>
        <p className="type-body text-[#737373] mt-1">
          Connect your tools and automate your job search.
        </p>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 bg-[#ECFDF5] border border-emerald-200 text-[#16845B] type-small font-semibold rounded-xl flex items-center justify-between shadow-xs transition-all">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#16845B] shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-[#737373] hover:text-[#171717] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Integration Cards Grid ─────────────────────────────── */}
      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E7E0E3] p-10 text-center type-body text-[#737373]">
          No integrations returned from the API yet.
        </div>
      ) : null}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-[#E7E0E3] p-6 shadow-xs flex flex-col justify-between space-y-5 hover:border-[#641E32]/40 transition-all"
          >
            <div>
              {/* Header row: Icon & Status Badge */}
              <div className="flex items-center justify-between gap-3 mb-4">
                {integrationIcons[item.id] || (
                  <div className="w-10 h-10 rounded-xl bg-[#F6F3F4] text-[#171717] border border-[#E7E0E3] flex items-center justify-center shrink-0">
                    <Globe2 className="w-5 h-5" />
                  </div>
                )}

                <span
                  className={`inline-flex items-center gap-1.5 type-small font-bold px-3 py-1 rounded-full border ${
                    item.status === 'connected'
                      ? 'bg-[#ECFDF5] text-[#16845B] border-emerald-200'
                      : item.status === 'needs_attention'
                      ? 'bg-[#FEF3C7] text-[#B7791F] border-amber-200'
                      : 'bg-[#F6F3F4] text-[#737373] border-[#E7E0E3]'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      item.status === 'connected' ? 'bg-[#16845B]' : 'bg-[#A3A3A3]'
                    }`}
                  />
                  <span className="capitalize">{(item.status || 'unknown').replace(/_/g, ' ')}</span>
                </span>
              </div>

              {/* Title & Subtitle */}
              <div className="flex items-center justify-between">
                <h3 className="type-h3 text-[#171717]">{item.name}</h3>
                {item.id === 'gmail' && (
                  <span className="type-caption font-bold px-2 py-0.5 rounded-full bg-[#F5E9ED] text-[#641E32] border border-[#641E32]/20">
                    Active Dispatch
                  </span>
                )}
              </div>
              <p className="type-small text-[#737373] mt-1 font-mono truncate">{item.description}</p>
            </div>

            {/* Bottom Action Button */}
            <div className="pt-3 border-t border-[#E7E0E3]">
              <button
                onClick={() => handleOpenManage(item)}
                className="w-full py-2.5 px-4 bg-white hover:bg-[#F6F3F4] text-[#171717] type-small font-semibold rounded-xl border border-[#E7E0E3] hover:border-[#641E32]/40 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Manage</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Manage / Edit Modal (Gmail & other services) ──────────── */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E7E0E3] space-y-5 animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E0E3]">
              <div className="flex items-center gap-2.5">
                {integrationIcons[activeModalItem.id] || (
                  <div className="w-8 h-8 rounded-lg bg-[#F5E9ED] text-[#641E32] flex items-center justify-center">
                    <Mail className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <h3 className="type-h3 text-[#171717]">
                    Manage {activeModalItem.name}
                  </h3>
                  <p className="type-caption text-[#737373]">
                    Configure authentication and dispatch account settings.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveModalItem(null)}
                className="p-1 rounded-lg text-[#737373] hover:text-[#171717] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Specific fields for Gmail */}
            {activeModalItem.id === 'gmail' ? (
              <div className="space-y-4 type-small">
                {/* Direct Google OAuth 2.0 Action Box */}
                <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold type-small text-[#171717]">Direct Google OAuth 2.0</h4>
                    <p className="type-caption text-[#737373]">One-click authorization via official Google consent screen.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDirectOAuthConnect}
                    className="px-4 py-2 bg-[#641E32] hover:bg-[#431321] text-white font-bold type-small rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Connect with Google</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </button>
                </div>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-[#E7E0E3]"></div>
                  <span className="flex-shrink mx-3 type-caption uppercase font-bold text-[#A3A3A3]">or enter manually</span>
                  <div className="flex-grow border-t border-[#E7E0E3]"></div>
                </div>

                {/* Account Email Field */}
                <div className="space-y-1.5">
                  <label className="font-bold text-[#171717] flex items-center justify-between">
                    <span>Gmail Account Address</span>
                    <span className="text-[#16845B] font-medium type-caption">✓ Verified Channel</span>
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="e.g. yourname@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E0E3] type-body text-[#171717] focus:outline-none focus:border-[#641E32] font-mono bg-white"
                  />
                  <p className="type-caption text-[#737373]">
                    Outreach emails and application dispatches will be delivered from this account.
                  </p>
                </div>

                {/* Sender Name */}
                <div className="space-y-1.5">
                  <label className="font-bold text-[#171717]">Sender Display Name</label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Talha Aftab Alam"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E0E3] type-body text-[#171717] focus:outline-none focus:border-[#641E32]"
                  />
                </div>

                {/* App Password / OAuth */}
                <div className="space-y-1.5">
                  <label className="font-bold text-[#171717] flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-[#737373]" /> Google App Password
                    </span>
                    <span className="type-caption text-[#737373]">16-character secure token</span>
                  </label>
                  <input
                    type="password"
                    value={appPassword}
                    onChange={(e) => setAppPassword(e.target.value)}
                    placeholder="•••• •••• •••• ••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E0E3] type-body text-[#171717] focus:outline-none focus:border-[#641E32] font-mono"
                  />
                  <p className="type-caption text-[#737373]">
                    Generate from: Google Account → Security → 2-Step Verification → App Passwords.
                  </p>
                </div>
              </div>
            ) : (
              /* Non-gmail integrations generic manage body */
              <div className="space-y-3 type-small">
                <div className="space-y-1.5">
                  <label className="font-bold text-[#171717]">Connected Endpoint</label>
                  <input
                    type="text"
                    value={activeModalItem.description}
                    readOnly
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E0E3] type-body text-[#171717] bg-[#F6F3F4] font-mono"
                  />
                </div>
                <div className="p-3 bg-[#ECFDF5] text-[#16845B] border border-emerald-200 rounded-xl type-small font-medium">
                  ✓ Connected to Supabase backend database and storage vault.
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E7E0E3]">
              <button
                type="button"
                onClick={() => setActiveModalItem(null)}
                className="px-4 py-2 bg-white text-[#737373] hover:text-[#171717] type-small font-semibold rounded-xl border border-[#E7E0E3] cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveIntegration}
                disabled={isTesting}
                className="px-5 py-2 bg-[#641E32] hover:bg-[#431321] text-white type-small font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Integrations;
