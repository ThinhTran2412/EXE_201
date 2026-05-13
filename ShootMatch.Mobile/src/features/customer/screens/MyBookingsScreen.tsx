import React, { useEffect, useState } from 'react';
import {
  SectionList, StyleSheet, Text, View, Pressable, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getMyBookings, cancelBooking, Booking } from '../api';
import { ClayCard } from '../../../shared/components/ClayCard';
import { colors } from '../../../app/theme/colors';
import { fontSizes, fontWeights } from '../../../app/theme/typography';
import { radius, spacing } from '../../../app/theme/spacing';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  Pending:    { label: 'Chờ xác nhận', color: colors.warning,  icon: 'time-outline' },
  Confirmed:  { label: 'Đã xác nhận', color: colors.info,     icon: 'checkmark-circle-outline' },
  Completed:  { label: 'Hoàn thành',  color: colors.success,  icon: 'checkmark-done-circle' },
  Cancelled:  { label: 'Đã hủy',      color: colors.accent,   icon: 'close-circle-outline' },
  Disputed:   { label: 'Tranh chấp',  color: '#e07b39',       icon: 'warning-outline' },
};

const TABS = ['Sắp tới', 'Hoàn thành', 'Đã hủy'] as const;
type Tab = typeof TABS[number];

function tabFilter(tab: Tab, status: string): boolean {
  if (tab === 'Sắp tới')   return status === 'Pending' || status === 'Confirmed';
  if (tab === 'Hoàn thành') return status === 'Completed';
  return status === 'Cancelled' || status === 'Disputed';
}

function BookingItem({ booking, onCancel }: { booking: Booking; onCancel: () => void }) {
  const navigation = useNavigation<any>();
  const cfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.Pending;
  const canCancel = booking.status === 'Pending' || booking.status === 'Confirmed';

  return (
    <Animated.View entering={FadeInDown.duration(400)}>
      <ClayCard style={styles.card}>
        <Pressable onPress={() => navigation.navigate('BookingDetail', { booking })}>
          {/* Top row */}
          <View style={styles.cardTop}>
            <View style={[styles.statusBadge, { backgroundColor: cfg.color + '18' }]}>
              <Ionicons name={cfg.icon as any} size={14} color={cfg.color} />
              <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
            <Text style={styles.price}>{booking.agreedPrice?.toLocaleString('vi-VN')}đ</Text>
          </View>

          {/* Info */}
          <View style={styles.cardInfo}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
              <Text style={styles.infoText}>
                {new Date(booking.scheduledAt).toLocaleString('vi-VN')}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="receipt-outline" size={14} color={colors.textMuted} />
              <Text style={styles.infoText} numberOfLines={1}>#{booking.id.slice(0, 8)}</Text>
            </View>
          </View>

          {/* Actions */}
          {canCancel && (
            <Pressable
              style={styles.cancelBtn}
              onPress={onCancel}
            >
              <Text style={styles.cancelText}>Hủy lịch</Text>
            </Pressable>
          )}
        </Pressable>
      </ClayCard>
    </Animated.View>
  );
}

export default function MyBookingsScreen() {
  const [tab,        setTab]        = useState<Tab>('Sắp tới');
  const [bookings,   setBookings]   = useState<Booking[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try { setBookings(await getMyBookings()); }
    catch {}
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCancel(b: Booking) {
    Alert.alert('Hủy lịch hẹn', 'Bạn chắc chắn muốn hủy không?', [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Hủy lịch',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelBooking(b.id, 'Khách hàng hủy');
            load();
          } catch { Alert.alert('Lỗi', 'Không thể hủy. Thử lại.'); }
        },
      },
    ]);
  }

  const filtered = bookings.filter((b) => tabFilter(tab, b.status));

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Lịch hẹn của tôi</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <Pressable key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      {loading
        ? <ActivityIndicator size="large" color={colors.accent} style={{ flex: 1 }} />
        : <SectionList
            sections={[{ title: tab, data: filtered }]}
            keyExtractor={(b) => b.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.accent} />}
            contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.list}
            renderSectionHeader={() => null}
            renderItem={({ item }) => (
              <BookingItem booking={item} onCancel={() => handleCancel(item)} />
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>📅</Text>
                <Text style={styles.emptyTitle}>Chưa có lịch hẹn nào</Text>
                <Text style={styles.emptySub}>Khám phá và đặt lịch với nhiếp ảnh gia ngay!</Text>
              </View>
            }
          />
      }
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing[6], paddingVertical: spacing[4] },
  title:  { fontSize: fontSizes.xl, fontWeight: fontWeights.bold, color: colors.dark },

  tabRow: { flexDirection: 'row', paddingHorizontal: spacing[6], gap: spacing[2], marginBottom: spacing[4] },
  tab:    { flex: 1, paddingVertical: spacing[2.5], borderRadius: radius.full, alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  tabActive: { backgroundColor: colors.dark, borderColor: colors.dark },
  tabText:   { fontSize: fontSizes.xs, fontWeight: fontWeights.semibold, color: colors.textMuted },
  tabTextActive: { color: colors.background },

  list:           { paddingHorizontal: spacing[6], gap: spacing[3], paddingBottom: spacing[10] },
  emptyContainer: { flex: 1 },

  card:     { padding: spacing[4], gap: spacing[3] },
  cardTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing[1], paddingHorizontal: spacing[2.5], paddingVertical: spacing[1], borderRadius: radius.full },
  statusText:  { fontSize: fontSizes.xs, fontWeight: fontWeights.semibold },
  price:       { fontSize: fontSizes.md, fontWeight: fontWeights.bold, color: colors.dark },
  cardInfo:    { gap: spacing[2] },
  infoRow:     { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  infoText:    { fontSize: fontSizes.sm, color: colors.textMuted },
  cancelBtn:   { alignSelf: 'flex-start', paddingHorizontal: spacing[4], paddingVertical: spacing[2], borderRadius: radius.full, borderWidth: 1, borderColor: colors.accent + '50' },
  cancelText:  { fontSize: fontSizes.xs, color: colors.accent, fontWeight: fontWeights.semibold },

  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[3], padding: spacing[10] },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: fontSizes.xl, fontWeight: fontWeights.bold, color: colors.dark },
  emptySub:   { fontSize: fontSizes.sm, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
});
