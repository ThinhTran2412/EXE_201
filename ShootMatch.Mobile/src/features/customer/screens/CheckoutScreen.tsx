import React, { useState } from 'react';
import {
  ScrollView, StyleSheet, Text, View, TextInput, Alert, Platform, Pressable, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ClayButton } from '../../../shared/components/ClayButton';
import { ClayCard } from '../../../shared/components/ClayCard';
import { createBooking, Photographer } from '../api';
import { colors } from '../../../app/theme/colors';
import { fontSizes, fontWeights } from '../../../app/theme/typography';
import { radius, spacing } from '../../../app/theme/spacing';

const COMMISSION_RATE = 0.1;

export default function CheckoutScreen() {
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const { photographer, matchId, packageId, packages } = route.params as { photographer: Photographer; matchId?: string, packageId?: string, packages?: any[] };

  const initialPackage = packages?.find(p => p.id === packageId);
  const [selectedPackage, setSelectedPackage] = useState<any | null>(initialPackage || null);

  const [price,     setPrice]     = useState(initialPackage ? initialPackage.price.toString() : photographer.minBudget.toString());
  const [date,      setDate]      = useState('');
  const [note,      setNote]      = useState(initialPackage ? `Gói dịch vụ: ${initialPackage.title}` : '');
  const [loading,   setLoading]   = useState(false);
  const [showPackages, setShowPackages] = useState(false);

  const numPrice   = parseFloat(price.replace(/[^0-9.]/g, '')) || 0;
  const commission = Math.round(numPrice * COMMISSION_RATE);
  const total      = numPrice + commission;

  async function handleBook() {
    if (!date.trim()) { Alert.alert('Chọn ngày chụp', 'Vui lòng nhập ngày giờ bạn muốn đặt.'); return; }
    if (!matchId)     { Alert.alert('Lỗi', 'Cần Match trước khi đặt lịch.'); return; }
    setLoading(true);
    try {
      await createBooking({
        matchId,
        agreedPrice: numPrice,
        scheduledAt: new Date(date).toISOString(),
      });
      navigation.replace('BookingSuccess', { photographerName: photographer.displayName });
    } catch (e: any) {
      Alert.alert('Đặt lịch thất bại', e.response?.data?.title ?? 'Vui lòng thử lại.');
    } finally { setLoading(false); }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(500)}>
          <Text style={styles.title}>Đặt lịch</Text>
          <Text style={styles.sub}>Xác nhận thông tin buổi chụp</Text>
        </Animated.View>

        {/* Photographer Summary */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
          <ClayCard style={styles.photoCard}>
            <View style={styles.photoRow}>
              <View style={styles.photoAvatar}>
                <Text style={styles.photoAvatarText}>{photographer.displayName?.[0]}</Text>
              </View>
              <View style={styles.photoInfo}>
                <Text style={styles.photoName}>{photographer.displayName}</Text>
                <Text style={styles.photoMeta}>{photographer.region}</Text>
              </View>
              <View style={styles.ratingWrap}>
                <Ionicons name="star" size={14} color="#f4c430" />
                <Text style={styles.rating}>{photographer.rating?.toFixed(1)}</Text>
              </View>
            </View>
          </ClayCard>
        </Animated.View>

        {/* Form */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.form}>
          <Text style={styles.sectionTitle}>Chi tiết đặt lịch</Text>

          {packages && packages.length > 0 && (
            <View style={styles.field}>
              <Text style={styles.label}>Gói dịch vụ (Tùy chọn)</Text>
              <Pressable style={styles.packageSelect} onPress={() => setShowPackages(true)}>
                <Text style={[styles.packageSelectText, !selectedPackage && { color: colors.textLight }]}>
                  {selectedPackage ? selectedPackage.title : 'Chọn gói dịch vụ...'}
                </Text>
                <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
              </Pressable>
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Ngày & Giờ chụp</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="VD: 2026-06-15 09:00"
              placeholderTextColor={colors.textLight}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Phí thỏa thuận (đồng)</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textLight}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Ghi chú cho nhiếp ảnh gia</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
              placeholder="Concept, địa điểm, yêu cầu đặc biệt..."
              placeholderTextColor={colors.textLight}
            />
          </View>
        </Animated.View>

        {/* Price Summary */}
        <Animated.View entering={FadeInDown.duration(500).delay(300)}>
          <ClayCard style={styles.summary}>
            <Text style={styles.sectionTitle}>Thanh toán</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Phí dịch vụ</Text>
              <Text style={styles.summaryValue}>{numPrice.toLocaleString('vi-VN')}đ</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Phí nền tảng (10%)</Text>
              <Text style={styles.summaryValue}>{commission.toLocaleString('vi-VN')}đ</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Tổng cộng</Text>
              <Text style={styles.totalValue}>{total.toLocaleString('vi-VN')}đ</Text>
            </View>
          </ClayCard>
        </Animated.View>
      </ScrollView>

      {/* CTA */}
      <View style={styles.cta}>
        <ClayButton
          label={`Xác nhận đặt lịch — ${total.toLocaleString('vi-VN')}đ`}
          onPress={handleBook}
          loading={loading}
          variant="primary"
          size="lg"
        />
      </View>

      {/* Package Selection Modal */}
      {packages && packages.length > 0 && (
        <Modal visible={showPackages} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chọn gói dịch vụ</Text>
                <Pressable onPress={() => setShowPackages(false)} style={styles.modalClose}>
                  <Ionicons name="close" size={24} color={colors.dark} />
                </Pressable>
              </View>
              <ScrollView>
                {packages.map((pkg: any) => (
                  <Pressable
                    key={pkg.id}
                    style={[styles.packageOption, selectedPackage?.id === pkg.id && styles.packageOptionSelected]}
                    onPress={() => {
                      setSelectedPackage(pkg);
                      setPrice(pkg.price.toString());
                      setNote(prev => prev.includes('Gói dịch vụ:') ? prev.replace(/Gói dịch vụ:.*(\n|$)/, `Gói dịch vụ: ${pkg.title}\n`) : `Gói dịch vụ: ${pkg.title}\n${prev}`);
                      setShowPackages(false);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.packageOptionTitle}>{pkg.title}</Text>
                      <Text style={styles.packageOptionSub}>{pkg.durationHours} giờ · {pkg.subtitle}</Text>
                    </View>
                    <Text style={styles.packageOptionPrice}>{pkg.price.toLocaleString('vi-VN')}đ</Text>
                  </Pressable>
                ))}
                <Pressable
                  style={styles.packageOption}
                  onPress={() => {
                    setSelectedPackage(null);
                    setPrice(photographer.minBudget.toString());
                    setNote(prev => prev.replace(/Gói dịch vụ:.*(\n|$)/, ''));
                    setShowPackages(false);
                  }}
                >
                  <Text style={styles.packageOptionTitle}>Không chọn gói (Thỏa thuận riêng)</Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing[6], gap: spacing[5] },
  title:  { fontSize: fontSizes['2xl'], fontWeight: fontWeights.extrabold, color: colors.dark },
  sub:    { fontSize: fontSizes.sm, color: colors.textMuted, marginTop: spacing[1] },

  photoCard: { padding: spacing[4] },
  photoRow:  { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  photoAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.clay, alignItems: 'center', justifyContent: 'center' },
  photoAvatarText: { fontSize: fontSizes.xl, fontWeight: fontWeights.bold, color: colors.dark },
  photoInfo: { flex: 1 },
  photoName: { fontSize: fontSizes.md, fontWeight: fontWeights.bold, color: colors.dark },
  photoMeta: { fontSize: fontSizes.sm, color: colors.textMuted },
  ratingWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating:     { fontSize: fontSizes.sm, fontWeight: fontWeights.bold, color: colors.dark },

  form:        { gap: spacing[4] },
  sectionTitle: { fontSize: fontSizes.md, fontWeight: fontWeights.bold, color: colors.dark, marginBottom: spacing[3] },
  field:       { gap: spacing[2] },
  label:       { fontSize: fontSizes.xs, fontWeight: fontWeights.semibold, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  input:       { backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: spacing[4], paddingVertical: spacing[3], fontSize: fontSizes.md, color: colors.dark, borderWidth: 1, borderColor: colors.border },
  textarea:    { height: 80, textAlignVertical: 'top' },

  summary:      { padding: spacing[5], gap: spacing[3] },
  summaryRow:   { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: fontSizes.sm, color: colors.textMuted },
  summaryValue: { fontSize: fontSizes.sm, fontWeight: fontWeights.medium, color: colors.dark },
  summaryDivider: { height: 1, backgroundColor: colors.border },
  totalLabel:   { fontSize: fontSizes.md, fontWeight: fontWeights.bold, color: colors.dark },
  totalValue:   { fontSize: fontSizes.md, fontWeight: fontWeights.extrabold, color: colors.accent },

  cta: { paddingHorizontal: spacing[6], paddingVertical: spacing[4], borderTopWidth: 1, borderTopColor: colors.border },

  packageSelect: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: spacing[4], paddingVertical: spacing[3], borderWidth: 1, borderColor: colors.border },
  packageSelectText: { fontSize: fontSizes.md, color: colors.dark, flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.background, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: '80%', paddingBottom: spacing[6] },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing[5], borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: fontSizes.lg, fontWeight: fontWeights.bold, color: colors.dark },
  modalClose: { padding: spacing[1] },
  packageOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing[5], borderBottomWidth: 1, borderBottomColor: colors.border },
  packageOptionSelected: { backgroundColor: 'rgba(255, 66, 0, 0.05)' },
  packageOptionTitle: { fontSize: fontSizes.md, fontWeight: fontWeights.semibold, color: colors.dark, marginBottom: 2 },
  packageOptionSub: { fontSize: fontSizes.sm, color: colors.textMuted },
  packageOptionPrice: { fontSize: fontSizes.md, fontWeight: fontWeights.bold, color: colors.accent },
});
