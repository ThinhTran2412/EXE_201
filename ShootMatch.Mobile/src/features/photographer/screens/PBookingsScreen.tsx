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
  Platform,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cancelBooking, completeBooking, confirmBooking, getMyBookingsAsPhotographer, PBooking } from '../api';
import { usePhotographerTheme } from '../PhotographerThemeContext';
import { fontSizes, fontWeights } from '../../../app/theme/typography';
import { spacing } from '../../../app/theme/spacing';
import { formatImageUrl } from '../../../shared/utils/formatImageUrl';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAL_CELL = Math.floor((SCREEN_WIDTH - 40 - 36) / 7);

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  Pending: { label: 'Chờ duyệt', color: '#B4781A', bg: 'rgba(212, 175, 55, 0.15)', icon: 'time-outline' },
  Confirmed: { label: 'Đã xác nhận', color: '#3A6073', bg: 'rgba(58, 96, 115, 0.12)', icon: 'checkmark-circle-outline' },
  Completed: { label: 'Hoàn tất', color: '#3D7055', bg: 'rgba(61, 112, 85, 0.12)', icon: 'checkmark-done-circle' },
  Cancelled: { label: 'Đã hủy', color: '#914141', bg: 'rgba(145, 65, 65, 0.12)', icon: 'close-circle-outline' },
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
  const navigation = useNavigation<any>();
  const { colors, isDark } = usePhotographerTheme();
  const styles = getStyles(colors);
  const cfg = STATUS_CFG[booking.status] ?? STATUS_CFG.Pending;
  const isPending = booking.status === 'Pending';
  const isConfirmed = booking.status === 'Confirmed';

  const displayTitle = booking.servicePackageName || (booking.requirements || `Yêu cầu chụp riêng #${booking.id.slice(0, 6)}`);
  const packageImg = booking.servicePackageImageUrl 
    ? formatImageUrl(booking.servicePackageImageUrl) 
    : 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80';

  const date = new Date(booking.scheduledAt);
  const dayStr = date.getDate();
  const monthStr = `Tháng ${date.getMonth() + 1}`;
  const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  const goToDetails = () => navigation.navigate('BookingDetail', { booking });
  const goToCustomer = () => navigation.navigate('CustomerProfile', { customerId: booking.customerId, customerName: booking.customerName });

  return (
    <View style={styles.bookingCard}>
      <Pressable onPress={goToDetails} style={styles.cardCoverContainer}>
        <Image source={{ uri: packageImg }} style={styles.cardCover} />
        <View style={styles.coverDarkOverlay} />
        
        <View style={styles.dateTag}>
          <Text style={styles.dateTagDay}>{dayStr}</Text>
          <View>
            <Text style={styles.dateTagMonth}>{monthStr}</Text>
            <Text style={styles.dateTagTime}>{timeStr}</Text>
          </View>
        </View>

        <View style={[styles.statusBadgeOverlay, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon as any} size={12} color={cfg.color} />
          <Text style={[styles.statusTextOverlay, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </Pressable>

      <View style={styles.cardBody}>
        <Pressable onPress={goToCustomer} style={styles.customerRow}>
          {booking.customerAvatarUrl ? (
            <Image source={{ uri: formatImageUrl(booking.customerAvatarUrl) }} style={styles.pAvatar} />
          ) : (
            <Ionicons name="person-circle-outline" size={38} color={colors.textMuted} style={{ marginRight: -4 }} />
          )}
          <View style={styles.pInfo}>
            <Text style={styles.pRole}>KHÁCH HÀNG ĐẶT LỊCH (Bấm để xem hồ sơ)</Text>
            <Text style={styles.pName}>{booking.customerName || 'Khách hàng'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
        </Pressable>

        <Pressable onPress={goToDetails} style={styles.conceptContainer}>
          <Text style={styles.conceptLabel}>TIÊU ĐỀ BUỔI CHỤP</Text>
          <Text style={styles.conceptTitle}>{displayTitle}</Text>
          
          <View style={styles.tagRow}>
            <View style={styles.infoBadge}>
              <Ionicons name="location-outline" size={12} color={colors.text} />
              <Text style={styles.infoBadgeText} numberOfLines={1}>{booking.location || 'Chưa xác định'}</Text>
            </View>
            <View style={styles.infoBadge}>
              <Ionicons name="call-outline" size={12} color={colors.text} />
              <Text style={styles.infoBadgeText} numberOfLines={1}>{booking.phone || 'Không có sđt'}</Text>
            </View>
          </View>
        </Pressable>

        {(booking.note || booking.requirements) && (
          <View style={styles.tipsBox}>
            <View style={styles.tipsHeader}>
              <Ionicons name="sparkles-outline" size={14} color={colors.accent} />
              <Text style={styles.tipsTitle}>Ghi chú & yêu cầu của khách</Text>
            </View>
            <Text style={styles.tipsText}>{booking.note || booking.requirements}</Text>
          </View>
        )}

        <View style={styles.footerRow}>
          <View>
            <Text style={styles.priceLabel}>CHI PHÍ THỎA THUẬN</Text>
            <Text style={styles.priceValue}>{booking.agreedPrice?.toLocaleString('vi-VN')} đ</Text>
          </View>
          
          <View style={styles.actionButtons}>
            <Pressable style={styles.detailOutlineBtn} onPress={goToDetails}>
              <Text style={styles.detailOutlineBtnText}>Chi tiết</Text>
            </Pressable>

            {isPending && (
              <>
                <Pressable style={styles.cancelBtn} onPress={onCancel}>
                  <Text style={styles.cancelBtnText}>Từ chối</Text>
                </Pressable>
                <Pressable style={styles.detailBtn} onPress={onConfirm}>
                  <Text style={styles.detailBtnText}>Nhận</Text>
                </Pressable>
              </>
            )}
            {isConfirmed && (
              <Pressable style={[styles.detailBtn, { flexDirection: 'row', gap: 6 }]} onPress={onComplete}>
                <Ionicons name="camera-outline" size={14} color={colors.background} />
                <Text style={styles.detailBtnText}>Bấm máy</Text>
              </Pressable>
            )}
            {booking.status === 'Completed' && (
              <View style={styles.completedRibbon}>
                <Ionicons name="checkmark-done" size={14} color={colors.success} />
                <Text style={styles.completedRibbonText}>Hoàn tất</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

interface CalendarModalProps {
  visible: boolean;
  value: Date;
  onClose: () => void;
  onSelect: (date: Date) => void;
}

function CalendarModal({
  visible,
  value,
  onClose,
  onSelect,
}: CalendarModalProps) {
  const { colors } = usePhotographerTheme();
  const styles = getStyles(colors);
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
              <Ionicons name="chevron-back" size={18} color={colors.text} />
            </Pressable>
            <Text style={styles.calendarMonth}>{formatMonthYear(monthStart)}</Text>
            <Pressable style={styles.calendarNavBtn} onPress={() => moveMonth(1)}>
              <Ionicons name="chevron-forward" size={18} color={colors.text} />
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
  const { colors, isDark } = usePhotographerTheme();
  const styles = getStyles(colors);
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

  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Confirmed' | 'Completed'>('All');

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

  const filteredBookings = useMemo(() => {
    if (statusFilter === 'All') return selectedBookings;
    return selectedBookings.filter(b => b.status === statusFilter);
  }, [selectedBookings, statusFilter]);

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
            <Text style={styles.brandTitle}>
              Lịch trình <Text style={styles.brandTitleItalic}>bấm máy</Text>
            </Text>
          </View>
          <Pressable style={styles.headerIconBtn} onPress={() => setCalendarOpen(true)}>
            <Ionicons name="aperture-outline" size={22} color={colors.accent} />
          </Pressable>
        </View>

        <View style={styles.mastheadStats}>
          <View style={styles.mastheadItem}>
            <Text style={styles.mastheadLabel}>ĐÃ CHỐT</Text>
            <View style={styles.mastheadValueRow}>
              <Text style={[styles.mastheadValue, { color: colors.info }]}>{stats.confirmed}</Text>
              <Text style={styles.mastheadUnit}>lịch</Text>
            </View>
          </View>
          <View style={styles.mastheadDivider} />
          <View style={styles.mastheadItem}>
            <Text style={styles.mastheadLabel}>CHỜ DUYỆT</Text>
            <View style={styles.mastheadValueRow}>
              <Text style={[styles.mastheadValue, { color: colors.warning }]}>{stats.pending}</Text>
              <Text style={styles.mastheadUnit}>y/c</Text>
            </View>
          </View>
          <View style={styles.mastheadDivider} />
          <View style={styles.mastheadItem}>
            <Text style={styles.mastheadLabel}>HOÀN TẤT</Text>
            <View style={styles.mastheadValueRow}>
              <Text style={[styles.mastheadValue, { color: colors.success }]}>{stats.completed}</Text>
              <Text style={styles.mastheadUnit}>buổi</Text>
            </View>
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
            tintColor={colors.text}
          />
        }
      >
        <View style={styles.dateSelectorRow}>
          <Pressable style={styles.dateArrow} onPress={() => setSelectedDate(addDays(selectedDate, -1))}>
            <Ionicons name="chevron-back" size={16} color={colors.text} />
          </Pressable>
          <Pressable style={styles.dateCenterBtn} onPress={() => setCalendarOpen(true)}>
            <Ionicons name="time-outline" size={14} color={colors.textMuted} style={{ marginRight: 6 }} />
            <Text style={styles.dateCenterText}>{dateLabel}</Text>
          </Pressable>
          <Pressable style={styles.dateArrow} onPress={() => setSelectedDate(addDays(selectedDate, 1))}>
            <Ionicons name="chevron-forward" size={16} color={colors.text} />
          </Pressable>
        </View>

        {/* Weather & Occupancy Widget Row */}
        <View style={styles.occupancyWeatherRow}>
          <View style={styles.weatherCard}>
            <Ionicons name="sunny" size={16} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.widgetTitle}>DỰ BÁO KHÍ HẬU</Text>
              <Text style={styles.widgetValue}>Nắng ấm · 26°C · Đẹp trời</Text>
            </View>
          </View>
          <View style={styles.occupancyCard}>
            <View style={styles.occupancyTextRow}>
              <Text style={styles.widgetTitle}>CÔNG SUẤT BẤM</Text>
              <Text style={styles.occupancyPercent}>
                {Math.min(Math.round((selectedBookings.filter(b => b.status === 'Confirmed' || b.status === 'Completed').length / 4) * 100), 100)}%
              </Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${Math.min((selectedBookings.filter(b => b.status === 'Confirmed' || b.status === 'Completed').length / 4) * 100, 100)}%` }]} />
            </View>
          </View>
        </View>

        {/* Quick Filter Row */}
        <View style={styles.filterOuterWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
          >
            <Pressable
              style={[styles.filterPill, statusFilter === 'All' && (isDark ? { backgroundColor: colors.surface, borderColor: '#ffffff' } : styles.filterPillActive)]}
              onPress={() => setStatusFilter('All')}
            >
              <Text style={[styles.filterPillText, statusFilter === 'All' && (isDark ? { color: '#ffffff' } : styles.filterPillTextActive)]}>
                Tất cả ({selectedBookings.length})
              </Text>
            </Pressable>
            <Pressable
              style={[styles.filterPill, statusFilter === 'Pending' && (isDark ? { backgroundColor: colors.surface, borderColor: '#ffffff' } : styles.filterPillActive)]}
              onPress={() => setStatusFilter('Pending')}
            >
              <Text style={[styles.filterPillText, statusFilter === 'Pending' && (isDark ? { color: '#ffffff' } : styles.filterPillTextActive)]}>
                Chờ duyệt ({selectedBookings.filter(b => b.status === 'Pending').length})
              </Text>
            </Pressable>
            <Pressable
              style={[styles.filterPill, statusFilter === 'Confirmed' && (isDark ? { backgroundColor: colors.surface, borderColor: '#ffffff' } : styles.filterPillActive)]}
              onPress={() => setStatusFilter('Confirmed')}
            >
              <Text style={[styles.filterPillText, statusFilter === 'Confirmed' && (isDark ? { color: '#ffffff' } : styles.filterPillTextActive)]}>
                Đã chốt ({selectedBookings.filter(b => b.status === 'Confirmed').length})
              </Text>
            </Pressable>
            <Pressable
              style={[styles.filterPill, statusFilter === 'Completed' && (isDark ? { backgroundColor: colors.surface, borderColor: '#ffffff' } : styles.filterPillActive)]}
              onPress={() => setStatusFilter('Completed')}
            >
              <Text style={[styles.filterPillText, statusFilter === 'Completed' && (isDark ? { color: '#ffffff' } : styles.filterPillTextActive)]}>
                Đã xong ({selectedBookings.filter(b => b.status === 'Completed').length})
              </Text>
            </Pressable>
          </ScrollView>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {statusFilter === 'All' ? 'Danh sách khung hình' : `Khung hình ${STATUS_CFG[statusFilter]?.label || ''}`} ({filteredBookings.length})
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={colors.text} style={styles.loader} />
        ) : (
          <View style={styles.list}>
             {filteredBookings.length === 0 ? (
               <View style={styles.emptyState}>
                 <Animated.View 
                   entering={FadeInDown.duration(600).delay(100)}
                   style={styles.polaroidFrame}
                 >
                   <Image 
                     source={{ uri: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=500' }} 
                     style={styles.polaroidImage} 
                   />
                   <Text style={styles.polaroidCaption}>Lăng kính đang nghỉ ngơi...</Text>
                 </Animated.View>
                 <Text style={styles.emptyTitle}>Trống lịch bấm máy</Text>
                 <Text style={styles.emptyText}>Không tìm thấy lịch hẹn nào phù hợp với bộ lọc đã chọn.</Text>
               </View>
             ) : (
               <>
                 {filteredBookings.map((b, i) => (
                   <Animated.View key={b.id} entering={FadeInDown.duration(300).delay(i * 35)}>
                     <BookingCard
                       booking={b}
                       onCancel={() => doAction(b, 'cancel')}
                       onConfirm={() => doAction(b, 'confirm')}
                       onComplete={() => doAction(b, 'complete')}
                     />
                   </Animated.View>
                 ))}
                 
                 {/* Photography Quote Box */}
                 <View style={styles.quoteCard}>
                   <Text style={styles.quoteMarkLeft}>“</Text>
                   <Text style={styles.quoteText}>
                     Mười vạn bức ảnh đầu tiên là mười vạn bức ảnh tệ nhất.
                   </Text>
                   <Text style={styles.quoteAuthor}>— Henri Cartier-Bresson</Text>
                   <Text style={styles.quoteMarkRight}>”</Text>
                 </View>
               </>
             )}
          </View>
        )}
        <View style={{ height: spacing[8] }} />
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

  premiumHeader: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
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
    color: colors.textLight,
    fontWeight: '700',
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
    letterSpacing: -0.4,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  brandTitleItalic: {
    fontStyle: 'italic',
    fontWeight: '300',
    color: colors.accent,
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  mastheadStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceStrong,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mastheadItem: {
    flex: 1,
    alignItems: 'center',
  },
  mastheadDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  mastheadLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.textLight,
    letterSpacing: 1,
    marginBottom: 2,
  },
  mastheadValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  mastheadValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  mastheadUnit: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
  },

  content: { paddingTop: 20 },

  dateSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 6,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
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
  dateCenterText: { color: colors.text, fontSize: 14, fontWeight: '700' },

  sectionHeader: {
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 24,
  },
  sectionTitle: { color: colors.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  loader: { paddingVertical: 40 },
  list: { paddingHorizontal: 24, gap: 14 },

  emptyState: { paddingVertical: 40, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  emptyText: { color: colors.textMuted, fontSize: 13, textAlign: 'center', paddingHorizontal: 32, lineHeight: 18 },
  polaroidFrame: {
    backgroundColor: colors.surfaceStrong,
    padding: 12,
    paddingBottom: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    shadowColor: colors.dark,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    transform: [{ rotate: '-2deg' }],
  },
  polaroidImage: {
    width: 160,
    height: 160,
    borderRadius: 2,
  },
  polaroidCaption: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontStyle: 'italic',
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 10,
  },

  bookingCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  cardCoverContainer: {
    height: 150,
    width: '100%',
    position: 'relative',
    backgroundColor: colors.background,
  },
  cardCover: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverDarkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.borderStrong,
  },
  dateTag: {
    position: 'absolute',
    left: 16,
    top: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.glassStrong,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateTagDay: {
    fontSize: 26,
    fontWeight: '300',
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginRight: 2,
  },
  dateTagMonth: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateTagTime: {
    fontSize: 10,
    color: colors.accent,
    fontWeight: '700',
    marginTop: 1,
  },
  statusBadgeOverlay: {
    position: 'absolute',
    right: 16,
    top: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  statusTextOverlay: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardBody: {
    padding: 20,
    gap: 16,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
  },
  pInfo: {
    flex: 1,
  },
  pRole: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  pName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginTop: 1,
  },
  conceptContainer: {
    gap: 4,
  },
  conceptLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 1.2,
  },
  conceptTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  tagRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  infoBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  infoBadgeText: { color: colors.text, fontSize: 11, fontWeight: '500' },
  tipsBox: {
    backgroundColor: colors.surfaceStrong,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderColor: colors.accent,
    padding: 10,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  tipsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  tipsText: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingTop: 16,
  },
  priceLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.accent,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  detailBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.background,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
  },
  detailOutlineBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  detailOutlineBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  completedRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(61, 112, 85, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  completedRibbonText: {
    color: '#3D7055',
    fontSize: 11,
    fontWeight: '700',
  },

  modalBackdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', paddingHorizontal: 20 },
  modalCard: { backgroundColor: colors.surface, borderRadius: 24, padding: 20, gap: 16 },
  calendarTopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  calendarNavBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  calendarMonth: { color: colors.text, fontSize: 15, fontWeight: '700' },

  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 2 },
  weekLabel: { width: CAL_CELL, textAlign: 'center', color: colors.textLight, fontSize: 11, fontWeight: '700' },

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
    backgroundColor: 'transparent'
  },
  calendarCellEmpty: {
    width: CAL_CELL,
    height: CAL_CELL,
    backgroundColor: 'transparent'
  },
  calendarCellActive: { backgroundColor: colors.dark },
  calendarCellText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  calendarCellTextActive: { color: colors.surface, fontWeight: '700' },
  calendarCellToday: { color: '#3A6073', fontWeight: '700' },
  todayIndicatorDot: { width: 4, height: 4, borderRadius: 99, backgroundColor: '#3A6073', position: 'absolute', bottom: 4 },

  modalFooter: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalSecondaryBtn: { flex: 1, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  modalSecondaryText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  modalPrimaryBtn: { flex: 1, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  modalPrimaryText: { color: colors.background, fontSize: 13, fontWeight: '700' },

  // ================= NEW DESIGN ADDITIONS =================
  occupancyWeatherRow: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 24,
    marginTop: 14,
  },
  weatherCard: {
    flex: 1.1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  widgetTitle: {
    fontSize: 7.5,
    fontWeight: '700',
    color: colors.textLight,
    letterSpacing: 0.8,
  },
  widgetValue: {
    fontSize: 11,
    color: colors.text,
    fontWeight: '600',
    marginTop: 1,
  },
  occupancyCard: {
    flex: 0.9,
    backgroundColor: colors.surface,
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
  },
  occupancyTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  occupancyPercent: {
    fontSize: 11,
    color: colors.accent,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: colors.background,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 2,
  },

  filterOuterWrap: {
    marginTop: 14,
  },
  filterContainer: {
    paddingHorizontal: 24,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.dark,
    borderColor: colors.dark,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  filterPillTextActive: {
    color: colors.surface,
  },

  quoteCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 10,
    marginBottom: 24,
  },
  quoteText: {
    color: colors.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  quoteAuthor: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  quoteMarkLeft: { position: 'absolute', top: 4, left: 12, fontSize: 36, fontWeight: 'bold', color: colors.accent, opacity: 0.25 },
  quoteMarkRight: { position: 'absolute', bottom: -8, right: 12, fontSize: 36, fontWeight: 'bold', color: colors.accent, opacity: 0.25 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surface, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.border },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: colors.text, fontSize: 12 },
});