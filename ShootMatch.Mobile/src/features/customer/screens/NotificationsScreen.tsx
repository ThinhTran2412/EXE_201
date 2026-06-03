import React, { useState } from 'react';
import {
  FlatList, StyleSheet, Text, View, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../../app/theme/colors';
import { fontSizes, fontWeights } from '../../../app/theme/typography';
import { radius, spacing } from '../../../app/theme/spacing';

type NotifType = 'match' | 'booking' | 'message' | 'review' | 'system';

interface Notif {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

// Mock data — thay bằng API khi backend sẵn sàng
const MOCK_NOTIFS: Notif[] = [
  { id: '1', type: 'match',   title: 'Match mới! 🎉',        body: 'Bạn và Nguyễn Minh Khoa đã match. Bắt đầu trò chuyện!', time: '2 phút trước',  read: false },
  { id: '2', type: 'booking', title: 'Lịch hẹn được xác nhận', body: 'Nhiếp ảnh gia đã xác nhận lịch chụp ngày 15/06.', time: '1 giờ trước',   read: false },
  { id: '3', type: 'message', title: 'Tin nhắn mới',           body: 'Trần Thị Lan: Bạn muốn chụp ở đâu?', time: '3 giờ trước',   read: true },
  { id: '4', type: 'review',  title: 'Đánh giá của bạn',       body: 'Nhớ để lại đánh giá cho buổi chụp vừa rồi!', time: '1 ngày trước',  read: true },
  { id: '5', type: 'system',  title: 'Chào mừng đến ShootMatch!', body: 'Bắt đầu khám phá nhiếp ảnh gia phù hợp với bạn.', time: '3 ngày trước', read: true },
];

const ICON_MAP: Record<NotifType, { name: string; color: string; bg: string }> = {
  match:   { name: 'heart',          color: colors.accent,   bg: colors.accent  + '18' },
  booking: { name: 'calendar',       color: colors.info,     bg: colors.info    + '18' },
  message: { name: 'chatbubble',     color: colors.success,  bg: colors.success + '18' },
  review:  { name: 'star',           color: '#f4c430',       bg: '#f4c43018'           },
  system:  { name: 'notifications',  color: colors.textMuted, bg: colors.clay   + '40' },
};

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const [notifs, setNotifs] = useState<Notif[]>(MOCK_NOTIFS);

  const unread = notifs.filter((n) => !n.read).length;

  function markRead(id: string) {
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  function markAllRead() {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.dark} />
        </Pressable>
        <Text style={styles.title}>Thông báo</Text>
        {unread > 0 && (
          <Pressable onPress={markAllRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Đọc tất cả</Text>
          </Pressable>
        )}
      </View>

      {unread > 0 && (
        <View style={styles.unreadBanner}>
          <View style={styles.unreadDot} />
          <Text style={styles.unreadText}>{unread} thông báo chưa đọc</Text>
        </View>
      )}

      <FlatList
        data={notifs}
        keyExtractor={(n) => n.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        renderItem={({ item: n, index }) => {
          const ic = ICON_MAP[n.type];
          return (
            <Animated.View entering={FadeInDown.duration(400).delay(index * 50)}>
              <Pressable
                style={[styles.row, !n.read && styles.rowUnread]}
                onPress={() => markRead(n.id)}
              >
                <View style={[styles.notifIcon, { backgroundColor: ic.bg }]}>
                  <Ionicons name={ic.name as any} size={20} color={ic.color} />
                </View>
                <View style={styles.rowContent}>
                  <View style={styles.rowTop}>
                    <Text style={[styles.rowTitle, !n.read && styles.rowTitleUnread]} numberOfLines={1}>
                      {n.title}
                    </Text>
                    <Text style={styles.rowTime}>{n.time}</Text>
                  </View>
                  <Text style={styles.rowBody} numberOfLines={2}>{n.body}</Text>
                </View>
                {!n.read && <View style={styles.unreadIndicator} />}
              </Pressable>
            </Animated.View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🔔</Text>
            <Text style={styles.emptyText}>Chưa có thông báo nào</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingHorizontal: spacing[4], paddingVertical: spacing[3], borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title:   { flex: 1, fontSize: fontSizes.lg, fontWeight: fontWeights.bold, color: colors.dark },
  markAllBtn: { paddingHorizontal: spacing[3], paddingVertical: spacing[1.5] },
  markAllText: { fontSize: fontSizes.xs, color: colors.accent, fontWeight: fontWeights.semibold },

  unreadBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], paddingHorizontal: spacing[6], paddingVertical: spacing[3], backgroundColor: colors.accent + '08' },
  unreadDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  unreadText:   { fontSize: fontSizes.xs, color: colors.accent, fontWeight: fontWeights.semibold },

  list:  { paddingVertical: spacing[2] },
  sep:   { height: 1, marginHorizontal: spacing[6], backgroundColor: colors.border },

  row:          { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: spacing[6], paddingVertical: spacing[4], gap: spacing[3] },
  rowUnread:    { backgroundColor: colors.accent + '04' },
  notifIcon:    { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowContent:   { flex: 1, gap: spacing[1] },
  rowTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing[2] },
  rowTitle:     { flex: 1, fontSize: fontSizes.sm, fontWeight: fontWeights.medium, color: colors.textMuted },
  rowTitleUnread: { fontWeight: fontWeights.bold, color: colors.dark },
  rowTime:      { fontSize: fontSizes.xs, color: colors.textLight, flexShrink: 0 },
  rowBody:      { fontSize: fontSizes.sm, color: colors.textMuted, lineHeight: 18 },
  unreadIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent, marginTop: spacing[2], flexShrink: 0 },

  empty:      { alignItems: 'center', gap: spacing[3], paddingTop: spacing[16] },
  emptyEmoji: { fontSize: 48 },
  emptyText:  { fontSize: fontSizes.md, color: colors.textMuted },
});
