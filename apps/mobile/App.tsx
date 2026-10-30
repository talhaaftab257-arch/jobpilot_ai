/**
 * App.tsx — 100% Native Mobile Architecture
 * Combines Bottom Tab Navigation (thumb-friendly mobile standard)
 * with a Left Slide Drawer for all secondary tools (Settings, Calendar, Analytics).
 */
import React, { useState, useRef } from 'react';
import {
  StyleSheet, Text, TouchableOpacity, View,
  ScrollView, Platform, Animated, Dimensions,
  TouchableWithoutFeedback
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { colors } from './src/theme/colors';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { JobsScreen } from './src/screens/JobsScreen';
import { ApplicationsScreen } from './src/screens/ApplicationsScreen';
import { ResumeScreen } from './src/screens/ResumeScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { AIAssistantScreen } from './src/screens/AIAssistantScreen';
import { CalendarScreen } from './src/screens/CalendarScreen';
import { EmailTemplatesScreen } from './src/screens/EmailTemplatesScreen';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DRAWER_WIDTH = Math.min(290, SCREEN_WIDTH * 0.82);

export type ScreenId =
  | 'overview' | 'jobs' | 'matched' | 'applications'
  | 'resumes' | 'assistant' | 'calendar' | 'templates'
  | 'analytics' | 'integrations' | 'automation' | 'settings';

const DRAWER_ITEMS: Array<{ id: ScreenId; label: string; icon: string; section?: string; badge?: string }> = [
  { id: 'overview',     label: 'Overview',        icon: '📊', section: 'MAIN' },
  { id: 'jobs',         label: 'Discover Jobs',   icon: '🔍' },
  { id: 'matched',      label: 'Matched Jobs',    icon: '✨', badge: 'AI' },
  { id: 'applications', label: 'Applications',    icon: '✉️' },
  { id: 'resumes',      label: 'Resume Library',  icon: '📄', badge: '4', section: 'MANAGE' },
  { id: 'templates',    label: 'Email Templates', icon: '✍️' },
  { id: 'assistant',    label: 'AI Assistant',    icon: '🤖' },
  { id: 'calendar',     label: 'Calendar',        icon: '📅', section: 'TOOLS' },
  { id: 'analytics',    label: 'Analytics',       icon: '📈' },
  { id: 'settings',     label: 'Settings & Host', icon: '⚙️' },
];

// All 10 screens are fully built and functional
const ALL_SCREENS: ScreenId[] = [
  'overview', 'jobs', 'matched', 'applications',
  'resumes', 'assistant', 'calendar', 'templates',
  'analytics', 'settings'
];

function MainNavigator() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('overview');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.parallel([
      Animated.spring(drawerAnim, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 0 }),
      Animated.timing(overlayAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.spring(drawerAnim, { toValue: -DRAWER_WIDTH, useNativeDriver: true, speed: 22, bounciness: 0 }),
      Animated.timing(overlayAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
    ]).start(() => setDrawerOpen(false));
  };

  const navigate = (id: ScreenId) => {
    setCurrentScreen(id);
    closeDrawer();
  };

  const currentLabel = DRAWER_ITEMS.find(n => n.id === currentScreen)?.label ?? 'Overview';

  return (
    <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      {/* ── Native Top Brand Bar ── */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.hamburgerHit} onPress={openDrawer}>
          <View style={s.hamLine} />
          <View style={[s.hamLine, { width: 15 }]} />
          <View style={s.hamLine} />
        </TouchableOpacity>

        <TouchableOpacity style={s.brandTouchable} onPress={() => navigate('overview')}>
          <View style={s.brandIconBox}>
            <Text style={s.brandIconEmoji}>✈</Text>
          </View>
          <View>
            <Text style={s.brandTitle}>JobPilot AI</Text>
            <Text style={s.brandSubTitle}>Autonomous Career Agent</Text>
          </View>
        </TouchableOpacity>

        <View style={s.headerPill}>
          <Text style={s.headerPillText} numberOfLines={1}>{currentLabel}</Text>
        </View>
      </View>

      {/* ── Active Screen Container ── */}
      <View style={s.screenContainer}>
        {currentScreen === 'overview'     && <DashboardScreen onNavigate={(s) => navigate(s as ScreenId)} />}
        {currentScreen === 'jobs'         && <JobsScreen />}
        {currentScreen === 'matched'      && <JobsScreen />}
        {currentScreen === 'applications' && <ApplicationsScreen />}
        {currentScreen === 'resumes'      && <ResumeScreen />}
        {currentScreen === 'assistant'    && <AIAssistantScreen />}
        {currentScreen === 'calendar'     && <CalendarScreen />}
        {currentScreen === 'templates'    && <EmailTemplatesScreen />}
        {currentScreen === 'analytics'    && <AnalyticsScreen />}
        {currentScreen === 'settings'     && <SettingsScreen />}
        {(currentScreen === 'integrations' || currentScreen === 'automation') && <SettingsScreen />}
      </View>

      {/* ── Thumb-Friendly Bottom Tab Bar (Native Mobile Standard) ── */}
      <View style={s.bottomTabBar}>
        <TouchableOpacity
          style={[s.tabButton, currentScreen === 'overview' && s.tabButtonActive]}
          onPress={() => setCurrentScreen('overview')}
        >
          <Text style={[s.tabIcon, currentScreen === 'overview' && s.tabIconActive]}>📊</Text>
          <Text style={[s.tabLabel, currentScreen === 'overview' && s.tabLabelActive]}>Overview</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.tabButton, (currentScreen === 'jobs' || currentScreen === 'matched') && s.tabButtonActive]}
          onPress={() => setCurrentScreen('jobs')}
        >
          <Text style={[s.tabIcon, (currentScreen === 'jobs' || currentScreen === 'matched') && s.tabIconActive]}>🔍</Text>
          <Text style={[s.tabLabel, (currentScreen === 'jobs' || currentScreen === 'matched') && s.tabLabelActive]}>Jobs</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.tabButton, currentScreen === 'applications' && s.tabButtonActive]}
          onPress={() => setCurrentScreen('applications')}
        >
          <Text style={[s.tabIcon, currentScreen === 'applications' && s.tabIconActive]}>✉️</Text>
          <Text style={[s.tabLabel, currentScreen === 'applications' && s.tabLabelActive]}>Tracker</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.tabButton, currentScreen === 'resumes' && s.tabButtonActive]}
          onPress={() => setCurrentScreen('resumes')}
        >
          <Text style={[s.tabIcon, currentScreen === 'resumes' && s.tabIconActive]}>📄</Text>
          <Text style={[s.tabLabel, currentScreen === 'resumes' && s.tabLabelActive]}>Resumes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.tabButton, currentScreen === 'settings' && s.tabButtonActive]}
          onPress={() => setCurrentScreen('settings')}
        >
          <Text style={[s.tabIcon, currentScreen === 'settings' && s.tabIconActive]}>⚙️</Text>
          <Text style={[s.tabLabel, currentScreen === 'settings' && s.tabLabelActive]}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* ── Slide-in Drawer Overlay ── */}
      {drawerOpen && (
        <TouchableWithoutFeedback onPress={closeDrawer}>
          <Animated.View style={[s.overlay, { opacity: overlayAnim }]} />
        </TouchableWithoutFeedback>
      )}

      {/* ── Native Left Slide Drawer ── */}
      <Animated.View style={[s.drawerPanel, { transform: [{ translateX: drawerAnim }] }]}>
        <View style={s.drawerHeader}>
          <View style={s.drawerBrandBox}>
            <View style={s.drawerBrandIcon}>
              <Text style={s.drawerBrandIconText}>✈</Text>
            </View>
            <View>
              <Text style={s.drawerBrandTitle}>JobPilot AI</Text>
              <Text style={s.drawerBrandSub}>Full Platform Hub</Text>
            </View>
          </View>
          <TouchableOpacity onPress={closeDrawer} style={s.closeDrawerBtn}>
            <Text style={s.closeDrawerText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={s.drawerScroll} showsVerticalScrollIndicator={false}>
          {DRAWER_ITEMS.map((item, idx) => {
            const isActive = currentScreen === item.id;
            const prev = DRAWER_ITEMS[idx - 1];
            const showSec = item.section && item.section !== prev?.section;

            return (
              <React.Fragment key={item.id}>
                {showSec && <Text style={s.sectionHeader}>{item.section}</Text>}
                <TouchableOpacity
                  style={[s.navItemBtn, isActive && s.navItemBtnActive]}
                  onPress={() => navigate(item.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.navItemIcon, isActive && s.navItemIconActive]}>{item.icon}</Text>
                  <Text style={[s.navItemLabel, isActive && s.navItemLabelActive]}>{item.label}</Text>
                  {item.badge && (
                    <View style={[s.itemBadge, isActive && s.itemBadgeActive]}>
                      <Text style={[s.itemBadgeText, isActive && s.itemBadgeTextActive]}>{item.badge}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </React.Fragment>
            );
          })}
          <View style={{ height: 24 }} />
        </ScrollView>

        <View style={s.drawerFooter}>
          <View style={s.drawerAvatar}>
            <Text style={s.drawerAvatarText}>TA</Text>
          </View>
          <View style={s.drawerUserMeta}>
            <Text style={s.drawerUserName}>Talha Aftab Alam</Text>
            <Text style={s.drawerUserStatus}>Active Job Seeker</Text>
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

export default function App() {
  const [showWelcome, setShowWelcome] = useState(true);

  if (showWelcome) {
    return (
      <SafeAreaProvider>
        <WelcomeScreen onContinue={() => setShowWelcome(false)} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <MainNavigator />
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.black,
  },

  // Top Bar
  topBar: {
    backgroundColor: colors.black,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hamburgerHit: {
    padding: 6,
    gap: 4,
    justifyContent: 'center',
  },
  hamLine: {
    width: 20,
    height: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  brandTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandIconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandIconEmoji: {
    fontSize: 15,
    color: '#FFFFFF',
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  brandSubTitle: {
    fontSize: 9,
    color: '#888',
    fontWeight: '600',
  },
  headerPill: {
    flex: 1,
    alignItems: 'flex-end',
  },
  headerPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#AAA',
    backgroundColor: '#262626',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  // Main Screen
  screenContainer: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },

  // Bottom Navigation Bar
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#171717',
    borderTopWidth: 1,
    borderTopColor: '#262626',
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    minHeight: 56,
    elevation: 8,
    zIndex: 10,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    borderRadius: 10,
    marginHorizontal: 3,
    gap: 2,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
  },
  tabIcon: {
    fontSize: 16,
    opacity: 0.5,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#888',
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // Overlay
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 20,
  },

  // Drawer
  drawerPanel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#171717',
    borderRightWidth: 1,
    borderRightColor: '#262626',
    zIndex: 30,
    elevation: 20,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  drawerBrandBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  drawerBrandIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerBrandIconText: {
    fontSize: 16,
    color: '#FFF',
  },
  drawerBrandTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFF',
  },
  drawerBrandSub: {
    fontSize: 10,
    color: '#777',
    marginTop: 1,
  },
  closeDrawerBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#262626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeDrawerText: {
    fontSize: 12,
    color: '#AAA',
    fontWeight: '700',
  },
  drawerScroll: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  sectionHeader: {
    fontSize: 9,
    fontWeight: '800',
    color: '#666',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 6,
  },
  navItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 10,
    marginBottom: 2,
    gap: 10,
  },
  navItemBtnActive: {
    backgroundColor: colors.primary,
  },
  navItemIcon: {
    fontSize: 16,
    width: 22,
    textAlign: 'center',
    opacity: 0.6,
  },
  navItemIconActive: {
    opacity: 1,
  },
  navItemLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#AAA',
  },
  navItemLabelActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  itemBadge: {
    backgroundColor: '#262626',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  itemBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  itemBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#888',
  },
  itemBadgeTextActive: {
    color: '#FFF',
  },
  drawerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#262626',
  },
  drawerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerAvatarText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  drawerUserMeta: {
    flex: 1,
  },
  drawerUserName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EEE',
  },
  drawerUserStatus: {
    fontSize: 10,
    color: '#777',
  },
});
