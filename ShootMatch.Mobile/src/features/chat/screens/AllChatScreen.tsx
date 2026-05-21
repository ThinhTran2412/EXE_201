import React, { useEffect, useState } from 'react';
import {
  FlatList, StyleSheet, Text, View, Pressable, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getMyConversations } from '../../customer/api';
import type { Conversation } from '../../customer/api';
import { colors } from '../../../app/theme/colors';
import { fontSizes, fontWeights } from '../../../app/theme/typography';
import { radius, spacing } from '../../../app/theme/spacing';

function formatTime(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ`;
  return d.toLocaleDateString('vi-VN');
}

export default function AllChatScreen() {
  const navigation  = useNavigation<any>();
  const [convs,      setConvs]      = useState<Conversation[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const list = await getMyConversations();
      setConvs(list.sort((a: Conversation, b: Conversation) =>
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
        <ActivityIndicator size="large" color={colors.accent} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Tin nhắn</Text>
        <Text style={styles.badge}>{convs.length}</Text>
      </View>

      <FlatList
        data={convs}
        keyExtractor={(c) => c.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.accent} />}
        contentContainerStyle={convs.length === 0 ? styles.emptyContainer : styles.list}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        renderItem={({ item: c, index }) => (
          <Animated.View entering={FadeInDown.duration(400).delay(index * 60)}>
            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() => navigation.getParent()?.navigate('Chat', { conversationId: c.id, name: 'Nhiếp ảnh gia', participantName: 'Nhiếp ảnh gia' })}
            >
              <View style={styles.avatar}>
                <Ionicons name="person" size={24} color={colors.textMuted} />
                {c.status === 'Active' && <View style={styles.onlineDot} />}
              </View>
              <View style={styles.rowContent}>
                <View style={styles.rowTop}>
                  <Text style={styles.rowName} numberOfLines={1}>Nhiếp ảnh gia</Text>
                  <Text style={styles.rowTime}>{formatTime(c.lastMessageAt)}</Text>
                </View>
                <Text style={styles.rowPreview} numberOfLines={1}>
                  {c.lastMessageAt ? 'Nhấn để xem tin nhắn' : 'Bắt đầu trò chuyện'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
            </Pressable>
          </Animated.View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>💬</Text>
            <Text style={styles.emptyTitle}>Chưa có tin nhắn nào</Text>
            <Text style={styles.emptySub}>Swipe phải một nhiếp ảnh gia để bắt đầu match và trò chuyện!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingHorizontal: spacing[6], paddingVertical: spacing[4], borderBottomWidth: 1, borderBottomColor: colors.border, paddingTop: spacing[4] },
  title:  { fontSize: fontSizes.xl, fontWeight: fontWeights.bold, color: colors.dark, flex: 1 },
  badge:  { backgroundColor: colors.accent, fontSize: fontSizes.xs, fontWeight: fontWeights.bold, paddingHorizontal: spacing[2.5], paddingVertical: spacing[0.5], borderRadius: radius.full, overflow: 'hidden' },
  list:           { paddingTop: spacing[2] },
  emptyContainer: { flex: 1 },
  sep:            { height: 1, marginHorizontal: spacing[6], backgroundColor: colors.border },
  row:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[6], paddingVertical: spacing[4], gap: spacing[3] },
  rowPressed: { backgroundColor: 'rgba(26,26,15,0.04)' },
  avatar:    { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.clay, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  onlineDot: { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.success, borderWidth: 2, borderColor: colors.background },
  rowContent:{ flex: 1, gap: spacing[1] },
  rowTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowName:   { fontSize: fontSizes.md, fontWeight: fontWeights.semibold, color: colors.dark, flex: 1 },
  rowTime:   { fontSize: fontSizes.xs, color: colors.textLight },
  rowPreview: { fontSize: fontSizes.sm, color: colors.textMuted },
  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[3], padding: spacing[10] },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: fontSizes.xl, fontWeight: fontWeights.bold, color: colors.dark },
  emptySub:   { fontSize: fontSizes.sm, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
});
