/**
 * AIAssistantScreen — 100% Native Mobile Interface
 * Interactive AI Chat Assistant with quick prompts, tailored advice, and career recommendations.
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { colors } from '../theme/colors';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
}

const QUICK_ACTIONS = [
  { icon: '🎯', title: 'Analyze Match', prompt: 'Analyze my job match score and suggest improvements' },
  { icon: '✨', title: 'Resume Keywords', prompt: 'What keywords should I add to my resume for better ATS matching?' },
  { icon: '✉️', title: 'Outreach Email', prompt: 'Review and improve my outreach email template' },
  { icon: '💼', title: 'Interview Prep', prompt: 'Give me interview preparation tips for upcoming AI Engineer calls' },
];

const AI_RESPONSES: Record<string, string> = {
  default: `I've analyzed your JobPilot AI profile and live data:\n\n• **Match Score Rating:** Your technical profile matches ~88% of discovered AI roles.\n• **Key Strengths:** Python, FastAPI, Microservices, Agentic Workflows.\n• **Recommended Additions:** Consider highlighting Kubernetes, Docker, and Vector DBs.\n\nWhich area would you like to explore further?`,
  keywords: `Based on 900+ active roles in your feeds, here are **high-impact keywords** to include:\n\n• **Core:** LLMs, RAG, LangChain, FastAPI, Python, Vector Search\n• **Infrastructure:** Docker, Redis, PostgreSQL, CI/CD\n• **Frameworks:** PyTorch, HuggingFace, Supabase\n\nThese keywords appear in 82% of top-matched openings.`,
  email: `Here is an optimized outreach message tailored for recruiters:\n\n"Dear Hiring Team,\n\nI noticed the AI/ML Engineer role at your organization. With 5+ years building production backend and agentic AI architectures using Python and FastAPI, I specialize in high-throughput microservices.\n\nI would love to connect and discuss how my background aligns with your upcoming goals.\n\nBest regards,\nTalha Aftab Alam"`,
  interview: `Here are **key prep topics** for upcoming technical interviews:\n\n1. **System Design:** Designing scalable RAG pipelines and handling rate limits.\n2. **FastAPI & Async:** Event loops, async SQLAlchemy, and dependency injection.\n3. **Evaluation Metrics:** Precision/Recall in LLM output evaluation and vector retrieval accuracy.\n\nGood luck! You are well-positioned for Senior-level rounds.`,
};

export const AIAssistantScreen: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello Talha! 👋 I'm your AI Career Co-Pilot.\n\nI can analyze your job matches, optimize resume keywords, improve email outreach, and prepare you for technical interviews. What can I help you with today?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, isTyping]);

  const handleSend = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const lower = trimmed.toLowerCase();
      let response = AI_RESPONSES.default;
      if (lower.includes('keyword') || lower.includes('ats') || lower.includes('resume')) {
        response = AI_RESPONSES.keywords;
      } else if (lower.includes('email') || lower.includes('template') || lower.includes('outreach')) {
        response = AI_RESPONSES.email;
      } else if (lower.includes('interview') || lower.includes('prep') || lower.includes('call')) {
        response = AI_RESPONSES.interview;
      }

      const botMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        role: 'assistant',
        content: response,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* ── Quick Action Horizontal Chips ── */}
      <View style={s.quickActionsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.quickActionsScroll}>
          {QUICK_ACTIONS.map(q => (
            <TouchableOpacity
              key={q.title}
              style={s.quickChip}
              onPress={() => handleSend(q.prompt)}
              activeOpacity={0.7}
            >
              <Text style={s.quickChipIcon}>{q.icon}</Text>
              <Text style={s.quickChipTitle}>{q.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Messages List ── */}
      <ScrollView
        ref={scrollRef}
        style={s.messagesScroll}
        contentContainerStyle={s.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map(m => {
          const isUser = m.role === 'user';
          return (
            <View key={m.id} style={[s.msgWrapper, isUser ? s.msgWrapperUser : s.msgWrapperBot]}>
              {!isUser && (
                <View style={s.botAvatar}>
                  <Text style={s.botAvatarEmoji}>🤖</Text>
                </View>
              )}
              <View style={[s.bubble, isUser ? s.bubbleUser : s.bubbleBot]}>
                <Text style={[s.bubbleText, isUser ? s.bubbleTextUser : s.bubbleTextBot]}>
                  {m.content}
                </Text>
                <Text style={[s.bubbleTime, isUser ? s.bubbleTimeUser : s.bubbleTimeBot]}>
                  {m.time}
                </Text>
              </View>
            </View>
          );
        })}

        {isTyping && (
          <View style={[s.msgWrapper, s.msgWrapperBot]}>
            <View style={s.botAvatar}>
              <Text style={s.botAvatarEmoji}>🤖</Text>
            </View>
            <View style={[s.bubble, s.bubbleBot, s.typingBubble]}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={s.typingText}>AI is thinking...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Chat Input Bar ── */}
      <View style={s.inputBar}>
        <TextInput
          style={s.chatInput}
          placeholder="Ask AI anything about your job search..."
          placeholderTextColor="#999"
          value={inputText}
          onChangeText={setInputText}
          multiline={false}
          onSubmitEditing={() => handleSend(inputText)}
        />
        <TouchableOpacity
          style={[s.sendBtn, !inputText.trim() && s.sendBtnDisabled]}
          onPress={() => handleSend(inputText)}
          disabled={!inputText.trim()}
        >
          <Text style={s.sendBtnText}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },

  // Quick action chips
  quickActionsWrap: {
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8EC',
  },
  quickActionsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F2F4',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8E2E5',
    gap: 6,
  },
  quickChipIcon: {
    fontSize: 13,
  },
  quickChipTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },

  // Messages
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
    gap: 12,
  },
  msgWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  msgWrapperBot: {
    justifyContent: 'flex-start',
    marginRight: 40,
  },
  msgWrapperUser: {
    justifyContent: 'flex-end',
    marginLeft: 40,
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.subtleMehroon,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  botAvatarEmoji: {
    fontSize: 16,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '88%',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    gap: 4,
  },
  bubbleBot: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E8EC',
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 19,
  },
  bubbleTextBot: {
    color: colors.text,
  },
  bubbleTextUser: {
    color: '#FFFFFF',
  },
  bubbleTime: {
    fontSize: 9,
    alignSelf: 'flex-end',
  },
  bubbleTimeBot: {
    color: colors.textSecondary,
  },
  bubbleTimeUser: {
    color: 'rgba(255,255,255,0.7)',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  typingText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },

  // Input
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E8EC',
    gap: 10,
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#F5F5F7',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.text,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
});
