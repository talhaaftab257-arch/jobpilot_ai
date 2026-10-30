import React, { useState, useEffect } from 'react';
import {
  Users,
  Briefcase,
  DollarSign,
  TrendingUp,
  Plus,
  Search,
  Filter,
  MoreVertical,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  Building,
  UserCheck,
  ChevronRight,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { CrmLead, CrmDeal, DealStage } from '../types';
import { api, DEMO_LEADS, DEMO_DEALS } from '../services/api';

const STAGES: { id: DealStage; label: string; badge: string }[] = [
  { id: 'sourcing', label: 'Sourcing', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'screening', label: 'Screening', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'interview', label: 'Interview', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'offer', label: 'Offer Stage', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'placed', label: 'Placed & Billed', badge: 'bg-[#F5E9ED] text-[#641E32] border-[#F2C0CD]' }
];

export const CrmDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'leads'>('pipeline');
  const [deals, setDeals] = useState<CrmDeal[]>(DEMO_DEALS);
  const [leads, setLeads] = useState<CrmLead[]>(DEMO_LEADS);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [showAddDealModal, setShowAddDealModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [newLead, setNewLead] = useState({
    name: '',
    company_name: '',
    role: '',
    email: '',
    phone: '',
    country_code: 'PK',
    notes: ''
  });

  const [newDeal, setNewDeal] = useState({
    title: '',
    company_name: '',
    candidate_name: 'Talha Aftab',
    deal_value: 10000,
    currency: 'USD',
    stage: 'sourcing' as DealStage,
    priority: 'high' as const
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [leadsRes, dealsRes] = await Promise.all([api.getLeads(), api.getDeals()]);
      if (leadsRes && leadsRes.length) setLeads(leadsRes);
      if (dealsRes && dealsRes.length) setDeals(dealsRes);
    } catch (err) {
      console.warn('Using local CRM fallback data', err);
    } finally {
      setLoading(false);
    }
  };

  const totalPipelineValue = deals.reduce((acc, d) => acc + (d.deal_value || 0), 0);
  const placedDeals = deals.filter((d) => d.stage === 'placed');
  const placedValue = placedDeals.reduce((acc, d) => acc + (d.deal_value || 0), 0);

  const handleStageChange = async (dealId: string, nextStage: DealStage) => {
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage: nextStage } : d))
    );
    try {
      await api.updateDeal(dealId, { stage: nextStage });
    } catch (e) {
      console.warn('Stage update sync error', e);
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.name || !newLead.email) return;

    try {
      const created = await api.createLead(newLead);
      setLeads([created, ...leads]);
      setShowAddLeadModal(false);
      setNewLead({ name: '', company_name: '', role: '', email: '', phone: '', country_code: 'PK', notes: '' });
    } catch (err) {
      const fallback: CrmLead = {
        id: 'lead-' + Date.now(),
        ...newLead,
        status: 'new',
        source: 'manual',
        created_at: new Date().toISOString()
      };
      setLeads([fallback, ...leads]);
      setShowAddLeadModal(false);
    }
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeal.title || !newDeal.company_name) return;

    try {
      const created = await api.createDeal(newDeal);
      setDeals([created, ...deals]);
      setShowAddDealModal(false);
      setNewDeal({
        title: '',
        company_name: '',
        candidate_name: 'Talha Aftab',
        deal_value: 10000,
        currency: 'USD',
        stage: 'sourcing',
        priority: 'high'
      });
    } catch (err) {
      const fallback: CrmDeal = {
        id: 'deal-' + Date.now(),
        ...newDeal,
        created_at: new Date().toISOString()
      };
      setDeals([fallback, ...deals]);
      setShowAddDealModal(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner / Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-2xl border border-[#E5E7EB] shadow-xs">
        <div>
          <div className="flex items-center gap-2 type-body font-bold text-[#641E32] uppercase tracking-wider mb-1.5">
            <Briefcase className="w-4 h-4 text-[#641E32]" />
            Enterprise Recruitment CRM
          </div>
          <h1 className="type-h1 text-[#171717]">Talent & Client Pipeline</h1>
          <p className="type-body text-[#737373] mt-1">
            Manage corporate client accounts, headhunting deals, and placement commissions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex bg-[#F3F4F6] p-1 rounded-xl border border-[#E5E7EB]">
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`px-4 py-2 type-body font-semibold rounded-lg transition-all cursor-pointer ${ activeTab === 'pipeline' ? 'bg-white text-[#171717] shadow-xs' : 'text-[#6B7280] hover:text-[#171717]' }`}
            >
              Deal Pipeline
            </button>
            <button
              onClick={() => setActiveTab('leads')}
              className={`px-4 py-2 type-body font-semibold rounded-lg transition-all cursor-pointer ${ activeTab === 'leads' ? 'bg-white text-[#171717] shadow-xs' : 'text-[#6B7280] hover:text-[#171717]' }`}
            >
              Corporate Leads ({leads.length})
            </button>
          </div>

          {activeTab === 'pipeline' ? (
            <button
              onClick={() => setShowAddDealModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#641E32] hover:bg-[#501626] text-white type-body font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Deal
            </button>
          ) : (
            <button
              onClick={() => setShowAddLeadModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#641E32] hover:bg-[#501626] text-white type-body font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Lead
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E5E7EB] shadow-xs hover:border-[#D1D5DB] transition-all">
          <div className="flex items-center justify-between text-[#6B7280] type-body font-medium mb-1.5">
            <span>Total Pipeline Value</span>
            <DollarSign className="w-4 h-4 text-[#641E32]" />
          </div>
          {/* Display KPI: 32px (2.0rem) */}
          <div className="type-h1 text-[#171717] font-tabular tracking-tight">
            ${totalPipelineValue.toLocaleString()}
          </div>
          <div className="type-body text-[#6B7280] leading-relaxed mt-1 flex items-center gap-1 font-medium">
            <span className="text-[#059669] font-bold">Active deals</span> across 5 recruitment stages
          </div>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E5E7EB] shadow-xs hover:border-[#D1D5DB] transition-all">
          <div className="flex items-center justify-between text-[#6B7280] type-body font-medium mb-1.5">
            <span>Placed & Closed</span>
            <CheckCircle2 className="w-4 h-4 text-[#059669]" />
          </div>
          <div className="type-h1 text-[#171717] font-tabular tracking-tight">
            ${placedValue.toLocaleString()}
          </div>
          <div className="type-body text-[#6B7280] leading-relaxed mt-1 font-medium">
            <strong className="text-[#171717]">{placedDeals.length}</strong> positions filled successfully
          </div>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E5E7EB] shadow-xs hover:border-[#D1D5DB] transition-all">
          <div className="flex items-center justify-between text-[#6B7280] type-body font-medium mb-1.5">
            <span>Corporate Leads</span>
            <Building className="w-4 h-4 text-[#641E32]" />
          </div>
          <div className="type-h1 text-[#171717] font-tabular tracking-tight">{leads.length}</div>
          <div className="type-body text-[#6B7280] leading-relaxed mt-1 font-medium">
            <strong className="text-[#171717]">
              {leads.filter((l) => l.status === 'qualified').length}
            </strong> qualified enterprise prospects
          </div>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E5E7EB] shadow-xs hover:border-[#D1D5DB] transition-all">
          <div className="flex items-center justify-between text-[#6B7280] type-body font-medium mb-1.5">
            <span>Primary Candidate</span>
            <UserCheck className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="type-h2 text-[#171717] tracking-tight">Talha Aftab</div>
          <div className="type-body text-[#6B7280] leading-relaxed mt-1 font-medium">
            Executive AI Engineer Profile
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'pipeline' ? (
        /* Kanban Pipeline View */
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {STAGES.map((col, idx) => {
            const colDeals = deals.filter((d) => d.stage === col.id);
            const colValue = colDeals.reduce((sum, d) => sum + (d.deal_value || 0), 0);

            return (
              <div
                key={col.id}
                className="bg-[#F8F9FA] rounded-2xl p-3.5 border border-[#E5E7EB] flex flex-col min-w-[245px]"
              >
                {/* Column Section Heading H2: 18px – 20px (1.125rem) */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E5E7EB]">
                  <div className="flex items-center gap-1.5">
                    <h2 className="type-body sm:type-h3 text-[#171717]">{col.label}</h2>
                    <span className="w-5 h-5 rounded-full bg-white type-small font-bold text-[#6B7280] flex items-center justify-center border border-[#E5E7EB] font-tabular">
                      {colDeals.length}
                    </span>
                  </div>
                  <span className="type-body font-bold text-[#6B7280] font-tabular">
                    ${colValue > 1000 ? `${(colValue / 1000).toFixed(1)}k` : colValue}
                  </span>
                </div>

                <div className="flex-1 space-y-3 min-h-[320px]">
                  {colDeals.length === 0 ? (
                    <div className="h-32 border border-dashed border-[#D1D5DB] rounded-xl flex items-center justify-center type-body text-[#9CA3AF] font-medium">
                      No deals in this stage
                    </div>
                  ) : (
                    colDeals.map((deal) => (
                      <div
                        key={deal.id}
                        className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-2xs hover:shadow-xs hover:border-[#D1D5DB] transition-all"
                      >
                        <div className="flex items-start justify-between gap-1 mb-2">
                          <span
                            className={`type-small font-bold px-2.5 py-0.5 rounded uppercase tracking-wider ${ deal.priority === 'urgent' ? 'bg-red-50 text-red-700 border border-red-200' : deal.priority === 'high' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-gray-100 text-gray-700 border border-gray-200' }`}
                          >
                            {deal.priority}
                          </span>
                          <span className="type-h3 font-tabular text-[#641E32] font-tabular">
                            ${deal.deal_value.toLocaleString()}
                          </span>
                        </div>

                        {/* Card Title H3: 18px (1.125rem) */}
                        <h3 className="type-h3 text-[#171717] line-clamp-1 mb-1 leading-snug">
                          {deal.title}
                        </h3>
                        {/* Secondary metadata: 13px - 14px */}
                        <div className="type-body text-[#6B7280] flex items-center gap-1 mb-3 font-medium">
                          <Building className="w-3.5 h-3.5 text-[#9CA3AF]" />
                          <span className="truncate">{deal.company_name}</span>
                        </div>

                        <div className="pt-2.5 border-t border-[#F3F4F6] flex items-center justify-between type-body">
                          <span className="text-[#374151] font-semibold truncate">
                            {deal.candidate_name}
                          </span>
                          {idx < STAGES.length - 1 && (
                            <button
                              onClick={() => handleStageChange(deal.id, STAGES[idx + 1].id)}
                              title={`Advance to ${STAGES[idx + 1].label}`}
                              className="p-1.5 hover:bg-[#F5E9ED] text-[#641E32] rounded transition-colors cursor-pointer"
                            >
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Corporate Leads Table View */
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search leads by name, company, email..."
                className="w-full pl-10 pr-4 py-2 type-body bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#641E32] focus:bg-white transition-all text-[#171717]"
              />
            </div>
            <div className="type-body text-[#6B7280] font-medium">
              Showing {leads.length} corporate leads
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] type-small font-bold text-[#6B7280] uppercase tracking-wider">
                  <th className="py-3.5 px-5">Contact & Company</th>
                  <th className="py-3.5 px-5">Role / Title</th>
                  <th className="py-3.5 px-5">Contact Info</th>
                  <th className="py-3.5 px-5">Country</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Source</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] type-body">
                {leads
                  .filter(
                    (l) =>
                      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      l.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      l.email.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((lead) => (
                    <tr key={lead.id} className="hover:bg-[#F9FAFB]/80 transition-colors">
                      <td className="py-4 px-5">
                        <div className="font-bold text-[#171717] type-body">{lead.name}</div>
                        <div className="type-body text-[#6B7280] mt-0.5">{lead.company_name}</div>
                      </td>
                      <td className="py-4 px-5 text-[#374151] font-semibold">
                        {lead.role || 'Hiring Lead'}
                      </td>
                      <td className="py-4 px-5 space-y-1">
                        <div className="flex items-center gap-1.5 type-body text-[#171717]">
                          <Mail className="w-3.5 h-3.5 text-[#9CA3AF]" />
                          <a href={`mailto:${lead.email}`} className="hover:text-[#641E32] underline-offset-2 hover:underline">
                            {lead.email}
                          </a>
                        </div>
                        {lead.phone && (
                          <div className="flex items-center gap-1.5 type-small text-[#6B7280] font-mono">
                            <Phone className="w-3.5 h-3.5 text-[#9CA3AF]" />
                            {lead.phone}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        <span className="px-2.5 py-1 rounded type-small font-bold bg-[#F3F4F6] text-[#374151] border border-[#E5E7EB] font-mono">
                          {lead.country_code || 'GLOBAL'}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <span
                          className={`px-3 py-1 rounded-full type-small font-bold uppercase tracking-wider ${ lead.status === 'qualified' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : lead.status === 'contacted' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-amber-50 text-amber-700 border border-amber-200' }`}
                        >
                          {lead.status}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-[#6B7280] type-body capitalize">
                        {lead.source.replace('_', ' ')}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => {
                            setNewDeal((d) => ({
                              ...d,
                              title: `Placement at ${lead.company_name}`,
                              company_name: lead.company_name
                            }));
                            setShowAddDealModal(true);
                          }}
                          className="px-3 py-1.5 bg-[#F5E9ED] hover:bg-[#641E32] text-[#641E32] hover:text-white rounded-lg type-small font-bold transition-colors cursor-pointer"
                        >
                          Create Deal
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddLeadModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <h3 className="type-h3 text-[#171717] mb-1">Add Corporate Lead</h3>
            <p className="type-body text-[#6B7280] mb-4">
              Enter recruiter or hiring manager contact details.
            </p>

            <form onSubmit={handleCreateLead} className="space-y-4">
              <div>
                <label className="block type-body font-semibold text-[#374151] mb-1">Contact Name *</label>
                <input
                  type="text"
                  required
                  value={newLead.name}
                  onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                  placeholder="e.g. Alex Henderson"
                  className="w-full px-3.5 py-2 type-body bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:bg-white focus:border-[#641E32] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block type-body font-semibold text-[#374151] mb-1">Company *</label>
                  <input
                    type="text"
                    required
                    value={newLead.company_name}
                    onChange={(e) => setNewLead({ ...newLead, company_name: e.target.value })}
                    placeholder="e.g. Acme Corp"
                    className="w-full px-3.5 py-2 type-body bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:bg-white focus:border-[#641E32] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block type-body font-semibold text-[#374151] mb-1">Job Title</label>
                  <input
                    type="text"
                    value={newLead.role}
                    onChange={(e) => setNewLead({ ...newLead, role: e.target.value })}
                    placeholder="e.g. Head of Talent"
                    className="w-full px-3.5 py-2 type-body bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:bg-white focus:border-[#641E32] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block type-body font-semibold text-[#374151] mb-1">Work Email *</label>
                  <input
                    type="email"
                    required
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                    placeholder="alex@acme.com"
                    className="w-full px-3.5 py-2 type-body bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:bg-white focus:border-[#641E32] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block type-body font-semibold text-[#374151] mb-1">Phone</label>
                  <input
                    type="text"
                    value={newLead.phone}
                    onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                    placeholder="+1 555 0192"
                    className="w-full px-3.5 py-2 type-body bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:bg-white focus:border-[#641E32] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block type-body font-semibold text-[#374151] mb-1">Recruitment Notes</label>
                <textarea
                  rows={3}
                  value={newLead.notes}
                  onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                  placeholder="Target roles, candidate compensation expectations..."
                  className="w-full px-3.5 py-2 type-body bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:bg-white focus:border-[#641E32] focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddLeadModal(false)}
                  className="px-4 py-2 type-body font-semibold text-[#6B7280] hover:text-[#171717] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#641E32] hover:bg-[#501626] text-white type-body font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Deal Modal */}
      {showAddDealModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <h3 className="type-h3 text-[#171717] mb-1">Create Recruitment Deal</h3>
            <p className="type-body text-[#6B7280] mb-4">
              Add a headhunting pipeline opportunity.
            </p>

            <form onSubmit={handleCreateDeal} className="space-y-4">
              <div>
                <label className="block type-body font-semibold text-[#374151] mb-1">Deal Title *</label>
                <input
                  type="text"
                  required
                  value={newDeal.title}
                  onChange={(e) => setNewDeal({ ...newDeal, title: e.target.value })}
                  placeholder="e.g. Lead AI Engineer Placement"
                  className="w-full px-3.5 py-2 type-body bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:bg-white focus:border-[#641E32] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block type-body font-semibold text-[#374151] mb-1">Client Company *</label>
                  <input
                    type="text"
                    required
                    value={newDeal.company_name}
                    onChange={(e) => setNewDeal({ ...newDeal, company_name: e.target.value })}
                    placeholder="e.g. TechWave Berlin"
                    className="w-full px-3.5 py-2 type-body bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:bg-white focus:border-[#641E32] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block type-body font-semibold text-[#374151] mb-1">Candidate</label>
                  <input
                    type="text"
                    value={newDeal.candidate_name}
                    onChange={(e) => setNewDeal({ ...newDeal, candidate_name: e.target.value })}
                    className="w-full px-3.5 py-2 type-body bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:bg-white focus:border-[#641E32] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block type-body font-semibold text-[#374151] mb-1">Est. Deal Value ($)</label>
                  <input
                    type="number"
                    value={newDeal.deal_value}
                    onChange={(e) => setNewDeal({ ...newDeal, deal_value: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 type-body bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:bg-white focus:border-[#641E32] focus:outline-none font-tabular"
                  />
                </div>
                <div>
                  <label className="block type-body font-semibold text-[#374151] mb-1">Priority</label>
                  <select
                    value={newDeal.priority}
                    onChange={(e) => setNewDeal({ ...newDeal, priority: e.target.value as any })}
                    className="w-full px-3.5 py-2 type-body bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:bg-white focus:border-[#641E32] focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddDealModal(false)}
                  className="px-4 py-2 type-body font-semibold text-[#6B7280] hover:text-[#171717] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#641E32] hover:bg-[#501626] text-white type-body font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  Create Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
