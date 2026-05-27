import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../features/auth/AuthContext';
import { colors } from '../../app/theme/colors';
import { fontSizes, fontWeights } from '../../app/theme/typography';
import { spacing } from '../../app/theme/spacing';
import { useNotifications } from './NotificationContext';
import NotificationsList from './NotificationsList';
import { parseNotificationPayload } from './parsePayload';
import type { AppNotification } from './types';

export default function SharedNotificationsScreen() {
  const navigation = useNavigation<any>();
  const { session } = useAuth();
  const { items, unreadCount, loading, markRead, markAllRead } = useNotifications();

  const handlePress = useCallback(async (n: AppNotification) => {
    if (!n.read) await markRead(n.id);
    const payload = parseNotificationPayload(n.payloadJson);
    if (n.actionType === 'open_conversation' && payload.conversationId) {
      if (session?.role === 'photographer') {
        navigation.navigate('Chat', {
          conversationId: payload.conversationId,
          name: 'Tin nhắn',
        });
      } else {
        navigation.navigate('ChatThread', {
          conversationId: payload.conversationId,
          name: 'Tin nhắn',
        });
      }
    }
  }, [markRead, navigation, session?.role]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.dark} />
        </Pressable>
        <Text style={styles.title}>Thông báo</Text>
        {unreadCount > 0 && (
          <Pressable onPress={markAllRead}>
            <Text style={styles.markAllHeader}>Đọc tất cả</Text>
          </Pressable>
        )}
      </View>

      {!loading && (
        <NotificationsList
          items={items}
          unreadCount={unreadCount}
          onPressItem={handlePress}
          onMarkAllRead={markAllRead}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: fontSizes.lg, fontWeight: fontWeights.bold, color: colors.dark },
  markAllHeader: { fontSize: fontSizes.xs, color: colors.accent, fontWeight: fontWeights.semibold },
});
