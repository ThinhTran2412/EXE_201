import React, { useCallback } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
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
import { getMyBookings, getMyConversations } from '../../features/customer/api';
import { formatImageUrl } from '../utils/formatImageUrl';

export default function SharedNotificationsScreen() {
  const navigation = useNavigation<any>();
  const { session } = useAuth();
  const { items, unreadCount, loading, markRead, markAllRead } = useNotifications();

  const openConversation = useCallback(async (conversationId: string) => {
    const conversations = await getMyConversations();
    const conversation = conversations.find((c) => c.id?.toLowerCase() === conversationId.toLowerCase());

    const participantName = session?.role === 'photographer'
      ? (conversation?.customerDisplayName ?? 'Khách hàng')
      : (conversation?.photographerDisplayName ?? 'Nhiếp ảnh gia');

    const participantAvatarUrlRaw = session?.role === 'photographer'
      ? conversation?.customerAvatarUrl
      : conversation?.photographerAvatarUrl;
    const participantAvatarUrl = formatImageUrl(participantAvatarUrlRaw);

    navigation.navigate('Chat', {
      conversationId,
      name: participantName,
      participantName,
      participantAvatarUrl,
      photographerId: conversation?.photographerId,
    });
  }, [navigation, session?.role]);

  const openBookingById = useCallback(async (bookingId: string) => {
    if (session?.role === 'photographer') {
      navigation.navigate('PBookings');
      return;
    }

    const bookings = await getMyBookings();
    const booking = bookings.find((b) => b.id?.toLowerCase() === bookingId.toLowerCase());
    if (!booking) {
      Alert.alert('Không tìm thấy lịch hẹn', 'Vui lòng mở tab Lịch hẹn để xem chi tiết.');
      navigation.navigate('Bookings');
      return;
    }

    navigation.navigate('BookingDetail', { booking });
  }, [navigation, session?.role]);

  const handlePress = useCallback(async (n: AppNotification) => {
    if (!n.read) await markRead(n.id);
    const payload = parseNotificationPayload(n.payloadJson);

    switch (n.actionType) {
      case 'open_conversation':
        if (payload.conversationId) await openConversation(payload.conversationId);
        return;
      case 'open_booking':
      case 'open_booking_detail':
        if (payload.bookingId) await openBookingById(payload.bookingId);
        return;
      case 'open_match':
        if (payload.conversationId) {
          await openConversation(payload.conversationId);
          return;
        }
        navigation.navigate('Chat');
        return;
      case 'open_call':
        navigation.navigate('Chat');
        return;
      case 'open_review':
        if (payload.bookingId) {
          await openBookingById(payload.bookingId);
          return;
        }
        navigation.navigate('Bookings');
        return;
      case 'open_system':
      default:
        return;
    }
  }, [markRead, navigation, openBookingById, openConversation]);

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
