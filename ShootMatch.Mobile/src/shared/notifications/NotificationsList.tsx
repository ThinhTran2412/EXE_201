import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors } from '../../app/theme/colors';
import { fontSizes, fontWeights } from '../../app/theme/typography';
import { spacing } from '../../app/theme/spacing';
import { formatRelativeTime } from './formatRelativeTime';
import type { AppNotification, NotificationCategory } from './types';

const ICON_MAP: Record<NotificationCategory, { name: string; color: string; bg: string }> = {
  match:   { name: 'heart',          color: colors.accent,   bg: colors.accent  + '18' },
  booking: { name: 'calendar',       color: colors.info,     bg: colors.info    + '18' },
  message: { name: 'chatbubble',     color: colors.success,  bg: colors.success + '18' },
  call:    { name: 'call',           color: colors.info,     bg: colors.info    + '18' },
  review:  { name: 'star',           color: '#f4c430',       bg: '#f4c43018'           },
  system:  { name: 'notifications',  color: colors.textMuted, bg: colors.clay   + '40' },
};

interface Props {
  items: AppNotification[];
  unreadCount: number;
  onPressItem: (item: AppNotification) => void;
  onMarkAllRead: () => void;
}

export default function NotificationsList({ items, unreadCount, onPressItem, onMarkAllRead }: Props) {
  return (
    <>
      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <View style={styles.unreadDot} />
          <Text style={styles.unreadText}>{unreadCount} thông báo chưa đọc</Text>
          <Pressable onPress={onMarkAllRead}>
            <Text style={styles.markAll}>Đọc tất cả</Text>
          </Pressable>
        </View>
      )}

      <FlatList
        data={items}
        keyExtractor={(n) => n.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        renderItem={({ item: n, index }) => {
          const ic = ICON_MAP[n.category] ?? ICON_MAP.system;
          return (
            <Animated.View entering={FadeInDown.duration(400).delay(index * 40)}>
              <Pressable
                style={[styles.row, !n.read && styles.rowUnread]}
                onPress={() => onPressItem(n)}
              >
                <View style={[styles.notifIcon, { backgroundColor: ic.bg }]}>
                  <Ionicons name={ic.name as any} size={20} color={ic.color} />
                </View>
                <View style={styles.rowContent}>
                  <View style={styles.rowTop}>
                    <Text style={[styles.rowTitle, !n.read && styles.rowTitleUnread]} numberOfLines={1}>
                      {n.title}
                    </Text>
                    <Text style={styles.rowTime}>{formatRelativeTime(n.createdAt)}</Text>
                  </View>
                  <Text style={styles.rowBody} numberOfLines={2}>{n.body}</Text>
                </View>
                {!n.read && <View style={styles.unreadIndicator} />}
              </Pressable>
            </Animated.View>
          );
        }}
        ListEmptyComponent={(
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🔔</Text>
            <Text style={styles.emptyText}>Chưa có thông báo nào</Text>
          </View>
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  unreadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    backgroundColor: colors.accent + '08',
  },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  unreadText: { flex: 1, fontSize: fontSizes.xs, color: colors.accent, fontWeight: fontWeights.semibold },
  markAll: { fontSize: fontSizes.xs, color: colors.accent, fontWeight: fontWeights.semibold },
  list: { paddingVertical: spacing[2] },
  sep: { height: 1, marginHorizontal: spacing[6], backgroundColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: spacing[6], paddingVertical: spacing[4], gap: spacing[3] },
  rowUnread: { backgroundColor: colors.accent + '04' },
  notifIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  rowContent: { flex: 1, gap: spacing[1] },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing[2] },
  rowTitle: { flex: 1, fontSize: fontSizes.sm, fontWeight: fontWeights.medium, color: colors.textMuted },
  rowTitleUnread: { fontWeight: fontWeights.bold, color: colors.dark },
  rowTime: { fontSize: fontSizes.xs, color: colors.textLight },
  rowBody: { fontSize: fontSizes.sm, color: colors.textMuted, lineHeight: 18 },
  unreadIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent, marginTop: spacing[2] },
  empty: { alignItems: 'center', gap: spacing[3], paddingTop: spacing[16] },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: fontSizes.md, color: colors.textMuted },
});
