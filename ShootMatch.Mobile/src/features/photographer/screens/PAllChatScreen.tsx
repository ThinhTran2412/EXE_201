import React, { useEffect, useState } from 'react';
import {
  FlatList, StyleSheet, Text, View, Pressable, ActivityIndicator, RefreshControl, Image, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { formatImageUrl } from '../../../shared/utils/formatImageUrl';
import { getConversationsByPhotographer } from '../../chat/api';
import { usePhotographerTheme } from '../PhotographerThemeContext';
import { fontSizes, fontWeights } from '../../../app/theme/typography';
import { spacing } from '../../../app/theme/spacing';

function formatTime(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return 'vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ`;
  return d.toLocaleDateString('vi-VN');
}

export default function PAllChatScreen() {
  const navigation = useNavigation<any>();
  const { colors, isDark } = usePhotographerTheme();
  const styles = getStyles(colors);
  const [convs, setConvs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const list = await getConversationsByPhotographer();
      setConvs(list.sort((a, b) =>
        new Date(b.lastMessageAt ?? '0').getTime() - new Date(a.lastMessageAt ?? '0').getTime()
      ));
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color="#0084FF" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Đoạn chat</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={colors.textLight} style={styles.searchIcon} />
        <TextInput
          placeholder="Tìm kiếm"
          placeholderTextColor={colors.textLight}
          style={styles.searchInput}
          editable={false}
        />
      </View>

      <FlatList
        data={convs}
        keyExtractor={(c) => c.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#0084FF" />}
        contentContainerStyle={convs.length === 0 ? styles.emptyContainer : styles.list}
        renderItem={({ item: c, index }) => (
          <Animated.View entering={FadeInDown.duration(400).delay(index * 60)}>
            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() => navigation.navigate('Chat', {
                conversationId: c.id,
                name: c.customerDisplayName ?? `Khách hàng #${(c.customerId ?? '').slice(0, 6)}`,
                participantName: c.customerDisplayName ?? `Khách hàng #${(c.customerId ?? '').slice(0, 6)}`,
                participantAvatarUrl: c.customerAvatarUrl ? formatImageUrl(c.customerAvatarUrl) : undefined,
                customerId: c.customerId,
              })}
            >
              <View style={styles.avatarWrapper}>
                <Image
                  source={{
                    uri: c.customerAvatarUrl
                      ? formatImageUrl(c.customerAvatarUrl)
                      : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&q=80'
                  }}
                  style={styles.avatar}
                />
                {c.status === 'Active' && <View style={styles.onlineDot} />}
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowName} numberOfLines={1}>{c.customerDisplayName ?? `Khách hàng #${(c.customerId ?? '').slice(0, 6)}`}</Text>
                <Text style={styles.rowPreview} numberOfLines={1}>
                  {c.lastMessageContent ?? 'Bắt đầu trò chuyện'}
                  {c.lastMessageAt || c.createdAt ? ` • ${formatTime(c.lastMessageAt ?? c.createdAt)}` : ''}
                </Text>
              </View>
            </Pressable>
          </Animated.View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>💬</Text>
            <Text style={styles.emptyTitle}>Chưa có hội thoại nào</Text>
            <Text style={styles.emptySub}>Khi khách hàng match, cuộc trò chuyện sẽ xuất hiện ở đây.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[4], paddingTop: spacing[3], paddingBottom: spacing[1] },
  title: { fontSize: 30, fontWeight: fontWeights.bold, color: colors.text, flex: 1 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceStrong, borderRadius: 20, marginHorizontal: spacing[4], marginVertical: spacing[3], paddingHorizontal: spacing[3], height: 40, borderWidth: 1, borderColor: colors.border },
  searchIcon: { marginRight: spacing[2] },
  searchInput: { flex: 1, fontSize: fontSizes.md, color: colors.text, padding: 0 },
  list: { paddingBottom: spacing[4] },
  emptyContainer: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[4], paddingVertical: spacing[3], gap: spacing[3], borderBottomWidth: 1, borderColor: colors.border },
  rowPressed: { backgroundColor: colors.surfaceStrong },
  avatarWrapper: { width: 56, height: 56, position: 'relative' },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  onlineDot: { position: 'absolute', bottom: 1, right: 1, width: 14, height: 14, borderRadius: 7, backgroundColor: '#31A24C', borderWidth: 2.5, borderColor: colors.background },
  rowContent: { flex: 1, justifyContent: 'center' },
  rowName: { fontSize: fontSizes.md + 1, fontWeight: fontWeights.bold, color: colors.text, marginBottom: 2 },
  rowPreview: { fontSize: fontSizes.sm, color: colors.textMuted },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[3], padding: spacing[10], paddingTop: spacing[16] },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: fontSizes.xl, fontWeight: fontWeights.bold, color: colors.text },
  emptySub: { fontSize: fontSizes.sm, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
});
