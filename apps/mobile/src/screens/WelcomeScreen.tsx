/**
 * WelcomeScreen — 100% Exact match to Web Welcome Screen
 * Deep luxury burgundy card, logo, feature list, and Continue button.
 */
import React from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  Dimensions, ScrollView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

interface WelcomeScreenProps {
  onContinue: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FEATURES = [
  { icon: '🧭', label: 'Global Job Search' },
  { icon: '⚖️', label: 'AI Matching' },
  { icon: '🛡️', label: 'Auto Applications' },
  { icon: '📈', label: 'Track & Grow' },
];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onContinue }) => {
  return (
    <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── Main Dark Burgundy Luxury Card ── */}
        <View style={s.luxuryCard}>
          {/* Subtle Ambient Decorative Glow Circle */}
          <View style={s.decorGlow} />

          {/* Brand Header */}
          <View style={s.brandRow}>
            <View style={s.logoBox}>
              <Text style={s.logoEmoji}>✈</Text>
            </View>
            <View style={s.brandTextWrap}>
              <Text style={s.brandTitle}>JobPilot AI</Text>
              <Text style={s.brandTagline}>Global Jobs. Smarter Search.</Text>
            </View>
          </View>

          {/* Pitch & Headline */}
          <View style={s.pitchContainer}>
            <Text style={s.mainHeadline}>
              Your AI-Powered{'\n'}Job Hunting Assistant
            </Text>
            <Text style={s.pitchDesc}>
              Discover global opportunities, match with your skills, automate applications, and build your future — all in one place.
            </Text>
          </View>

          {/* Features Checklist */}
          <View style={s.featuresList}>
            {FEATURES.map((item) => (
              <View key={item.label} style={s.featureRow}>
                <View style={s.featureIconBox}>
                  <Text style={s.featureIcon}>{item.icon}</Text>
                </View>
                <View style={s.featureAccentBar} />
                <Text style={s.featureLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Continue Action Button ── */}
        <View style={s.bottomActionContainer}>
          <TouchableOpacity
            style={s.continueButton}
            onPress={onContinue}
            activeOpacity={0.85}
          >
            <Text style={s.continueButtonText}>Continue</Text>
            <Text style={s.continueArrow}>→</Text>
          </TouchableOpacity>

          <Text style={s.subHint}>
            Ready to discover opportunities across 4 regions
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#070204',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 18,
  },

  // Luxury Card
  luxuryCard: {
    backgroundColor: '#120409',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 28,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 8,
  },
  decorGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(100, 30, 50, 0.28)',
  },

  // Brand Row
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    zIndex: 2,
  },
  logoBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E11D48',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  logoEmoji: {
    fontSize: 22,
    color: '#FFFFFF',
  },
  brandTextWrap: {
    gap: 2,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  brandTagline: {
    fontSize: 11,
    color: '#A3A3A3',
    fontWeight: '600',
  },

  // Pitch
  pitchContainer: {
    marginTop: 22,
    gap: 10,
    zIndex: 2,
  },
  mainHeadline: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 31,
    letterSpacing: -0.4,
  },
  pitchDesc: {
    fontSize: 13,
    color: '#D4D4D4',
    lineHeight: 20,
    fontWeight: '400',
  },

  // Features
  featuresList: {
    marginTop: 22,
    gap: 12,
    zIndex: 2,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#260A13',
    borderWidth: 1,
    borderColor: 'rgba(100, 30, 50, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIcon: {
    fontSize: 15,
  },
  featureAccentBar: {
    width: 2.5,
    height: 14,
    borderRadius: 2,
    backgroundColor: '#E11D48',
  },
  featureLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F5F5F5',
    letterSpacing: 0.2,
  },

  // Bottom CTA
  bottomActionContainer: {
    gap: 10,
    alignItems: 'center',
  },
  continueButton: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 6,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  continueArrow: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  subHint: {
    fontSize: 11,
    color: '#737373',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default WelcomeScreen;
