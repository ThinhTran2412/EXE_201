import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withDelay, withTiming,
} from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ClayButton } from '../../../shared/components/ClayButton';
import { colors } from '../../../app/theme/colors';
import { fontSizes, fontWeights } from '../../../app/theme/typography';
import { spacing } from '../../../app/theme/spacing';
import { getMyConversations } from '../api';

export default function BookingSuccessScreen() {
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const insets     = useSafeAreaInsets();
  
  const [chatLoading, setChatLoading] = useState(false);

  // Safely extract parameters with fallbacks to avoid any app crash
  const params = (route.params || {}) as any;
  const photographerId   = params.photographerId || '';
  const photographerName = params.photographerName || 'Nhiếp ảnh gia';
  const packageName      = params.packageName || 'Gói dịch vụ tùy chỉnh';
  const dateDisplay      = params.dateDisplay || 'Chưa xác định';
  const price            = params.price ?? 0;
  const commission       = params.commission ?? 0;
  const total            = params.total ?? 0;
  const location         = params.location || 'Chưa xác định';
  const phone            = params.phone || 'Chưa xác định';

  // Animation values
  const checkScale = useSharedValue(0);
  const ticketOpacity = useSharedValue(0);
  const ticketTranslateY = useSharedValue(40);
  const timelineOpacity = useSharedValue(0);
  const timelineTranslateY = useSharedValue(40);
  const ctaOpacity = useSharedValue(0);
  const ctaTranslateY = useSharedValue(40);

  useEffect(() => {
    // Satisfying spring pop-in for the red clay wax seal
    checkScale.value = withSpring(1, { damping: 10, stiffness: 80 });
    
    // Staggered slide and fade-in for details
    ticketOpacity.value = withDelay(150, withTiming(1, { duration: 500 }));
    ticketTranslateY.value = withDelay(150, withSpring(0, { damping: 12, stiffness: 80 }));
    
    timelineOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));
    timelineTranslateY.value = withDelay(300, withSpring(0, { damping: 12, stiffness: 80 }));
    
    ctaOpacity.value = withDelay(450, withTiming(1, { duration: 500 }));
    ctaTranslateY.value = withDelay(450, withSpring(0, { damping: 12, stiffness: 80 }));
  }, []);

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const ticketStyle = useAnimatedStyle(() => ({
    opacity: ticketOpacity.value,
    transform: [{ translateY: ticketTranslateY.value }],
  }));

  const timelineStyle = useAnimatedStyle(() => ({
    opacity: timelineOpacity.value,
    transform: [{ translateY: timelineTranslateY.value }],
  }));

  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
    transform: [{ translateY: ctaTranslateY.value }],
  }));

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN') + ' ₫';
  };

  const handleChat = async () => {
    if (!photographerId) {
      // Direct to general inbox list if no specific photographer ID
      navigation.navigate('CustomerRoot', { screen: 'Chat' });
      return;
    }
    setChatLoading(true);
    try {
      const convs = await getMyConversations();
      const existingConv = convs.find(c => c.photographerId === photographerId);
      if (existingConv) {
        // Navigate directly to private chat thread screen
        navigation.navigate('Chat', {
          conversationId: existingConv.id,
          name: photographerName,
        });
      } else {
        // Fallback to inbox tab
        navigation.navigate('CustomerRoot', { screen: 'Chat' });
      }
    } catch (error) {
      console.warn('Failed to find direct conversation, falling back to all chats', error);
      navigation.navigate('CustomerRoot', { screen: 'Chat' });
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Soft warm claymorphic background blobs */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <ScrollView 
        contentContainerStyle={[styles.scrollContainer, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Layered Custom Stamp Checkmark (Red-Clay Wax Seal) */}
        <Animated.View style={[styles.sealWrapper, checkStyle]}>
          <View style={styles.outerSeal}>
            <View style={styles.sealBody}>
              <View style={styles.sealInner}>
                <Ionicons name="checkmark-sharp" size={32} color={colors.background} />
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Polaroid Ticket Card */}
        <Animated.View style={[styles.ticketCard, ticketStyle]}>
          <View style={styles.ticketTop}>
            <View style={styles.sparkles}>
              <Ionicons name="sparkles" size={18} color="#fbbf24" />
            </View>
            <Text style={styles.title}>Đã Gửi Yêu Cầu!</Text>
            
            <View style={styles.statusBadge}>
              <Ionicons name="time-outline" size={12} color={colors.accent} />
              <Text style={styles.statusText}>Đang chờ phản hồi</Text>
            </View>

            <View style={styles.badgeDivider} />

            {/* Details Grid */}
            <View style={styles.detailList}>
              <View style={styles.detailItem}>
                <View style={styles.detailIconCircle}>
                  <Ionicons name="person-outline" size={14} color={colors.accent} />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Nhiếp ảnh gia</Text>
                  <Text style={styles.detailValue}>{photographerName}</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <View style={styles.detailIconCircle}>
                  <Ionicons name="camera-outline" size={14} color={colors.accent} />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Gói dịch vụ</Text>
                  <Text style={styles.detailValue} numberOfLines={1}>{packageName}</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <View style={styles.detailIconCircle}>
                  <Ionicons name="calendar-outline" size={14} color={colors.accent} />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Thời gian</Text>
                  <Text style={styles.detailValue}>{dateDisplay}</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <View style={styles.detailIconCircle}>
                  <Ionicons name="pin-outline" size={14} color={colors.accent} />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Địa điểm</Text>
                  <Text style={styles.detailValue} numberOfLines={2}>{location}</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <View style={styles.detailIconCircle}>
                  <Ionicons name="call-outline" size={14} color={colors.accent} />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Số điện thoại</Text>
                  <Text style={styles.detailValue}>{phone}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Ticket Dashed Separator with Left and Right punch cuts */}
          <View style={styles.dashedRow}>
            <View style={styles.cutoutLeft} />
            <View style={styles.dashLine} />
            <View style={styles.cutoutRight} />
          </View>

          {/* Ticket Bottom (Billing Breakdown) */}
          <View style={styles.ticketBottom}>
            <Text style={styles.billingTitle}>Chi tiết chi phí</Text>
            
            <View style={styles.billingRow}>
              <Text style={styles.billingLabel}>Phí gói dịch vụ</Text>
              <Text style={styles.billingValue}>{formatCurrency(price)}</Text>
            </View>

            <View style={styles.billingRow}>
              <Text style={styles.billingLabel}>Phí dịch vụ nền tảng</Text>
              <Text style={styles.billingValue}>{formatCurrency(commission)}</Text>
            </View>

            <View style={styles.billingDivider} />

            <View style={styles.billingRow}>
              <Text style={styles.totalLabel}>Tổng cộng</Text>
              <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Timeline Next Steps Card */}
        <Animated.View style={[styles.timelineCard, timelineStyle]}>
          <Text style={styles.timelineHeader}>Quy trình tiếp theo</Text>
          
          <View style={styles.timeline}>
            <View style={styles.timelineStep}>
              <View style={styles.timelineIndicator}>
                <View style={styles.timelineDotActive}>
                  <Text style={styles.timelineDotText}>1</Text>
                </View>
                <View style={styles.timelineLine} />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Nhiếp ảnh gia phản hồi</Text>
                <Text style={styles.timelineDesc}>Đối tác sẽ nhận được thông tin đặt lịch, kiểm tra lịch trống thực tế và phản hồi xác nhận yêu cầu của bạn trong vòng 24h.</Text>
              </View>
            </View>

            <View style={styles.timelineStep}>
              <View style={styles.timelineIndicator}>
                <View style={styles.timelineDotActive}>
                  <Text style={styles.timelineDotText}>2</Text>
                </View>
                <View style={styles.timelineLine} />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Nhắn tin thảo luận Concept</Text>
                <Text style={styles.timelineDesc}>Bạn nên chủ động nhắn tin thảo luận trước với đối tác về concept chụp mong muốn, chuẩn bị trang phục và đạo cụ phù hợp.</Text>
              </View>
            </View>

            <View style={styles.timelineStep}>
              <View style={styles.timelineIndicator}>
                <View style={styles.timelineDotActive}>
                  <Text style={styles.timelineDotText}>3</Text>
                </View>
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Theo dõi trạng thái lịch hẹn</Text>
                <Text style={styles.timelineDesc}>Hãy bật thông báo ứng dụng để nhận cập nhật trạng thái lịch hẹn ngay lập tức khi đối tác xác nhận hoặc thay đổi.</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Sticky Bottom Actions inside Safe Area */}
      <Animated.View style={[styles.cta, ctaStyle, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <ClayButton
          label="Xem lịch hẹn của tôi"
          onPress={() => navigation.navigate('CustomerRoot', { screen: 'Bookings' })}
          variant="primary"
          size="lg"
        />
        <ClayButton
          label={chatLoading ? "Đang kết nối..." : "Nhắn tin trao đổi ngay"}
          onPress={handleChat}
          variant="secondary"
          size="lg"
          disabled={chatLoading}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: spacing[5],
    paddingBottom: 40,
    alignItems: 'center',
    gap: 20,
  },
  bgCircle1: {
    position: 'absolute',
    top: -60,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#eae1c8',
    opacity: 0.35,
  },
  bgCircle2: {
    position: 'absolute',
    bottom: 180,
    right: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#f3ecd8',
    opacity: 0.45,
  },
  
  // Seal Stamp Styles
  sealWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  outerSeal: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(207, 64, 40, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealBody: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1a1a0f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  sealInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#bc3620',
    borderWidth: 1.5,
    borderColor: '#e25942',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Polaroid Ticket Card Styles
  ticketCard: {
    width: '100%',
    backgroundColor: '#fdfbf7',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.06)',
    shadowColor: colors.clay,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 5,
    overflow: 'hidden',
  },
  ticketTop: {
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  sparkles: {
    marginBottom: -4,
  },
  title: {
    fontSize: 22,
    fontWeight: fontWeights.extrabold,
    color: colors.dark,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(207, 64, 40, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(207, 64, 40, 0.12)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    color: colors.accent,
  },
  badgeDivider: {
    width: 40,
    height: 1.5,
    backgroundColor: 'rgba(26,26,15,0.08)',
    marginVertical: 4,
  },
  
  // Detail List Styles
  detailList: {
    width: '100%',
    gap: 14,
    marginTop: 6,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3ecd8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.04)',
  },
  detailTextContainer: {
    flex: 1,
    gap: 2,
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: fontWeights.bold,
    color: colors.textLight,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: fontWeights.bold,
    color: colors.dark,
  },

  // Dashed Cutout Divider Styles
  dashedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 24,
    position: 'relative',
  },
  cutoutLeft: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.background,
    marginLeft: -12,
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.06)',
  },
  cutoutRight: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.background,
    marginRight: -12,
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.06)',
  },
  dashLine: {
    flex: 1,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.12)',
    marginHorizontal: 8,
  },

  // Ticket Bottom Styles
  ticketBottom: {
    padding: 20,
    backgroundColor: '#faf7ee',
    gap: 12,
  },
  billingTitle: {
    fontSize: 10,
    fontWeight: fontWeights.bold,
    color: colors.textLight,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  billingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billingLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  billingValue: {
    fontSize: 13,
    fontWeight: fontWeights.semibold,
    color: colors.dark,
  },
  billingDivider: {
    height: 1,
    backgroundColor: 'rgba(26,26,15,0.06)',
    marginVertical: 4,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: fontWeights.bold,
    color: colors.dark,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: fontWeights.extrabold,
    color: colors.accent,
  },

  // Timeline Step Styles
  timelineCard: {
    width: '100%',
    backgroundColor: '#f3ecd8',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.08)',
    gap: 16,
  },
  timelineHeader: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  timeline: {
    gap: 4,
  },
  timelineStep: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineIndicator: {
    alignItems: 'center',
    width: 24,
  },
  timelineDotActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timelineDotText: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    color: colors.background,
  },
  timelineLine: {
    position: 'absolute',
    top: 24,
    bottom: -10,
    left: 11,
    width: 2,
    backgroundColor: 'rgba(26,26,15,0.08)',
    zIndex: 1,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 20,
    gap: 4,
  },
  timelineTitle: {
    fontSize: 13,
    fontWeight: fontWeights.bold,
    color: colors.dark,
  },
  timelineDesc: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 15,
  },

  // Sticky Bottom CTA
  cta: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    gap: 12,
    borderTopWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#f3ecd8',
    width: '100%',
  },
});
