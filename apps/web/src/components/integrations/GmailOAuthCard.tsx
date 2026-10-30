/**
 * GmailOAuthCard
 * Full Gmail OAuth 2.0 connection card with:
 *  - Live status polling from backend
 *  - Connect / Reconnect button (redirects to Google OAuth consent)
 *  - Disconnect (revoke tokens)
 *  - Send test-email to verify the connection
 *  - Daily quota ring gauge
 *  - OAuth callback result banner (reads ?gmail=success|error from URL)
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Mail,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Send,
  LogOut,
  ShieldCheck,
  Zap,
  Info,
  ExternalLink
} from 'lucide-react';
import { api, GmailStatus, GmailQuota, TestEmailResult } from '../../services/api';

// ── helpers ──────────────────────────────────────────────────────────────────

function QuotaRing({ used, max }: { used: number; max: number }) {
  const pct = max > 0 ? Math.min(used / max, 1) : 0;
  const r = 20;
  const circ = 2 * Math.PI * r;
  const dash = circ * (1 - pct);
  const color = pct >= 1 ? '#ef4444' : pct >= 0.8 ? '#f97316' : '#10b981';

  return (
    <div className="flex items-center gap-3">
      <svg width={52} height={52} viewBox="0 0 52 52" className="shrink-0">
        <circle cx={26} cy={26} r={r} fill="none" stroke="#e4e4e7" strokeWidth={6} />
        <circle
          cx={26}
          cy={26}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={dash}
          transform="rotate(-90 26 26)"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        <text x={26} y={30} textAnchor="middle" fontSize={11} fontWeight={700} fill={color}>
          {used}
        </text>
      </svg>
      <div>
        <p className="type-small font-semibold text-zinc-700">{used} / {max} used today</p>
        <p className="type-caption text-zinc-400 mt-0.5">Asia/Karachi timezone</p>
      </div>
    </div>
  );
}

type BannerVariant = 'success' | 'error' | 'info';
function Banner({ variant, message, onDismiss }: { variant: BannerVariant; message: string; onDismiss: () => void }) {
  const styles: Record<BannerVariant, string> = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };
  const Icon = variant === 'success' ? CheckCircle2 : variant === 'error' ? XCircle : Info;

  return (
    <div className={`flex items-start gap-2 rounded-xl border px-4 py-3 type-body ${styles[variant]}`}>
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss} className="ml-auto type-small opacity-60 hover:opacity-100 font-medium">
        ✕
      </button>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export const GmailOAuthCard: React.FC = () => {
  const [status, setStatus] = useState<GmailStatus | null>(null);
  const [quota, setQuota] = useState<GmailQuota | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testResult, setTestResult] = useState<TestEmailResult | null>(null);
  const [banner, setBanner] = useState<{ variant: BannerVariant; message: string } | null>(null);

  // ── Read OAuth callback result from URL query params ──────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gmailParam = params.get('gmail');
    const errorMsg = params.get('error');

    if (gmailParam === 'success') {
      setBanner({ variant: 'success', message: '✅ Gmail connected successfully! Your account is now authorized.' });
      // Strip query params from URL without a page reload
      const clean = window.location.pathname + window.location.hash;
      window.history.replaceState({}, '', clean);
    } else if (gmailParam === 'error') {
      const reason = errorMsg ? decodeURIComponent(errorMsg) : 'Unknown error during OAuth flow.';
      setBanner({ variant: 'error', message: `❌ Gmail connection failed: ${reason}` });
      const clean = window.location.pathname + window.location.hash;
      window.history.replaceState({}, '', clean);
    }
  }, []);

  // ── Load status + quota ──────────────────────────────────────────────────
  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const [st, q] = await Promise.allSettled([api.getGmailStatus(), api.getGmailQuota()]);
      if (st.status === 'fulfilled') setStatus(st.value);
      if (q.status === 'fulfilled') setQuota(q.value);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
    // Poll status every 30 s so the card reflects changes after OAuth redirects back
    const id = setInterval(loadStatus, 30_000);
    return () => clearInterval(id);
  }, [loadStatus]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleConnect = () => {
    setBanner(null);
    api.connectGmail(); // redirects browser to /api/v1/integrations/gmail/connect → Google
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect Gmail? This will revoke access tokens at Google and stop all email sends.')) return;
    setDisconnecting(true);
    try {
      const res = await api.disconnectGmail();
      setBanner({ variant: 'info', message: res?.message ?? 'Gmail disconnected.' });
      await loadStatus();
    } catch {
      setBanner({ variant: 'error', message: 'Disconnect request failed. Please try again.' });
    } finally {
      setDisconnecting(false);
    }
  };

  const handleTestEmail = async () => {
    setTestingEmail(true);
    setTestResult(null);
    try {
      const result = await api.sendTestEmail();
      setTestResult(result);
      if (result.success) {
        setBanner({ variant: 'success', message: result.dry_run ? `Test email prepared (dry-run) to ${result.to}` : `Test email sent to ${result.to}` });
      } else {
        setBanner({ variant: 'error', message: result.message });
      }
    } catch {
      setBanner({ variant: 'error', message: 'Test email request failed — backend may be offline.' });
    } finally {
      setTestingEmail(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  const isConnected = status?.connected === true;

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white shadow-xs flex flex-col overflow-hidden">
      {/* Card header */}
      <div className="flex items-start justify-between gap-3 p-6 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-50 border border-red-100">
            <Mail className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="type-h3 text-zinc-900">Gmail (OAuth 2.0)</h3>
            <p className="type-small text-zinc-500 mt-0.5">Sends personalized application emails via Google API</p>
          </div>
        </div>

        {/* Status badge */}
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-zinc-400 shrink-0 mt-1" />
        ) : isConnected ? (
          <span className="inline-flex items-center gap-1 type-small font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Connected
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 type-small font-semibold px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600">
            Not Connected
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-6 flex flex-col gap-5 flex-1">
        {/* OAuth callback banner */}
        {banner && (
          <Banner
            variant={banner.variant}
            message={banner.message}
            onDismiss={() => setBanner(null)}
          />
        )}

        {/* Connected account info */}
        {isConnected && status?.account_email && (
          <div className="rounded-xl bg-zinc-50 border border-zinc-100 px-4 py-3 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="type-small text-zinc-400 font-medium">Active Google Account</span>
            </div>
            <span className="font-mono type-body text-zinc-800 break-all">{status.account_email}</span>
            {status.last_synced_at && (
              <span className="type-caption text-zinc-400">
                Last synced: {new Date(status.last_synced_at).toLocaleString()}
              </span>
            )}
          </div>
        )}

        {/* Quota ring (only when connected) */}
        {isConnected && quota && (
          <div className="rounded-xl bg-zinc-50 border border-zinc-100 px-4 py-3">
            <p className="type-caption font-semibold uppercase tracking-widest text-zinc-400 mb-3">
              Daily Send Quota
            </p>
            <QuotaRing used={quota.used_count} max={quota.max_limit} />
            {quota.is_exhausted && (
              <div className="mt-2 flex items-center gap-1.5 type-small text-red-600 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                Daily quota exhausted — emails paused until midnight PKT
              </div>
            )}
          </div>
        )}

        {/* Scopes (when connected) */}
        {isConnected && status?.scopes && status.scopes.length > 0 && (
          <div>
            <p className="type-caption font-semibold uppercase tracking-widest text-zinc-400 mb-2">
              Authorized Scopes
            </p>
            <div className="flex flex-wrap gap-1.5">
              {status.scopes.map((s) => (
                <span key={s} className="type-caption font-mono bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">
                  {s.replace('https://www.googleapis.com/auth/', '')}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Not connected info */}
        {!isConnected && !loading && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="type-small font-semibold text-amber-800">Gmail not connected</p>
              <p className="type-small text-amber-700 mt-0.5">
                Application emails cannot be sent until you authorize via Google OAuth 2.0. Click <strong>Connect</strong> below to start.
              </p>
            </div>
          </div>
        )}

        {/* Prerequisites note */}
        {!isConnected && (
          <div className="flex items-start gap-2 type-small text-zinc-500">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-zinc-400" />
            <span>
              Requires <strong>GMAIL_CLIENT_ID</strong> and <strong>GMAIL_CLIENT_SECRET</strong> set in <code className="bg-zinc-100 px-1 rounded">.env</code>.{' '}
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-0.5"
              >
                Create credentials <ExternalLink className="w-3 h-3" />
              </a>
            </span>
          </div>
        )}

        {/* Test email result */}
        {testResult && (
          <div className={`rounded-xl border px-4 py-3 type-small ${testResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
            <p className="font-semibold mb-1">{testResult.success ? '✅ Test email prepared' : '❌ Test email failed'}</p>
            <p>{testResult.message}</p>
            {testResult.dry_run && <p className="mt-1 text-emerald-600 font-medium">Running in Dry-Run mode — no email was actually sent.</p>}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-6 py-4 border-t border-zinc-100 flex flex-wrap items-center gap-2">
        {/* Refresh status */}
        <button
          onClick={loadStatus}
          disabled={loading}
          title="Refresh status"
          className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 transition-colors text-zinc-500 disabled:opacity-40"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>

        {isConnected ? (
          <>
            {/* Test email */}
            <button
              onClick={handleTestEmail}
              disabled={testingEmail}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 type-small font-medium text-zinc-700 transition-colors disabled:opacity-40"
            >
              {testingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              {testingEmail ? 'Sending…' : 'Send Test Email'}
            </button>

            {/* Reconnect */}
            <button
              onClick={handleConnect}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 type-small font-medium text-zinc-700 transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Reconnect
            </button>

            {/* Disconnect */}
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="flex items-center gap-1.5 px-3 py-1.5 ml-auto rounded-xl border border-red-200 hover:bg-red-50 type-small font-medium text-red-600 transition-colors disabled:opacity-40"
            >
              {disconnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
              {disconnecting ? 'Disconnecting…' : 'Disconnect'}
            </button>
          </>
        ) : (
          <button
            onClick={handleConnect}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white type-small font-semibold transition-colors shadow-xs"
          >
            <Mail className="w-3.5 h-3.5" />
            Connect via OAuth
          </button>
        )}
      </div>
    </div>
  );
};
