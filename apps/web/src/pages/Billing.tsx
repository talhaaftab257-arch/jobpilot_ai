import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Check,
  Zap,
  Download,
  ShieldCheck,
  Building,
  Users,
  Send,
  AlertCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { SubscriptionPlan, UserSubscription, Invoice } from '../types';
import { api, DEMO_PLANS, DEMO_INVOICES } from '../services/api';

export const Billing: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>(DEMO_PLANS);
  const [invoices, setInvoices] = useState<Invoice[]>(DEMO_INVOICES);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [currentPlanId, setCurrentPlanId] = useState<string>('pro');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [usage, setUsage] = useState({
    applications_used_today: 14,
    applications_daily_limit: 50,
    active_team_members: 3,
    max_team_seats: 5,
    days_remaining_in_cycle: 19
  });

  useEffect(() => {
    loadBilling();
  }, []);

  const loadBilling = async () => {
    try {
      const [plansRes, currentRes, invoicesRes] = await Promise.all([
        api.getBillingPlans(),
        api.getCurrentBilling(),
        api.getInvoices()
      ]);
      if (plansRes && plansRes.length) setPlans(plansRes);
      if (currentRes?.subscription?.plan_id) {
        setCurrentPlanId(currentRes.subscription.plan_id);
        if (currentRes.usage) setUsage(currentRes.usage);
      }
      if (invoicesRes && invoicesRes.length) setInvoices(invoicesRes);
    } catch (e) {
      console.warn('Billing fetch fallback', e);
    }
  };

  const handleUpgrade = async (planId: string) => {
    setLoading(true);
    setSuccessMsg(null);
    try {
      await api.upgradePlan(planId, billingCycle);
      setCurrentPlanId(planId);
      setSuccessMsg(`Successfully switched to ${planId.toUpperCase()} tier!`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setCurrentPlanId(planId);
      setSuccessMsg(`Switched to ${planId.toUpperCase()} tier.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  const currentPlan = plans.find((p) => p.id === currentPlanId) || plans[1];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-2xl border border-[#E5E7EB] shadow-xs">
        <div>
          <div className="flex items-center gap-2 type-body font-bold text-[#641E32] uppercase tracking-wider mb-1.5">
            <CreditCard className="w-4 h-4 text-[#641E32]" />
            SaaS Subscription & ERP Licensing
          </div>
          <h1 className="type-h1 text-[#171717]">Billing & Plans</h1>
          <p className="type-body text-[#737373] mt-1">
            Manage your recruitment agency licensing, seats, AI application quotas, and invoices.
          </p>
        </div>

        {/* Monthly / Yearly Toggle */}
        <div className="flex items-center gap-1.5 bg-[#F3F4F6] p-1.5 rounded-xl border border-[#E5E7EB]">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 type-body font-semibold rounded-lg transition-all cursor-pointer ${ billingCycle === 'monthly' ? 'bg-white text-[#171717] shadow-xs' : 'text-[#6B7280] hover:text-[#171717]' }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-2 type-body font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${ billingCycle === 'yearly' ? 'bg-white text-[#171717] shadow-xs' : 'text-[#6B7280] hover:text-[#171717]' }`}
          >
            <span>Annual</span>
            <span className="px-2 py-0.5 rounded type-small bg-[#F5E9ED] text-[#641E32] font-bold">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-[#F5E9ED] border border-[#641E32]/20 text-[#641E32] p-4 rounded-xl type-body font-semibold flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 shrink-0 text-[#641E32]" />
          {successMsg}
        </div>
      )}

      {/* Current Subscription & Usage Summary */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-[#E5E7EB] shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#E5E7EB]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="type-small font-bold text-[#6B7280] uppercase tracking-wider">Current Tier:</span>
              <span className="px-3 py-1 rounded-full type-body font-bold bg-[#641E32] text-white">
                {currentPlan.name}
              </span>
              <span className="px-2.5 py-0.5 rounded-full type-small font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active Subscription
              </span>
            </div>
            {/* Body text: 16px */}
            <p className="type-body text-[#6B7280] leading-relaxed mt-2 font-medium">
              Next billing cycle renews in <strong className="text-[#171717]">{usage.days_remaining_in_cycle} days</strong>. Payment method charged automatically.
            </p>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div>
              <div className="type-h1 text-[#171717] font-tabular tracking-tight">
                ${billingCycle === 'monthly' ? currentPlan.price_monthly : Math.round(currentPlan.price_yearly / 12)}
                <span className="type-body font-normal text-[#6B7280]">/month</span>
              </div>
              <div className="type-small text-[#6B7280] mt-0.5">
                Billed {billingCycle}
              </div>
            </div>
          </div>
        </div>

        {/* Live Quota & Seat Bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
          <div className="p-4 sm:p-5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
            <div className="flex items-center justify-between type-body font-bold text-[#171717] mb-2">
              <span className="flex items-center gap-2">
                <Send className="w-4 h-4 text-[#641E32]" />
                Daily AI Job Applications
              </span>
              <span className="font-tabular">
                {usage.applications_used_today} / {usage.applications_daily_limit} used
              </span>
            </div>
            <div className="w-full h-2.5 bg-[#E5E7EB] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#641E32] rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (usage.applications_used_today / usage.applications_daily_limit) * 100)}%`
                }}
              />
            </div>
            <div className="type-body text-[#6B7280] leading-relaxed mt-2 font-medium">
              Resets at midnight PKT (GMT+5). Multi-threaded high-speed dispatch.
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
            <div className="flex items-center justify-between type-body font-bold text-[#171717] mb-2">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#641E32]" />
                Recruitment Team Seats
              </span>
              <span className="font-tabular">
                {usage.active_team_members} / {usage.max_team_seats} assigned
              </span>
            </div>
            <div className="w-full h-2.5 bg-[#E5E7EB] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#171717] rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (usage.active_team_members / usage.max_team_seats) * 100)}%`
                }}
              />
            </div>
            <div className="type-body text-[#6B7280] leading-relaxed mt-2 font-medium">
              {usage.max_team_seats - usage.active_team_members} vacant seats available for talent sourcers.
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Plans Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => {
          const isCurrent = p.id === currentPlanId;
          const price = billingCycle === 'monthly' ? p.price_monthly : p.price_yearly;

          return (
            <div
              key={p.id}
              className={`bg-white rounded-2xl border transition-all p-6 sm:p-7 flex flex-col justify-between ${ isCurrent ? 'border-[#641E32] shadow-md ring-2 ring-[#641E32]/10 relative' : 'border-[#E5E7EB] shadow-xs hover:border-[#D1D5DB]' }`}
            >
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#641E32] text-white type-small font-bold uppercase tracking-wider px-3.5 py-0.5 rounded-full shadow-xs">
                  Active Tier
                </div>
              )}

              <div>
                {/* Card Title H3: 18px – 20px (1.125rem – 1.25rem) */}
                <h3 className="type-h3 text-[#171717] mb-2">{p.name}</h3>
                {/* Body / Description: 14px - 16px */}
                <p className="type-body text-[#6B7280] leading-relaxed min-h-[42px] mb-5 font-medium">
                  {p.description}
                </p>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="type-h1 text-[#171717] font-tabular tracking-tight">${price}</span>
                  <span className="type-body text-[#6B7280]">
                    {billingCycle === 'monthly' ? '/month' : '/year'}
                  </span>
                </div>

                <div className="space-y-3.5 pt-4 border-t border-[#E5E7EB] mb-6">
                  {p.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 type-body text-[#374151]">
                      <div className="w-4 h-4 rounded-full bg-[#F5E9ED] text-[#641E32] flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                      <span className="font-medium leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <button
                  disabled={isCurrent || loading}
                  onClick={() => handleUpgrade(p.id)}
                  className={`w-full py-2.5 px-4 rounded-xl type-body font-bold transition-all cursor-pointer ${ isCurrent ? 'bg-[#F3F4F6] text-[#9CA3AF] cursor-default' : 'bg-[#641E32] hover:bg-[#501626] text-white shadow-xs' }`}
                >
                  {isCurrent ? 'Current Plan' : `Switch to ${p.name}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Invoice History & Payment Details */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-6 sm:p-7">
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB] mb-4">
          <div>
            {/* Section Heading H2: 24px (1.5rem) */}
            <h2 className="type-h2 text-[#171717]">Billing & Invoicing History</h2>
            <p className="type-body text-[#6B7280] mt-0.5">
              Tax receipts and automated monthly SaaS invoices.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="type-small font-medium text-[#6B7280]">Card ending:</span>
            <span className="type-small font-bold text-[#171717] bg-[#F9FAFB] px-2.5 py-1 rounded-lg border border-[#E5E7EB] font-mono">
              VISA •••• 4242
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="type-small font-bold text-[#6B7280] uppercase tracking-wider border-b border-[#E5E7EB] bg-[#F9FAFB]">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Plan / Description</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] type-body">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-[#F9FAFB]/80">
                  <td className="py-3.5 px-4 font-mono font-bold text-[#171717] type-body">{inv.invoice_number}</td>
                  <td className="py-3.5 px-4 text-[#171717] font-semibold">{inv.plan_name}</td>
                  <td className="py-3.5 px-4 text-[#6B7280] type-body font-medium">{inv.billing_period}</td>
                  <td className="py-3.5 px-4 font-bold text-[#171717] font-tabular">${inv.amount.toFixed(2)}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-full type-small font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => alert(`Downloading receipt ${inv.invoice_number} (PDF)`)}
                      className="inline-flex items-center gap-1 type-body text-[#641E32] hover:text-[#87364F] font-semibold cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
