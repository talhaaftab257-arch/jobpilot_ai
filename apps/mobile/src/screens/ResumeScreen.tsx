/**
 * ResumeScreen — 100% Native Mobile Interface
 * Mobile CV safety gate cards with responsive switches and skill chips.
 */
import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView,
  TouchableOpacity, RefreshControl, Switch, Alert
} from 'react-native';
import { colors } from '../theme/colors';
import { mobileApi, MobileResume } from '../services/api';

const REGION_META: Record<string, { color: string; bg: string; label: string }> = {
  PK:   { color: '#16845B', bg: '#E8F5EE', label: 'Pakistan / South Asia' },
  EU:   { color: '#1D4ED8', bg: '#DBEAFE', label: 'European Union' },
  ASIA: { color: '#B7791F', bg: '#FEF5E7', label: 'Asia Pacific' },
  ARAB: { color: '#641E32', bg: '#F5E9ED', label: 'Arab / Gulf Region' },
};

export const ResumeScreen: React.FC = () => {
  const [resumes, setResumes] = useState<MobileResume[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const data = await mobileApi.getResumes();
    setResumes(data);
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const toggleResume = (id: string) => {
    setResumes(prev =>
      prev.map(r => (r.id === id ? { ...r, is_active: !r.is_active } : r))
    );
  };

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* ── Mobile Safety Banner ── */}
      <View style={s.safetyBannerCard}>
        <View style={s.safetyBannerIconWrap}>
          <Text style={s.safetyBannerIcon}>🛡</Text>
        </View>
        <View style={s.safetyBannerTextWrap}>
          <Text style={s.safetyBannerHeading}>Regional Safety Gates</Text>
          <Text style={s.safetyBannerDesc}>
            Only regions with an <Text style={{ fontWeight: '800' }}>Active CV</Text> will receive automated job applications.
          </Text>
        </View>
      </View>

      {/* ── 4 Regional Cards ── */}
      {resumes.map(r => {
        const meta = REGION_META[r.region_code] || {
          color: colors.primary,
          bg: colors.subtleMehroon,
          label: r.region_code,
        };

        return (
          <View key={r.id} style={s.cvCard}>
            {/* Top row: Flag, Title, Switch */}
            <View style={s.cvCardTopRow}>
              <View style={[s.flagSquare, { backgroundColor: meta.bg }]}>
                <Text style={s.flagEmoji}>{r.flag}</Text>
              </View>

              <View style={s.cvTitleContainer}>
                <Text style={s.cvRegionTitle}>{r.region_name}</Text>
                <Text style={s.cvRegionSub}>{meta.label}</Text>
              </View>

              <Switch
                value={r.is_active}
                onValueChange={() => toggleResume(r.id)}
                trackColor={{ false: '#DDD', true: colors.primary }}
                thumbColor={r.is_active ? '#FFFFFF' : '#F4F3F4'}
              />
            </View>

            {/* Document File Bar */}
            <View style={[s.filePillBox, { backgroundColor: meta.bg }]}>
              <Text style={s.fileDocIcon}>📄</Text>
              <Text style={[s.fileNameText, { color: meta.color }]} numberOfLines={1}>
                {r.filename}
              </Text>
              <View style={[s.statusBadge, { backgroundColor: r.is_active ? '#D1FAE5' : '#F0EEF0' }]}>
                <Text style={[s.statusBadgeText, { color: r.is_active ? '#047857' : '#888' }]}>
                  {r.is_active ? '● Active' : '○ Paused'}
                </Text>
              </View>
            </View>

            {/* Skills */}
            {r.skills.length > 0 && (
              <View style={s.skillsWrap}>
                {r.skills.map(sk => (
                  <View key={sk} style={s.skillChip}>
                    <Text style={s.skillChipText}>{sk}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Footer */}
            <View style={s.cardFooterRow}>
              <Text style={s.footerUpdatedText}>Last synced {r.updated_at}</Text>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert('Replace CV', `To upload a new CV for ${r.region_name}, visit the web dashboard.`)
                }
              >
                <Text style={[s.replaceLink, { color: meta.color }]}>Replace CV ↗</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
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

  // Banner
  safetyBannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E8E8EC',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  safetyBannerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.subtleMehroon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safetyBannerIcon: {
    fontSize: 20,
  },
  safetyBannerTextWrap: {
    flex: 1,
    gap: 2,
  },
  safetyBannerHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  safetyBannerDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },

  // CV Cards
  cvCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E8EC',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  cvCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flagSquare: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagEmoji: {
    fontSize: 22,
  },
  cvTitleContainer: {
    flex: 1,
    gap: 2,
  },
  cvRegionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  cvRegionSub: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // Document bar
  filePillBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
  },
  fileDocIcon: {
    fontSize: 14,
  },
  fileNameText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },

  // Skills
  skillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillChip: {
    backgroundColor: '#F6F4F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#ECEAEB',
  },
  skillChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },

  // Footer
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F2EFF0',
  },
  footerUpdatedText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  replaceLink: {
    fontSize: 11,
    fontWeight: '800',
  },
});
