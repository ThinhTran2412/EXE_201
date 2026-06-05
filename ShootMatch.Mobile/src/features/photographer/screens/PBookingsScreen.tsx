import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { getMyBookingsAsPhotographer, confirmBooking, completeBooking, cancelBooking, PBooking } from '../api';
import { ClayCard } from '../../../shared/components/ClayCard';
import { colors } from '../../../app/theme/colors';
import { fontSizes, fontWeights } from '../../../app/theme/typography';
import { radius, spacing } from '../../../app/theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CELL = Math.floor((SCREEN_WIDTH - spacing[6] * 2 - 12 * 6) / 7);

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  Pending: { label: 'Chờ duyệt', color: colors.warning },
  Confirmed: { label: 'Đã xác nhận', color: colors.info },
  Completed: { label: 'Hoàn thành', color: colors.success },
  Cancelled: { label: 'Đã hủy', color: colors.accent },
};

const TABS = ['Tất cả', 'Chờ duyệt', 'Đã xác nhận', 'Hoàn thành'] as const;
type Tab = typeof TABS[number];
const MONTH_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function toKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function PBookingsScreen() {
  const navigation = useNavigation<any>();
  const [tab, setTab] = useState<Tab>('Tất cả');
  const [bookings, setBookings] = useState<PBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  async function load() {
    try {
      setBookings(await getMyBookingsAsPhotographer());
    } catch {
      // noop
    }
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    load();
    const unsubscribe = navigation.addListener('focus', () => {
      load();
    });
    return unsubscribe;
  }, [navigation]);

  async function doAction(b: PBooking, type: 'confirm' | 'complete' | 'cancel') {
    try {
      if (type === 'confirm') await confirmBooking(b.id);
      if (type === 'complete') await completeBooking(b.id);
      if (type === 'cancel') await cancelBooking(b.id, 'Nhiếp ảnh gia hủy');
      load();
    } catch {
      Alert.alert('Lỗi', 'Thao tác thất bại.');
    }
  }

  const filtered = bookings.filter((b) => {
    if (tab === 'Tất cả') return true;
    if (tab === 'Chờ duyệt') return b.status === 'Pending';
    if (tab === 'Đã xác nhận') return b.status === 'Confirmed';
    return b.status === 'Completed';
  });

  const calendarDays = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const first = new Date(year, month, 1);
    const startDay = (first.getDay() + 6) % 7;
    const totalDays = new Date(year, month + 1, 0).getDate();
    const grid: (Date | null)[] = [];
    for (let i = 0; i < startDay; i++) grid.push(null);
    for (let d = 1; d <= totalDays; d++) grid.push(new Date(year, month, d));
    while (grid.length % 7 !== 0) grid.push(null);
    return grid;
  }, [selectedDate]);

  const selectedBookings = useMemo(
    () => bookings.filter((b) => toKey(new Date(b.scheduledAt)) === toKey(selectedDate)),
    [bookings, selectedDate]
  );

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={['#fffdf8', '#f3f4f6']} style={styles.header}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.headerKicker}>Photographer Workspace</Text>
            <Text style={styles.headerTitle}>Bookings</Text>
            <Text style={styles.headerSub}>Quản lý lịch hẹn, chấp nhận và xem theo lịch</Text>
          </View>
          <View style={styles.headerAccent}>
            <Ionicons name="calendar" size={22} color="#fff" />
          </View>
        </View>

        <View style={styles.heroStatsRow}>
          <View style={styles.heroStatCard}>
            <Text style={styles.heroStatValue}>{bookings.filter(b => b.status === 'Pending').length}</Text>
            <Text style={styles.heroStatLabel}>Chờ duyệt</Text>
          </View>
          <View style={styles.heroStatCard}>
            <Text style={styles.heroStatValue}>{bookings.filter(b => b.status === 'Confirmed').length}</Text>
            <Text style={styles.heroStatLabel}>Đã xác nhận</Text>
          </View>
          <View style={styles.heroStatCard}>
            <Text style={styles.heroStatValue}>{selectedBookings.length}</Text>
            <Text style={styles.heroStatLabel}>Hôm nay</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.monthNav}>
        <Pressable style={styles.monthNavBtn} onPress={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}>
          <Ionicons name="chevron-back" size={18} color={colors.dark} />
        </Pressable>
        <Text style={styles.monthNavTitle}>{selectedDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}</Text>
        <Pressable style={styles.monthNavBtn} onPress={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}>
          <Ionicons name="chevron-forward" size={18} color={colors.dark} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.screenContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.accent} />}>
        <View style={styles.sectionIntro}>
          <View>
            <Text style={styles.sectionEyebrow}>Calendar view</Text>
            <Text style={styles.sectionHeading}>Lịch theo ngày</Text>
          </View>
          <View style={styles.sectionBadge}>
            <Ionicons name="ellipse" size={8} color="#4ade80" />
            <Text style={styles.sectionBadgeText}>Có booking</Text>
          </View>
        </View>

        <View style={styles.calendarCard}>
          <View style={styles.weekRow}>
            {MONTH_LABELS.map((d) => <Text key={d} style={styles.weekLabel}>{d}</Text>)}
          </View>
          <View style={styles.grid}>
            {calendarDays.map((date, idx) => {
              if (!date) return <View key={`empty-${idx}`} style={[styles.cell, { width: CELL, height: CELL }]} />;
              const key = toKey(date);
              const dayBookings = bookings.filter((b) => toKey(new Date(b.scheduledAt)) === key);
              const isSelected = key === toKey(selectedDate);
              const hasPending = dayBookings.some((b) => b.status === 'Pending');
              const hasConfirmed = dayBookings.some((b) => b.status === 'Confirmed' || b.status === 'Completed');
              const dotColor = hasConfirmed ? '#4ade80' : hasPending ? '#fbbf24' : 'transparent';

              return (
                <Pressable key={key} style={[styles.cell, { width: CELL, height: CELL }, isSelected && styles.selectedCell]} onPress={() => setSelectedDate(date)}>
                  <Text style={[styles.cellText, isSelected && styles.selectedCellText]}>{date.getDate()}</Text>
                  {dotColor !== 'transparent' && <View style={[styles.dot, { backgroundColor: dotColor }]} />}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.sectionIntro}>
          <View>
            <Text style={styles.sectionEyebrow}>Filters</Text>
            <Text style={styles.sectionHeading}>Lọc trạng thái</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsWrap} contentContainerStyle={styles.tabsContent}>
          {TABS.map((t) => (
            <Pressable key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {loading ? (
          <ActivityIndicator size="large" color={colors.accent} style={{ flex: 1 }} />
        ) : (
          <View style={styles.list}>
            {filtered.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>📅</Text>
                <Text style={styles.emptyText}>Không có lịch hẹn</Text>
              </View>
            ) : filtered.map((b, i) => {
              const cfg = STATUS_CFG[b.status] ?? STATUS_CFG.Pending;
              return (
                <Animated.View key={b.id} entering={FadeInDown.duration(400).delay(i * 50)}>
                  <ClayCard style={[styles.card, b.status === 'Pending' && styles.pendingCard]}>
                    <View style={styles.cardTop}>
                      <View style={[styles.statusBadge, { backgroundColor: cfg.color + '18' }]}>
                        <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label.toUpperCase()}</Text>
                      </View>
                      <Text style={styles.price}>{b.agreedPrice?.toLocaleString('vi-VN')}đ</Text>
                    </View>
                    <View style={styles.cardBody}>
                      <Image source={{ uri: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80' }} style={styles.thumb} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.sessionTitle}>Session #{b.id.slice(0, 6)}</Text>
                        <View style={styles.infoRow}>
                          <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
                          <Text style={styles.infoText}>{new Date(b.scheduledAt).toLocaleString('vi-VN')}</Text>
                        </View>
                        <View style={styles.infoRow}>
                          <Ionicons name="cash-outline" size={13} color={colors.textMuted} />
                          <Text style={styles.infoText}>Hoa hồng: {b.commission?.toLocaleString('vi-VN')}đ</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.actions}>
                      {b.status === 'Pending' && (
                        <>
                          <Pressable style={styles.btnAccept} onPress={() => doAction(b, 'confirm')}>
                            <Text style={styles.btnAcceptText}>Chấp nhận</Text>
                          </Pressable>
                          <Pressable style={styles.btnReject} onPress={() => doAction(b, 'cancel')}>
                            <Text style={styles.btnRejectText}>Từ chối</Text>
                          </Pressable>
                        </>
                      )}
                      {b.status === 'Confirmed' && (
                        <Pressable style={styles.btnDone} onPress={() => doAction(b, 'complete')}>
                          <Text style={styles.btnDoneText}>Hoàn thành buổi chụp</Text>
                        </Pressable>
                      )}
                    </View>
                  </ClayCard>
                </Animated.View>
              );
            })}

            <View style={styles.selectedDayCard}>
              <View style={styles.sectionHead}>
                <View>
                  <Text style={styles.sectionEyebrow}>Today focus</Text>
                  <Text style={styles.sectionHeading}>Lịch cụ thể</Text>
                </View>
                <View style={styles.pendingBadgeCount}><Text style={styles.pendingBadgeCountText}>{selectedBookings.length} booking</Text></View>
              </View>
              {selectedBookings.length === 0 ? (
                <View style={styles.emptySelected}>
                  <Text style={styles.emptyText}>Ngày này chưa có booking</Text>
                </View>
              ) : selectedBookings.map((b, i) => {
                const cfg = STATUS_CFG[b.status] ?? STATUS_CFG.Pending;
                return (
                  <Animated.View key={b.id} entering={FadeInDown.duration(250).delay(i * 35)}>
                    <ClayCard style={styles.card}>
                      <View style={styles.cardTop}>
                        <View style={[styles.statusBadge, { backgroundColor: cfg.color + '18' }]}>
                          <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label.toUpperCase()}</Text>
                        </View>
                        <Text style={styles.price}>{b.agreedPrice?.toLocaleString('vi-VN')}đ</Text>
                      </View>
                      <View style={styles.cardBody}>
                        <Image source={{ uri: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80' }} style={styles.thumb} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.sessionTitle}>Session #{b.id.slice(0, 6)}</Text>
                          <View style={styles.infoRow}>
                            <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
                            <Text style={styles.infoText}>{new Date(b.scheduledAt).toLocaleString('vi-VN')}</Text>
                          </View>
                          <View style={styles.infoRow}>
                            <Ionicons name="cash-outline" size={13} color={colors.textMuted} />
                            <Text style={styles.infoText}>Hoa hồng: {b.commission?.toLocaleString('vi-VN')}đ</Text>
                          </View>
                        </View>
                      </View>
                    </ClayCard>
                  </Animated.View>
                );
              })}
            </View>

            <View style={{ height: spacing[10] }} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { paddingHorizontal: spacing[6], paddingTop: spacing[6], paddingBottom: spacing[5], gap: spacing[3] },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing[3] },
  headerKicker: { fontSize: 10, fontWeight: fontWeights.bold, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.primary, marginBottom: 6 },
  headerTitle: { fontSize: 30, fontWeight: fontWeights.bold, color: colors.dark, letterSpacing: 0.5 },
  headerSub: { fontSize: fontSizes.xs, color: 'rgba(10,10,6,0.65)', marginTop: 4 },
  headerAccent: { width: 44, height: 44, borderRadius: 16, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', shadowColor: colors.primary, shadowOpacity: 0.25, shadowRadius: 10, elevation: 4 },
  heroStatsRow: { flexDirection: 'row', gap: 10 },
  heroStatCard: { flex: 1, backgroundColor: '#fff', borderRadius: 18, paddingVertical: 14, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(10,10,6,0.08)', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 1 },
  heroStatValue: { fontSize: 20, fontWeight: fontWeights.bold, color: colors.dark },
  heroStatLabel: { fontSize: 10, color: 'rgba(10,10,6,0.55)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.8 },
  sectionIntro: { paddingHorizontal: spacing[6], marginTop: spacing[5], marginBottom: spacing[2], flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionEyebrow: { fontSize: 10, fontWeight: fontWeights.bold, color: colors.primary, letterSpacing: 1.1, textTransform: 'uppercase' },
  sectionHeading: { marginTop: 4, fontSize: 20, fontWeight: fontWeights.bold, color: colors.dark },
  sectionBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(10,10,6,0.08)', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999 },
  sectionBadgeText: { color: 'rgba(10,10,6,0.7)', fontSize: 12, fontWeight: fontWeights.semibold },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[6], paddingTop: spacing[2] },
  monthNavBtn: { width: 38, height: 38, borderRadius: radius.full, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(10,10,6,0.08)' },
  monthNavTitle: { color: colors.dark, fontSize: fontSizes.md, fontWeight: fontWeights.bold, textTransform: 'capitalize', flex: 1, textAlign: 'center', paddingHorizontal: spacing[2] },
  screenContent: { paddingBottom: 24 },
  calendarCard: { marginHorizontal: spacing[6], marginTop: spacing[2], padding: spacing[4], backgroundColor: '#fff', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(10,10,6,0.08)', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 18, elevation: 2 },
  weekRow: { flexDirection: 'row', marginBottom: spacing[2] },
  weekLabel: { width: CELL, textAlign: 'center', color: 'rgba(10,10,6,0.55)', fontSize: 10, fontWeight: fontWeights.bold },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cell: { borderRadius: 16, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(10,10,6,0.08)' },
  selectedCell: { backgroundColor: colors.dark, borderColor: colors.dark },
  selectedCellText: { color: colors.background },
  cellText: { fontSize: 15, fontWeight: '900', color: colors.dark },
  dot: { position: 'absolute', bottom: 8, width: 6, height: 6, borderRadius: 3 },
  tabsWrap: { flexGrow: 0 },
  tabsContent: { paddingHorizontal: spacing[6], gap: spacing[2], paddingVertical: spacing[2] },
  tab: { paddingVertical: spacing[2], paddingHorizontal: spacing[4], borderRadius: radius.full, backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(10,10,6,0.08)', minHeight: 40, justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  tabActive: { backgroundColor: colors.dark, borderColor: colors.dark },
  tabText: { fontSize: fontSizes.xs, fontWeight: fontWeights.semibold, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
  tabTextActive: { color: colors.background },
  list: { paddingHorizontal: spacing[6], gap: spacing[3] },
  empty: { alignItems: 'center', gap: spacing[3], paddingTop: spacing[12] },
  emptyEmoji: { fontSize: 48 },
  emptyText: { color: colors.textMuted, fontSize: fontSizes.md },
  selectedDayCard: { marginTop: spacing[4] },
  emptySelected: { alignItems: 'center', paddingVertical: spacing[5] },
  card: { padding: spacing[4], gap: spacing[3] },
  pendingCard: { borderColor: colors.accent + '50', borderWidth: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardBody: { flexDirection: 'row', gap: spacing[3], alignItems: 'center' },
  thumb: { width: 52, height: 52, borderRadius: radius.sm },
  sessionTitle: { fontSize: fontSizes.sm, color: colors.dark, fontWeight: fontWeights.semibold, marginBottom: spacing[1] },
  statusBadge: { paddingHorizontal: spacing[3], paddingVertical: spacing[1], borderRadius: radius.full },
  statusText: { fontSize: 10, fontWeight: fontWeights.bold, letterSpacing: 0.7 },
  price: { fontSize: fontSizes.md, fontWeight: fontWeights.bold, color: colors.dark },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  infoText: { fontSize: fontSizes.sm, color: colors.textMuted },
  actions: { flexDirection: 'row', gap: spacing[3] },
  btnAccept: { flex: 1, backgroundColor: colors.dark, borderRadius: radius.full, paddingVertical: spacing[2.5], alignItems: 'center' },
  btnAcceptText: { color: colors.background, fontWeight: fontWeights.semibold, fontSize: fontSizes.sm },
  btnReject: { flex: 1, borderWidth: 1, borderColor: colors.accent + '50', borderRadius: radius.full, paddingVertical: spacing[2.5], alignItems: 'center' },
  btnRejectText: { color: colors.accent, fontWeight: fontWeights.semibold, fontSize: fontSizes.sm },
  btnDone: { flex: 1, backgroundColor: colors.success + '18', borderRadius: radius.full, paddingVertical: spacing[2.5], alignItems: 'center', borderWidth: 1, borderColor: colors.success + '40' },
  btnDoneText: { color: colors.success, fontWeight: fontWeights.semibold, fontSize: fontSizes.sm },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[2] },
  sectionTitle: { fontSize: fontSizes.md, fontWeight: fontWeights.bold, color: colors.dark },
  pendingBadgeCount: { backgroundColor: colors.primary + '18', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
  pendingBadgeCountText: { fontSize: 9, fontWeight: '700', color: colors.primary, textTransform: 'uppercase' },
});
