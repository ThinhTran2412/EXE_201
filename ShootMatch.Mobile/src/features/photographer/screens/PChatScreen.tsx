import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getConversationMessages, Message } from '../../chat/api';
import * as ChatHub from '../../chat/ChatHub';
import { useAuth } from '../../auth/AuthContext';
import { getUserIdFromAccessToken } from '../../../shared/auth/currentUser';
import { getPhotographerProfile } from '../api';
import { formatImageUrl } from '../../../shared/utils/formatImageUrl';
import {
  buildMessageClusters,
  clustersToListRows,
  isPeerOnline,
  ONLINE_THRESHOLD_MS,
} from '../../chat/utils/messageClusters';
import ChatMessageClusterView from '../../chat/components/ChatMessageClusterView';
import ImageLightbox from '../../../shared/components/ImageLightbox';
import { useSendChatImage } from '../../chat/hooks/useSendChatImage';
import { colors } from '../../../app/theme/colors';
import { fontSizes, fontWeights } from '../../../app/theme/typography';
import { radius, spacing } from '../../../app/theme/spacing';

const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&q=80';

export default function PChatScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { session } = useAuth();
  const {
    conversationId,
    name,
    participantName,
    participantAvatarUrl,
    customerLastSeenAt,
  } = route.params as {
    conversationId: string;
    name?: string;
    participantName?: string;
    participantAvatarUrl?: string;
    customerLastSeenAt?: string;
  };

  const headerTitle = participantName ?? name ?? 'Đang trò chuyện';
  const theirAvatar = participantAvatarUrl ?? FALLBACK_AVATAR;

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [myAvatar, setMyAvatar] = useState('');
  const [myName, setMyName] = useState('Tôi');
  const [expandedClusterId, setExpandedClusterId] = useState<string | null>(null);
  const [peerLastSeenAt, setPeerLastSeenAt] = useState<string | undefined>(customerLastSeenAt);
  const [peerLiveUntil, setPeerLiveUntil] = useState(0);
  const [lightboxUri, setLightboxUri] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);
  const { uploading: uploadingImage, pickAndSend } = useSendChatImage(conversationId);

  const peerOnline = isPeerOnline(peerLastSeenAt, peerLiveUntil);

  useEffect(() => {
    getPhotographerProfile()
      .then((p) => {
        if (p?.avatarUrl) setMyAvatar(formatImageUrl(p.avatarUrl));
        if (p?.displayName?.trim()) setMyName(p.displayName.trim());
      })
      .catch(() => {});
  }, []);

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
        if (incoming.senderRole === 'customer') {
          setPeerLiveUntil(Date.now() + ONLINE_THRESHOLD_MS);
          setPeerLastSeenAt(incoming.sentAt);
        }
        setMessages((prev) => {
          if (prev.some((m) => m.id === incoming.id)) return prev;
          return [...prev, {
            id: incoming.id,
            senderId: incoming.senderId,
            senderRole: incoming.senderRole,
            content: incoming.content,
            contentType: incoming.contentType ?? 'Text',
            sentAt: incoming.sentAt,
            mediaPreviewUrl: incoming.mediaPreviewUrl,
            mediaExpiresAt: incoming.mediaExpiresAt,
          }];
        });
      });
    })();
    return () => {
      cleanup?.();
      ChatHub.leaveConversation(conversationId);
    };
  }, [conversationId]);

  const currentUserId = useMemo(
    () => (session?.accessToken ? getUserIdFromAccessToken(session.accessToken, session.role) : session?.userId) ?? '',
    [session?.accessToken, session?.role, session?.userId],
  );

  const listRows = useMemo(() => {
    const clusters = buildMessageClusters(messages, currentUserId);
    return clustersToListRows(clusters);
  }, [messages, currentUserId]);

  const toggleClusterTime = (clusterId: string) => {
    setExpandedClusterId((prev) => (prev === clusterId ? null : clusterId));
  };

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await ChatHub.sendMessage(conversationId, text.trim());
      setText('');
    } catch {
      // noop
    }
    setSending(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.dark} />
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={styles.headerAvatarWrap}>
            <Image source={{ uri: theirAvatar }} style={styles.headerAvatar} />
            <View style={[styles.statusDot, peerOnline ? styles.statusOnline : styles.statusOffline]} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerName} numberOfLines={1}>{headerTitle}</Text>
            <Text style={[styles.headerSub, peerOnline && styles.headerSubOnline]}>
              {peerOnline ? 'Đang trực tuyến' : 'Không trực tuyến'}
            </Text>
          </View>
        </View>
        <Pressable onPress={() => navigation.navigate('Call', {
          conversationId,
          callType: 'audio',
          role: 'caller',
          name: headerTitle,
          participantName: headerTitle,
        })}
        style={styles.headerAction}
        >
          <Ionicons name="call-outline" size={20} color={colors.accent} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {loading ? (
          <ActivityIndicator size="large" color={colors.accent} style={styles.loader} />
        ) : (
          <FlatList
            ref={listRef}
            data={listRows}
            keyExtractor={(row) => row.key}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              if (item.type === 'spacer') {
                return <View style={styles.blockSpacer} />;
              }
              return (
                <ChatMessageClusterView
                  cluster={item.cluster}
                  expanded={expandedClusterId === item.cluster.id}
                  onPress={() => toggleClusterTime(item.cluster.id)}
                  myAvatar={myAvatar}
                  theirAvatar={theirAvatar}
                  theirName={headerTitle}
                  myName={myName}
                  onImagePress={setLightboxUri}
                />
              );
            }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={(
              <View style={styles.empty}>
                <Text style={styles.emptyText}>Chưa có tin nhắn. Gửi lời đầu tiên nhé.</Text>
              </View>
            )}
          />
        )}

        <View style={styles.inputRow}>
          <Pressable style={styles.attachBtn} onPress={pickAndSend} disabled={uploadingImage}>
            {uploadingImage
              ? <ActivityIndicator size="small" color={colors.dark} />
              : <Ionicons name="image-outline" size={22} color={colors.dark} />}
          </Pressable>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Nhắn tin..."
            placeholderTextColor={colors.textLight}
            multiline
            maxLength={2000}
          />
          <Pressable
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnOff]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            {sending
              ? <ActivityIndicator size="small" color={colors.background} />
              : <Ionicons name="send" size={18} color={colors.background} />}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <ImageLightbox
        visible={!!lightboxUri}
        uri={lightboxUri ?? ''}
        onClose={() => setLightboxUri(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  loader: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: spacing[2] },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  headerAvatarWrap: { position: 'relative' },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.clayLight,
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.background,
  },
  statusOnline: { backgroundColor: colors.success },
  statusOffline: { backgroundColor: colors.textLight },
  headerText: { flex: 1 },
  headerName: { fontSize: fontSizes.md, fontWeight: fontWeights.bold, color: colors.dark },
  headerSub: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
  headerSubOnline: { color: colors.success },
  headerAction: { padding: spacing[2] },
  messageList: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    gap: spacing[2],
    flexGrow: 1,
  },
  blockSpacer: { height: spacing[5] },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: spacing[12] },
  emptyText: { color: colors.textMuted, fontSize: fontSizes.sm },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: colors.white,
    borderRadius: radius.full,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2.5],
    fontSize: fontSizes.md,
    color: colors.dark,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnOff: { opacity: 0.35 },
});
