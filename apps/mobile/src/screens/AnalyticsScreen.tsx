/**
 * AnalyticsScreen — 100% Native Mobile Interface
 * Visual conversion funnel, regional coverage bars, and job application statistics.
 */
import React from 'react';
import {
  StyleSheet, Text, View, ScrollView
} from 'react-native';
import { colors } from '../theme/colors';

const REGION_BARS = [
  { region: 'Europe (EU)', flag: '🇪🇺', count: 836, pct: 100, color: '#1D4ED8' },
  { region: 'Asia Pacific', flag: '🌏', count: 59, pct: 14, color: '#B7791F' },
  { region: 'Arab Region', flag: '🇦🇪', count: 26, pct: 8, color: '#641E32' },
  { region: 'Pakistan', flag: '🇵🇰', count: 19, pct: 6, color: '#16845B' },
];

const FUNNEL_STEPS = [
  { label: 'Jobs Discovered', value: 940, pct: '100%', bg: '#641E32', fg: '#FFFFFF' },
  { label: 'High Match (≥ 80%)', value: 18, pct: '1.9%', bg: '#87364F', fg: '#FFFFFF' },
  { label: 'Applications Sent', value: 5, pct: '0.5%', bg: '#AB4F6B', fg: '#FFFFFF' },
  { label: 'Interviews Scheduled', value: 2, pct: '40% conv.', bg: '#16845B', fg: '#FFFFFF' },
];

export const AnalyticsScreen: React.FC = () => {
  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {/* ── Key Stat Row ── */}
      <View style={s.statsRow}>
        <View style={s.statCard}>
          <Text style={s.statNum}>940</Text>
          <Text style={s.statLabel}>Discovered</Text>
        </View>
        <View style={s.statCard}>
          <Text style={[s.statNum, { color: colors.primary }]}>18</Text>
          <Text style={s.statLabel}>Matches</Text>
        </View>
        <View style={s.statCard}>
          <Text style={[s.statNum, { color: '#16845B' }]}>2</Text>
          <Text style={s.statLabel}>Interviews</Text>
        </View>
      </View>

      {/* ── Funnel Card ── */}
      <View style={s.card}>
        <Text style={s.cardHeading}>📊 Conversion Funnel</Text>
        <Text style={s.cardSubheading}>How discovered positions progress to interviews</Text>

        <View style={s.funnelList}>
          {FUNNEL_STEPS.map(step => (
            <View key={step.label} style={s.funnelRow}>
              <View style={[s.funnelBar, { backgroundColor: step.bg }]}>
                <Text style={[s.funnelBarLabel, { color: step.fg }]} numberOfLines={1}>{step.label}</Text>
                <Text style={[s.funnelBarVal, { color: step.fg }]}>{step.value}</Text>
              </View>
              <Text style={s.funnelPct}>{step.pct}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Regional Distribution ── */}
      <View style={s.card}>
        <Text style={s.cardHeading}>🌍 Regional Distribution</Text>
        <Text style={s.cardSubheading}>Active scraped positions across global feeds</Text>

        <View style={s.regionsList}>
          {REGION_BARS.map(r => (
            <View key={r.region} style={s.regionRow}>
              <View style={s.regionMeta}>
                <Text style={s.regionFlag}>{r.flag}</Text>
                <Text style={s.regionName}>{r.region}</Text>
                <Text style={s.regionCount}>{r.count} roles</Text>
              </View>

              <View style={s.barTrack}>
                <View style={[s.barFill, { width: `${r.pct}%` as any, backgroundColor: r.color }]} />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* ── Status Breakdown ── */}
      <View style={s.card}>
        <Text style={s.cardHeading}>📈 Application Status</Text>

        <View style={s.statusGrid}>
          <View style={s.statusItem}>
            <View style={[s.statusDot, { backgroundColor: '#16845B' }]} />
            <Text style={s.statusTitle}>Applied / Sent</Text>
            <Text style={s.statusNumber}>5</Text>
          </View>

          <View style={s.statusItem}>
            <View style={[s.statusDot, { backgroundColor: '#B7791F' }]} />
            <Text style={s.statusTitle}>In Review</Text>
            <Text style={s.statusNumber}>3</Text>
          </View>

          <View style={s.statusItem}>
            <View style={[s.statusDot, { backgroundColor: '#1D4ED8' }]} />
            <Text style={s.statusTitle}>Interviews</Text>
            <Text style={s.statusNumber}>2</Text>
          </View>

          <View style={s.statusItem}>
            <View style={[s.statusDot, { backgroundColor: '#C53030' }]} />
            <Text style={s.statusTitle}>Declined</Text>
            <Text style={s.statusNumber}>1</Text>
          </View>
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
    paddingTop: 12,
    paddingBottom: 40,
    gap: 12,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8EC',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  statNum: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 2,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E8EC',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 10,
  },
  cardHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  cardSubheading: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: -4,
  },

  // Funnel
  funnelList: {
    gap: 8,
    marginTop: 4,
  },
  funnelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  funnelBar: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  funnelBarLabel: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  funnelBarVal: {
    fontSize: 13,
    fontWeight: '900',
    marginLeft: 8,
  },
  funnelPct: {
    width: 65,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'right',
  },

  // Regions
  regionsList: {
    gap: 10,
    marginTop: 4,
  },
  regionRow: {
    gap: 4,
  },
  regionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  regionFlag: {
    fontSize: 16,
  },
  regionName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  regionCount: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  barTrack: {
    height: 7,
    backgroundColor: '#EAE6E8',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Status
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  statusItem: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: '#F7F6F7',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECEAEB',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusTitle: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  statusNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
  },
});
