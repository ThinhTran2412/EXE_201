import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList, KeyboardAvoidingView, Platform, Pressable,
  StyleSheet, Text, TextInput, View, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getConversationMessages, Message } from '../api';
import * as ChatHub from '../ChatHub';
import { useAuth } from '../../auth/AuthContext';
import { colors } from '../../../app/theme/colors';
import { fontSizes, fontWeights } from '../../../app/theme/typography';
import { radius, spacing } from '../../../app/theme/spacing';

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function getUserIdFromToken(token: string): string {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.user_id ?? payload.sub ?? '';
  } catch {
    return '';
  }
}

function Bubble({ msg, isMe }: { msg: Message; isMe: boolean }) {
  return (
    <View style={[styles.bubbleWrapper, isMe ? styles.bubbleWrapperMe : styles.bubbleWrapperThem]}>
      <View style={[styles.bubble, isMe ? styles.bubbleMeBg : styles.bubbleThemBg]}>
        <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
          {msg.content}
        </Text>
      </View>
      <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>
        {formatTime(msg.sentAt)}
      </Text>
    </View>
  );
}

export default function ChatScreen() {
  const navigation  = useNavigation<any>();
  const route       = useRoute<any>();
  const { session } = useAuth();
  const { conversationId, name, participantName } = route.params as { conversationId: string; name?: string; participantName?: string };
  const headerTitle = participantName ?? name ?? 'Đang trò chuyện';

  const currentUserId = useMemo(
    () => session?.accessToken ? getUserIdFromToken(session.accessToken) : '',
    [session?.accessToken],
  );

  const [messages, setMessages] = useState<Message[]>([]);
  const [text,     setText]     = useState('');
  const [loading,  setLoading]  = useState(true);
  const [sending,  setSending]  = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    getConversationMessages(conversationId)
      .then(setMessages)
      .finally(() => setLoading(false));
  }, [conversationId]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    (async () => {
      await ChatHub.joinConversation(conversationId);
      cleanup = ChatHub.onReceiveMessage((incoming) => {
        setMessages((prev) => [...prev, {
          id:          Date.now().toString(),
          senderId:    incoming.senderId,
          senderRole:  incoming.senderRole,
          content:     incoming.content,
          contentType: 'Text',
          sentAt:      incoming.sentAt,
        }]);
      });
    })();

    return () => {
      cleanup?.();
      ChatHub.leaveConversation(conversationId);
    };
  }, [conversationId]);

  const listData = useMemo(
    () => messages.map((msg) => ({ msg, isMe: msg.senderId === currentUserId })),
    [messages, currentUserId],
  );

  async function handleSend() {
    if (!text.trim()) return;
    setSending(true);
    try {
      await ChatHub.sendMessage(conversationId, text.trim());
      setText('');
    } catch {}
    setSending(false);
  }

  function initiateCall(type: 'audio' | 'video') {
    navigation.navigate('Call', {
      conversationId,
      callType: type,
      role: 'caller',
      name: headerTitle,
      participantName: headerTitle,
    });
  }

  function handleCallPress() {
    Alert.alert('Bắt đầu cuộc gọi', 'Chọn loại cuộc gọi bạn muốn thực hiện:', [
      { text: '📞 Cuộc gọi thoại', onPress: () => initiateCall('audio') },
      { text: '📹 Cuộc gọi video', onPress: () => initiateCall('video') },
      { text: 'Hủy', style: 'cancel' },
    ], { cancelable: true });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.dark} />
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>{headerTitle}</Text>
          <Text style={styles.headerSub}>Đang trực tuyến</Text>
        </View>
        <Pressable onPress={handleCallPress} style={styles.headerAction}>
          <Ionicons name="call-outline" size={22} color={colors.dark} />
        </Pressable>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        {loading
          ? <ActivityIndicator size="large" color={colors.accent} style={styles.loader} />
          : <FlatList
              ref={listRef}
              data={listData}
              keyExtractor={(item) => item.msg.id}
              contentContainerStyle={styles.messageList}
              renderItem={({ item }) => <Bubble msg={item.msg} isMe={item.isMe} />}
              onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
              ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>Chưa có tin nhắn nào.{'\n'}Bắt đầu trò chuyện! 👋</Text></View>}
            />
        }

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Nhắn tin..."
            placeholderTextColor={colors.textLight}
            multiline
            maxLength={2000}
          />
          <Pressable style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]} onPress={handleSend} disabled={!text.trim() || sending}>
            {sending ? <ActivityIndicator size="small" color={colors.background} /> : <Ionicons name="send" size={18} color={colors.background} />}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  loader: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[4], paddingVertical: spacing[3], borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing[3] },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1 },
  headerName: { fontSize: fontSizes.md, fontWeight: fontWeights.bold, color: colors.dark },
  headerSub: { fontSize: fontSizes.xs, color: colors.success },
  headerAction: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  messageList: { paddingHorizontal: spacing[4], paddingVertical: spacing[4], gap: spacing[3], flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: spacing[12] },
  emptyText: { color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  bubbleWrapper: { width: '100%', flexDirection: 'column', gap: spacing[1.5] },
  bubbleWrapperMe: { alignItems: 'flex-end' },
  bubbleWrapperThem: { alignItems: 'flex-start' },
  bubble: { maxWidth: '82%', borderRadius: radius.lg, paddingVertical: spacing[3], paddingHorizontal: spacing[4] },
  bubbleMeBg: { backgroundColor: colors.dark, borderBottomRightRadius: 4 },
  bubbleThemBg: { backgroundColor: colors.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
  bubbleText: { fontSize: fontSizes.md, lineHeight: 22 },
  bubbleTextMe: { color: colors.background },
  bubbleTextThem: { color: colors.dark },
  bubbleTime: { fontSize: fontSizes.xs, color: colors.textLight },
  bubbleTimeMe: { color: colors.textLight, textAlign: 'right' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing[3], paddingHorizontal: spacing[4], paddingVertical: spacing[3], borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: spacing[4], paddingVertical: spacing[2.5], fontSize: fontSizes.md, color: colors.dark, borderWidth: 1, borderColor: colors.border, maxHeight: 120 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
});