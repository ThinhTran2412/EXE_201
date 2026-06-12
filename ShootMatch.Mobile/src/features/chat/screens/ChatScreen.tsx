import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList, KeyboardAvoidingView, Platform, Pressable,
  StyleSheet, Text, TextInput, View, ActivityIndicator, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getConversationMessages, Message } from '../api';
import * as ChatHub from '../ChatHub';
import { useAuth } from '../../auth/AuthContext';
import { colors } from '../../../app/theme/colors';
import { usePhotographerTheme } from '../../photographer/PhotographerThemeContext';
import { fontSizes, fontWeights } from '../../../app/theme/typography';
import { radius, spacing } from '../../../app/theme/spacing';
import { isImageMessage, getMessageImageUri } from '../utils/messageDisplay';
import { useSendChatImage } from '../hooks/useSendChatImage';
import { formatImageUrl } from '../../../shared/utils/formatImageUrl';

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function Bubble({
  msg,
  isMe,
  showTime,
  participantAvatarUrl,
  showAvatar,
}: {
  msg: Message;
  isMe: boolean;
  showTime: boolean;
  participantAvatarUrl?: string;
  showAvatar?: boolean;
}) {
  const isImg = isImageMessage(msg);
  return (
    <View style={[styles.bubbleWrapper, isMe ? styles.bubbleWrapperMe : styles.bubbleWrapperThem, { marginBottom: showTime ? spacing[3] : spacing[1] }]}>
      <View style={[styles.bubbleRow, isMe ? styles.bubbleRowMe : styles.bubbleRowThem]}>
        {!isMe && (
          <View style={styles.avatarWrapper}>
            {showAvatar ? (
              <Image
                source={{ uri: participantAvatarUrl ?? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80' }}
                style={styles.smallAvatar}
              />
            ) : (
              <View style={styles.smallAvatarPlaceholder} />
            )}
          </View>
        )}
        <View style={[styles.bubble, isMe ? styles.bubbleMeBg : styles.bubbleThemBg, isImg && styles.bubbleImage]}>
          {isImg ? (
            <Image source={{ uri: getMessageImageUri(msg) }} style={styles.imageContent} resizeMode="cover" />
          ) : (
            <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
              {msg.content}
            </Text>
          )}
        </View>
      </View>
      {showTime && (
        <Text style={[styles.bubbleTime, isMe ? styles.bubbleTimeMe : styles.bubbleTimeThem]}>
          {formatTime(msg.sentAt)}
        </Text>
      )}
    </View>
  );
}

export default function ChatScreen() {
  const { isDark, colors: pColors } = usePhotographerTheme();
  const navigation  = useNavigation<any>();
  const route       = useRoute<any>();
  const { session } = useAuth();
  const { conversationId, name, participantName, participantAvatarUrl, photographerId } = route.params as {
    conversationId: string;
    name?: string;
    participantName?: string;
    participantAvatarUrl?: string;
    photographerId?: string;
  };
  const headerTitle = participantName ?? name ?? 'Đang trò chuyện';

  const [messages, setMessages] = useState<Message[]>([]);
  const [text,     setText]     = useState('');
  const [loading,  setLoading]  = useState(true);
  const [sending,  setSending]  = useState(false);
  const listRef = useRef<FlatList>(null);

  const { uploading, pickAndSend } = useSendChatImage(conversationId);

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
          contentType: incoming.contentType || 'Text',
          sentAt:      incoming.sentAt,
        }]);
      });
    })();

    return () => {
      cleanup?.();
      ChatHub.leaveConversation(conversationId);
    };
  }, [conversationId]);

  const listData = useMemo(() => {
    // DEBUG — xóa sau khi fix xong
    if (messages.length > 0) {
      const first = messages[0];
      console.log('[ChatScreen] session.userId:', session?.userId);
      console.log('[ChatScreen] session.role:', session?.role);
      console.log('[ChatScreen] first msg senderId:', first.senderId, 'senderRole:', first.senderRole);
    }
    return messages.map((msg, index) => {
      // Sử dụng senderRole làm tiêu chí chính vì luôn chính xác.
      // senderId chỉ dùng confirm thêm khi cả hai có giá trị.
      const myRole = session?.role?.toLowerCase() ?? '';
      const myId   = session?.userId?.trim().toLowerCase() ?? '';
      const msgRole = msg.senderRole?.toLowerCase() ?? '';
      const msgId   = msg.senderId?.trim().toLowerCase() ?? '';

      let isMe: boolean;
      if (myRole && msgRole) {
        // Primary: so sánh role
        isMe = msgRole === myRole;
        // Nếu có cả userId thì confirm thêm: phải khớp cả role và id
        if (isMe && myId && msgId) {
          isMe = msgId === myId;
        }
      } else if (myId && msgId) {
        isMe = msgId === myId;
      } else {
        isMe = false;
      }

      const next = messages[index + 1];
      let showTime = true;
      if (next) {
        const nextRole = next.senderRole?.toLowerCase() ?? '';
        const nextId   = next.senderId?.trim().toLowerCase() ?? '';
        let isNextMe: boolean;
        if (myRole && nextRole) {
          isNextMe = nextRole === myRole;
          if (isNextMe && myId && nextId) isNextMe = nextId === myId;
        } else if (myId && nextId) {
          isNextMe = nextId === myId;
        } else {
          isNextMe = false;
        }
        const diffMs = new Date(next.sentAt).getTime() - new Date(msg.sentAt).getTime();
        const diffMins = diffMs / (1000 * 60);
        if (isMe === isNextMe && diffMins < 5) {
          showTime = false;
        }
      }
      return { msg, isMe, showTime };
    });
  }, [messages, session?.userId, session?.role]);

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

  function handleHeaderPress() {
    if (session?.role === 'customer' && photographerId) {
      navigation.navigate('PhotographerProfile', { photographerId });
    }
  }

  return (
    <SafeAreaView style={[styles.safe, isDark && { backgroundColor: pColors.background }]} edges={['top', 'bottom']}>
      <View style={[styles.header, isDark && { backgroundColor: pColors.surface, borderBottomColor: pColors.border }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#0084FF" />
        </Pressable>
        <Pressable onPress={handleHeaderPress} style={styles.headerInfoPressable}>
          <Image
            source={{ uri: participantAvatarUrl ?? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80' }}
            style={styles.headerAvatar}
          />
          <View style={styles.headerInfo}>
            <Text style={[styles.headerName, isDark && { color: pColors.text }]} numberOfLines={1}>{headerTitle}</Text>
            <Text style={[styles.headerSub, isDark && { color: pColors.textMuted }]}>Đang hoạt động</Text>
          </View>
        </Pressable>
        <Pressable onPress={handleCallPress} style={styles.headerAction}>
          <Ionicons name="call" size={22} color="#0084FF" />
        </Pressable>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        {loading
          ? <ActivityIndicator size="large" color="#0084FF" style={styles.loader} />
          : <FlatList
              ref={listRef}
              data={listData}
              keyExtractor={(item) => item.msg.id}
              contentContainerStyle={styles.messageList}
              renderItem={({ item }) => (
                <Bubble
                  msg={item.msg}
                  isMe={item.isMe}
                  showTime={item.showTime}
                  participantAvatarUrl={participantAvatarUrl}
                  showAvatar={item.showTime}
                />
              )}
              onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
              ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>Chưa có tin nhắn nào.{'\n'}Bắt đầu trò chuyện! 👋</Text></View>}
            />
        }

        <View style={[styles.inputBar, isDark && { backgroundColor: pColors.surface, borderTopColor: pColors.border }]}>
          <Pressable style={styles.attachBtn} onPress={pickAndSend} disabled={uploading || sending}>
            {uploading ? (
              <ActivityIndicator size="small" color="#0084FF" />
            ) : (
              <Ionicons name="image" size={24} color="#0084FF" />
            )}
          </Pressable>
          <TextInput
            style={[styles.input, isDark && { backgroundColor: pColors.surfaceStrong, color: pColors.text }]}
            value={text}
            onChangeText={setText}
            placeholder="Nhắn tin..."
            placeholderTextColor="#8e8e93"
            multiline
            maxLength={2000}
          />
          <Pressable style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]} onPress={handleSend} disabled={!text.trim() || sending}>
            {sending ? <ActivityIndicator size="small" color={colors.background} /> : <Ionicons name="send" size={18} color="#0084FF" />}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  loader: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[2], paddingVertical: spacing[2], borderBottomWidth: 0.5, borderBottomColor: '#E4E6EB', gap: spacing[1], backgroundColor: '#FFFFFF' },
  backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  headerInfoPressable: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing[2.5] },
  headerAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#E4E6EB' },
  headerInfo: { flex: 1 },
  headerName: { fontSize: fontSizes.md, fontWeight: fontWeights.bold, color: '#050505' },
  headerSub: { fontSize: fontSizes.xs, color: '#65676B', marginTop: 1 },
  headerAction: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  messageList: { paddingHorizontal: spacing[4], paddingVertical: spacing[4], flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: spacing[12] },
  emptyText: { color: '#65676B', textAlign: 'center', lineHeight: 22 },
  bubbleWrapper: { width: '100%', flexDirection: 'column', gap: spacing[1] },
  bubbleWrapperMe: { alignItems: 'flex-end' },
  bubbleWrapperThem: { alignItems: 'flex-start' },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing[2], maxWidth: '85%' },
  bubbleRowMe: { alignSelf: 'flex-end' },
  bubbleRowThem: { alignSelf: 'flex-start' },
  avatarWrapper: { width: 28, alignItems: 'center' },
  smallAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E4E6EB' },
  smallAvatarPlaceholder: { width: 28, height: 28 },
  bubble: { borderRadius: 20, paddingVertical: spacing[2.5], paddingHorizontal: spacing[4], minHeight: 38, justifyContent: 'center' },
  bubbleImage: { paddingVertical: 0, paddingHorizontal: 0, backgroundColor: 'transparent', borderWidth: 0, overflow: 'hidden' },
  imageContent: { width: 220, height: 160, borderRadius: 16 },
  bubbleMeBg: { backgroundColor: '#0084FF' },
  bubbleThemBg: { backgroundColor: '#E4E6EB' },
  bubbleText: { fontSize: fontSizes.md, lineHeight: 20 },
  bubbleTextMe: { color: '#FFFFFF' },
  bubbleTextThem: { color: '#050505' },
  bubbleTime: { fontSize: fontSizes.xs - 1, color: '#65676B', marginTop: 2 },
  bubbleTimeMe: { textAlign: 'right', marginRight: 4 },
  bubbleTimeThem: { textAlign: 'left', marginLeft: 36 },
  inputBar: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderTopWidth: 0.5, borderTopColor: '#E4E6EB', backgroundColor: '#FFFFFF' },
  attachBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, backgroundColor: '#F0F2F5', borderRadius: 20, paddingHorizontal: spacing[4], paddingVertical: spacing[2], fontSize: fontSizes.md, color: '#050505', maxHeight: 120, minHeight: 38 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
});