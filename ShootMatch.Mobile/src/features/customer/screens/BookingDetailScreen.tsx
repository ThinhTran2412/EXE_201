import React, { useState } from 'react';
import {
  ScrollView, StyleSheet, Text, View, Pressable, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { cancelBooking, submitReview, Booking } from '../api';
import { ClayCard } from '../../../shared/components/ClayCard';
import { ClayButton } from '../../../shared/components/ClayButton';
import { colors } from '../../../app/theme/colors';
import { fontSizes, fontWeights } from '../../../app/theme/typography';
import { radius, spacing } from '../../../app/theme/spacing';

const STATUS_CFG: Record<string, { label: string; color: string; icon: string }> = {
  Pending:   { label: 'Chờ xác nhận', color: colors.warning, icon: 'time-outline' },
  Confirmed: { label: 'Đã xác nhận', color: colors.info,    icon: 'checkmark-circle-outline' },
  Completed: { label: 'Hoàn thành',  color: colors.success, icon: 'checkmark-done-circle' },
  Cancelled: { label: 'Đã hủy',      color: colors.accent,  icon: 'close-circle-outline' },
};

function StarRow({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Pressable key={s} onPress={() => onChange(s)}>
          <Ionicons
            name={s <= value ? 'star' : 'star-outline'}
            size={32}
            color={s <= value ? '#f4c430' : colors.textLight}
          />
        </Pressable>
      ))}
    </View>
  );
}

export default function BookingDetailScreen() {
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const { booking } = route.params as { booking: Booking };

  const [rating,         setRating]         = useState(5);
  const [comment,        setComment]        = useState('');
  const [submittingRev,  setSubmittingRev]  = useState(false);
  const [reviewDone,     setReviewDone]     = useState(false);
  const [cancelling,     setCancelling]     = useState(false);

  const cfg = STATUS_CFG[booking.status] ?? STATUS_CFG.Pending;
  const canCancel = booking.status === 'Pending' || booking.status === 'Confirmed';
  const canReview = booking.status === 'Completed' && !reviewDone;

  async function handleCancel() {
    Alert.alert('Hủy lịch hẹn', 'Bạn chắc chắn muốn hủy? Hành động này không thể hoàn tác.', [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Xác nhận hủy',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            await cancelBooking(booking.id, 'Khách hàng hủy');
            Alert.alert('Đã hủy', 'Lịch hẹn đã được hủy thành công.');
            navigation.goBack();
          } catch { Alert.alert('Lỗi', 'Không thể hủy. Thử lại.'); }
          setCancelling(false);
        },
      },
    ]);
  }

  async function handleSubmitReview() {
    if (!comment.trim()) { Alert.alert('Thiếu nhận xét', 'Vui lòng để lại nhận xét.'); return; }
    setSubmittingRev(true);
    try {
      await submitReview({ bookingId: booking.id, rating, comment: comment.trim() });
      setReviewDone(true);
      Alert.alert('✅ Cảm ơn!', 'Đánh giá của bạn đã được gửi.');
    } catch { Alert.alert('Lỗi', 'Không gửi được đánh giá.'); }
    setSubmittingRev(false);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Header */}
      <Animated.View entering={FadeInUp.duration(500)} style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.dark} />
        </Pressable>
        <Text style={styles.headerTitle}>Chi tiết lịch hẹn</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Status Hero */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
          <ClayCard style={styles.statusCard}>
            <View style={styles.statusRow}>
              <View style={[styles.statusIcon, { backgroundColor: cfg.color + '18' }]}>
                <Ionicons name={cfg.icon as any} size={28} color={cfg.color} />
              </View>
              <View style={styles.statusInfo}>
                <Text style={styles.statusLabel}>{cfg.label}</Text>
                <Text style={styles.statusSub}>#{booking.id.slice(0, 8).toUpperCase()}</Text>
              </View>
              <Text style={[styles.statusPrice, { color: cfg.color }]}>
                {booking.agreedPrice?.toLocaleString('vi-VN')}đ
              </Text>
            </View>
          </ClayCard>
        </Animated.View>

        {/* Details */}
        <Animated.View entering={FadeInDown.duration(500).delay(150)}>
          <ClayCard style={styles.detailCard}>
            <Text style={styles.sectionTitle}>Thông tin buổi chụp</Text>
            {[
              { icon: 'calendar-outline',   label: 'Thời gian',    value: new Date(booking.scheduledAt).toLocaleString('vi-VN') },
              { icon: 'cash-outline',       label: 'Phí thỏa thuận', value: `${booking.agreedPrice?.toLocaleString('vi-VN')}đ` },
              { icon: 'receipt-outline',    label: 'Mã đặt lịch',  value: `#${booking.id.slice(0, 8).toUpperCase()}` },
              { icon: 'time-outline',       label: 'Đặt lúc',      value: new Date(booking.createdAt).toLocaleString('vi-VN') },
            ].map((row) => (
              <View key={row.label} style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Ionicons name={row.icon as any} size={16} color={colors.textMuted} />
                </View>
                <Text style={styles.detailLabel}>{row.label}</Text>
                <Text style={styles.detailValue}>{row.value}</Text>
              </View>
            ))}
            {booking.cancellationReason && (
              <View style={styles.cancelReason}>
                <Ionicons name="information-circle" size={16} color={colors.accent} />
                <Text style={styles.cancelReasonText}>Lý do hủy: {booking.cancellationReason}</Text>
              </View>
            )}
          </ClayCard>
        </Animated.View>

        {/* Review Section */}
        {canReview && (
          <Animated.View entering={FadeInDown.duration(500).delay(200)}>
            <ClayCard style={styles.reviewCard}>
              <Text style={styles.sectionTitle}>⭐ Đánh giá buổi chụp</Text>
              <Text style={styles.reviewSub}>Chia sẻ trải nghiệm để giúp cộng đồng</Text>
              <StarRow value={rating} onChange={setRating} />
              <TextInput
                style={styles.reviewInput}
                value={comment}
                onChangeText={setComment}
                placeholder="Nhận xét của bạn về nhiếp ảnh gia..."
                placeholderTextColor={colors.textLight}
                multiline
                numberOfLines={4}
              />
              <ClayButton
                label="Gửi đánh giá"
                onPress={handleSubmitReview}
                loading={submittingRev}
                variant="primary"
                size="md"
              />
            </ClayCard>
          </Animated.View>
        )}

        {reviewDone && (
          <ClayCard style={[styles.reviewCard, { backgroundColor: colors.success + '08' }]}>
            <View style={styles.reviewDoneRow}>
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              <Text style={styles.reviewDoneText}>Cảm ơn bạn đã đánh giá! 🙏</Text>
            </View>
          </ClayCard>
        )}

        {/* Actions */}
        {canCancel && (
          <Animated.View entering={FadeInDown.duration(500).delay(250)} style={styles.actions}>
            <ClayButton
              label={cancelling ? 'Đang hủy...' : 'Hủy lịch hẹn'}
              onPress={handleCancel}
              loading={cancelling}
              variant="ghost"
              size="md"
            />
          </Animated.View>
        )}

        <View style={{ height: spacing[10] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingHorizontal: spacing[4], paddingTop: spacing[2], paddingBottom: spacing[4], borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  headerTitle: { fontSize: fontSizes.lg, fontWeight: fontWeights.bold, color: colors.dark },

  scroll:  { padding: spacing[6], gap: spacing[4] },

  statusCard:  { padding: spacing[5] },
  statusRow:   { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  statusIcon:  { width: 52, height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  statusInfo:  { flex: 1 },
  statusLabel: { fontSize: fontSizes.md, fontWeight: fontWeights.bold, color: colors.dark },
  statusSub:   { fontSize: fontSizes.xs, color: colors.textMuted, fontVariant: ['tabular-nums'] },
  statusPrice: { fontSize: fontSizes.xl, fontWeight: fontWeights.extrabold },

  detailCard:  { padding: spacing[5], gap: spacing[3] },
  sectionTitle: { fontSize: fontSizes.md, fontWeight: fontWeights.bold, color: colors.dark, marginBottom: spacing[1] },
  detailRow:   { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  detailIcon:  { width: 32, height: 32, borderRadius: radius.sm, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  detailLabel: { flex: 1, fontSize: fontSizes.sm, color: colors.textMuted },
  detailValue: { fontSize: fontSizes.sm, fontWeight: fontWeights.semibold, color: colors.dark, textAlign: 'right', flex: 1 },
  cancelReason: { flexDirection: 'row', gap: spacing[2], alignItems: 'flex-start', backgroundColor: colors.accent + '10', padding: spacing[3], borderRadius: radius.sm, marginTop: spacing[2] },
  cancelReasonText: { flex: 1, fontSize: fontSizes.xs, color: colors.accent },

  reviewCard:  { padding: spacing[5], gap: spacing[4] },
  reviewSub:   { fontSize: fontSizes.sm, color: colors.textMuted },
  starRow:     { flexDirection: 'row', gap: spacing[2] },
  reviewInput: { backgroundColor: colors.background, borderRadius: radius.md, padding: spacing[4], fontSize: fontSizes.md, color: colors.dark, borderWidth: 1, borderColor: colors.border, height: 100, textAlignVertical: 'top' },
  reviewDoneRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  reviewDoneText: { fontSize: fontSizes.md, fontWeight: fontWeights.semibold, color: colors.success },

  actions: { gap: spacing[3] },
});
