import React, { useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { getConversationsByPhotographer } from '../../chat/api';
import type { ConversationWithPhotographer } from '../../chat/api';
import { formatImageUrl } from '../../../shared/utils/formatImageUrl';
import { colors } from '../../../app/theme/colors';
import { fontSizes, fontWeights } from '../../../app/theme/typography';
import { radius, spacing, shadows } from '../../../app/theme/spacing';

const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&q=80';

function formatTime(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ`;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

function customerLabel(c: ConversationWithPhotographer) {
  const name = c.customerDisplayName?.trim();
  if (name) return name;
  return `Khách #${(c.customerId ?? '').slice(0, 6)}`;
}

function ChatAvatar({ uri, name, size = 56 }: { uri?: string; name: string; size?: number }) {
  const src = uri?.trim() ? formatImageUrl(uri) : FALLBACK_AVATAR;
  const initial = (name.trim()[0] ?? '?').toUpperCase();

  return (
    <View style={[styles.avatarRing, { width: size + 6, height: size + 6, borderRadius: (size + 6) / 2 }]}>
      {src ? (
        <Image source={{ uri: src }} style={{ width: size, height: size, borderRadius: size / 2 }} />
      ) : (
        <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={[styles.avatarInitial, { fontSize: size * 0.38 }]}>{initial}</Text>
        </View>
      )}
    </View>
  );
}

export default function PAllChatScreen() {
  const navigation = useNavigation<any>();
  const [convs, setConvs] = useState<ConversationWithPhotographer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const list = await getConversationsByPhotographer();
      setConvs(list.sort((a, b) =>
        new Date(b.lastMessageAt ?? '0').getTime() - new Date(a.lastMessageAt ?? '0').getTime(),
      ));
    } catch {
      // noop
    }
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color={colors.accent} style={styles.loader} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.canvas}>
        <View style={styles.accentOrb} />
        <View style={[styles.accentOrb, styles.accentOrb2]} />
      </View>

      <View style={styles.topBar}>
        <View style={styles.countPill}>
          <Text style={styles.countText}>{convs.length}</Text>
        </View>
        <Text style={styles.topBarHint}>cuộc trò chuyện</Text>
      </View>

      <FlatList
        data={convs}
        keyExtractor={(c) => c.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={colors.accent}
          />
        }
        contentContainerStyle={convs.length === 0 ? styles.emptyContainer : styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: c, index }) => {
          const label = customerLabel(c);
          const avatarUri = formatImageUrl(c.customerAvatarUrl) || FALLBACK_AVATAR;
          const isNew = !c.lastMessageAt;

          return (
            <Animated.View entering={FadeInDown.duration(420).delay(index * 55)}>
              <Pressable
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                onPress={() => navigation.navigate('Chat', {
                  conversationId: c.id,
                  participantName: label,
                  participantAvatarUrl: avatarUri,
                  customerLastSeenAt: c.customerLastSeenAt,
                })}
              >
                <ChatAvatar uri={c.customerAvatarUrl} name={label} size={54} />
                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardName} numberOfLines={1}>{label}</Text>
                    {c.lastMessageAt ? (
                      <Text style={styles.cardTime}>{formatTime(c.lastMessageAt)}</Text>
                    ) : null}
                  </View>
                  <Text style={styles.cardPreview} numberOfLines={2}>
                    {isNew
                      ? 'Một kết nối mới — mở lời đầu tiên'
                      : 'Tiếp tục câu chuyện về buổi chụp'}
                  </Text>
                  {isNew && (
                    <LinearGradient
                      colors={['#ff4200', '#cf4028']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.newTag}
                    >
                      <Text style={styles.newTagText}>Mới</Text>
                    </LinearGradient>
                  )}
                </View>
                <View style={styles.cardArrow}>
                  <Ionicons name="arrow-forward" size={18} color={colors.accent} />
                </View>
              </Pressable>
            </Animated.View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyFrame}>
              <Ionicons name="chatbubbles-outline" size={40} color={colors.accent} />
            </View>
            <Text style={styles.emptyTitle}>Không gian trống</Text>
            <Text style={styles.emptySub}>
              Khi có match, hội thoại sẽ hiện như những khung tranh nhỏ — mỗi khách một câu chuyện riêng.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  loader: { flex: 1 },
  canvas: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  accentOrb: {
    position: 'absolute',
    top: -80,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(207,64,40,0.08)',
  },
  accentOrb2: {
    top: 120,
    left: -60,
    width: 160,
    height: 160,
    backgroundColor: 'rgba(255,66,0,0.06)',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
  },
  countPill: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[2],
  },
  countText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.background,
  },
  topBarHint: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },
  list: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[10],
    gap: spacing[3],
  },
  emptyContainer: { flex: 1, paddingHorizontal: spacing[6] },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.clay,
  },
  cardPressed: { opacity: 0.92, transform: [{ scale: 0.995 }] },
  avatarRing: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(207,64,40,0.35)',
    backgroundColor: colors.clayLight,
  },
  avatarFallback: {
    backgroundColor: colors.clay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontWeight: fontWeights.bold,
    color: colors.dark,
  },
  cardBody: { flex: 1, gap: spacing[1.5] },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[2] },
  cardName: {
    flex: 1,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    color: colors.dark,
    letterSpacing: 0.2,
  },
  cardTime: { fontSize: 10, color: colors.textLight, fontWeight: fontWeights.semibold },
  cardPreview: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  newTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[2.5],
    paddingVertical: 3,
    borderRadius: radius.full,
    marginTop: spacing[1],
  },
  newTagText: {
    fontSize: 10,
    fontWeight: fontWeights.bold,
    color: colors.white,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  cardArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(207,64,40,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
    paddingVertical: spacing[16],
  },
  emptyFrame: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: 'rgba(207,64,40,0.25)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  emptyTitle: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.dark,
    letterSpacing: 0.5,
  },
  emptySub: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
    fontStyle: 'italic',
  },
});
