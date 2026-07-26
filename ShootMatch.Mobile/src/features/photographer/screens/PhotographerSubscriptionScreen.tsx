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
import { usePhotographerTheme } from '../PhotographerThemeContext';
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

const PHOTOGRAPHER_PLANS: PlanDetail[] = [
  {
    id: 'Basic',
    name: 'Basic',
    gradient: ['#7A8A9E', '#4B5563'],
    monthlyPrice: 0,
    sixMonthPrice: 0,
    yearlyPrice: 0,
    savingsSixMonth: '—',
    savingsYear: '—',
    description: 'Bắt đầu hành trình nhiếp ảnh của bạn',
    features: [
      { label: 'Portfolio tối đa 20 ảnh', checked: true },
      { label: 'Video giới thiệu bản thân', checked: false },
      { label: 'Hiển thị tìm kiếm tiêu chuẩn', checked: 'Tiêu chuẩn' },
      { label: 'Xuất hiện ở mục "Recommended"', checked: false },
      { label: 'Nhận yêu cầu booking (Giới hạn)', checked: true },
      { label: 'Chat với khách hàng', checked: true },
      { label: 'Thống kê lượt xem profile', checked: false },
      { label: 'Thống kê lượt quẹt / quan tâm', checked: false },
      { label: 'Quản lý lịch chụp cơ bản', checked: 'Cơ bản' },
      { label: 'Đăng nhiều gói chụp', checked: false },
      { label: 'Hỗ trợ kỹ thuật qua Email', checked: 'Email' },
    ],
  },
  {
    id: 'Pro',
    name: 'Pro',
    gradient: ['#cf4028', '#ff4200'],
    monthlyPrice: 299000,
    sixMonthPrice: 1650000,
    yearlyPrice: 2990000,
    savingsSixMonth: 'Tiết kiệm ~144.000 VNĐ',
    savingsYear: 'Tiết kiệm ~598.000 VNĐ',
    badge: 'PHỔ BIẾN',
    description: 'Dành cho photographer làm việc thường xuyên',
    features: [
      { label: 'Portfolio không giới hạn', checked: true },
      { label: 'Đăng 1 video giới thiệu', checked: true },
      { label: 'Hiển thị tìm kiếm ưu tiên', checked: 'Ưu tiên' },
      { label: 'Xuất hiện ở mục "Recommended"', checked: true },
      { label: 'Nhận booking không giới hạn', checked: true },
      { label: 'Chat với khách hàng', checked: true },
      { label: 'Thống kê lượt xem profile', checked: true },
      { label: 'Thống kê lượt quẹt / quan tâm', checked: true },
      { label: 'Quản lý lịch chụp nâng cao', checked: 'Nâng cao' },
      { label: 'Đăng nhiều gói chụp', checked: true },
      { label: 'Hỗ trợ kỹ thuật ưu tiên', checked: 'Ưu tiên' },
    ],
  },
  {
    id: 'Studio+',
    name: 'Studio+',
    gradient: ['#D4AF37', '#8F6E00'],
    monthlyPrice: 699000,
    sixMonthPrice: 3850000,
    yearlyPrice: 6990000,
    savingsSixMonth: 'Tiết kiệm ~344.000 VNĐ',
    savingsYear: 'Tiết kiệm ~1.398.000 VNĐ',
    badge: 'CHUYÊN NGHIỆP',
    description: 'Giải pháp hoàn hảo cho Studio và Photographer lớn',
    features: [
      { label: 'Portfolio không giới hạn', checked: true },
      { label: 'Đăng nhiều video giới thiệu', checked: true },
      { label: 'Hiển thị tìm kiếm cao nhất', checked: 'Ưu tiên cao' },
      { label: 'Xuất hiện ở mục "Recommended"', checked: true },
      { label: 'Nhận booking không giới hạn', checked: true },
      { label: 'Chat với khách hàng', checked: true },
      { label: 'Thống kê lượt xem profile', checked: true },
      { label: 'Thống kê lượt quẹt / quan tâm', checked: true },
      { label: 'Quản lý lịch chụp nâng cao', checked: 'Nâng cao' },
      { label: 'Đăng nhiều gói chụp', checked: true },
      { label: 'Ưu tiên nhận booking gấp', checked: true },
      { label: 'Hỗ trợ riêng 24/7 từ SHOOTMATCH', checked: 'Hỗ trợ riêng' },
    ],
  },
];

export default function PhotographerSubscriptionScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { session, updateMembershipTier } = useAuth();
  const { colors, isDark } = usePhotographerTheme();
  const { width: windowWidth } = useWindowDimensions();
  const containerWidth = Platform.OS === 'web' ? Math.min(windowWidth, 600) : windowWidth;

  const [cycle, setCycle] = useState<Cycle>('month');
  const [selectedPlanId, setSelectedPlanId] = useState<string>(session?.membershipTier || 'Basic');
  const [buying, setBuying] = useState(false);
  const [activeOrder, setActiveOrder] = useState<{ orderCode: string; checkoutUrl: string } | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const styles = getStyles(colors, isDark);

  const checkPaymentStatus = async () => {
    if (!activeOrder) return;
    setCheckingStatus(true);
    try {
      const { data } = await apiClient.get(`/api/payments/membership/status/${activeOrder.orderCode}`);
      if (data.status === 'Paid') {
        await updateMembershipTier(selectedPlanId); 
        Alert.alert(
          'Thành công',
          `Chúc mừng! Đối tác đã kích hoạt gói "${selectedPlanId}" thành công.`,
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
    
    let planId = 'basic';
    if (selectedPlanId === 'Pro') planId = 'pro';
    else if (selectedPlanId === 'Studio+') planId = 'studio_plus';

    if (planId === 'basic') {
      setBuying(true);
      try {
        await updateMembershipTier('Basic');
        Alert.alert('Thành công', 'Đã chuyển về gói Basic.');
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
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Đăng ký Gói Đối tác</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { width: containerWidth, alignSelf: 'center' }]}>
        <Animated.View entering={FadeInUp.duration(450)} style={styles.heroSection}>
          <Text style={styles.heroTitle}>Nâng tầm Thương hiệu của bạn</Text>
          <Text style={styles.heroSubtitle}>
            Chọn gói dịch vụ để mở rộng hiển thị, thu hút nhiều khách hàng chất lượng và quản lý công việc chuyên nghiệp hơn.
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
          {PHOTOGRAPHER_PLANS.map((plan, idx) => {
            const isSelected = selectedPlanId === plan.id;
            const savings = getSavingsDisplay(plan);
            const planColor = 
              plan.id === 'Studio+' ? '#D4AF37' :
              plan.id === 'Pro' ? '#FF4200' : 
              '#7A8A9E';

            return (
              <Animated.View
                key={plan.id}
                entering={FadeInDown.delay(150 + idx * 100).duration(450)}
              >
                <Pressable
                  onPress={() => setSelectedPlanId(plan.id)}
                  style={[
                    styles.planCard,
                    isSelected && { borderColor: planColor, borderWidth: 2, shadowColor: planColor, shadowOpacity: 0.15, shadowRadius: 20, elevation: 6 },
                  ]}
                >
                  <LinearGradient
                    colors={plan.gradient}
                    style={styles.cardTopBar}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />

                  {isSelected && (
                    <View style={[styles.selectedIndicator, { backgroundColor: planColor }]}>
                      <Ionicons name="checkmark" size={12} color="#FFF" />
                    </View>
                  )}

                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <Text style={[styles.planName, { color: isSelected ? planColor : colors.text }]}>
                        {plan.name}
                      </Text>
                      {plan.badge && (
                        <LinearGradient
                          colors={plan.gradient}
                          style={styles.badgeContainer}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <Text style={styles.badgeText}>{plan.badge}</Text>
                        </LinearGradient>
                      )}
                    </View>
                    
                    <Text style={styles.planDescription}>{plan.description}</Text>
                    
                    <View style={styles.priceContainer}>
                      <Text style={styles.planPrice}>
                        {plan.monthlyPrice === 0 ? 'Miễn phí' : plan.monthlyPrice.toLocaleString('vi-VN')}
                        {plan.monthlyPrice !== 0 && <Text style={styles.currency}> đ</Text>}
                      </Text>
                      {plan.monthlyPrice !== 0 && (
                        <Text style={styles.periodText}>
                          {cycle === 'month' ? '/tháng' : cycle === '6months' ? '/6 tháng' : '/năm'}
                        </Text>
                      )}
                    </View>

                    {savings ? (
                      <View style={styles.savingsBadge}>
                        <Text style={styles.savingsText}>{savings}</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.cardBody}>
                    <Text style={styles.featuresTitle}>Tính năng bao gồm:</Text>
                    <View style={styles.featuresList}>
                      {plan.features.map((feat, fidx) => {
                        const isIncluded = feat.checked !== false;
                        return (
                          <View key={fidx} style={[styles.featureRow, !isIncluded && { opacity: 0.4 }]}>
                            {typeof feat.checked === 'string' ? (
                              <View style={[styles.featureBadge, { backgroundColor: planColor + '15' }]}>
                                <Text style={[styles.featureBadgeText, { color: planColor }]}>{feat.checked}</Text>
                              </View>
                            ) : feat.checked ? (
                              <View style={[styles.checkCircle, { backgroundColor: planColor + '15' }]}>
                                <Ionicons name="checkmark" size={10} color={planColor} />
                              </View>
                            ) : (
                              <View style={styles.uncheckCircle}>
                                <Ionicons name="close" size={10} color={colors.textMuted} />
                              </View>
                            )}
                            <Text style={[
                              styles.featureLabel, 
                              !isIncluded && { textDecorationLine: 'line-through', color: colors.textMuted }
                            ]}>
                              {feat.label}
                            </Text>
                          </View>
                        );
                      })}
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
            buying && { backgroundColor: isDark ? '#475569' : '#FFA180' }
          ]}
        >
          <Text style={styles.subscribeBtnText}>
            {buying ? 'Đang thanh toán...' : selectedPlanId === session?.membershipTier ? 'Đang sử dụng' : 'Đăng ký Ngay'}
          </Text>
        </Pressable>
      </View>

      {/* ── PAYOS PAYMENT STATUS MODAL ── */}
      <Modal visible={!!activeOrder} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Thanh toán nâng cấp gói đối tác</Text>
            
            <View style={styles.orderCodeBox}>
              <Text style={styles.orderCodeLabel}>MÃ ĐƠN HÀNG:</Text>
              <Text style={styles.orderCodeVal}>{activeOrder?.orderCode}</Text>
            </View>

            <Text style={styles.modalInfo}>
              Vui lòng thực hiện chuyển khoản thanh toán qua cổng PayOS để kích hoạt tài khoản đối tác {selectedPlanId}.
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

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
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
    color: colors.text,
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
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  heroSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing[4],
    lineHeight: 20,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: isDark ? colors.surfaceStrong : '#F1EBE0',
    borderRadius: 99,
    padding: 4,
    marginBottom: spacing[6],
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 99,
  },
  toggleBtnActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.3 : 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  toggleText: {
    fontSize: fontSizes.sm - 1,
    fontWeight: '700',
    color: colors.textMuted,
  },
  toggleTextActive: {
    color: colors.text,
  },
  cardsContainer: {
    gap: spacing[6],
  },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: isDark ? 0.2 : 0.04,
    shadowRadius: 16,
    elevation: 3,
    position: 'relative',
  },
  cardTopBar: {
    height: 6,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  cardHeader: {
    padding: 24,
    paddingBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  planName: {
    fontSize: 22,
    fontWeight: '800',
  },
  badgeContainer: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: fontSizes.xs - 3,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  planDescription: {
    fontSize: fontSizes.sm - 1,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.text,
  },
  currency: {
    fontSize: 18,
    fontWeight: '700',
  },
  periodText: {
    fontSize: 14,
    color: colors.textMuted,
    marginLeft: 4,
    fontWeight: '600',
  },
  savingsBadge: {
    backgroundColor: isDark ? '#064E3B' : '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  savingsText: {
    fontSize: 12,
    color: isDark ? '#A7F3D0' : '#059669',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 24,
  },
  cardBody: {
    padding: 24,
  },
  featuresTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  uncheckCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: isDark ? colors.surfaceStrong : '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  featureBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 10,
  },
  featureBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  featureLabel: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  footer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
    color: colors.textMuted,
  },
  footerValue: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    color: colors.text,
    marginTop: 2,
  },
  subscribeBtn: {
    backgroundColor: colors.accentOrange,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: radius.md,
  },
  subscribeBtnText: {
    fontSize: fontSizes.md - 1,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
  },
  modalContent: {
    backgroundColor: colors.surface,
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
    color: colors.text,
    marginBottom: spacing[2],
  },
  orderCodeBox: {
    backgroundColor: isDark ? colors.surfaceStrong : '#F1F5F9',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[5],
    borderRadius: radius.md,
    alignItems: 'center',
    width: '100%',
  },
  orderCodeLabel: {
    fontSize: fontSizes.xs - 2,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  orderCodeVal: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.text,
    marginTop: 4,
  },
  modalInfo: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  openWebBtn: {
    backgroundColor: colors.accentOrange,
    paddingVertical: spacing[3],
    borderRadius: radius.md,
    width: '100%',
    alignItems: 'center',
    marginTop: spacing[2],
  },
  openWebBtnText: {
    color: colors.primary,
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
