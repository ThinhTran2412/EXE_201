import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { usePhotographerTheme } from '../PhotographerThemeContext';
import { fontSizes, fontWeights } from '../../../app/theme/typography';
import { radius, spacing, shadows } from '../../../app/theme/spacing';
import {
  blockAvailability,
  getAvailability,
  unblockAvailability,
  getMyBookingsAsPhotographer,
  confirmBooking,
  cancelBooking,
  type PhotographerAvailabilitySlot,
  type PBooking,
} from '../api';

type BookingStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Busy';

type BookingEvent = {
  id: string;
  date: string;
  time: string;
  title: string;
  customer: string;
  shootType: string;
  city: string;
  status: BookingStatus;
  location: string;
  price: number;
};

type TimeSlot = {
  start: string;
  end: string;
  label: string;
  shift: 'morning' | 'afternoon' | 'evening';
};

type ShiftKey = TimeSlot['shift'];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CELL = Math.floor((SCREEN_WIDTH - spacing[6] * 2 - 12 * 6) / 7);
const MONTH_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const TIME_SLOTS: TimeSlot[] = [
  { start: '07:00', end: '07:30', label: 'Ca 1', shift: 'morning' },
  { start: '07:30', end: '08:00', label: 'Ca 2', shift: 'morning' },
  { start: '08:00', end: '08:30', label: 'Ca 3', shift: 'morning' },
  { start: '08:30', end: '09:00', label: 'Ca 4', shift: 'morning' },
  { start: '09:00', end: '09:30', label: 'Ca 5', shift: 'morning' },
  { start: '09:30', end: '10:00', label: 'Ca 6', shift: 'morning' },
  { start: '10:00', end: '10:30', label: 'Ca 7', shift: 'morning' },
  { start: '10:30', end: '11:00', label: 'Ca 8', shift: 'morning' },
  { start: '11:00', end: '11:30', label: 'Ca 9', shift: 'morning' },
  { start: '11:30', end: '12:00', label: 'Ca 10', shift: 'morning' },
  { start: '12:00', end: '12:30', label: 'Ca 1', shift: 'afternoon' },
  { start: '12:30', end: '13:00', label: 'Ca 2', shift: 'afternoon' },
  { start: '13:00', end: '13:30', label: 'Ca 3', shift: 'afternoon' },
  { start: '13:30', end: '14:00', label: 'Ca 4', shift: 'afternoon' },
  { start: '14:00', end: '14:30', label: 'Ca 5', shift: 'afternoon' },
  { start: '14:30', end: '15:00', label: 'Ca 6', shift: 'afternoon' },
  { start: '15:00', end: '15:30', label: 'Ca 7', shift: 'afternoon' },
  { start: '15:30', end: '16:00', label: 'Ca 8', shift: 'afternoon' },
  { start: '16:00', end: '16:30', label: 'Ca 9', shift: 'afternoon' },
  { start: '16:30', end: '17:00', label: 'Ca 10', shift: 'afternoon' },
  { start: '17:00', end: '17:30', label: 'Ca 1', shift: 'evening' },
  { start: '17:30', end: '18:00', label: 'Ca 2', shift: 'evening' },
  { start: '18:00', end: '18:30', label: 'Ca 3', shift: 'evening' },
  { start: '18:30', end: '19:00', label: 'Ca 4', shift: 'evening' },
  { start: '19:00', end: '19:30', label: 'Ca 5', shift: 'evening' },
  { start: '19:30', end: '20:00', label: 'Ca 6', shift: 'evening' },
  { start: '20:00', end: '20:30', label: 'Ca 7', shift: 'evening' },
  { start: '20:30', end: '21:00', label: 'Ca 8', shift: 'evening' },
  { start: '21:00', end: '21:30', label: 'Ca 9', shift: 'evening' },
  { start: '21:30', end: '22:00', label: 'Ca 10', shift: 'evening' },
];

function toKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function slotToAvailability(date: string, slot: TimeSlot): PhotographerAvailabilitySlot {
  return { specificDate: date, startTime: slot.start, endTime: slot.end, slotType: 'Blocked' };
}

function normalizeTime(time: string) {
  return time.length >= 5 ? time.slice(0, 5) : time;
}

const INITIAL_EVENTS = (): BookingEvent[] => {
  const todayStr = toKey(new Date());
  return [
    { id: '1', date: todayStr, time: '09:15', title: 'Chụp cưới ngoại cảnh', customer: 'Lâm Minh Anh', shootType: 'Wedding (Chụp Cưới)', city: 'Đà Lạt', status: 'Confirmed', location: 'Hồ Tuyền Lâm, Đà Lạt', price: 4500000 },
    { id: '2', date: todayStr, time: '14:30', title: 'Chụp chân dung cá nhân', customer: 'Nguyễn Hồng Nhung', shootType: 'Portrait (Chân Dung)', city: 'TP.HCM', status: 'Pending', location: 'Phố đi bộ Nguyễn Huệ, Quận 1', price: 1200000 },
    { id: '3', date: '2026-05-12', time: '18:00', title: 'Sự kiện khai trương', customer: 'Công ty Cổ phần ABC', shootType: 'Event (Sự Kiện)', city: 'TP.HCM', status: 'Confirmed', location: 'Gigamall Phạm Văn Đồng, Thủ Đức', price: 2800000 },
    { id: '4', date: '2026-05-21', time: '10:45', title: 'Chụp ảnh gia đình ngoại cảnh', customer: 'Gia đình anh Huy', shootType: 'Family (Gia Đình)', city: 'TP.HCM', status: 'Completed', location: 'Công viên Gia Định, Phú Nhuận', price: 2200000 },
  ];
};

function getMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startDay = (first.getDay() + 6) % 7;
  const totalDays = new Date(year, month + 1, 0).getDate();
  const grid: (Date | null)[] = [];
  for (let i = 0; i < startDay; i++) grid.push(null);
  for (let d = 1; d <= totalDays; d++) grid.push(new Date(year, month, d));
  while (grid.length % 7 !== 0) grid.push(null);
  return grid;
}

export default function PBookingCalendarScreen() {
  const navigation = useNavigation<any>();
  const { colors, isDark } = usePhotographerTheme();
  const styles = getStyles(colors);
  const [selected, setSelected] = useState(new Date());
  const [events, setEvents] = useState<BookingEvent[]>(INITIAL_EVENTS);
  const [availabilitySlots, setAvailabilitySlots] = useState<PhotographerAvailabilitySlot[]>([]);
  const [realBookings, setRealBookings] = useState<PBooking[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [selectionEnabled, setSelectionEnabled] = useState(false);
  const [collapsedShifts, setCollapsedShifts] = useState<Record<ShiftKey, boolean>>({
    morning: false,
    afternoon: false,
    evening: false,
  });

  const year = selected.getFullYear();
  const month = selected.getMonth();
  const days = useMemo(() => getMonthGrid(year, month), [year, month]);

  const selectedKey = toKey(selected);
  const selectedEvents = useMemo(() => events.filter((e) => e.date === selectedKey), [events, selectedKey]);
  const displayEvents = useMemo(() => selectedEvents.filter((e) => e.status !== 'Busy'), [selectedEvents]);

  const bookedMap = useMemo(() => {
    const map = new Map<string, BookingEvent[]>();
    events.forEach((event) => {
      const list = map.get(event.date) ?? [];
      list.push(event);
      map.set(event.date, list);
    });
    return map;
  }, [events]);

  const loadData = async () => {
    try {
      const [slots, realBookingsList] = await Promise.all([
        getAvailability().catch(() => []),
        getMyBookingsAsPhotographer().catch(() => []),
      ]);
      setAvailabilitySlots(slots);
      setRealBookings(realBookingsList);
    } catch (err) {
      console.warn('Failed to load availability/bookings', err);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    syncBusyFromAvailability(availabilitySlots, realBookings);
  }, [availabilitySlots, realBookings]);

  const monthLabel = selected.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
  const pendingCount = events.filter((e) => e.status === 'Pending').length;
  const confirmedCount = events.filter((e) => e.status === 'Confirmed').length;
  const busyCount = events.filter((e) => e.status === 'Busy').length;

  const shifts = useMemo(() => ({
    morning: TIME_SLOTS.filter((slot) => slot.shift === 'morning'),
    afternoon: TIME_SLOTS.filter((slot) => slot.shift === 'afternoon'),
    evening: TIME_SLOTS.filter((slot) => slot.shift === 'evening'),
  }), []);

  function changeMonth(direction: -1 | 1) {
    setSelected(new Date(year, month + direction, 1));
  }

  function toggleSlotSelection(slot: TimeSlot) {
    const key = slot.start;
    setSelectionEnabled(true);
    setSelectedSlots((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]));
  }

  function toggleShiftSelection(shift: ShiftKey) {
    setSelectionEnabled(true);
    const keys = shifts[shift].map((slot) => slot.start);
    setSelectedSlots((prev) => {
      const allSelected = keys.every((key) => prev.includes(key));
      return allSelected ? prev.filter((item) => !keys.includes(item)) : Array.from(new Set([...prev, ...keys]));
    });
  }

  function clearSelectedSlots() {
    setSelectedSlots([]);
    setSelectionEnabled(false);
  }

  function syncBusyFromAvailability(slots: PhotographerAvailabilitySlot[], realBookingsList: PBooking[]) {
    const base = INITIAL_EVENTS();

    // Map real bookings to BookingEvent format
    const bookingEvents: BookingEvent[] = realBookingsList.map((b) => {
      const dateObj = new Date(b.scheduledAt);
      const dateStr = toKey(dateObj);
      const hours = String(dateObj.getHours()).padStart(2, '0');
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;

      return {
        id: b.id,
        date: dateStr,
        time: timeStr,
        title: b.note || 'Yêu cầu chụp',
        customer: b.phone ? `Khách (${b.phone})` : 'Khách hàng',
        shootType: b.requirements || 'Gói dịch vụ',
        city: '-',
        status: b.status as BookingStatus,
        location: b.location || 'Chưa xác định',
        price: b.agreedPrice,
      };
    });

    const uniqueBlocked = new Map<string, PhotographerAvailabilitySlot>();

    slots
      .filter((slot) => slot.slotType === 'Blocked' && slot.specificDate)
      .forEach((slot) => {
        uniqueBlocked.set(`${slot.specificDate}-${slot.startTime}`, slot);
      });

    const blockedEvents: BookingEvent[] = Array.from(uniqueBlocked.values()).map((slot) => ({
      id: `blocked-${slot.specificDate}-${normalizeTime(slot.startTime)}`,
      date: slot.specificDate!,
      time: normalizeTime(slot.startTime),
      title: `Khóa lịch riêng`,
      customer: 'Đã chặn lịch',
      shootType: 'Khóa lịch',
      city: '-',
      status: 'Busy',
      location: 'Lịch cá nhân',
      price: 0,
    }));

    setEvents([...base, ...bookingEvents, ...blockedEvents]);
  }

  function applyBusySelectedSlots() {
    if (selectedSlots.length === 0) {
      Alert.alert('Chưa chọn khung giờ', 'Bạn hãy chọn ít nhất một khung giờ trước khi bận.');
      return;
    }

    const payloadSlots = selectedSlots
      .map((start) => TIME_SLOTS.find((slot) => slot.start === start))
      .filter((slot): slot is TimeSlot => Boolean(slot));

    Alert.alert('Xác nhận bận?', `Bạn muốn đánh dấu ${selectedSlots.length} khung giờ đã chọn là bận?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đánh dấu bận',
        style: 'destructive',
        onPress: async () => {
          await blockAvailability(selectedKey, payloadSlots.map((slot) => slotToAvailability(selectedKey, slot)));
          setAvailabilitySlots((prev) => [
            ...prev,
            ...payloadSlots.map((slot) => slotToAvailability(selectedKey, slot)),
          ]);
          clearSelectedSlots();
          Alert.alert('Đã cập nhật', 'Các khung giờ đã được đánh dấu bận.');
        },
      },
    ]);
  }

  function restoreSelectedSlots() {
    if (selectedSlots.length === 0) return;
    const payloadSlots = selectedSlots
      .map((start) => TIME_SLOTS.find((slot) => slot.start === start))
      .filter((slot): slot is TimeSlot => Boolean(slot));

    void unblockAvailability(selectedKey, payloadSlots.map((slot) => slotToAvailability(selectedKey, slot)));
    setAvailabilitySlots((prev) => prev.filter((slot) => !(slot.specificDate === selectedKey && selectedSlots.includes(normalizeTime(slot.startTime)))));
    clearSelectedSlots();
    Alert.alert('Đã hủy bận', 'Các khung giờ đã chọn được gỡ bận.');
  }

  function occupyWholeDay() {
    Alert.alert('Xác nhận bận cả ngày?', 'Tất cả khung giờ trong ngày này sẽ bị đánh dấu bận.', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Bận cả ngày',
        style: 'destructive',
        onPress: async () => {
          await blockAvailability(selectedKey, TIME_SLOTS.map((slot) => slotToAvailability(selectedKey, slot)));
          setAvailabilitySlots((prev) => [
            ...prev.filter((slot) => slot.specificDate !== selectedKey),
            ...TIME_SLOTS.map((slot) => slotToAvailability(selectedKey, slot)),
          ]);
          clearSelectedSlots();
          Alert.alert('Đã cập nhật', 'Ngày này đã được đánh dấu bận cả ngày.');
        },
      },
    ]);
  }

  async function acceptBooking(eventId: string) {
    const isReal = !['1', '2', '3', '4'].includes(eventId) && !eventId.startsWith('blocked-');
    if (isReal) {
      try {
        await confirmBooking(eventId);
        Alert.alert('Thành công', 'Đã chấp nhận lịch hẹn.');
        await loadData();
      } catch (err) {
        Alert.alert('Lỗi', 'Không thể xác nhận lịch hẹn.');
      }
    } else {
      setEvents((prev) => prev.map((event) => (event.id === eventId ? { ...event, status: 'Confirmed' } : event)));
      Alert.alert('Đã chấp nhận', 'Booking đã được chuyển sang lịch xác nhận của photographer (Demo).');
    }
  }

  async function rejectBooking(eventId: string) {
    const isReal = !['1', '2', '3', '4'].includes(eventId) && !eventId.startsWith('blocked-');
    if (isReal) {
      try {
        await cancelBooking(eventId, 'Từ chối yêu cầu đặt lịch');
        Alert.alert('Thành công', 'Đã từ chối lịch hẹn.');
        await loadData();
      } catch (err) {
        Alert.alert('Lỗi', 'Không thể từ chối lịch hẹn.');
      }
    } else {
      setEvents((prev) => prev.filter((event) => event.id !== eventId));
      Alert.alert('Đã từ chối', 'Booking đã được gỡ khỏi lịch (Demo).');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={isDark ? [colors.surface, colors.surfaceStrong] : ['#ffffff', '#fffcf5']} style={styles.hero}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.kicker}>LỊCH LÀM VIỆC</Text>
              <Text style={styles.title}>Quản lý lịch riêng</Text>
            </View>
            <View style={styles.heroIcon}>
              <Ionicons name="calendar" size={22} color={colors.white} />
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{pendingCount}</Text>
              <Text style={styles.statLabel}>Chờ duyệt</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: colors.success }]}>{confirmedCount}</Text>
              <Text style={styles.statLabel}>Đã accept</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: colors.textLight }]}>{busyCount}</Text>
              <Text style={styles.statLabel}>Đang bận</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.panel}>
          <View style={styles.monthRow}>
            <Pressable style={styles.monthBtn} onPress={() => changeMonth(-1)}><Ionicons name="chevron-back" size={18} color={colors.text} /></Pressable>
            <View style={{ flex: 1 }}>
              <Text style={styles.monthTitle}>{monthLabel}</Text>
              <Text style={styles.monthSub}>Lịch theo ngày của photographer</Text>
            </View>
            <Pressable style={styles.monthBtn} onPress={() => changeMonth(1)}><Ionicons name="chevron-forward" size={18} color={colors.text} /></Pressable>
          </View>

          <View style={styles.legendRow}>
            <Legend color="#4ade80" label="Đã xác nhận" />
            <Legend color="#fbbf24" label="Chờ duyệt" />
            <Legend color="#94a3b8" label="Đang bận" />
          </View>

          <View style={styles.weekRow}>
            {MONTH_LABELS.map((d) => <Text key={d} style={styles.weekLabel}>{d}</Text>)}
          </View>

          <View style={styles.grid}>
            {days.map((date, idx) => {
              if (!date) return <View key={`empty-${idx}`} style={[styles.cell, { width: CELL, height: CELL }]} />;
              const key = toKey(date);
              const dayEvents = bookedMap.get(key) ?? [];
              const isSelected = key === selectedKey;
              const hasConfirmed = dayEvents.some((e) => e.status === 'Confirmed' || e.status === 'Completed');
              const hasPending = dayEvents.some((e) => e.status === 'Pending');
              const hasBusyFromApi = availabilitySlots.some((slot) => slot.specificDate === key && slot.slotType === 'Blocked');
              const hasBusy = dayEvents.some((e) => e.status === 'Busy') || hasBusyFromApi;
              const dotColor = hasBusy ? '#94a3b8' : hasConfirmed ? '#4ade80' : hasPending ? '#fbbf24' : 'transparent';
              const textColor = colors.text;

              return (
                <Pressable key={key} style={[styles.cell, { width: CELL, height: CELL }, isSelected && (isDark ? { backgroundColor: '#ffffff', borderColor: '#ffffff' } : styles.selectedCell)]} onPress={() => setSelected(date)}>
                  <Text style={[styles.cellText, { color: isSelected ? (isDark ? '#000000' : '#ffffff') : textColor }]}>{date.getDate()}</Text>
                  {dotColor !== 'transparent' && <View style={[styles.dot, { backgroundColor: dotColor }]} />}
                </Pressable>
              );
            })}
          </View>
        </View>

        <Animated.View entering={FadeInDown.duration(250)} style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <View>
              <Text style={styles.detailTitle}>Ngày đã chọn</Text>
              <Text style={styles.detailSub}>{selected.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
            </View>
            <Pressable style={styles.busyDayBtn} onPress={occupyWholeDay}>
              <Ionicons name="remove-circle-outline" size={16} color={colors.accent} />
              <Text style={styles.busyDayBtnText}>Bận cả ngày</Text>
            </Pressable>
          </View>

          <View style={styles.slotSection}>
            <View style={styles.sectionHead}>
              <View>
                <Text style={styles.sectionEyebrow}>Khung giờ làm</Text>
                <Text style={styles.sectionHeading}>Cài đặt bận hoặc xem lịch</Text>
              </View>
              {selectionEnabled && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{selectedSlots.length} đã chọn</Text>
                </View>
              )}
            </View>

            <View style={styles.modeRow}>
              <Pressable
                style={[styles.modeBtn, selectionEnabled && styles.modeBtnActive]}
                onPress={() => {
                  if (selectionEnabled) {
                    if (selectedSlots.length > 0) {
                      applyBusySelectedSlots();
                    } else {
                      clearSelectedSlots();
                    }
                  } else {
                    setSelectionEnabled(true);
                  }
                }}
              >
                <Ionicons
                  name={selectionEnabled ? 'checkmark-circle-outline' : 'checkbox-outline'}
                  size={15}
                  color={selectionEnabled ? colors.white : colors.accent}
                />
                <Text style={[styles.modeBtnText, selectionEnabled && styles.modeBtnTextActive]}>
                  {selectionEnabled ? 'Hoàn tất' : 'Chọn lịch bận'}
                </Text>
              </Pressable>
              {selectionEnabled && (
                <Pressable style={styles.clearBtn} onPress={clearSelectedSlots}>
                  <Text style={styles.clearBtnText}>Hủy</Text>
                </Pressable>
              )}
            </View>

            {(['morning', 'afternoon', 'evening'] as ShiftKey[]).map((shift) => {
              const shiftSlots = shifts[shift];
              const shiftTitle = shift === 'morning' ? 'Buổi sáng' : shift === 'afternoon' ? 'Buổi chiều' : 'Buổi tối';
              const shiftRange = shift === 'morning' ? '07:00 - 12:00' : shift === 'afternoon' ? '12:00 - 17:00' : '17:00 - 22:00';
              const collapsed = collapsedShifts[shift];

              return (
                <View key={shift} style={styles.shiftSection}>
                  <View style={styles.shiftHeader}>
                    <Pressable 
                      style={styles.shiftHeaderToggle} 
                      onPress={() => setCollapsedShifts((prev) => ({ ...prev, [shift]: !prev[shift] }))}
                    >
                      <View>
                        <Text style={styles.shiftTitle}>{shiftTitle}</Text>
                        <Text style={styles.shiftRange}>{shiftRange}</Text>
                      </View>
                      <Ionicons name={collapsed ? 'chevron-down' : 'chevron-up'} size={16} color={colors.textLight} />
                    </Pressable>
                    {selectionEnabled && (
                      <Pressable onPress={() => toggleShiftSelection(shift)} style={styles.shiftSelectBtn}>
                        <Text style={styles.shiftSelectBtnText}>Chọn cả ca</Text>
                      </Pressable>
                    )}
                  </View>

                  {!collapsed && (
                    <View style={styles.slotsGrid}>
                      {shiftSlots.map((slot) => {
                        const occupied = selectedEvents.some((event) => event.time === slot.start && event.status === 'Busy');
                        const bookedEvent = selectedEvents.find((event) => event.time === slot.start && event.status !== 'Busy');
                        const picked = selectedSlots.includes(slot.start);

                        return (
                          <Pressable
                            key={slot.start}
                            style={[
                              styles.slotCard,
                              occupied && styles.slotCardBusy,
                              bookedEvent && styles.slotCardBooked,
                              picked && styles.slotCardPicked,
                            ]}
                            onPress={() => {
                              if (selectionEnabled) {
                                if (!bookedEvent) {
                                  toggleSlotSelection(slot);
                                }
                              } else {
                                if (bookedEvent) {
                                  Alert.alert(
                                    'Chi tiết Booking',
                                    `Khách hàng: ${bookedEvent.customer}\nKiểu chụp: ${bookedEvent.shootType}\nNơi chụp: ${bookedEvent.location}\nChi phí: ${bookedEvent.price.toLocaleString('vi-VN')} đ`
                                  );
                                }
                              }
                            }}
                          >
                            <Text
                              style={[
                                styles.slotTime,
                                occupied && styles.slotTimeBusy,
                                bookedEvent && styles.slotTimeBooked,
                                picked && styles.slotTimePicked,
                              ]}
                            >
                              {slot.start}
                            </Text>

                            {/* Round selector button: only shown when selection mode is ON and slot is not occupied by customer booking */}
                            {selectionEnabled && !bookedEvent && (
                              <View style={styles.selectionIndicator}>
                                <Ionicons
                                  name={picked ? 'checkmark-circle' : 'ellipse-outline'}
                                  size={16}
                                  color={picked ? colors.accent : colors.textLight}
                                />
                              </View>
                            )}

                            <Text
                              style={[
                                styles.slotMiniStatus,
                                occupied && styles.slotMiniStatusBusy,
                                bookedEvent && styles.slotMiniStatusBooked,
                                picked && styles.slotMiniStatusPicked,
                              ]}
                            >
                              {bookedEvent ? 'Có lịch' : occupied ? 'Đã chặn' : 'Còn trống'}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}

            {selectionEnabled && selectedSlots.length > 0 && (
              <View style={styles.bulkActionsRow}>
                <Pressable style={styles.bulkBtn} onPress={applyBusySelectedSlots}>
                  <Ionicons name="lock-closed-outline" size={16} color={colors.white} />
                  <Text style={styles.bulkBtnText}>Đánh dấu bận</Text>
                </Pressable>
                <Pressable style={styles.bulkBtnSecondary} onPress={restoreSelectedSlots}>
                  <Ionicons name="refresh-outline" size={16} color={colors.text} />
                  <Text style={styles.bulkBtnSecondaryText}>Hủy chặn (Mở lịch)</Text>
                </Pressable>
              </View>
            )}
          </View>

          <View style={styles.sectionHead}>
            <View>
              <Text style={styles.sectionEyebrow}>Lịch trong ngày</Text>
              <Text style={styles.sectionHeading}>Chi tiết Booking & Trạng thái</Text>
            </View>
          </View>

          {displayEvents.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="calendar-outline" size={32} color={colors.textLight} />
              <Text style={styles.emptyText}>Chưa có booking nào trong ngày này</Text>
            </View>
          ) : (
            displayEvents.map((event) => {
              const isPending = event.status === 'Pending';

              let statusBg = 'rgba(45, 106, 79, 0.1)';
              let statusColor: string = colors.success;
              let statusLabel = 'Đã xác nhận';

              if (event.status === 'Pending') {
                statusBg = 'rgba(207, 64, 40, 0.1)';
                statusColor = colors.accent;
                statusLabel = 'Chờ duyệt';
              } else if (event.status === 'Completed') {
                statusBg = 'rgba(45, 106, 79, 0.1)';
                statusColor = colors.success;
                statusLabel = 'Đã xong';
              }

              return (
                <View key={event.id} style={styles.eventCard}>
                  {/* Left part: Time and Status */}
                  <View style={styles.eventTimeCol}>
                    <View style={styles.eventTimeBadge}>
                      <Ionicons name="time-outline" size={12} color={colors.accent} />
                      <Text style={styles.eventTimeText}>{event.time}</Text>
                    </View>
                    <View style={[styles.eventStatusBadge, { backgroundColor: statusBg }]}>
                      <Text style={[styles.eventStatusText, { color: statusColor }]}>{statusLabel}</Text>
                    </View>
                  </View>

                  {/* Vertical Divider */}
                  <View style={styles.eventDivider} />

                  {/* Middle part: Details */}
                  <View style={styles.eventBody}>
                    <Text style={styles.eventTitle}>{event.title}</Text>

                    <View style={styles.eventDetailsList}>
                      <View style={styles.eventDetailRow}>
                        <Ionicons name="person-outline" size={13} color={colors.textLight} />
                        <Text style={styles.eventDetailText} numberOfLines={1}>
                          Khách book: <Text style={styles.eventDetailValue}>{event.customer}</Text>
                        </Text>
                      </View>

                      <View style={styles.eventDetailRow}>
                        <Ionicons name="camera-outline" size={13} color={colors.textLight} />
                        <Text style={styles.eventDetailText} numberOfLines={1}>
                          Kiểu chụp: <Text style={styles.eventDetailValue}>{event.shootType}</Text>
                        </Text>
                      </View>

                      <View style={styles.eventDetailRow}>
                        <Ionicons name="location-outline" size={13} color={colors.textLight} />
                        <Text style={styles.eventDetailText} numberOfLines={1}>
                          Khu vực: <Text style={styles.eventDetailValue}>{event.city} ({event.location})</Text>
                        </Text>
                      </View>

                      <View style={styles.eventDetailRow}>
                        <Ionicons name="cash-outline" size={13} color={colors.textLight} />
                        <Text style={styles.eventDetailText}>
                          Chi phí: <Text style={styles.eventPriceText}>{event.price.toLocaleString('vi-VN')} đ</Text>
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Actions Column (Pending Only) */}
                  {isPending && (
                    <View style={styles.actionsCol}>
                      <Pressable style={styles.acceptBtn} onPress={() => acceptBooking(event.id)}>
                        <Ionicons name="checkmark" size={13} color={colors.white} />
                        <Text style={styles.acceptBtnText}>Nhận</Text>
                      </Pressable>
                      <Pressable style={styles.rejectBtn} onPress={() => rejectBooking(event.id)}>
                        <Ionicons name="close" size={13} color={colors.accent} />
                        <Text style={styles.rejectBtnText}>Từ chối</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  const { colors } = usePhotographerTheme();
  const styles = getStyles(colors);
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing[4], gap: spacing[4], backgroundColor: colors.background },
  hero: {
    borderRadius: radius.xl,
    padding: spacing[5],
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  kicker: { color: colors.textLight, fontSize: fontSizes.xs, fontWeight: fontWeights.bold, textTransform: 'uppercase', letterSpacing: 1.4 },
  title: { color: colors.text, fontSize: fontSizes.xl, fontWeight: fontWeights.bold, marginTop: 4 },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  statsRow: { flexDirection: 'row', gap: spacing[2.5], marginTop: spacing[4] },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing[3],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: { color: colors.accent, fontSize: fontSizes.lg, fontWeight: fontWeights.bold },
  statLabel: { color: colors.textMuted, fontSize: fontSizes.xs - 1, fontWeight: fontWeights.semibold, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 4 },

  panel: { backgroundColor: colors.surface, borderRadius: 26, padding: spacing[4], borderWidth: 1, borderColor: colors.border, gap: spacing[3], shadowColor: colors.borderStrong, shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 2 },
  monthRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  monthBtn: { width: 38, height: 38, borderRadius: radius.full, backgroundColor: colors.surfaceStrong, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  monthTitle: { color: colors.text, fontSize: 18, fontWeight: fontWeights.bold, textTransform: 'capitalize' },
  monthSub: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surfaceStrong, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.border },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: colors.text, fontSize: 12 },
  weekRow: { flexDirection: 'row' },
  weekLabel: { width: CELL, textAlign: 'center', color: colors.textMuted, fontSize: 11, fontWeight: fontWeights.bold },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cell: { borderRadius: 18, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.borderStrong, shadowColor: colors.border, shadowOpacity: 0.04, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 0 },
  selectedCell: { backgroundColor: colors.accent, borderColor: colors.accent },
  cellText: { fontSize: 16, fontWeight: fontWeights.bold, color: colors.text },
  dot: { position: 'absolute', bottom: 8, width: 6, height: 6, borderRadius: 3 },

  detailCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing[4],
    ...shadows.card,
  },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: colors.border, paddingBottom: spacing[3] },
  detailTitle: { color: colors.text, fontSize: fontSizes.md, fontWeight: fontWeights.bold },
  detailSub: { color: colors.textMuted, fontSize: fontSizes.sm - 1, marginTop: 2 },
  busyDayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(207,64,40,0.06)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(207,64,40,0.15)',
  },
  busyDayBtnText: { color: colors.accent, fontSize: fontSizes.xs, fontWeight: fontWeights.semibold },

  slotSection: { gap: spacing[4] },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionEyebrow: { color: colors.textLight, fontSize: fontSizes.xs - 1, fontWeight: fontWeights.bold, textTransform: 'uppercase', letterSpacing: 1.1 },
  sectionHeading: { color: colors.text, fontSize: fontSizes.md, fontWeight: fontWeights.bold, marginTop: 2 },
  countBadge: { backgroundColor: 'rgba(207,64,40,0.08)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full },
  countBadgeText: { color: colors.accent, fontWeight: fontWeights.bold, fontSize: fontSizes.xs },

  modeRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  modeBtn: {
    flexDirection: 'row',
    gap: 6,
    borderRadius: radius.full,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  modeBtnActive: { backgroundColor: colors.accent },
  modeBtnText: { color: colors.accent, fontSize: fontSizes.xs, fontWeight: fontWeights.semibold },
  modeBtnTextActive: { color: colors.white },
  clearBtn: { paddingVertical: 8, paddingHorizontal: 12 },
  clearBtnText: { color: colors.textMuted, fontSize: fontSizes.xs, fontWeight: fontWeights.medium },

  shiftSection: { gap: spacing[2], borderTopWidth: 1, borderColor: colors.border, paddingTop: spacing[3] },
  shiftHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  shiftHeaderToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1, paddingRight: spacing[3] },
  shiftTitle: { color: colors.text, fontSize: fontSizes.sm, fontWeight: fontWeights.bold },
  shiftRange: { color: colors.textMuted, fontSize: fontSizes.xs, marginTop: 1 },
  shiftSelectBtn: {
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  shiftSelectBtnText: { color: colors.textMuted, fontSize: fontSizes.xs - 1, fontWeight: fontWeights.semibold },

  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing[1] },
  slotCard: {
    width: '23%',
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.md,
    paddingVertical: spacing[2.5],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  slotCardBusy: { backgroundColor: colors.clayLight, borderColor: colors.clay },
  slotCardBooked: { backgroundColor: 'rgba(45,106,79,0.06)', borderColor: 'rgba(45,106,79,0.25)' },
  slotCardPicked: { backgroundColor: 'rgba(207,64,40,0.06)', borderColor: colors.accent },

  slotTime: { color: colors.text, fontWeight: fontWeights.bold, fontSize: fontSizes.sm },
  slotTimeBusy: { color: colors.textMuted, textDecorationLine: 'line-through' },
  slotTimeBooked: { color: colors.success },
  slotTimePicked: { color: colors.accent },

  slotMiniStatus: { color: colors.textLight, fontSize: fontSizes.xs - 2, fontWeight: fontWeights.medium, marginTop: 2 },
  slotMiniStatusBusy: { color: colors.textMuted },
  slotMiniStatusBooked: { color: colors.success },
  slotMiniStatusPicked: { color: colors.accent },

  selectionIndicator: { position: 'absolute', top: 2, right: 2 },

  bulkActionsRow: { flexDirection: 'row', gap: 10, marginTop: spacing[2] },
  bulkBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.accent, borderRadius: radius.full, paddingVertical: 12 },
  bulkBtnText: { color: colors.white, fontSize: fontSizes.xs, fontWeight: fontWeights.bold },
  bulkBtnSecondary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.white, borderRadius: radius.full, paddingVertical: 12, borderWidth: 1, borderColor: colors.border },
  bulkBtnSecondaryText: { color: colors.text, fontSize: fontSizes.xs, fontWeight: fontWeights.bold },

  emptyBox: { alignItems: 'center', gap: 8, paddingVertical: 24, backgroundColor: colors.background, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  emptyText: { color: colors.textMuted, textAlign: 'center', fontSize: fontSizes.sm },

  eventCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.lg,
    padding: 14,
    alignItems: 'stretch',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  eventTimeCol: { width: 85, alignItems: 'center', justifyContent: 'center', gap: 6 },
  eventTimeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.background, paddingHorizontal: 6, paddingVertical: 4, borderRadius: radius.sm },
  eventTimeText: { color: colors.accent, fontWeight: fontWeights.bold, fontSize: fontSizes.sm },
  eventStatusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  eventStatusText: { fontSize: fontSizes.xs - 2, fontWeight: fontWeights.bold, textTransform: 'uppercase' },

  eventDivider: { width: 1, backgroundColor: colors.border },
  eventBody: { flex: 1, justifyContent: 'center' },
  eventTitle: { color: colors.text, fontWeight: fontWeights.bold, fontSize: fontSizes.base },
  eventDetailsList: { gap: 4, marginTop: 6 },
  eventDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eventDetailText: { color: colors.textMuted, fontSize: fontSizes.xs, flex: 1 },
  eventDetailValue: { color: colors.text, fontWeight: fontWeights.semibold },
  eventPriceText: { color: colors.accent, fontWeight: fontWeights.bold },

  actionsCol: { gap: 8, justifyContent: 'center', borderLeftWidth: 1, borderColor: colors.border, paddingLeft: 12 },
  acceptBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.success, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.full },
  acceptBtnText: { color: '#ffffff', fontWeight: fontWeights.bold, fontSize: fontSizes.xs - 1 },
  rejectBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.full, backgroundColor: colors.surfaceStrong },
  rejectBtnText: { color: colors.accent, fontWeight: fontWeights.semibold, fontSize: fontSizes.xs - 1 },
});
