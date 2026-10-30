/**
 * DashboardScreen — 100% Native Mobile Interface
 * Optimized for mobile touch, readable cards, thumb-friendly buttons, and responsive metrics.
 */
import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView,
  TouchableOpacity, RefreshControl, Alert, Dimensions
} from 'react-native';
import { colors } from '../theme/colors';
import { mobileApi, MobileReport } from '../services/api';

interface DashboardScreenProps {
  onNavigate: (tab: string) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const REGION_FEEDS = [
  { code: 'PK', flag: '🇵🇰', label: 'Pakistan', jobs: 19, color: '#16845B', bg: '#E8F5EE' },
  { code: 'EU', flag: '🇪🇺', label: 'Europe', jobs: 836, color: '#1D4ED8', bg: '#DBEAFE' },
  { code: 'ASIA', flag: '🌏', label: 'Asia Pacific', jobs: 59, color: '#B7791F', bg: '#FEF5E7' },
  { code: 'ARAB', flag: '🇦🇪', label: 'Arab Region', jobs: 26, color: '#641E32', bg: '#F5E9ED' },
];

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigate }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [taskTab, setTaskTab] = useState<'in_progress' | 'to_do' | 'upcoming'>('in_progress');
  const [report, setReport] = useState<MobileReport>({
    used_quota: 0,
    max_quota: 30,
    jobs_discovered_today: 940,
    eligible_matches_today: 18,
    applications_sent_today: 0,
  });

  const loadData = async () => {
    const online = await mobileApi.healthCheck();
    setBackendOnline(online);
    if (online) {
      const q = await mobileApi.getQuota();
      if (q) setReport(q);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleRunSearch = async () => {
    setIsDiscovering(true);
    const success = await mobileApi.triggerDiscovery();
    setIsDiscovering(false);
    if (success) {
      Alert.alert('✅ Search Started', 'Job discovery agent is scanning live international boards.');
      loadData();
    } else {
      Alert.alert('⚠️ Offline', 'Could not reach backend API. Check Wi-Fi settings.');
    }
  };

  const quotaPct = Math.min(100, Math.round((report.used_quota / (report.max_quota || 30)) * 100));
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' });

  const tasksInProgress = [
    { id: '1', title: 'Global Job Discovery', sub: `${report.jobs_discovered_today || 940} roles discovered`, badge: 'Running', bc: '#16845B', bb: '#E8F5EE' },
    { id: '2', title: 'Matches Ready for Review', sub: 'High match score roles available', badge: 'High Fit', bc: '#B91C1C', bb: '#FEE2E2' },
    { id: '3', title: 'Daily Application Pipeline', sub: `${report.used_quota} of ${report.max_quota} sent`, badge: 'Active', bc: '#B45309', bb: '#FEF3C7' },
  ];
  const tasksToDo = [
    { id: '4', title: 'Follow-ups Window', sub: '3 submissions past 5-day mark', badge: 'Review', bc: '#737373', bb: '#F6F3F4' },
    { id: '5', title: 'CV Safety Gate Verification', sub: 'Europe & Gulf CVs active', badge: 'Safety', bc: '#B45309', bb: '#FEF3C7' },
  ];
  const tasksUpcoming = [
    { id: '6', title: 'Technical Interview', sub: 'Remote AI Role · TechSolutions', badge: 'Next', bc: '#1D4ED8', bb: '#DBEAFE' },
    { id: '7', title: 'Recruiter Screening Call', sub: 'Gulf Cloud Team · Video', badge: 'Scheduled', bc: '#1D4ED8', bb: '#DBEAFE' },
  ];
  const currentTasks = taskTab === 'in_progress' ? tasksInProgress : taskTab === 'to_do' ? tasksToDo : tasksUpcoming;

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* ── Mobile Hero Greeting Card ── */}
      <View style={s.heroCard}>
        <View style={s.heroTop}>
          <View style={s.heroInfo}>
            <Text style={s.heroDate}>{today.toUpperCase()}</Text>
            <Text style={s.heroName}>Talha Aftab Alam</Text>
            <Text style={s.heroSub}>
              Autonomous AI agent is <Text style={s.heroHighlight}>live & scanning</Text>
            </Text>
          </View>
        </View>

        {/* Status + Action Bar inside Hero */}
        <View style={s.heroActionsRow}>
          <View style={[s.liveIndicator, { backgroundColor: backendOnline ? '#E8F5EE' : '#FEE2E2' }]}>
            <View style={[s.liveDot, { backgroundColor: backendOnline ? '#16845B' : '#B91C1C' }]} />
            <Text style={[s.liveText, { color: backendOnline ? '#16845B' : '#B91C1C' }]}>
              {backendOnline ? 'System Online' : 'Offline'}
            </Text>
          </View>

          <TouchableOpacity
            style={s.heroScanBtn}
            onPress={handleRunSearch}
            disabled={isDiscovering}
            activeOpacity={0.8}
          >
            <Text style={s.heroScanBtnText}>
              {isDiscovering ? '⏳ Scanning...' : '⚡ Run Search'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Quick Mobile Shortcuts ── */}
      <View style={s.shortcutsContainer}>
        <TouchableOpacity style={s.shortcutCard} onPress={() => onNavigate('jobs')} activeOpacity={0.8}>
          <View style={[s.shortcutIconCircle, { backgroundColor: '#F5E9ED' }]}>
            <Text style={s.shortcutIcon}>🔍</Text>
          </View>
          <Text style={s.shortcutTitle}>Find Jobs</Text>
          <Text style={s.shortcutSub}>{report.jobs_discovered_today || 940} Live</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.shortcutCard} onPress={() => onNavigate('applications')} activeOpacity={0.8}>
          <View style={[s.shortcutIconCircle, { backgroundColor: '#E8F5EE' }]}>
            <Text style={s.shortcutIcon}>✉️</Text>
          </View>
          <Text style={s.shortcutTitle}>Tracker</Text>
          <Text style={s.shortcutSub}>Applications</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.shortcutCard} onPress={() => onNavigate('resumes')} activeOpacity={0.8}>
          <View style={[s.shortcutIconCircle, { backgroundColor: '#DBEAFE' }]}>
            <Text style={s.shortcutIcon}>📄</Text>
          </View>
          <Text style={s.shortcutTitle}>Resumes</Text>
          <Text style={s.shortcutSub}>4 CVs Active</Text>
        </TouchableOpacity>
      </View>

      {/* ── Daily Quota & Health Meter Card ── */}
      <View style={s.mobileCard}>
        <View style={s.cardHeaderRow}>
          <View>
            <Text style={s.cardHeading}>Daily Dispatch Limit</Text>
            <Text style={s.cardSubheading}>Automated regional outreach cap</Text>
          </View>
          <View style={s.quotaPill}>
            <Text style={s.quotaPillText}>{report.used_quota} / {report.max_quota}</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={s.progressBarTrack}>
          <View style={[s.progressBarFill, { width: `${Math.max(6, quotaPct)}%` as any }]} />
        </View>

        <View style={s.progressMetaRow}>
          <Text style={s.progressMetaText}>{quotaPct}% utilized</Text>
          <Text style={[s.progressMetaText, { color: colors.primary, fontWeight: '700' }]}>
            {report.max_quota - report.used_quota} remaining today
          </Text>
        </View>

        {/* 3 Mobile Metric Boxes */}
        <View style={s.statsGridRow}>
          <View style={s.metricBox}>
            <Text style={s.metricIcon}>🌐</Text>
            <Text style={s.metricNum}>{report.jobs_discovered_today || 940}</Text>
            <Text style={s.metricTitle}>Discovered</Text>
          </View>

          <View style={s.metricBox}>
            <Text style={s.metricIcon}>🎯</Text>
            <Text style={s.metricNum}>{report.eligible_matches_today || 18}</Text>
            <Text style={s.metricTitle}>Eligible</Text>
          </View>

          <View style={s.metricBox}>
            <Text style={s.metricIcon}>🚀</Text>
            <Text style={s.metricNum}>{report.applications_sent_today || 0}</Text>
            <Text style={s.metricTitle}>Sent</Text>
          </View>
        </View>
      </View>

      {/* ── Tasks & Activity Card ── */}
      <View style={s.mobileCard}>
        <Text style={s.cardHeading}>Agent Activity & Tasks</Text>
        
        {/* Segmented control for mobile */}
        <View style={s.segmentedControl}>
          {(['in_progress', 'to_do', 'upcoming'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setTaskTab(tab)}
              style={[s.segmentBtn, taskTab === tab && s.segmentBtnActive]}
            >
              <Text style={[s.segmentBtnText, taskTab === tab && s.segmentBtnTextActive]}>
                {tab === 'in_progress' ? 'Active' : tab === 'to_do' ? 'To-Do' : 'Scheduled'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tasks List */}
        <View style={s.taskList}>
          {currentTasks.map((t, index) => (
            <View key={t.id} style={[s.taskCardRow, index < currentTasks.length - 1 && s.taskCardBorder]}>
              <View style={[s.taskAccentDot, { backgroundColor: t.bc }]} />
              <View style={s.taskTextContainer}>
                <Text style={s.taskMainTitle}>{t.title}</Text>
                <Text style={s.taskSubTitle}>{t.sub}</Text>
              </View>
              <View style={[s.taskBadgePill, { backgroundColor: t.bb }]}>
                <Text style={[s.taskBadgePillText, { color: t.bc }]}>{t.badge}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* ── Regional Feeds Cards ── */}
      <View style={s.mobileCard}>
        <View style={s.cardHeaderRow}>
          <View>
            <Text style={s.cardHeading}>Target Regions</Text>
            <Text style={s.cardSubheading}>Scraping 4 global job markets</Text>
          </View>
          <TouchableOpacity onPress={() => onNavigate('jobs')}>
            <Text style={s.viewAllLink}>View All →</Text>
          </TouchableOpacity>
        </View>

        <View style={s.regionsContainer}>
          {REGION_FEEDS.map(r => (
            <TouchableOpacity
              key={r.code}
              style={s.regionCardItem}
              onPress={() => onNavigate('jobs')}
              activeOpacity={0.75}
            >
              <View style={s.regionItemLeft}>
                <Text style={s.regionItemFlag}>{r.flag}</Text>
                <View>
                  <Text style={s.regionItemName}>{r.label}</Text>
                  <Text style={s.regionItemCount}>{r.jobs} positions found</Text>
                </View>
              </View>
              <View style={[s.regionStatusTag, { backgroundColor: r.bg }]}>
                <Text style={[s.regionStatusTagText, { color: r.color }]}>Live</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
    gap: 14,
  },

  // ── Hero Greeting Card (Mobile-first)
  heroCard: {
    backgroundColor: colors.primaryDark,
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  heroTop: {
    marginBottom: 14,
  },
  heroInfo: {
    gap: 3,
  },
  heroDate: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  heroName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  heroSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
  heroHighlight: {
    color: '#FFB3C6',
    fontWeight: '700',
  },
  heroActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
  },
  heroScanBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroScanBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // ── 3 Shortcuts Row
  shortcutsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  shortcutCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8EC',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 4,
  },
  shortcutIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  shortcutIcon: {
    fontSize: 18,
  },
  shortcutTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  shortcutSub: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // ── Mobile Card Generic
  mobileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E8EC',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.2,
  },
  cardSubheading: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  quotaPill: {
    backgroundColor: colors.subtleMehroon,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  quotaPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },

  // Progress Bar
  progressBarTrack: {
    height: 8,
    backgroundColor: '#EAE6E8',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  progressMetaText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },

  // 3 Metric Boxes
  statsGridRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#F9F8F9',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECEAEB',
  },
  metricIcon: {
    fontSize: 15,
    marginBottom: 2,
  },
  metricNum: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.text,
  },
  metricTitle: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 1,
  },

  // Segmented Control
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F2EFF1',
    borderRadius: 10,
    padding: 3,
    marginTop: 10,
    marginBottom: 12,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentBtnText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  segmentBtnTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },

  // Task List
  taskList: {
    gap: 2,
  },
  taskCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  taskCardBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0ECED',
  },
  taskAccentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  taskTextContainer: {
    flex: 1,
  },
  taskMainTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  taskSubTitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  taskBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  taskBadgePillText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // Regions
  viewAllLink: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  regionsContainer: {
    gap: 8,
    marginTop: 4,
  },
  regionCardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9F8F9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECEAEB',
  },
  regionItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  regionItemFlag: {
    fontSize: 22,
  },
  regionItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  regionItemCount: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  regionStatusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  regionStatusTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
