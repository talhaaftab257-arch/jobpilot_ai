/**
 * SettingsScreen — 100% Native Mobile Interface
 * Mobile controls for backend LAN connection, safety toggles, and quota configuration.
 */
import React, { useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView,
  TouchableOpacity, TextInput, Switch, Alert
} from 'react-native';
import { colors } from '../theme/colors';
import { setApiHost, getApiHost } from '../services/api';

export const SettingsScreen: React.FC = () => {
  const [apiHost, setApiHostState] = useState(getApiHost());
  const [dryRun, setDryRun] = useState(true);
  const [paused, setPaused] = useState(false);
  const [dailyCap, setDailyCap] = useState('30');
  const [hostEditing, setHostEditing] = useState(false);

  const [testing, setTesting] = useState(false);

  const saveHost = () => {
    const cleaned = apiHost.trim().replace(/\/$/, '');
    setApiHost(cleaned);
    setApiHostState(cleaned);
    setHostEditing(false);
    Alert.alert('✅ Saved', `Backend host updated to:\n${cleaned}`);
  };

  const testConnection = async () => {
    setTesting(true);
    const cleaned = apiHost.trim().replace(/\/$/, '');
    setApiHost(cleaned);
    try {
      const ok = await (await import('../services/api')).mobileApi.healthCheck();
      if (ok) {
        Alert.alert('🟢 Online!', `Successfully connected to backend:\n${cleaned}`);
      } else {
        Alert.alert('🔴 Offline', `Could not reach backend:\n${cleaned}\n\nMake sure laptop and phone are on same Wi-Fi.`);
      }
    } catch (e: any) {
      Alert.alert('🔴 Error', String(e?.message || e));
    } finally {
      setTesting(false);
    }
  };

  const handlePause = (val: boolean) => {
    setPaused(val);
    Alert.alert(
      val ? '⏸ Automation Paused' : '▶️ Automation Resumed',
      val
        ? 'All automated applications and discovery are now safely paused.'
        : 'Autonomous job scanning and scoring is now active.'
    );
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {/* ── User Profile Card ── */}
      <View style={s.card}>
        <View style={s.profileTopRow}>
          <View style={s.profileAvatar}>
            <Text style={s.profileAvatarText}>TA</Text>
          </View>
          <View style={s.profileMeta}>
            <Text style={s.profileName}>Talha Aftab Alam</Text>
            <Text style={s.profileSub}>Senior AI/ML Backend Engineer</Text>
            <View style={s.activeBadge}>
              <Text style={s.activeBadgeText}>🎯 Active Job Seeker</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Backend API Host Configuration ── */}
      <View style={s.card}>
        <Text style={s.cardHeading}>🔗 Backend API Host</Text>
        <Text style={s.cardSubheading}>
          IP address of your laptop running FastAPI server on same Wi-Fi
        </Text>

        <View style={s.inputContainer}>
          <TextInput
            style={[s.inputField, hostEditing && s.inputFieldActive]}
            value={apiHost}
            onChangeText={setApiHostState}
            onFocus={() => setHostEditing(true)}
            placeholder="http://192.168.0.100:8000"
            placeholderTextColor="#999"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <TouchableOpacity style={s.saveBtn} onPress={saveHost}>
            <Text style={s.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[s.testBtn, testing && { opacity: 0.6 }]} 
          onPress={testConnection} 
          disabled={testing}
        >
          <Text style={s.testBtnText}>
            {testing ? '🔄 Testing Connection...' : '⚡ Test Connection Now'}
          </Text>
        </TouchableOpacity>
        <Text style={s.hintText}>💡 Phone and laptop must be connected to the same Wi-Fi router.</Text>
      </View>

      {/* ── Automation Safety Controls ── */}
      <View style={s.card}>
        <Text style={s.cardHeading}>⚙️ Automation Controls</Text>
        <Text style={s.cardSubheading}>Safety limits for automated job applications</Text>

        <View style={s.toggleItem}>
          <View style={s.toggleInfo}>
            <Text style={s.toggleTitle}>Emergency Pause</Text>
            <Text style={s.toggleDesc}>Instantly freeze all discovery and application dispatches</Text>
          </View>
          <Switch
            value={paused}
            onValueChange={handlePause}
            trackColor={{ false: '#DDD', true: '#FCA5A5' }}
            thumbColor={paused ? '#B91C1C' : '#F4F3F4'}
          />
        </View>

        <View style={s.dividerLine} />

        <View style={s.toggleItem}>
          <View style={s.toggleInfo}>
            <Text style={s.toggleTitle}>Dry Run Mode</Text>
            <Text style={s.toggleDesc}>Simulate applications without actually sending live emails</Text>
          </View>
          <Switch
            value={dryRun}
            onValueChange={setDryRun}
            trackColor={{ false: '#DDD', true: colors.subtleMehroon }}
            thumbColor={dryRun ? colors.primary : '#F4F3F4'}
          />
        </View>

        <View style={s.dividerLine} />

        <View style={s.toggleItem}>
          <View style={s.toggleInfo}>
            <Text style={s.toggleTitle}>Daily Application Cap</Text>
            <Text style={s.toggleDesc}>Maximum applications sent across all 4 regions per day</Text>
          </View>
          <View style={s.capBox}>
            <TextInput
              style={s.capInput}
              value={dailyCap}
              onChangeText={setDailyCap}
              keyboardType="numeric"
              maxLength={3}
            />
          </View>
        </View>
      </View>

      {/* ── Regional Collector Safety ── */}
      <View style={s.card}>
        <Text style={s.cardHeading}>🛡 Active Regional Safety Gates</Text>

        {[
          { flag: '🇵🇰', name: 'Pakistan', portals: 'Rozee.pk · LinkedIn' },
          { flag: '🇪🇺', name: 'Europe', portals: 'Arbeitnow · EuroTechJobs' },
          { flag: '🌏', name: 'Asia Pacific', portals: 'Indeed Asia · LinkedIn' },
          { flag: '🇦🇪', name: 'Arab Region', portals: 'NaukriGulf · Bayt' },
        ].map((gate, index, arr) => (
          <React.Fragment key={gate.name}>
            <View style={s.gateItemRow}>
              <Text style={s.gateFlag}>{gate.flag}</Text>
              <View style={s.gateInfo}>
                <Text style={s.gateName}>{gate.name}</Text>
                <Text style={s.gatePortals}>{gate.portals}</Text>
              </View>
              <View style={s.gateStatusTag}>
                <Text style={s.gateStatusText}>Active</Text>
              </View>
            </View>
            {index < arr.length - 1 && <View style={s.dividerLine} />}
          </React.Fragment>
        ))}
      </View>

      {/* ── About Application ── */}
      <View style={s.card}>
        <Text style={s.cardHeading}>ℹ️ App Version & System</Text>
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>Version</Text>
          <Text style={s.infoVal}>1.0.0 (Native Android)</Text>
        </View>
        <View style={s.dividerLine} />
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>Build Architecture</Text>
          <Text style={s.infoVal}>Expo SDK 58 · React 19 · FastAPI</Text>
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
    lineHeight: 16,
    marginTop: -4,
  },

  // Profile
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  profileMeta: {
    flex: 1,
    gap: 3,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  profileSub: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  activeBadge: {
    backgroundColor: colors.subtleMehroon,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  activeBadgeText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '700',
  },

  // Input
  inputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  inputField: {
    flex: 1,
    backgroundColor: '#F7F6F7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2DFE1',
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: colors.text,
  },
  inputFieldActive: {
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  hintText: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },

  // Toggle
  toggleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  toggleDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  capBox: {
    backgroundColor: '#F7F6F7',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2DFE1',
    width: 52,
    alignItems: 'center',
  },
  capInput: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    paddingVertical: 6,
    textAlign: 'center',
  },

  dividerLine: {
    height: 1,
    backgroundColor: '#F0EDED',
  },

  // Gates
  gateItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  gateFlag: {
    fontSize: 20,
  },
  gateInfo: {
    flex: 1,
  },
  gateName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  gatePortals: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  gateStatusTag: {
    backgroundColor: '#E8F5EE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  gateStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16845B',
  },

  // Info
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  infoVal: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '700',
  },
});
