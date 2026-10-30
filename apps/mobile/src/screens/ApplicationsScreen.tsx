/**
 * ApplicationsScreen — 100% Native Mobile Interface
 * Responsive status metrics, filter tabs, readable cards.
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet, Text, View, ScrollView,
  TouchableOpacity, RefreshControl, TextInput, ActivityIndicator
} from 'react-native';
import { colors } from '../theme/colors';
import { mobileApi, MobileApplication } from '../services/api';

const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'applied', label: 'Applied' },
  { id: 'interview', label: 'Interview' },
  { id: 'pending', label: 'Review' },
  { id: 'rejected', label: 'Archived' },
] as const;

type StatusTab = typeof STATUS_TABS[number]['id'];

function getStatusBadge(status: string): { label: string; fg: string; bg: string } {
  switch (status.toLowerCase()) {
    case 'interview': return { label: 'Interview', fg: '#B45309', bg: '#FEF3C7' };
    case 'applied':   return { label: 'Applied',   fg: '#047857', bg: '#D1FAE5' };
    case 'pending':   return { label: 'In Review',  fg: '#92400E', bg: '#FEF3C7' };
    case 'rejected':  return { label: 'Declined',   fg: '#B91C1C', bg: '#FEE2E2' };
    default:          return { label: status,       fg: '#737373', bg: '#F6F3F4' };
  }
}

const AVATAR_COLORS = ['#641E32', '#0F766E', '#1D4ED8', '#C2410C', '#262626', '#431321'];
function companyColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = (hash + name.charCodeAt(i) * (i + 1)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[hash];
}

export const ApplicationsScreen: React.FC = () => {
  const [apps, setApps] = useState<MobileApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<StatusTab>('all');
  const [search, setSearch] = useState('');

  const load = async () => {
    const data = await mobileApi.getApplications();
    setApps(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const counts = useMemo(() => {
    let applied = 0, interview = 0, pending = 0, rejected = 0;
    apps.forEach(a => {
      if (a.status === 'interview') interview++;
      else if (a.status === 'applied') applied++;
      else if (a.status === 'pending') pending++;
      else if (a.status === 'rejected') rejected++;
    });
    return { all: apps.length, applied, interview, pending, rejected };
  }, [apps]);

  const filtered = useMemo(() => {
    return apps.filter(a => {
      if (activeTab !== 'all' && a.status !== activeTab) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return `${a.job_title} ${a.company_name} ${a.channel}`.toLowerCase().includes(q);
      }
      return true;
    });
  }, [apps, activeTab, search]);

  return (
    <View style={s.root}>
      {/* ── 4 Mobile Metric Counters ── */}
      <View style={s.metricsRow}>
        <View style={s.metricCard}>
          <Text style={s.metricNum}>{counts.all}</Text>
          <Text style={s.metricLabel}>Total</Text>
        </View>

        <View style={s.metricCard}>
          <Text style={[s.metricNum, { color: '#047857' }]}>{counts.applied}</Text>
          <Text style={s.metricLabel}>Applied</Text>
        </View>

        <View style={s.metricCard}>
          <Text style={[s.metricNum, { color: '#B45309' }]}>{counts.interview}</Text>
          <Text style={s.metricLabel}>Interview</Text>
        </View>

        <View style={s.metricCard}>
          <Text style={[s.metricNum, { color: '#B91C1C' }]}>{counts.rejected}</Text>
          <Text style={s.metricLabel}>Declined</Text>
        </View>
      </View>

      {/* ── Search Input ── */}
      <View style={s.searchWrap}>
        <View style={s.searchBox}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Search tracked applications..."
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={s.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Status Filter Chips ── */}
      <View style={s.filterScrollContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterTabsScroll}>
          {STATUS_TABS.map(tab => {
            const active = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[s.filterChip, active && s.filterChipActive]}
              >
                <Text style={[s.filterChipText, active && s.filterChipTextActive]}>
                  {tab.label}
                  <Text style={s.chipCount}> ({counts[tab.id]})</Text>
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Applications Card List ── */}
      {loading ? (
        <View style={s.centerLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={s.loadingText}>Loading applications...</Text>
        </View>
      ) : (
        <ScrollView
          style={s.appListScroll}
          contentContainerStyle={s.appListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          {filtered.length === 0 ? (
            <View style={s.emptyView}>
              <Text style={s.emptyIcon}>📭</Text>
              <Text style={s.emptyTitle}>No applications under this tab</Text>
              <Text style={s.emptySub}>Applications submitted by the AI agent will appear here</Text>
            </View>
          ) : (
            filtered.map(app => {
              const badge = getStatusBadge(app.status);
              const avatarBg = companyColor(app.company_name);
              return (
                <View key={app.id} style={s.appCard}>
                  {/* Top: Avatar, Title, Status */}
                  <View style={s.appCardTop}>
                    <View style={[s.avatarSquare, { backgroundColor: avatarBg }]}>
                      <Text style={s.avatarLetter}>{(app.company_name || '?')[0].toUpperCase()}</Text>
                    </View>

                    <View style={s.appMeta}>
                      <Text style={s.appTitle} numberOfLines={2}>{app.job_title}</Text>
                      <Text style={s.appCompany}>{app.company_name}</Text>
                    </View>

                    <View style={[s.statusPill, { backgroundColor: badge.bg }]}>
                      <Text style={[s.statusPillText, { color: badge.fg }]}>{badge.label}</Text>
                    </View>
                  </View>

                  {/* Chips: Location, Channel, Date */}
                  <View style={s.detailsRow}>
                    <View style={s.detailChip}>
                      <Text style={s.detailChipText}>📍 {app.location}</Text>
                    </View>
                    <View style={s.detailChip}>
                      <Text style={s.detailChipText}>📡 {app.channel}</Text>
                    </View>
                    <View style={s.detailChip}>
                      <Text style={s.detailChipText}>🗓 {app.applied_date}</Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },

  // 4 Top Metrics
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8EC',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  metricNum: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
  },
  metricLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '700',
    marginTop: 1,
  },

  // Search
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#E2DFE1',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    gap: 8,
  },
  searchIcon: {
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    padding: 0,
  },
  clearText: {
    fontSize: 14,
    color: '#888',
    padding: 2,
  },

  // Filter Chips
  filterScrollContainer: {
    paddingVertical: 4,
  },
  filterTabsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2DFE1',
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  chipCount: {
    fontSize: 11,
    fontWeight: '500',
  },

  // List
  appListScroll: {
    flex: 1,
  },
  appListContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 10,
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  emptyView: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 6,
  },
  emptyIcon: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 30,
  },

  // Card
  appCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8E8EC',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
    gap: 10,
  },
  appCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatarSquare: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  appMeta: {
    flex: 1,
    gap: 2,
  },
  appTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 19,
  },
  appCompany: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
  },

  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  detailChip: {
    backgroundColor: '#F8F7F8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#ECEAEB',
  },
  detailChipText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
