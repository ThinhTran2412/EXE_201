import React, { useEffect, useState } from 'react';
import {
  FlatList, StyleSheet, Text, View, Pressable, ActivityIndicator, RefreshControl, Image, TextInput,
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
import { formatImageUrl } from '../../../shared/utils/formatImageUrl';

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
        <Ionicons name="search" size={18} color="#8E8E93" style={styles.searchIcon} />
        <TextInput
          placeholder="Tìm kiếm"
          placeholderTextColor="#8E8E93"
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
              onPress={() => navigation.getParent()?.navigate('Chat', {
                conversationId: c.id,
                name: c.photographerDisplayName ?? 'Nhiếp ảnh gia',
                participantName: c.photographerDisplayName ?? 'Nhiếp ảnh gia',
                participantAvatarUrl: c.photographerAvatarUrl ? formatImageUrl(c.photographerAvatarUrl) : undefined,
                photographerId: c.photographerId,
              })}
            >
              <View style={styles.avatarWrapper}>
                {c.photographerAvatarUrl ? (
                  <Image source={{ uri: formatImageUrl(c.photographerAvatarUrl) }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={28} color="#8E8E93" />
                  </View>
                )}
                {c.status === 'Active' && <View style={styles.onlineDot} />}
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowName} numberOfLines={1}>{c.photographerDisplayName ?? 'Nhiếp ảnh gia'}</Text>
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
            <Text style={styles.emptyTitle}>Chưa có tin nhắn nào</Text>
            <Text style={styles.emptySub}>Hãy bắt đầu trò chuyện với nhiếp ảnh gia của bạn!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[4], paddingTop: spacing[3], paddingBottom: spacing[1] },
  title:  { fontSize: 30, fontWeight: fontWeights.bold, color: '#050505', flex: 1 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F2F5', borderRadius: 20, marginHorizontal: spacing[4], marginVertical: spacing[3], paddingHorizontal: spacing[3], height: 40 },
  searchIcon: { marginRight: spacing[2] },
  searchInput: { flex: 1, fontSize: fontSizes.md, color: '#050505', padding: 0 },
  list:           { paddingBottom: spacing[4] },
  emptyContainer: { flex: 1 },
  row:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[4], paddingVertical: spacing[3], gap: spacing[3] },
  rowPressed: { backgroundColor: '#F0F2F5' },
  avatarWrapper: { width: 56, height: 56, position: 'relative' },
  avatarImg: { width: 56, height: 56, borderRadius: 28 },
  avatarPlaceholder: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#E4E6EB', alignItems: 'center', justifyContent: 'center' },
  onlineDot: { position: 'absolute', bottom: 1, right: 1, width: 14, height: 14, borderRadius: 7, backgroundColor: '#31A24C', borderWidth: 2.5, borderColor: '#FFFFFF' },
  rowContent:{ flex: 1, justifyContent: 'center' },
  rowName:   { fontSize: fontSizes.md + 1, fontWeight: fontWeights.bold, color: '#050505', marginBottom: 2 },
  rowPreview: { fontSize: fontSizes.sm, color: '#65676B' },
  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[3], padding: spacing[10], paddingTop: spacing[16] },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: fontSizes.xl, fontWeight: fontWeights.bold, color: '#050505' },
  emptySub:   { fontSize: fontSizes.sm, color: '#65676B', textAlign: 'center', lineHeight: 20 },
});
