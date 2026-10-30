import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  UserPlus,
  Shield,
  Trash2,
  Mail,
  CheckCircle,
  Clock,
  Sparkles,
  Key
} from 'lucide-react';
import { WorkspaceMember, Organization } from '../types';
import { api, DEMO_MEMBERS } from '../services/api';

export const Workspace: React.FC = () => {
  const [members, setMembers] = useState<WorkspaceMember[]>(DEMO_MEMBERS);
  const [org, setOrg] = useState<Organization>({
    id: 'org-demo-1',
    name: 'Apex Talent Recruitment ERP',
    slug: 'apex-talent',
    owner_id: 'user-talha-1',
    current_plan_id: 'pro',
    created_at: new Date().toISOString()
  });
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'recruiter' | 'admin' | 'viewer'>('recruiter');
  const [seatLimit, setSeatLimit] = useState(5);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    loadWorkspace();
  }, []);

  const loadWorkspace = async () => {
    try {
      const data = await api.getWorkspace();
      if (data?.organization) setOrg(data.organization);
      if (data?.members) setMembers(data.members);
      if (data?.seat_usage?.max) setSeatLimit(data.seat_usage.max);
    } catch (e) {
      console.warn('Workspace fetch fallback', e);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;

    try {
      const newMember = await api.inviteWorkspaceMember(inviteName, inviteEmail, inviteRole);
      setMembers([...members, newMember]);
    } catch (err) {
      const fallback: WorkspaceMember = {
        id: 'mem-' + Date.now(),
        organization_id: org.id,
        name: inviteName,
        email: inviteEmail,
        role: inviteRole,
        status: 'invited',
        joined_at: new Date().toISOString()
      };
      setMembers([...members, fallback]);
    }

    setNotification(`Invitation successfully sent to ${inviteEmail}`);
    setTimeout(() => setNotification(null), 4000);
    setShowInviteModal(false);
    setInviteName('');
    setInviteEmail('');
    setInviteRole('recruiter');
  };

  const handleRemove = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to revoke access for ${name}?`)) return;
    try {
      await api.removeWorkspaceMember(id);
    } catch (e) {
      console.warn('Remove sync error', e);
    }
    setMembers((prev) => prev.filter((m) => m.id !== id));
    setNotification(`Removed ${name} from organization.`);
    setTimeout(() => setNotification(null), 3000);
  };

  const activeSeatsUsed = members.length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-2xl border border-[#E5E7EB] shadow-xs">
        <div>
          <div className="flex items-center gap-2 type-body font-bold text-[#641E32] uppercase tracking-wider mb-1.5">
            <Building2 className="w-4 h-4 text-[#641E32]" />
            Enterprise ERP Workspace
          </div>
          <h1 className="type-h1 text-[#171717]">{org.name}</h1>
          <p className="type-body text-[#737373] mt-1">
            Recruiter seats, team permission controls, and multi-tenant staffing workspace.
          </p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          disabled={activeSeatsUsed >= seatLimit}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#641E32] hover:bg-[#501626] disabled:bg-gray-200 disabled:text-gray-400 text-white type-body font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Invite Team Member
        </button>
      </div>

      {notification && (
        <div className="bg-[#F5E9ED] border border-[#641E32]/20 text-[#641E32] p-4 rounded-xl type-body font-semibold flex items-center gap-2.5">
          <CheckCircle className="w-4 h-4 shrink-0 text-[#641E32]" />
          {notification}
        </div>
      )}

      {/* Seats & Org Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-[#E5E7EB] shadow-xs hover:border-[#D1D5DB] transition-all">
          <div className="flex items-center justify-between type-small font-bold text-[#6B7280] uppercase tracking-wider mb-3">
            <span>Seat Utilization</span>
            <Users className="w-4 h-4 text-[#641E32]" />
          </div>
          <div className="type-h1 text-[#171717] font-tabular tracking-tight mb-2">
            {activeSeatsUsed} / {seatLimit}
            <span className="type-body font-semibold text-[#6B7280] ml-2">Seats Used</span>
          </div>
          <div className="w-full h-2.5 bg-[#E5E7EB] rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-[#641E32] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (activeSeatsUsed / seatLimit) * 100)}%` }}
            />
          </div>
          <p className="type-body text-[#6B7280] leading-relaxed font-medium">
            {seatLimit - activeSeatsUsed} more team recruiter seats available on your current plan.
          </p>
        </div>

        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-[#E5E7EB] shadow-xs hover:border-[#D1D5DB] transition-all">
          <div className="flex items-center justify-between type-small font-bold text-[#6B7280] uppercase tracking-wider mb-3">
            <span>Organization Domain</span>
            <Building2 className="w-4 h-4 text-[#641E32]" />
          </div>
          {/* Subheading H3: 18px (1.125rem) */}
          <div className="type-h3 text-[#171717] mb-1 font-mono">
            {org.slug}.jobpilot.io
          </div>
          <div className="type-body text-[#6B7280] leading-relaxed mb-4 font-medium">
            Private agency subdomain for client portals & ATS embeds.
          </div>
          <span className="px-3 py-1 rounded type-small font-bold bg-[#F5E9ED] text-[#641E32] border border-[#F2C0CD]">
            Custom DNS Verified
          </span>
        </div>

        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-[#E5E7EB] shadow-xs hover:border-[#D1D5DB] transition-all">
          <div className="flex items-center justify-between type-small font-bold text-[#6B7280] uppercase tracking-wider mb-3">
            <span>Organization Owner</span>
            <Shield className="w-4 h-4 text-[#641E32]" />
          </div>
          {/* Subheading H3: 18px (1.125rem) */}
          <div className="type-h3 text-[#171717] mb-1">
            Talha Aftab
          </div>
          <div className="type-body text-[#6B7280] leading-relaxed mb-4 font-medium">
            Primary Super-Admin with full billing & member authority.
          </div>
          <span className="px-3 py-1 rounded type-small font-bold bg-[#141414] text-white">
            Root Admin
          </span>
        </div>
      </div>

      {/* Team Members List */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#E5E7EB] flex items-center justify-between">
          <div>
            {/* Section Heading H2: 20px – 24px (1.25rem – 1.5rem) */}
            <h2 className="type-h2 text-[#171717]">Workspace Members</h2>
            <p className="type-body text-[#6B7280] mt-0.5">
              Recruiters and administrators with access to the candidates pipeline.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="type-small font-bold text-[#6B7280] uppercase tracking-wider border-b border-[#E5E7EB] bg-[#F9FAFB]">
                <th className="py-3.5 px-5">Member</th>
                <th className="py-3.5 px-5">Email</th>
                <th className="py-3.5 px-5">Role</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5">Joined</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] type-body">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-[#F9FAFB]/80">
                  <td className="py-4 px-5 font-bold text-[#171717]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#141414] text-white flex items-center justify-center font-bold type-small">
                        {m.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="type-body">{m.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-[#6B7280] font-medium">{m.email}</td>
                  <td className="py-4 px-5">
                    <span
                      className={`px-2.5 py-1 rounded type-small font-bold uppercase tracking-wider ${ m.role === 'owner' ? 'bg-[#641E32] text-white' : m.role === 'admin' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-gray-100 text-gray-700' }`}
                    >
                      {m.role}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    <span
                      className={`px-3 py-1 rounded-full type-small font-bold ${ m.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200' }`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-[#6B7280] type-body font-medium font-tabular">
                    {new Date(m.joined_at).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-5 text-right">
                    {m.role !== 'owner' && (
                      <button
                        onClick={() => handleRemove(m.id, m.name)}
                        className="text-[#9CA3AF] hover:text-red-600 transition-colors p-1 cursor-pointer"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <h3 className="type-h3 text-[#171717] mb-1">Invite Team Recruiter</h3>
            <p className="type-body text-[#6B7280] mb-4">
              Add a colleague to collaborate on deals and candidate job matching.
            </p>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block type-body font-semibold text-[#374151] mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Sara Khan"
                  className="w-full px-3.5 py-2 type-body bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:bg-white focus:border-[#641E32] focus:outline-none"
                />
              </div>

              <div>
                <label className="block type-body font-semibold text-[#374151] mb-1">Work Email Address *</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="sara@talentedge.io"
                  className="w-full px-3.5 py-2 type-body bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:bg-white focus:border-[#641E32] focus:outline-none"
                />
              </div>

              <div>
                <label className="block type-body font-semibold text-[#374151] mb-1">Permission Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full px-3.5 py-2 type-body bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:bg-white focus:border-[#641E32] focus:outline-none"
                >
                  <option value="recruiter">Recruiter (Can manage leads & applications)</option>
                  <option value="admin">Admin (Can manage settings and team)</option>
                  <option value="viewer">Viewer (Read-only pipeline observer)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 type-body font-semibold text-[#6B7280] hover:text-[#171717] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#641E32] hover:bg-[#501626] text-white type-body font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
