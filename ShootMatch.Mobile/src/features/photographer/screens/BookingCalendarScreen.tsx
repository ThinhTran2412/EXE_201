import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../app/theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CELL = Math.floor((SCREEN_WIDTH - 40 - 12 * 6) / 7);

type BookingEvent = {
  id: string;
  date: string;
  time: string;
  title: string;
  customer: string;
  status: 'Confirmed' | 'Pending' | 'Completed';
  location: string;
  price: number;
};

const EVENTS: BookingEvent[] = [
  { id: '1', date: '2026-05-08', time: '09:00', title: 'Chụp cưới ngoại cảnh', customer: 'Minh Anh', status: 'Confirmed', location: 'Đà Lạt', price: 4500000 },
  { id: '2', date: '2026-05-08', time: '14:30', title: 'Chụp chân dung cá nhân', customer: 'Hồng Nhung', status: 'Pending', location: 'Quận 1, TP.HCM', price: 1200000 },
  { id: '3', date: '2026-05-12', time: '18:00', title: 'Sự kiện khai trương', customer: 'Công ty ABC', status: 'Confirmed', location: 'Thủ Đức', price: 2800000 },
  { id: '4', date: '2026-05-21', time: '10:00', title: 'Chụp family', customer: 'Gia đình Huy', status: 'Completed', location: 'Phú Nhuận', price: 2200000 },
];

function toKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const MONTH_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export default function BookingCalendarScreen() {
  const [selected, setSelected] = useState(new Date('2026-05-08T00:00:00'));

  const year = 2026;
  const month = 4; // May
  const days = useMemo(() => {
    const first = new Date(year, month, 1);
    const startDay = (first.getDay() + 6) % 7;
    const totalDays = new Date(year, month + 1, 0).getDate();
    const grid: (Date | null)[] = [];
    for (let i = 0; i < startDay; i++) grid.push(null);
    for (let d = 1; d <= totalDays; d++) grid.push(new Date(year, month, d));
    while (grid.length % 7 !== 0) grid.push(null);
    return grid;
  }, []);

  const selectedKey = toKey(selected);
  const selectedEvents = EVENTS.filter(e => e.date === selectedKey);
  const bookedMap = useMemo(() => {
    const m = new Map<string, BookingEvent[]>();
    EVENTS.forEach(e => {
      const arr = m.get(e.date) ?? [];
      arr.push(e);
      m.set(e.date, arr);
    });
    return m;
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Lịch hẹn</Text>
        <Text style={styles.sub}>Ngày có booking sẽ được tô màu</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.calendarCard}>
          <View style={styles.monthRow}>
            <Text style={styles.monthTitle}>Tháng 05 / 2026</Text>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#4ade80' }]} /><Text style={styles.legendText}>Đã xác nhận</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#fbbf24' }]} /><Text style={styles.legendText}>Chờ duyệt</Text></View>
            </View>
          </View>

          <View style={styles.weekRow}>
            {MONTH_LABELS.map((d) => <Text key={d} style={styles.weekLabel}>{d}</Text>)}
          </View>

          <View style={styles.grid}>
            {days.map((date, idx) => {
              if (!date) return <View key={`empty-${idx}`} style={[styles.cell, { width: CELL, height: CELL }]} />;
              const key = toKey(date);
              const events = bookedMap.get(key) ?? [];
              const isSelected = key === selectedKey;
              const hasBooking = events.length > 0;
              const hasConfirmed = events.some(e => e.status === 'Confirmed' || e.status === 'Completed');
              const dayColor = hasConfirmed ? '#4ade80' : hasBooking ? '#fbbf24' : '#fff';

              return (
                <Pressable key={key} style={[styles.cell, { width: CELL, height: CELL }, isSelected && styles.selectedCell]} onPress={() => setSelected(date)}>
                  <Text style={[styles.cellText, { color: dayColor }]}>{date.getDate()}</Text>
                  {hasBooking && <View style={[styles.dot, { backgroundColor: hasConfirmed ? '#4ade80' : '#fbbf24' }]} />}
                </Pressable>
              );
            })}
          </View>
        </View>

        <Animated.View entering={FadeInDown.duration(300)} style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <View>
              <Text style={styles.detailTitle}>Lịch cụ thể</Text>
              <Text style={styles.detailSub}>{selected.toLocaleDateString('vi-VN')}</Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{selectedEvents.length} lịch</Text>
            </View>
          </View>

          {selectedEvents.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="calendar-outline" size={28} color="rgba(255,255,255,0.25)" />
              <Text style={styles.emptyText}>Không có lịch hẹn trong ngày này</Text>
            </View>
          ) : selectedEvents.map((e) => (
            <View key={e.id} style={styles.eventCard}>
              <View style={styles.eventTimeBox}>
                <Text style={styles.eventTime}>{e.time}</Text>
                <Text style={styles.eventStatus}>{e.status}</Text>
              </View>
              <View style={styles.eventBody}>
                <Text style={styles.eventTitle}>{e.title}</Text>
                <Text style={styles.eventMeta}>{e.customer} · {e.location}</Text>
                <Text style={styles.eventPrice}>{e.price.toLocaleString('vi-VN')}đ</Text>
              </View>
            </View>
          ))}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0d0b14' },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title: { color: '#FFFBF0', fontSize: 28, fontWeight: '900' },
  sub: { color: 'rgba(255,251,240,0.55)', marginTop: 6 },
  content: { padding: 20, gap: 16 },
  calendarCard: { backgroundColor: '#141121', borderRadius: 24, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  monthRow: { gap: 10, marginBottom: 12 },
  monthTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: 'rgba(255,255,255,0.55)', fontSize: 12 },
  weekRow: { flexDirection: 'row', marginBottom: 8 },
  weekLabel: { width: CELL, textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cell: { borderRadius: 18, backgroundColor: '#1e1c26', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  selectedCell: { backgroundColor: colors.primary, borderColor: colors.primary },
  cellText: { fontSize: 16, fontWeight: '800' },
  dot: { position: 'absolute', bottom: 8, width: 6, height: 6, borderRadius: 3 },
  detailCard: { backgroundColor: '#141121', borderRadius: 24, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', gap: 12 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  detailSub: { color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  countBadge: { backgroundColor: 'rgba(230,126,34,0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  countBadgeText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  emptyBox: { alignItems: 'center', gap: 10, paddingVertical: 24 },
  emptyText: { color: 'rgba(255,255,255,0.45)' },
  eventCard: { flexDirection: 'row', gap: 12, backgroundColor: '#1e1c26', borderRadius: 18, padding: 14 },
  eventTimeBox: { width: 72, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, paddingVertical: 8 },
  eventTime: { color: '#fff', fontWeight: '900', fontSize: 16 },
  eventStatus: { color: colors.primary, fontSize: 10, fontWeight: '700', marginTop: 4, textTransform: 'uppercase' },
  eventBody: { flex: 1 },
  eventTitle: { color: '#fff', fontWeight: '800', fontSize: 15 },
  eventMeta: { color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  eventPrice: { color: '#4ade80', marginTop: 8, fontWeight: '800' },
});
