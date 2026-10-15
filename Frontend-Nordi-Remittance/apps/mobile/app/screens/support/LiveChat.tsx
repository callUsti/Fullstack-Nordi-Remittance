// ============================================================================
// LIVE CHAT — Real-time chat with Nordi Support assistant
// ============================================================================
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { ScreenHeader } from '@/components/shared/ScreenHeader';

interface ChatMessage {
  id: string;
  from: 'user' | 'bot';
  text: string;
  time: string;
}

const now = () =>
  new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

export default function LiveChatScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);
  const listRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      from: 'bot',
      text: "Hello! 👋 I'm Nordi Assistant. How can I help you today?",
      time: now(),
    },
  ]);
  const [input, setInput] = useState('');

  const send = () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { id: String(Date.now()), from: 'user', text: input.trim(), time: now() };
    const botMsg: ChatMessage = {
      id: String(Date.now() + 1),
      from: 'bot',
      text: "Thanks for your message! A support agent will be with you shortly. Our average response time is under 2 minutes.",
      time: now(),
    };
    setMessages((m) => [...m, userMsg, botMsg]);
    setInput('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <ScreenHeader
        title="Live Chat"
        subtitle="Nordi Support · Online"
        showBack
        onBackPress={() => router.back()}
      />

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={s.messageList}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={[s.bubble, item.from === 'user' ? s.userBubble : s.botBubble]}>
            {item.from === 'bot' && (
              <View style={s.botAvatar}>
                <Ionicons name="headset" size={14} color="#fff" />
              </View>
            )}
            <View style={item.from === 'user' ? s.userContent : s.botContent}>
              <Text style={item.from === 'user' ? s.userText : s.botText}>{item.text}</Text>
              <Text style={s.timeText}>{item.time}</Text>
            </View>
          </View>
        )}
      />

      <View style={s.inputBar}>
        <TextInput
          style={s.textInput}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message…"
          placeholderTextColor={theme.colors.textSecondary}
          onSubmitEditing={send}
          returnKeyType="send"
        />
        <TouchableOpacity style={s.sendBtn} onPress={send} activeOpacity={0.8}>
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function createStyles(theme: ReturnType<typeof useMobileTheme>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    messageList: { padding: 16, paddingBottom: 8 },
    bubble: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end', gap: 8 },
    userBubble: { justifyContent: 'flex-end' },
    botBubble: { justifyContent: 'flex-start' },
    botAvatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    userContent: {
      maxWidth: '78%',
      backgroundColor: theme.colors.primary,
      borderRadius: 16,
      borderBottomRightRadius: 4,
      padding: 12,
    },
    botContent: {
      maxWidth: '78%',
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderBottomLeftRadius: 4,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    userText: { color: '#fff', fontSize: 13, lineHeight: 18 },
    botText: { color: theme.colors.textPrimary, fontSize: 13, lineHeight: 18 },
    timeText: { fontSize: 9, color: 'rgba(255,255,255,0.6)', marginTop: 4, alignSelf: 'flex-end' },
    inputBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    textInput: {
      flex: 1,
      backgroundColor: theme.colors.background,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 14,
      color: theme.colors.textPrimary,
    },
    sendBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
