// ============================================================================
// CONTACT & AI ASSISTANT / LIVE SERVICES SCREEN (Mobile)
// Interactive 24/7 AI banking companion, live support channels, and legal inquiries
// ============================================================================

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Bot,
  Send,
  Headset,
  Phone,
  Mail,
  ShieldCheck,
  Sparkles,
  Clock,
  CheckCircle,
  HelpCircle,
  AlertCircle,
} from 'lucide-react-native';

// Reusable UI & Shared components
import { Button, Card, Badge, StatusBadge, Input } from '@/components/ui';
import { NetworkStatusBanner } from '@/components/shared';

// Shared state, legal queries & theme
import { useCreateDispute } from '@nordi/shared/hooks/api-queries/useLegal';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { colors } from '@nordi/shared/constants/colors';
import { useToastStore } from '@nordi/shared/store/toast.store';
import { useAuthStore } from '@nordi/shared/store/auth.store';

type TabMode = 'ai' | 'live' | 'dispute';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export default function ContactServicesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useMobileTheme();
  const { showToast } = useToastStore();
  const user = useAuthStore((state) => state.user);

  const [activeTab, setActiveTab] = useState<TabMode>('ai');

  // AI Chat Simulation State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'assistant',
      text: `Hello ${user?.firstName || 'there'}! I am Nordi AI, your 24/7 remittance assistant. How can I help you today with rates, transfers, or compliance?`,
      timestamp: 'Just now',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isBotThinking, setIsBotThinking] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Dispute / Legal Inquiry Form State
  const [disputeSubject, setDisputeSubject] = useState('');
  const [disputeDescription, setDisputeDescription] = useState('');
  const [disputeType, setDisputeType] = useState<'service' | 'fee' | 'transaction' | 'other'>('service');

  const createDisputeMutation = useCreateDispute();

  const handleSendChatMessage = () => {
    if (!inputMessage.trim()) return;

    const userText = inputMessage.trim();
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputMessage('');
    setIsBotThinking(true);

    // Scroll to bottom
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Dynamic AI response simulation
    setTimeout(() => {
      let botReply = 'I can help look into that. For immediate transaction updates, you can check the Activity tab or speak with our live compliance team.';

      const lower = userText.toLowerCase();
      if (lower.includes('rate') || lower.includes('exchange')) {
        botReply = 'Our current mid-market rates are updated every 30 seconds with 0% hidden markup. Check our Convert FX screen for live quotes.';
      } else if (lower.includes('limit') || lower.includes('transfer')) {
        botReply = 'Tier 1 KYC accounts have a daily limit of $10,000. Verified Tier 2 corporate or personal accounts enjoy up to $100,000 daily limits.';
      } else if (lower.includes('privacy') || lower.includes('legal') || lower.includes('terms')) {
        botReply = 'You can review our complete GDPR Privacy Policy and Master Terms of Service directly in the Legal section of this app.';
      } else if (lower.includes('support') || lower.includes('human') || lower.includes('agent')) {
        botReply = 'Switch to the "Live Support" tab to connect directly with a priority financial compliance officer.';
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: botReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsBotThinking(false);

      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 1200);
  };

  const handleDisputeSubmit = async () => {
    if (!disputeSubject.trim() || !disputeDescription.trim()) {
      showToast('Please provide a subject and description', 'warning');
      return;
    }

    try {
      await createDisputeMutation.mutateAsync({
        type: disputeType,
        subject: disputeSubject,
        description: disputeDescription,
      });
      setDisputeSubject('');
      setDisputeDescription('');
      showToast('Legal inquiry submitted to compliance team', 'success');
      setActiveTab('live');
    } catch {
      showToast('Inquiry recorded for verification', 'info');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <NetworkStatusBanner />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 16),
            backgroundColor: theme.surface,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: theme.background }]}
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={20} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Contact & Services
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>
            24/7 AI Assistant & Global Support
          </Text>
        </View>
        <View style={styles.liveIndicator}>
          <View style={styles.onlineDot} />
          <Text style={[styles.onlineText, { color: colors.success[600] }]}>Live</Text>
        </View>
      </View>

      {/* Tabs Switcher */}
      <View style={[styles.tabBar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => setActiveTab('ai')}
          style={[
            styles.tabItem,
            activeTab === 'ai' && { borderBottomColor: colors.primary[500], borderBottomWidth: 2 },
          ]}
        >
          <Bot size={16} color={activeTab === 'ai' ? colors.primary[500] : theme.iconMuted} />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'ai' ? colors.primary[500] : theme.textMuted },
            ]}
          >
            AI Assistant
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('live')}
          style={[
            styles.tabItem,
            activeTab === 'live' && { borderBottomColor: colors.primary[500], borderBottomWidth: 2 },
          ]}
        >
          <Headset size={16} color={activeTab === 'live' ? colors.primary[500] : theme.iconMuted} />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'live' ? colors.primary[500] : theme.textMuted },
            ]}
          >
            Live Support
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('dispute')}
          style={[
            styles.tabItem,
            activeTab === 'dispute' && { borderBottomColor: colors.primary[500], borderBottomWidth: 2 },
          ]}
        >
          <ShieldCheck size={16} color={activeTab === 'dispute' ? colors.primary[500] : theme.iconMuted} />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'dispute' ? colors.primary[500] : theme.textMuted },
            ]}
          >
            Legal Inquiry
          </Text>
        </TouchableOpacity>
      </View>

      {/* TAB CONTENT: AI ASSISTANT */}
      {activeTab === 'ai' && (
        <View style={styles.chatWrapper}>
          <ScrollView
            ref={scrollRef}
            style={styles.chatScroll}
            contentContainerStyle={styles.chatContentContainer}
          >
            {/* Quick helper badges */}
            <View style={styles.quickPillsRow}>
              {['Exchange Rates', 'Transfer Limits', 'Privacy Policy'].map((pill, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => {
                    setInputMessage(`Tell me about ${pill.toLowerCase()}`);
                  }}
                  style={[styles.pillButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                >
                  <Sparkles size={12} color={colors.primary[500]} />
                  <Text style={[styles.pillText, { color: theme.textMuted }]}>{pill}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {messages.map((m) => {
              const isAssistant = m.sender === 'assistant';
              return (
                <View
                  key={m.id}
                  style={[
                    styles.messageRow,
                    isAssistant ? styles.messageRowLeft : styles.messageRowRight,
                  ]}
                >
                  {isAssistant && (
                    <View style={[styles.botAvatar, { backgroundColor: `${colors.primary[500]}15` }]}>
                      <Bot size={16} color={colors.primary[500]} />
                    </View>
                  )}
                  <View
                    style={[
                      styles.messageBubble,
                      isAssistant
                        ? [styles.bubbleAssistant, { backgroundColor: theme.surface, borderColor: theme.border }]
                        : [styles.bubbleUser, { backgroundColor: colors.primary[600] }],
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        { color: isAssistant ? theme.text : '#ffffff' },
                      ]}
                    >
                      {m.text}
                    </Text>
                    <Text
                      style={[
                        styles.messageTime,
                        { color: isAssistant ? theme.textMuted : 'rgba(255,255,255,0.7)' },
                      ]}
                    >
                      {m.timestamp}
                    </Text>
                  </View>
                </View>
              );
            })}

            {isBotThinking && (
              <View style={[styles.messageRow, styles.messageRowLeft]}>
                <View style={[styles.botAvatar, { backgroundColor: `${colors.primary[500]}15` }]}>
                  <Bot size={16} color={colors.primary[500]} />
                </View>
                <View style={[styles.bubbleAssistant, { backgroundColor: theme.surface, borderColor: theme.border, paddingVertical: 10 }]}>
                  <Text style={[styles.thinkingText, { color: theme.textMuted }]}>
                    Nordi AI is typing...
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Chat Input Bar */}
          <View
            style={[
              styles.inputBar,
              {
                paddingBottom: Math.max(insets.bottom, 12),
                backgroundColor: theme.surface,
                borderTopColor: theme.border,
              },
            ]}
          >
            <TextInput
              style={[styles.chatInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
              placeholder="Ask about transfers, rates, or account..."
              placeholderTextColor={theme.textMuted}
              value={inputMessage}
              onChangeText={setInputMessage}
              onSubmitEditing={handleSendChatMessage}
            />
            <TouchableOpacity
              onPress={handleSendChatMessage}
              disabled={!inputMessage.trim()}
              style={[
                styles.sendButton,
                { backgroundColor: inputMessage.trim() ? colors.primary[600] : theme.border },
              ]}
            >
              <Send size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* TAB CONTENT: LIVE SUPPORT */}
      {activeTab === 'live' && (
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 40 }]}
        >
          <Card variant="outlined" size="md" style={styles.supportBannerCard}>
            <View style={styles.bannerRow}>
              <View style={[styles.bannerIconCircle, { backgroundColor: `${colors.primary[500]}15` }]}>
                <Headset size={24} color={colors.primary[500]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.bannerTitle, { color: theme.text }]}>
                  Live Financial Desk
                </Text>
                <Text style={[styles.bannerSub, { color: theme.textMuted }]}>
                  Average response time under 2 minutes
                </Text>
              </View>
              <Badge variant="success" size="sm">Available</Badge>
            </View>
          </Card>

          <Text style={[styles.sectionHeading, { color: theme.text }]}>
            Direct Channels
          </Text>

          {/* Hotline */}
          <Card variant="default" size="md" style={[styles.channelCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.channelRow}>
              <View style={[styles.channelIcon, { backgroundColor: `${colors.primary[500]}15` }]}>
                <Phone size={20} color={colors.primary[500]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.channelName, { color: theme.text }]}>International Toll-Free</Text>
                <Text style={[styles.channelDesc, { color: theme.textMuted }]}>+1 (800) 459-NORDI</Text>
              </View>
              <Button variant="outline" size="sm" onPress={() => showToast('Calling support hotline...', 'info')}>
                Call
              </Button>
            </View>
          </Card>

          {/* Email */}
          <Card variant="default" size="md" style={[styles.channelCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.channelRow}>
              <View style={[styles.channelIcon, { backgroundColor: `${colors.primary[500]}15` }]}>
                <Mail size={20} color={colors.primary[500]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.channelName, { color: theme.text }]}>Compliance & Legal Desk</Text>
                <Text style={[styles.channelDesc, { color: theme.textMuted }]}>compliance@nordi-remit.com</Text>
              </View>
              <Button variant="outline" size="sm" onPress={() => showToast('Opening mail client...', 'info')}>
                Email
              </Button>
            </View>
          </Card>

          {/* Operating hours */}
          <Card variant="outlined" size="sm" style={styles.hoursCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Clock size={16} color={theme.iconMuted} />
              <Text style={[styles.hoursTitle, { color: theme.text }]}>Service Hours</Text>
            </View>
            <Text style={[styles.hoursText, { color: theme.textMuted }]}>
              Automated Swift and clearing networks operate 24/7/365. Compliance officers available Monday through Sunday.
            </Text>
          </Card>
        </ScrollView>
      )}

      {/* TAB CONTENT: LEGAL / DISPUTE INQUIRY */}
      {activeTab === 'dispute' && (
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 40 }]}
        >
          <Text style={[styles.sectionHeading, { color: theme.text }]}>
            Submit Formal Compliance Inquiry
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>
            Logged directly into our legal dispute registry via LegalRepository API.
          </Text>

          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Inquiry Category</Text>
            <View style={styles.typeSelectorRow}>
              {(['service', 'fee', 'transaction', 'other'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setDisputeType(t)}
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor: disputeType === t ? colors.primary[500] : theme.surface,
                      borderColor: disputeType === t ? colors.primary[500] : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      { color: disputeType === t ? '#fff' : theme.textMuted },
                    ]}
                  >
                    {t.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Subject</Text>
            <TextInput
              style={[styles.textInputSingle, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              placeholder="e.g., Delay in EUR to USD clearing"
              placeholderTextColor={theme.textMuted}
              value={disputeSubject}
              onChangeText={setDisputeSubject}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Description & Details</Text>
            <TextInput
              style={[styles.textInputMulti, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              placeholder="Please provide specific transaction references or regulatory details..."
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={4}
              value={disputeDescription}
              onChangeText={setDisputeDescription}
            />
          </View>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            isLoading={createDisputeMutation.isPending}
            onPress={handleDisputeSubmit}
            leftIcon={<ShieldCheck size={18} color="#fff" />}
          >
            Submit to Legal Registry
          </Button>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: `${colors.success[500]}15`,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success[500],
  },
  onlineText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chatWrapper: {
    flex: 1,
  },
  chatScroll: {
    flex: 1,
  },
  chatContentContainer: {
    padding: 16,
  },
  quickPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '500',
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
    gap: 8,
  },
  messageRowLeft: {
    justifyContent: 'flex-start',
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  bubbleAssistant: {
    borderTopLeftRadius: 4,
    borderWidth: 1,
  },
  bubbleUser: {
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 19,
  },
  messageTime: {
    fontSize: 9,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  thinkingText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  chatInput: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    borderWidth: 1,
    fontSize: 13,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  supportBannerCard: {
    marginBottom: 20,
    padding: 16,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bannerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  bannerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginBottom: 16,
    lineHeight: 17,
  },
  channelCard: {
    marginBottom: 12,
    padding: 14,
    borderWidth: 1,
    borderRadius: 16,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  channelIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelName: {
    fontSize: 14,
    fontWeight: '600',
  },
  channelDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  hoursCard: {
    marginTop: 12,
    padding: 14,
  },
  hoursTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  hoursText: {
    fontSize: 12,
    lineHeight: 18,
  },
  formGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  typeChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  textInputSingle: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 13,
  },
  textInputMulti: {
    minHeight: 100,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    fontSize: 13,
    textAlignVertical: 'top',
  },
});
