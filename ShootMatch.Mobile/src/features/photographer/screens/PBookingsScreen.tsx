import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cancelBooking, completeBooking, confirmBooking, getMyBookingsAsPhotographer, PBooking } from '../api';
import { colors } from '../../../app/theme/colors';
import { fontSizes, fontWeights } from '../../../app/theme/typography';
import { spacing } from '../../../app/theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAL_CELL = Math.floor((SCREEN_WIDTH - 40 - 36) / 7);

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  Pending: { label: 'Chờ duyệt', color: '#B4781A', bg: 'rgba(212, 175, 55, 0.15)' },
  Confirmed: { label: 'Đã xác nhận', color: '#3A6073', bg: 'rgba(58, 96, 115, 0.12)' },
  Completed: { label: 'Hoàn tất', color: '#3D7055', bg: 'rgba(61, 112, 85, 0.12)' },
  Cancelled: { label: 'Đã hủy', color: '#914141', bg: 'rgba(145, 65, 65, 0.12)' },
};

function toKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function clampDay(year: number, monthIndex: number, day: number) {
  return Math.min(day, new Date(year, monthIndex + 1, 0).getDate());
}

function formatDate(date: Date) {
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatMonthYear(date: Date) {
  return date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
}

function formatLongDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function BookingCard({
  booking,
  onConfirm,
  onComplete,
  onCancel,
}: {
  booking: PBooking;
  onPress?: () => void;
  onConfirm: () => void;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const cfg = STATUS_CFG[booking.status] ?? STATUS_CFG.Pending;
  const isPending = booking.status === 'Pending';
  const isConfirmed = booking.status === 'Confirmed';

  return (
    <View style={styles.bookingCard}>
      <View style={styles.bookingTopRow}>
        <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
          <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
        <Text style={styles.price}>{booking.agreedPrice?.toLocaleString('vi-VN')} đ</Text>
      </View>

      <View style={styles.bookingBody}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80' }}
          style={styles.cover}
        />
        <View style={styles.metaWrap}>
          <Text style={styles.title} numberOfLines={1}>
            {booking.servicePackageId ? `Gói dịch vụ #${booking.id.slice(0, 6)}` : `Buổi chụp riêng #${booking.id.slice(0, 6)}`}
          </Text>
          <Text style={styles.timeText}>{formatLongDateTime(booking.scheduledAt)}</Text>

          <View style={styles.tagRow}>
            <View style={styles.infoBadge}>
              <Ionicons name="location-outline" size={12} color="#4E4637" />
              <Text style={styles.infoBadgeText} numberOfLines={1}>{booking.location || 'Studio'}</Text>
            </View>
            <View style={styles.infoBadge}>
              <Ionicons name="call-outline" size={12} color="#4E4637" />
              <Text style={styles.infoBadgeText} numberOfLines={1}>{booking.phone || 'N/A'}</Text>
            </View>
          </View>
        </View>
      </View>

      {(booking.note || booking.requirements) && (
        <View style={styles.noteBox}>
          <Text style={styles.noteTitle}>Ghi chú từ ống kính:</Text>
          <Text style={styles.noteText} numberOfLines={2}>
            {booking.note || booking.requirements}
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        {isPending && (
          <>
            <Pressable style={[styles.btn, styles.btnDangerOutline]} onPress={onCancel}>
              <Text style={styles.textDangerBtn}>Từ chối</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.btnGoldSolid]} onPress={onConfirm}>
              <Text style={styles.textDarkBtn}>Chấp nhận lịch</Text>
            </Pressable>
          </>
        )}
        {isConfirmed && (
          <Pressable style={[styles.btn, styles.btnPrimarySolid]} onPress={onComplete}>
            <Ionicons name="camera-outline" size={15} color="#FAF7F2" />
            <Text style={styles.textLightBtn}>Bắt đầu bấm máy</Text>
          </Pressable>
        )}
        {booking.status === 'Completed' && (
          <View style={styles.completedRibbon}>
            <Ionicons name="checkmark-done" size={14} color="#3D7055" />
            <Text style={styles.completedRibbonText}>Màn trập đã hoàn tất xuất sắc</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function CalendarModal({
  visible,
  value,
  onClose,
  onSelect,
}: {
  visible: boolean;
  value: Date;
  onClose: () => void;
  onSelect: (date: Date) => void;
}) {
  const [year, setYear] = useState(value.getFullYear());
  const [month, setMonth] = useState(value.getMonth());
  const [day, setDay] = useState(value.getDate());

  useEffect(() => {
    if (visible) {
      setYear(value.getFullYear());
      setMonth(value.getMonth());
      setDay(value.getDate());
    }
  }, [visible, value]);

  const monthStart = new Date(year, month, 1);
  const startOffset = (monthStart.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const flatCells = useMemo(() => {
    const arr: Array<number | null> = [];
    for (let i = 0; i < startOffset; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [startOffset, daysInMonth]);

  const weeks = useMemo(() => {
    const chunked: Array<Array<number | null>> = [];
    for (let i = 0; i < flatCells.length; i += 7) {
      chunked.push(flatCells.slice(i, i + 7));
    }
    return chunked;
  }, [flatCells]);

  const selectedDate = new Date(year, month, clampDay(year, month, day));
  const weekLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  function moveMonth(delta: number) {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
    setDay(clampDay(next.getFullYear(), next.getMonth(), day));
  }

  function applyPickedDate(date: Date) {
    onSelect(date);
    onClose();
  }

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={() => null}>
          <View style={styles.calendarTopBar}>
            <Pressable style={styles.calendarNavBtn} onPress={() => moveMonth(-1)}>
              <Ionicons name="chevron-back" size={18} color="#2E2A24" />
            </Pressable>
            <Text style={styles.calendarMonth}>{formatMonthYear(monthStart)}</Text>
            <Pressable style={styles.calendarNavBtn} onPress={() => moveMonth(1)}>
              <Ionicons name="chevron-forward" size={18} color="#2E2A24" />
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {weekLabels.map((label) => (
              <Text key={label} style={styles.weekLabel}>{label}</Text>
            ))}
          </View>

          <View style={styles.calendarGridContainer}>
            {weeks.map((week, weekIdx) => (
              <View key={`week-${weekIdx}`} style={styles.calendarWeekRow}>
                {week.map((item, itemIdx) => {
                  if (!item) {
                    return <View key={`empty-${weekIdx}-${itemIdx}`} style={styles.calendarCellEmpty} />;
                  }
                  const date = new Date(year, month, item);
                  const selected = toKey(date) === toKey(selectedDate);
                  const today = toKey(date) === toKey(new Date());
                  return (
                    <Pressable
                      key={`day-${item}`}
                      style={[styles.calendarCell, selected && styles.calendarCellActive]}
                      onPress={() => setDay(item)}
                    >
                      <Text style={[styles.calendarCellText, selected && styles.calendarCellTextActive, today && !selected && styles.calendarCellToday]}>
                        {item}
                      </Text>
                      {today && !selected && <View style={styles.todayIndicatorDot} />}
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>

          <View style={styles.modalFooter}>
            <Pressable style={styles.modalSecondaryBtn} onPress={() => applyPickedDate(new Date())}>
              <Text style={styles.modalSecondaryText}>Hôm nay</Text>
            </Pressable>
            <Pressable style={styles.modalPrimaryBtn} onPress={() => applyPickedDate(selectedDate)}>
              <Text style={styles.modalPrimaryText}>Áp dụng</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function PBookingsScreen() {
  const navigation = useNavigation<any>();
  const [bookings, setBookings] = useState<PBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);

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
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation]);

  async function doAction(b: PBooking, type: 'confirm' | 'complete' | 'cancel') {
    try {
      if (type === 'confirm') await confirmBooking(b.id);
      if (type === 'complete') await completeBooking(b.id);
      if (type === 'cancel') await cancelBooking(b.id, 'Nhiếp ảnh gia hủy');
      await load();
    } catch {
      Alert.alert('Thất bại', 'Không cập nhật được trạng thái shot hình.');
    }
  }

  const stats = useMemo(() => ({
    pending: bookings.filter((b) => b.status === 'Pending').length,
    confirmed: bookings.filter((b) => b.status === 'Confirmed').length,
    completed: bookings.filter((b) => b.status === 'Completed').length,
  }), [bookings]);

  const selectedBookings = useMemo(
    () => bookings
      .filter((b) => toKey(new Date(b.scheduledAt)) === toKey(selectedDate))
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()),
    [bookings, selectedDate]
  );

  const isToday = toKey(selectedDate) === toKey(new Date());
  const dateLabel = isToday ? 'Hôm nay' : formatDate(selectedDate);

  return (
    <SafeAreaView style={styles.safe}>
      <CalendarModal
        visible={calendarOpen}
        value={selectedDate}
        onClose={() => setCalendarOpen(false)}
        onSelect={setSelectedDate}
      />

      <View style={styles.premiumHeader}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.brandSubtitle}>SHOOTMATCH ATELIER</Text>
            <Text style={styles.brandTitle}>Lịch trình bấm máy</Text>
          </View>
          <Pressable style={styles.headerIconBtn} onPress={() => setCalendarOpen(true)}>
            <Ionicons name="aperture-outline" size={20} color="#D4AF37" />
          </Pressable>
        </View>

        <View style={styles.counterRow}>
          <View style={[styles.counterCard, { backgroundColor: 'rgba(58, 96, 115, 0.08)' }]}>
            <Text style={[styles.counterNumber, { color: '#3A6073' }]}>{stats.confirmed}</Text>
            <Text style={styles.counterLabel}>Đã chốt</Text>
          </View>
          <View style={[styles.counterCard, { backgroundColor: 'rgba(212, 175, 55, 0.08)' }]}>
            <Text style={[styles.counterNumber, { color: '#B4781A' }]}>{stats.pending}</Text>
            <Text style={styles.counterLabel}>Chờ duyệt</Text>
          </View>
          <View style={[styles.counterCard, { backgroundColor: '#D4AF37' }]}>
            <Text style={[styles.counterNumber, { color: '#FAF7F2' }]}>{stats.completed}</Text>
            <Text style={[styles.counterLabel, { color: '#FAF7F2', opacity: 0.8 }]}>Hoàn tất</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor="#2E2A24"
          />
        }
      >
        <View style={styles.dateSelectorRow}>
          <Pressable style={styles.dateArrow} onPress={() => setSelectedDate(addDays(selectedDate, -1))}>
            <Ionicons name="chevron-back" size={16} color="#2E2A24" />
          </Pressable>
          <Pressable style={styles.dateCenterBtn} onPress={() => setCalendarOpen(true)}>
            <Ionicons name="time-outline" size={14} color="#7A7062" style={{ marginRight: 6 }} />
            <Text style={styles.dateCenterText}>{dateLabel}</Text>
          </Pressable>
          <Pressable style={styles.dateArrow} onPress={() => setSelectedDate(addDays(selectedDate, 1))}>
            <Ionicons name="chevron-forward" size={16} color="#2E2A24" />
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Khung hình trong ngày ({selectedBookings.length})</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color="#2E2A24" style={styles.loader} />
        ) : (
          <View style={styles.list}>
            {selectedBookings.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="camera-reverse-outline" size={44} color="#A39A8E" />
                <Text style={styles.emptyTitle}>Trống lịch thấu kính</Text>
                <Text style={styles.emptyText}>Hôm nay không có lịch đặt nào. Hãy thư giãn hoặc chọn mốc ngày khác.</Text>
              </View>
            ) : (
              selectedBookings.map((b, i) => (
                <Animated.View key={b.id} entering={FadeInDown.duration(300).delay(i * 35)}>
                  <BookingCard
                    booking={b}
                    onCancel={() => doAction(b, 'cancel')}
                    onConfirm={() => doAction(b, 'confirm')}
                    onComplete={() => doAction(b, 'complete')}
                  />
                </Animated.View>
              ))
            )}
          </View>
        )}
        <View style={{ height: spacing[8] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2ECE1' },

  premiumHeader: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    backgroundColor: '#FAF7F2',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    boxShadow: '0px 6px 16px rgba(46,42,36,0.04)',
    elevation: 3,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  brandSubtitle: {
    fontSize: 10,
    letterSpacing: 2.5,
    color: '#9C9180',
    fontWeight: '700',
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#2E2A24',
    marginTop: 2,
    letterSpacing: -0.4,
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F2ECE1',
    alignItems: 'center',
    justifyContent: 'center',
  },

  counterRow: {
    flexDirection: 'row',
    gap: 10,
  },
  counterCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  counterNumber: {
    fontSize: 20,
    fontWeight: '700',
  },
  counterLabel: {
    fontSize: 11,
    color: '#7A7062',
    marginTop: 2,
    fontWeight: '600',
  },

  content: { paddingTop: 20 },

  dateSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    backgroundColor: '#FAF7F2',
    borderRadius: 20,
    padding: 6,
    boxShadow: '0px 4px 12px rgba(46,42,36,0.03)',
    elevation: 2,
  },
  dateArrow: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCenterBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    height: 40,
  },
  dateCenterText: { color: '#2E2A24', fontSize: 14, fontWeight: '700' },

  sectionHeader: {
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 24,
  },
  sectionTitle: { color: '#7A7062', fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  loader: { paddingVertical: 40 },
  list: { paddingHorizontal: 24, gap: 14 },

  emptyState: { paddingVertical: 48, alignItems: 'center', gap: 8 },
  emptyTitle: { color: '#2E2A24', fontSize: 16, fontWeight: '700' },
  emptyText: { color: '#7A7062', fontSize: 13, textAlign: 'center', paddingHorizontal: 20, lineHeight: 18 },

  bookingCard: {
    backgroundColor: '#FAF7F2',
    borderRadius: 20,
    padding: 16,
    gap: 14,
    boxShadow: '0px 6px 18px rgba(46,42,36,0.03)',
    elevation: 2,
  },
  bookingTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  statusDot: { width: 6, height: 6, borderRadius: 99 },
  statusText: { fontSize: 10, fontWeight: '700' },
  price: { color: '#2E2A24', fontSize: 17, fontWeight: '700' },
  bookingBody: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  cover: { width: 66, height: 66, borderRadius: 14, backgroundColor: '#F2ECE1' },
  metaWrap: { flex: 1, gap: 2 },
  title: { color: '#2E2A24', fontSize: 15, fontWeight: '700' },
  timeText: { color: '#3A6073', fontSize: 12, fontWeight: '600' },
  tagRow: { flexDirection: 'row', gap: 6, marginTop: 2 },
  infoBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F2ECE1', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  infoBadgeText: { color: '#4E4637', fontSize: 11, fontWeight: '500' },

  noteBox: {
    padding: 12,
    backgroundColor: '#F7F3EB',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#D4AF37',
  },
  noteTitle: { color: '#7A7062', fontSize: 10, fontWeight: '700' },
  noteText: { color: '#2E2A24', fontSize: 12, marginTop: 2, lineHeight: 16 },

  actions: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  btnGoldSolid: { backgroundColor: '#D4AF37' },
  btnPrimarySolid: { backgroundColor: '#2E2A24' },
  btnDangerOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#E0A9A9' },
  textLightBtn: { color: '#FAF7F2', fontSize: 13, fontWeight: '700' },
  textDarkBtn: { color: '#FAF7F2', fontSize: 13, fontWeight: '700' },
  textDangerBtn: { color: '#914141', fontSize: 13, fontWeight: '700' },
  completedRibbon: { flex: 1, height: 44, borderRadius: 14, backgroundColor: 'rgba(61, 112, 85, 0.1)', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  completedRibbonText: { color: '#3D7055', fontSize: 12, fontWeight: '700' },

  // ================= CALENDAR UI (REMOVED TINTED CELL BACKGROUND) =================
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(46,42,36,0.3)', justifyContent: 'center', paddingHorizontal: 20 },
  modalCard: { backgroundColor: '#FAF7F2', borderRadius: 24, padding: 20, gap: 16 },
  calendarTopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  calendarNavBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F2ECE1' },
  calendarMonth: { color: '#2E2A24', fontSize: 15, fontWeight: '700' },

  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 2 },
  weekLabel: { width: CAL_CELL, textAlign: 'center', color: '#9C9180', fontSize: 11, fontWeight: '700' },

  calendarGridContainer: {
    flexDirection: 'column',
    gap: 8,
  },
  calendarWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  calendarCell: {
    width: CAL_CELL,
    height: CAL_CELL,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: 'transparent' // FIX: Đã đưa về dạng trong suốt, loại bỏ hoàn toàn nền mờ cũ
  },
  calendarCellEmpty: {
    width: CAL_CELL,
    height: CAL_CELL,
    backgroundColor: 'transparent'
  },
  calendarCellActive: { backgroundColor: '#2E2A24' }, // Vẫn giữ màu Charcoal đậm nổi bật khi click chọn
  calendarCellText: { color: '#2E2A24', fontSize: 13, fontWeight: '600' },
  calendarCellTextActive: { color: '#FAF7F2', fontWeight: '700' },
  calendarCellToday: { color: '#3A6073', fontWeight: '700' },
  todayIndicatorDot: { width: 4, height: 4, borderRadius: 99, backgroundColor: '#3A6073', position: 'absolute', bottom: 4 },

  modalFooter: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalSecondaryBtn: { flex: 1, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F2ECE1' },
  modalSecondaryText: { color: '#2E2A24', fontSize: 13, fontWeight: '700' },
  modalPrimaryBtn: { flex: 1, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2E2A24' },
  modalPrimaryText: { color: '#FAF7F2', fontSize: 13, fontWeight: '700' },
});