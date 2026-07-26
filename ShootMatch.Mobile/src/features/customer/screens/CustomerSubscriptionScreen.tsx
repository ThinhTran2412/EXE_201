import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Alert,
  Dimensions,
  Platform,
  useWindowDimensions,
  Linking,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { apiClient } from '../../../shared/api/client';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAuth } from '../../auth/AuthContext';
import { colors } from '../../../app/theme/colors';
import { fontSizes, fontWeights } from '../../../app/theme/typography';
import { radius, spacing } from '../../../app/theme/spacing';

type Cycle = 'month' | '6months' | 'year';

interface PlanDetail {
  id: string;
  name: string;
  gradient: [string, string, ...string[]];
  monthlyPrice: number;
  sixMonthPrice: number;
  yearlyPrice: number;
  savingsSixMonth: string;
  savingsYear: string;
  badge?: string;
  description: string;
  features: { label: string; checked: boolean | string }[];
}

const CUSTOMER_PLANS: PlanDetail[] = [
  {
    id: 'Lướt Nhẹ',
    name: 'Lướt Nhẹ',
    gradient: ['#7A8A9E', '#4B5563'],
    monthlyPrice: 0,
    sixMonthPrice: 0,
    yearlyPrice: 0,
    savingsSixMonth: '—',
    savingsYear: '—',
    description: 'Tải app và sử dụng hoàn toàn miễn phí',
    features: [
      { label: 'Xem danh sách photographer cơ bản', checked: 'Cơ bản' },
      { label: 'Hiển thị profile giới hạn', checked: true },
      { label: 'Portfolio preview giới hạn (5 ảnh)', checked: true },
      { label: 'Dùng bộ lọc cơ bản', checked: true },
      { label: 'Bộ lọc nâng cao (lịch, concept...)', checked: false },
      { label: 'Chỉ số phản hồi & tỷ lệ đúng giờ', checked: false },
      { label: 'Ưu tiên booking & match tốt hơn', checked: false },
    ],
  },
  {
    id: 'Chọn Xinh',
    name: 'Chọn Xinh',
    gradient: ['#F59E0B', '#D97706'],
    monthlyPrice: 99000,
    sixMonthPrice: 529000,
    yearlyPrice: 990000,
    savingsSixMonth: 'Tiết kiệm ~65.000 VNĐ',
    savingsYear: 'Tiết kiệm ~198.000 VNĐ',
    badge: 'PHỔ BIẾN',
    description: 'Trải nghiệm tìm kiếm sâu hơn, mở khóa portfolio rộng hơn',
    features: [
      { label: 'Xem danh sách photographer cơ bản', checked: 'Nhiều hơn' },
      { label: 'Hiển thị profile chi tiết đầy đủ', checked: true },
      { label: 'Mở thêm ảnh trong portfolio (15 ảnh)', checked: true },
      { label: 'Sử dụng bộ lọc chi tiết & lịch trống', checked: true },
      { label: 'Bộ lọc nâng cao đặc thù (concept, budget)', checked: true },
      { label: 'Chỉ số phản hồi & tỷ lệ đúng giờ', checked: false },
      { label: 'Nhận gợi ý match tốt hơn & ưu tiên', checked: true },
    ],
  },
  {
    id: 'Chốt Xịn',
    name: 'Chốt Xịn',
    gradient: ['#8B5CF6', '#EC4899', '#F43F5E'],
    monthlyPrice: 199000,
    sixMonthPrice: 1050000,
    yearlyPrice: 1990000,
    savingsSixMonth: 'Tiết kiệm ~144.000 VNĐ',
    savingsYear: 'Tiết kiệm ~398.000 VNĐ',
    badge: 'CAO CẤP',
    description: 'Mở khóa toàn bộ photographer, dữ liệu uy tín chuyên sâu',
    features: [
      { label: 'Xem photographer toàn nền tảng', checked: 'Toàn bộ' },
      { label: 'Ưu tiên hiển thị profile nổi bật/top-rated', checked: true },
      { label: 'Xem full portfolio không giới hạn', checked: true },
      { label: 'Bộ lọc nâng cao & gợi ý cá nhân hóa', checked: true },
      { label: 'Xem review & chỉ số uy tín (đúng giờ, tỉ lệ job)', checked: true },
      { label: 'Ưu tiên support, matching & booking nhanh', checked: true },
    ],
  },
];

export default function CustomerSubscriptionScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { session, updateMembershipTier } = useAuth();
  const { width: windowWidth } = useWindowDimensions();
  const containerWidth = Platform.OS === 'web' ? Math.min(windowWidth, 600) : windowWidth;

  const [cycle, setCycle] = useState<Cycle>('month');
  const [selectedPlanId, setSelectedPlanId] = useState<string>(session?.membershipTier || 'Lướt Nhẹ');
  const [buying, setBuying] = useState(false);
  const [activeOrder, setActiveOrder] = useState<{ orderCode: string; checkoutUrl: string } | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const checkPaymentStatus = async () => {
    if (!activeOrder) return;
    setCheckingStatus(true);
    try {
      const { data } = await apiClient.get(`/api/payments/membership/status/${activeOrder.orderCode}`);
      if (data.status === 'Paid') {
        await updateMembershipTier(selectedPlanId); 
        Alert.alert(
          'Thành công',
          `Chúc mừng! Gói "${selectedPlanId}" của bạn đã được kích hoạt.`,
          [{ text: 'Bắt đầu', onPress: () => {
            setActiveOrder(null);
            navigation.goBack();
          }}]
        );
      } else if (data.status === 'Cancelled') {
        Alert.alert('Huỷ bỏ', 'Giao dịch thanh toán này đã bị huỷ.');
        setActiveOrder(null);
      } else {
        Alert.alert('Thông báo', 'Hệ thống chưa nhận được khoản thanh toán của bạn. Vui lòng thực hiện chuyển khoản trên trang PayOS hoặc chờ trong giây lát.');
      }
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể kiểm tra trạng thái thanh toán.');
    } finally {
      setCheckingStatus(false);
    }
  };

  const getPriceDisplay = (plan: PlanDetail) => {
    if (plan.monthlyPrice === 0) return 'Miễn phí';
    if (cycle === 'month') return `${plan.monthlyPrice.toLocaleString('vi-VN')} đ/tháng`;
    if (cycle === '6months') return `${plan.sixMonthPrice.toLocaleString('vi-VN')} đ/6 tháng`;
    return `${plan.yearlyPrice.toLocaleString('vi-VN')} đ/năm`;
  };

  const getSavingsDisplay = (plan: PlanDetail) => {
    if (plan.monthlyPrice === 0) return '';
    if (cycle === '6months') return plan.savingsSixMonth;
    if (cycle === 'year') return plan.savingsYear;
    return '';
  };

  const handleSubscribe = async () => {
    if (selectedPlanId === session?.membershipTier) {
      Alert.alert('Thông báo', 'Bạn đang sử dụng gói này rồi.');
      return;
    }
    
    let planId = 'luot_nhe';
    if (selectedPlanId === 'Chọn Xinh') planId = 'chon_xinh';
    else if (selectedPlanId === 'Chốt Xịn') planId = 'chot_xin';

    if (planId === 'luot_nhe') {
      setBuying(true);
      try {
        await updateMembershipTier('Lướt Nhẹ');
        Alert.alert('Thành công', 'Đã chuyển sang gói Lướt Nhẹ.');
        navigation.goBack();
      } catch (e) {
        Alert.alert('Thất bại', 'Không thể chuyển gói.');
      } finally {
        setBuying(false);
      }
      return;
    }

    setBuying(true);
    try {
      const response = await apiClient.post('/api/payments/membership/create-link', {
        planId: planId,
        cycle: cycle,
        returnUrl: 'https://pickic.io.vn/payment-result?status=success',
        cancelUrl: 'https://pickic.io.vn/payment-result?status=cancel'
      });

      if (response.data && response.data.checkoutUrl) {
        setActiveOrder({
          orderCode: response.data.orderCode.toString(),
          checkoutUrl: response.data.checkoutUrl
        });
      } else {
        throw new Error('No checkout URL');
      }
    } catch (err: any) {
      console.warn(err);
      Alert.alert('Lỗi', 'Không thể tạo link thanh toán PayOS. Vui lòng thử lại.');
    } finally {
      setBuying(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.dark} />
        </Pressable>
        <Text style={styles.headerTitle}>Gói Thành Viên</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { width: containerWidth, alignSelf: 'center' }]}>
        <Animated.View entering={FadeInUp.duration(450)} style={styles.heroSection}>
          <Text style={styles.heroTitle}>Lựa chọn gói hội viên của bạn</Text>
          <Text style={styles.heroSubtitle}>
            Mở khóa các tính năng kết nối chuyên nghiệp để tìm được photographer phù hợp nhất
          </Text>
        </Animated.View>

        {/* ── CYCLE TOGGLE ── */}
        <Animated.View entering={FadeInUp.delay(100).duration(450)} style={styles.toggleContainer}>
          <Pressable
            onPress={() => setCycle('month')}
            style={[styles.toggleBtn, cycle === 'month' && styles.toggleBtnActive]}
          >
            <Text style={[styles.toggleText, cycle === 'month' && styles.toggleTextActive]}>Hàng tháng</Text>
          </Pressable>
          <Pressable
            onPress={() => setCycle('6months')}
            style={[styles.toggleBtn, cycle === '6months' && styles.toggleBtnActive]}
          >
            <Text style={[styles.toggleText, cycle === '6months' && styles.toggleTextActive]}>6 Tháng</Text>
          </Pressable>
          <Pressable
            onPress={() => setCycle('year')}
            style={[styles.toggleBtn, cycle === 'year' && styles.toggleBtnActive]}
          >
            <Text style={[styles.toggleText, cycle === 'year' && styles.toggleTextActive]}>Hàng năm</Text>
          </Pressable>
        </Animated.View>

        {/* ── CARDS ── */}
        <View style={styles.cardsContainer}>
          {CUSTOMER_PLANS.map((plan, idx) => {
            const isSelected = selectedPlanId === plan.id;
            const savings = getSavingsDisplay(plan);
            return (
              <Animated.View
                key={plan.id}
                entering={FadeInDown.delay(150 + idx * 100).duration(450)}
              >
                <Pressable
                  onPress={() => setSelectedPlanId(plan.id)}
                  style={[
                    styles.planCard,
                    isSelected && styles.planCardSelected,
                  ]}
                >
                  <LinearGradient
                    colors={plan.gradient}
                    style={styles.cardHeaderGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.planName}>{plan.name}</Text>
                      {plan.badge ? (
                        <View style={styles.badgeContainer}>
                          <Text style={styles.badgeText}>{plan.badge}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.planPrice}>{getPriceDisplay(plan)}</Text>
                    {savings ? <Text style={styles.savingsText}>{savings}</Text> : null}
                  </LinearGradient>

                  <View style={styles.cardBody}>
                    <Text style={styles.planDescription}>{plan.description}</Text>
                    <View style={styles.featuresList}>
                      {plan.features.map((feat, fidx) => (
                        <View key={fidx} style={styles.featureRow}>
                          {typeof feat.checked === 'string' ? (
                            <View style={styles.featureBadge}>
                              <Text style={styles.featureBadgeText}>{feat.checked}</Text>
                            </View>
                          ) : feat.checked ? (
                            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                          ) : (
                            <Ionicons name="close-circle" size={18} color="#EF4444" />
                          )}
                          <Text style={styles.featureLabel}>{feat.label}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── FOOTER REGISTER BUTTON ── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom > 0 ? insets.bottom : spacing[4] }]}>
        <View style={styles.footerInfo}>
          <Text style={styles.footerLabel}>Gói đã chọn:</Text>
          <Text style={styles.footerValue}>{selectedPlanId}</Text>
        </View>
        <Pressable
          onPress={handleSubscribe}
          disabled={buying}
          style={({ pressed }) => [
            styles.subscribeBtn,
            pressed && { opacity: 0.8 },
            buying && { backgroundColor: '#A78BFA' }
          ]}
        >
          <Text style={styles.subscribeBtnText}>
            {buying ? 'Đang thanh toán...' : selectedPlanId === session?.membershipTier ? 'Đang sử dụng' : 'Xác nhận Đăng ký'}
          </Text>
        </Pressable>
      </View>

      {/* ── PAYOS PAYMENT STATUS MODAL ── */}
      <Modal visible={!!activeOrder} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Thanh toán nâng cấp gói</Text>
            
            <View style={styles.orderCodeBox}>
              <Text style={styles.orderCodeLabel}>MÃ ĐƠN HÀNG:</Text>
              <Text style={styles.orderCodeVal}>{activeOrder?.orderCode}</Text>
            </View>

            <Text style={styles.modalInfo}>
              Vui lòng thực hiện chuyển khoản thanh toán qua cổng PayOS để kích hoạt gói thành viên.
            </Text>

            <Pressable
              onPress={() => activeOrder && Linking.openURL(activeOrder.checkoutUrl)}
              style={styles.openWebBtn}
            >
              <Text style={styles.openWebBtnText}>Mở Trang Thanh Toán PayOS</Text>
            </Pressable>

            <Pressable
              onPress={checkPaymentStatus}
              disabled={checkingStatus}
              style={[styles.doneBtn, checkingStatus && { backgroundColor: '#CBD5E1' }]}
            >
              {checkingStatus ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.doneBtnText}>Tôi đã thanh toán xong</Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => {
                Alert.alert(
                  'Huỷ giao dịch',
                  'Bạn có chắc chắn muốn thoát và huỷ giao dịch này không?',
                  [
                    { text: 'Tiếp tục thanh toán', style: 'cancel' },
                    { text: 'Huỷ bỏ', style: 'destructive', onPress: () => setActiveOrder(null) }
                  ]
                );
              }}
              style={styles.cancelOrderBtn}
            >
              <Text style={styles.cancelOrderBtnText}>Huỷ giao dịch</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.dark,
  },
  scrollContent: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[6],
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  heroTitle: {
    fontSize: fontSizes.xl + 2,
    fontWeight: fontWeights.bold,
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  heroSubtitle: {
    fontSize: fontSizes.sm,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: spacing[4],
    lineHeight: 20,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing[6],
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: spacing[2],
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  toggleBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: '#64748B',
  },
  toggleTextActive: {
    color: '#0F172A',
  },
  cardsContainer: {
    gap: spacing[6],
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  planCardSelected: {
    borderColor: '#8B5CF6',
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  cardHeaderGradient: {
    padding: spacing[5],
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  planName: {
    fontSize: fontSizes.lg + 2,
    fontWeight: fontWeights.bold,
    color: '#FFFFFF',
  },
  badgeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: spacing[2.5],
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  badgeText: {
    fontSize: fontSizes.xs - 2,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  planPrice: {
    fontSize: fontSizes.xl + 2,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  savingsText: {
    fontSize: fontSizes.xs,
    color: 'rgba(255, 255, 255, 0.95)',
    marginTop: spacing[1.5],
    fontWeight: '600',
  },
  cardBody: {
    padding: spacing[5],
  },
  planDescription: {
    fontSize: fontSizes.sm,
    color: '#475569',
    lineHeight: 20,
    marginBottom: spacing[4],
  },
  featuresList: {
    gap: spacing[3],
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureBadge: {
    backgroundColor: '#EEF2F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  featureBadgeText: {
    fontSize: fontSizes.xs - 1,
    fontWeight: '700',
    color: '#475569',
  },
  featureLabel: {
    fontSize: fontSizes.sm - 1,
    color: '#1E293B',
    marginLeft: spacing[2],
    flex: 1,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerInfo: {
    flex: 1,
  },
  footerLabel: {
    fontSize: fontSizes.xs,
    color: '#64748B',
  },
  footerValue: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    color: '#0F172A',
    marginTop: 2,
  },
  subscribeBtn: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: radius.md,
  },
  subscribeBtnText: {
    fontSize: fontSizes.md - 1,
    fontWeight: fontWeights.bold,
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing[6],
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    gap: spacing[4],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  modalTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: '#0F172A',
    marginBottom: spacing[2],
  },
  orderCodeBox: {
    backgroundColor: '#F1F5F9',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[5],
    borderRadius: radius.md,
    alignItems: 'center',
    width: '100%',
  },
  orderCodeLabel: {
    fontSize: fontSizes.xs - 2,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
  },
  orderCodeVal: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: '#0F172A',
    marginTop: 4,
  },
  modalInfo: {
    fontSize: fontSizes.sm,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
  },
  openWebBtn: {
    backgroundColor: '#8B5CF6',
    paddingVertical: spacing[3],
    borderRadius: radius.md,
    width: '100%',
    alignItems: 'center',
    marginTop: spacing[2],
  },
  openWebBtnText: {
    color: '#FFFFFF',
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.md - 1,
  },
  doneBtn: {
    backgroundColor: '#10B981',
    paddingVertical: spacing[3],
    borderRadius: radius.md,
    width: '100%',
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.md - 1,
  },
  cancelOrderBtn: {
    paddingVertical: spacing[2],
    marginTop: spacing[2],
  },
  cancelOrderBtnText: {
    color: '#EF4444',
    fontWeight: fontWeights.semibold,
    fontSize: fontSizes.sm,
  },
});
