/**
 * JobsScreen — 100% Native Mobile Interface
 * Responsive job cards, 2-line title wrapping, clear match pill, mobile filter chips.
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TextInput,
  TouchableOpacity, RefreshControl, Modal, Linking, ActivityIndicator
} from 'react-native';
import { colors } from '../theme/colors';
import { mobileApi, MobileJob } from '../services/api';

const REGION_TABS = [
  { id: 'ALL', label: 'All Feeds', emoji: '🌍' },
  { id: 'PK',  label: 'Pakistan', emoji: '🇵🇰' },
  { id: 'EU',  label: 'Europe', emoji: '🇪🇺' },
  { id: 'ASIA', label: 'Asia', emoji: '🌏' },
  { id: 'ARAB', label: 'Arab', emoji: '🇦🇪' },
];

function matchColor(score: number): { bg: string; fg: string } {
  if (score >= 85) return { bg: '#E8F5EE', fg: '#16845B' };
  if (score >= 70) return { bg: '#FEF5E7', fg: '#B7791F' };
  return { bg: '#FEE2E2', fg: '#B91C1C' };
}

function arrangementIcon(w: string): string {
  if (w === 'remote') return '🌐 Remote';
  if (w === 'hybrid') return '🏢 Hybrid';
  return '📍 Onsite';
}

const AVATAR_COLORS = ['#641E32', '#0F766E', '#1D4ED8', '#C2410C', '#262626', '#431321'];
function companyColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = (hash + name.charCodeAt(i) * (i + 1)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[hash];
}

export const JobsScreen: React.FC = () => {
  const [jobs, setJobs] = useState<MobileJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [region, setRegion] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<MobileJob | null>(null);

  const load = async () => {
    const data = await mobileApi.getJobs();
    setJobs(data);
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

  const filtered = useMemo(() => {
    return jobs
      .filter(j => {
        if (region !== 'ALL' && j.region_code !== region) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          return (
            j.title.toLowerCase().includes(q) ||
            j.company_name.toLowerCase().includes(q) ||
            j.location.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => b.match_score - a.match_score);
  }, [jobs, region, search]);

  return (
    <View style={s.root}>
      {/* ── Native Search Header ── */}
      <View style={s.searchSection}>
        <View style={s.searchBarContainer}>
          <Text style={s.searchIconText}>🔍</Text>
          <TextInput
            style={s.searchField}
            placeholder="Search roles, skills, or companies..."
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={s.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Horizontal Region Pills ── */}
      <View style={s.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabsScrollContent}>
          {REGION_TABS.map(tab => {
            const active = region === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setRegion(tab.id)}
                style={[s.regionTabChip, active && s.regionTabChipActive]}
              >
                <Text style={[s.regionTabChipText, active && s.regionTabChipTextActive]}>
                  {tab.emoji} {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Results Subhead ── */}
      <View style={s.metaResultsBar}>
        <Text style={s.resultsCountText}>{filtered.length} positions available</Text>
        <Text style={s.sortedByText}>Ranked by AI match</Text>
      </View>

      {/* ── Scrollable Jobs Feed ── */}
      {loading ? (
        <View style={s.centerLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={s.loadingText}>Fetching live job opportunities...</Text>
        </View>
      ) : (
        <ScrollView
          style={s.jobsScroll}
          contentContainerStyle={s.jobsListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          {filtered.length === 0 ? (
            <View style={s.emptyBox}>
              <Text style={s.emptyIcon}>🔍</Text>
              <Text style={s.emptyHeading}>No roles found</Text>
              <Text style={s.emptySubhead}>Try clearing search filters or selecting another region</Text>
            </View>
          ) : (
            filtered.map(job => {
              const mc = matchColor(job.match_score);
              const avatarBg = companyColor(job.company_name);
              return (
                <TouchableOpacity
                  key={job.id}
                  style={s.jobMobileCard}
                  onPress={() => setSelected(job)}
                  activeOpacity={0.8}
                >
                  {/* Top: Avatar, Title & Match Pill */}
                  <View style={s.cardTopRow}>
                    <View style={[s.avatarCircle, { backgroundColor: avatarBg }]}>
                      <Text style={s.avatarInitial}>{(job.company_name || '?')[0].toUpperCase()}</Text>
                    </View>

                    <View style={s.cardHeaderDetails}>
                      <Text style={s.jobRoleTitle} numberOfLines={2}>{job.title}</Text>
                      <Text style={s.companySubTitle}>{job.company_name}</Text>
                    </View>

                    <View style={[s.matchScoreBadge, { backgroundColor: mc.bg }]}>
                      <Text style={[s.matchScoreText, { color: mc.fg }]}>{job.match_score}%</Text>
                      <Text style={[s.matchScoreLabel, { color: mc.fg }]}>Match</Text>
                    </View>
                  </View>

                  {/* Middle: Tags Row (Location & Work Style) */}
                  <View style={s.chipsRow}>
                    <View style={s.infoChip}>
                      <Text style={s.infoChipText} numberOfLines={1}>📍 {job.location}</Text>
                    </View>
                    <View style={s.infoChip}>
                      <Text style={s.infoChipText}>{arrangementIcon(job.work_arrangement)}</Text>
                    </View>
                    {job.salary && job.salary !== 'Competitive' && (
                      <View style={s.infoChip}>
                        <Text style={s.infoChipText}>💰 {job.salary}</Text>
                      </View>
                    )}
                  </View>

                  {/* Bottom Skills */}
                  {(job.matching_skills?.length ?? 0) > 0 && (
                    <View style={s.skillsWrapRow}>
                      {job.matching_skills!.slice(0, 3).map(sk => (
                        <View key={sk} style={s.skillBadge}>
                          <Text style={s.skillBadgeText}>{sk}</Text>
                        </View>
                      ))}
                      {job.matching_skills!.length > 3 && (
                        <Text style={s.extraSkillsCount}>+{job.matching_skills!.length - 3} skills</Text>
                      )}
                    </View>
                  )}

                  {/* Footer */}
                  <View style={s.jobCardFooterBar}>
                    <Text style={s.jobPublishedTime}>Discovered {job.published_at}</Text>
                    <Text style={s.viewDetailsAction}>Details & Apply →</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}

      {/* ── Mobile Modal Sheet ── */}
      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelected(null)}>
        {selected && (
          <View style={s.modalContainer}>
            <View style={s.modalTopNav}>
              <TouchableOpacity onPress={() => setSelected(null)} style={s.modalCloseHit}>
                <Text style={s.modalCloseLabel}>✕ Close</Text>
              </TouchableOpacity>
              <Text style={s.modalNavTitle} numberOfLines={1}>{selected.company_name}</Text>
              <View style={{ width: 44 }} />
            </View>

            <ScrollView style={s.modalScroll} contentContainerStyle={s.modalBody} showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={s.modalHero}>
                <Text style={s.modalRole}>{selected.title}</Text>
                <Text style={s.modalCompany}>{selected.company_name} · {selected.location}</Text>

                <View style={[s.modalScoreBox, { backgroundColor: matchColor(selected.match_score).bg }]}>
                  <Text style={[s.modalScoreNum, { color: matchColor(selected.match_score).fg }]}>
                    {selected.match_score}% AI Relevance Match
                  </Text>
                  <Text style={[s.modalScoreSub, { color: matchColor(selected.match_score).fg }]}>
                    Scored based on candidate CV & technical profile
                  </Text>
                </View>
              </View>

              {/* Skills breakdown */}
              {(selected.matching_skills?.length ?? 0) > 0 && (
                <View style={s.sectionBlock}>
                  <Text style={s.sectionHeading}>✅ Matching Skills</Text>
                  <View style={s.modalChipsWrap}>
                    {selected.matching_skills!.map(s => (
                      <View key={s} style={s.matchSkillChip}>
                        <Text style={s.matchSkillChipText}>{s}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {(selected.missing_skills?.length ?? 0) > 0 && (
                <View style={s.sectionBlock}>
                  <Text style={s.sectionHeading}>📌 Missing / Secondary Skills</Text>
                  <View style={s.modalChipsWrap}>
                    {selected.missing_skills!.map(s => (
                      <View key={s} style={s.missingSkillChip}>
                        <Text style={s.missingSkillChipText}>{s}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {selected.description && (
                <View style={s.sectionBlock}>
                  <Text style={s.sectionHeading}>Job Description</Text>
                  <Text style={s.descParagraph}>{selected.description}</Text>
                </View>
              )}
            </ScrollView>

            {/* Sticky Action Footer */}
            {selected.canonical_url && (
              <View style={s.stickyFooter}>
                <TouchableOpacity
                  style={s.applyNowBtn}
                  onPress={() => Linking.openURL(selected.canonical_url!)}
                >
                  <Text style={s.applyNowBtnText}>Apply on Company Portal ↗</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },

  // Search
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  searchBarContainer: {
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
  searchIconText: {
    fontSize: 14,
  },
  searchField: {
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

  // Tabs
  tabsWrapper: {
    paddingVertical: 6,
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  regionTabChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2DFE1',
  },
  regionTabChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  regionTabChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  regionTabChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Meta
  metaResultsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  resultsCountText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
  },
  sortedByText: {
    fontSize: 11,
    color: colors.textSecondary,
  },

  // Loading / Empty
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
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 6,
  },
  emptyIcon: {
    fontSize: 36,
  },
  emptyHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  emptySubhead: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Job Cards
  jobsScroll: {
    flex: 1,
  },
  jobsListContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 32,
    gap: 12,
  },
  jobMobileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E8E8EC',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  cardHeaderDetails: {
    flex: 1,
    gap: 2,
  },
  jobRoleTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 19,
  },
  companySubTitle: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  matchScoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    alignItems: 'center',
  },
  matchScoreText: {
    fontSize: 13,
    fontWeight: '900',
  },
  matchScoreLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  infoChip: {
    backgroundColor: '#F7F6F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ECEAEB',
  },
  infoChipText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },

  skillsWrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  skillBadge: {
    backgroundColor: colors.subtleMehroon,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  skillBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  extraSkillsCount: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
  },

  jobCardFooterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F2EFF0',
  },
  jobPublishedTime: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  viewDetailsAction: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalTopNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EDED',
  },
  modalCloseHit: {
    paddingVertical: 4,
  },
  modalCloseLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  modalNavTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    maxWidth: 200,
  },
  modalScroll: {
    flex: 1,
  },
  modalBody: {
    padding: 18,
    gap: 16,
    paddingBottom: 40,
  },
  modalHero: {
    gap: 6,
  },
  modalRole: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
    lineHeight: 24,
  },
  modalCompany: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  modalScoreBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    gap: 2,
  },
  modalScoreNum: {
    fontSize: 14,
    fontWeight: '800',
  },
  modalScoreSub: {
    fontSize: 11,
  },
  sectionBlock: {
    gap: 8,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  matchSkillChip: {
    backgroundColor: '#E8F5EE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  matchSkillChipText: {
    fontSize: 12,
    color: '#16845B',
    fontWeight: '700',
  },
  missingSkillChip: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  missingSkillChipText: {
    fontSize: 12,
    color: '#B91C1C',
    fontWeight: '700',
  },
  descParagraph: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  stickyFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0EDED',
    backgroundColor: '#FFFFFF',
  },
  applyNowBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyNowBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
