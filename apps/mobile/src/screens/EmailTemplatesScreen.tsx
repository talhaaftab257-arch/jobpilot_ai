/**
 * EmailTemplatesScreen — 100% Native Mobile Interface
 * Outreach email template editor with dynamic variable pills and live preview.
 */
import React, { useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TextInput,
  TouchableOpacity, Alert
} from 'react-native';
import { colors } from '../theme/colors';

const VARIABLES = [
  '{{job_title}}',
  '{{company_name}}',
  '{{your_skills}}',
  '{{name}}',
  '{{link_url}}',
];

export const EmailTemplatesScreen: React.FC = () => {
  const [subject, setSubject] = useState(
    'Application for {{job_title}} — Talha Aftab Alam (Senior AI Engineer)'
  );
  const [body, setBody] = useState(
    `Dear Hiring Team,\n\nI am writing to express my strong interest in the {{job_title}} position at {{company_name}}.\n\nWith over 5 years of production experience designing scalable AI backends, autonomous multi-agent pipelines, and high-performance microservices using {{your_skills}}, I believe I can deliver immediate impact.\n\nKey Highlights:\n• Architected enterprise AI backend systems handling 10k+ daily queries\n• Built robust async pipelines with FastAPI and PostgreSQL\n• Deployed production microservices across cloud environments\n\nI welcome the opportunity to connect and discuss how my expertise fits your roadmap.\n\nBest regards,\nTalha Aftab Alam`
  );
  const [previewMode, setPreviewMode] = useState(false);

  const insertVariable = (v: string) => {
    setBody(prev => `${prev} ${v}`);
  };

  const handleSave = () => {
    Alert.alert('✅ Saved', 'Application email template has been updated and synced locally.');
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {/* ── Mode Switch Header ── */}
      <View style={s.modeRow}>
        <View style={s.modeToggle}>
          <TouchableOpacity
            style={[s.modeBtn, !previewMode && s.modeBtnActive]}
            onPress={() => setPreviewMode(false)}
          >
            <Text style={[s.modeBtnText, !previewMode && s.modeBtnTextActive]}>✏️ Editor</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.modeBtn, previewMode && s.modeBtnActive]}
            onPress={() => setPreviewMode(true)}
          >
            <Text style={[s.modeBtnText, previewMode && s.modeBtnTextActive]}>👁 Live Preview</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.saveTopBtn} onPress={handleSave}>
          <Text style={s.saveTopBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      {!previewMode ? (
        <>
          {/* ── Subject Field ── */}
          <View style={s.card}>
            <Text style={s.fieldLabel}>Email Subject Line</Text>
            <TextInput
              style={s.subjectInput}
              value={subject}
              onChangeText={setSubject}
              placeholder="Email subject..."
              placeholderTextColor="#999"
            />
          </View>

          {/* ── Quick Variables Chips ── */}
          <View style={s.variablesCard}>
            <Text style={s.fieldLabel}>Insert Dynamic Tags</Text>
            <View style={s.tagsWrap}>
              {VARIABLES.map(v => (
                <TouchableOpacity
                  key={v}
                  style={s.varTag}
                  onPress={() => insertVariable(v)}
                  activeOpacity={0.7}
                >
                  <Text style={s.varTagText}>{v}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Body Field ── */}
          <View style={s.card}>
            <Text style={s.fieldLabel}>Email Body (Markdown / Text)</Text>
            <TextInput
              style={s.bodyInput}
              value={body}
              onChangeText={setBody}
              placeholder="Email body text..."
              placeholderTextColor="#999"
              multiline
              textAlignVertical="top"
            />
          </View>
        </>
      ) : (
        /* ── Live Preview Mode ── */
        <View style={s.previewCard}>
          <View style={s.previewHeader}>
            <Text style={s.previewMetaLabel}>To: <Text style={s.previewMetaVal}>recruiter@company.com</Text></Text>
            <Text style={s.previewMetaLabel}>Subject: <Text style={s.previewMetaSubject}>
              {subject
                .replace('{{job_title}}', 'Senior AI Engineer')
                .replace('{{company_name}}', 'TechSolutions')}
            </Text></Text>
          </View>

          <View style={s.divider} />

          <Text style={s.previewBodyText}>
            {body
              .replace(/{{job_title}}/g, 'Senior AI Engineer')
              .replace(/{{company_name}}/g, 'TechSolutions')
              .replace(/{{your_skills}}/g, 'Python, FastAPI, and Agentic AI')
              .replace(/{{name}}/g, 'Talha Aftab Alam')
              .replace(/{{link_url}}/g, 'https://linkedin.com/in/talhaalam')}
          </Text>
        </View>
      )}
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

  modeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#E8E5E7',
    borderRadius: 12,
    padding: 3,
  },
  modeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 9,
  },
  modeBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  modeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modeBtnTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  saveTopBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  saveTopBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
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
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subjectInput: {
    backgroundColor: '#F7F6F7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2DFE1',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
  },
  bodyInput: {
    backgroundColor: '#F7F6F7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2DFE1',
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 13,
    color: colors.text,
    minHeight: 220,
    lineHeight: 20,
  },

  variablesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8E8EC',
    gap: 8,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  varTag: {
    backgroundColor: colors.subtleMehroon,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  varTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },

  // Preview
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E8E8EC',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  previewHeader: {
    gap: 6,
  },
  previewMetaLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  previewMetaVal: {
    color: colors.text,
    fontWeight: '700',
  },
  previewMetaSubject: {
    color: colors.primaryDark,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0EDED',
  },
  previewBodyText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 21,
  },
});
