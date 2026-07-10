import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, Pressable, Modal,
  Dimensions, useWindowDimensions
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
  withRepeat, withTiming
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../app/theme/colors';
import { fontSizes, fontWeights } from '../../../app/theme/typography';
import { spacing } from '../../../app/theme/spacing';

interface AppTutorialOverlayProps {
  visible: boolean;
  onClose: () => void;
}

export default function AppTutorialOverlay({ visible, onClose }: AppTutorialOverlayProps) {
  const { width: W, height: H } = useWindowDimensions();
  const [step, setStep] = useState(0); // 0: Welcome, 1: Search, 2: Discover Tab, 3: Swipe/Match, 4: Chat Tab

  // Spotlight pulse animation
  const pulseScale = useSharedValue(1);
  useEffect(() => {
    if (visible) {
      pulseScale.value = withRepeat(
        withTiming(1.2, { duration: 1000 }),
        -1,
        true
      );
    }
  }, [visible, step]);

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: withTiming(step === 0 ? 0 : 0.4),
  }));

  // Define spotlight properties for each step
  const getSpotlightProps = () => {
    switch (step) {
      case 1: // Search Icon (top right)
        return {
          top: 48,
          right: 98,
          width: 48,
          height: 48,
          borderRadius: 24,
        };
      case 2: // Discover Tab (bottom tab #2)
        return {
          bottom: 12,
          left: W * 0.3 - 28,
          width: 56,
          height: 56,
          borderRadius: 28,
        };
      case 3: // Swipe Feed (middle)
        return {
          top: H * 0.4 - 50,
          left: W * 0.5 - 50,
          width: 100,
          height: 100,
          borderRadius: 50,
        };
      case 4: // Chat Tab (bottom tab #3)
        return {
          bottom: 12,
          left: W * 0.5 - 28,
          width: 56,
          height: 56,
          borderRadius: 28,
        };
      default: // Welcome / None
        return null;
    }
  };

  const spotlight = getSpotlightProps();

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  // Render Tooltip Card contents
  const renderTooltipCard = () => {
    let title = '';
    let body = '';
    let cardPosition: any = { top: H * 0.3 };

    if (step === 0) {
      title = 'CHÀO MỪNG ĐẾN VỚI PICKIC! 📸';
      body = 'Hãy cùng đi qua hướng dẫn nhanh này để biết cách kết nối với nhiếp ảnh gia và đặt lịch chụp ảnh nhé!';
      cardPosition = { top: H * 0.32, alignSelf: 'center', width: W * 0.85 };
    } else if (step === 1) {
      title = '🔍 Tìm kiếm Nhiếp ảnh gia';
      body = 'Bấm biểu tượng kính lúp này để tìm kiếm nhiếp ảnh gia theo tên, khu vực, ngân sách hoặc phong cách chụp bạn mong muốn.';
      cardPosition = { top: 110, alignSelf: 'center', width: W * 0.85 };
    } else if (step === 2) {
      title = '🧭 Khám phá Lookbook';
      body = 'Nhấp vào đây để xem các bức ảnh đẹp từ cộng đồng nhiếp ảnh gia, tìm kiếm cảm hứng concept và lưu các album yêu thích.';
      cardPosition = { bottom: 85, alignSelf: 'center', width: W * 0.85 };
    } else if (step === 3) {
      title = '✨ Quẹt để Ghép đôi';
      body = 'Trải nghiệm tính năng ghép đôi độc đáo: Quẹt phải nhiếp ảnh gia bạn ưng ý để gửi yêu cầu ghép đôi. Khi họ đồng ý, bạn có thể trò chuyện!';
      cardPosition = { top: H * 0.4 + 70, alignSelf: 'center', width: W * 0.85 };
    } else if (step === 4) {
      title = '💬 Trò chuyện & Đặt lịch';
      body = 'Nơi lưu trữ các cuộc hội thoại với những nhiếp ảnh gia bạn đã ghép đôi. Bạn có thể trao đổi về trang phục, địa điểm và bấm Đặt lịch trực tiếp.';
      cardPosition = { bottom: 85, alignSelf: 'center', width: W * 0.85 };
    }

    return (
      <View style={[styles.tooltipCard, cardPosition]}>
        <Text style={styles.tooltipTitle}>{title}</Text>
        <Text style={styles.tooltipBody}>{body}</Text>

        <View style={styles.paginationRow}>
          {[0, 1, 2, 3, 4].map((s) => (
            <View
              key={s}
              style={[
                styles.pageDot,
                step === s && { backgroundColor: '#ff4200', width: 14 }
              ]}
            />
          ))}
        </View>

        <View style={styles.buttonRow}>
          {step < 4 ? (
            <Pressable style={styles.skipBtn} onPress={handleSkip}>
              <Text style={styles.skipText}>Bỏ qua</Text>
            </Pressable>
          ) : (
            <View />
          )}

          <Pressable style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextText}>{step === 4 ? 'BẮT ĐẦU TRẢI NGHIỆM' : 'TIẾP TỤC'}</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlayContainer}>
        {/* Semi-transparent backdrop with absolute holes is simulated by drawing overlay sections */}
        <View style={[StyleSheet.absoluteFillObject, styles.backdrop]} />

        {/* Highlight spotlight lens */}
        {spotlight && (
          <View
            style={[
              styles.spotlightCircle,
              {
                top: spotlight.top,
                bottom: spotlight.bottom,
                left: spotlight.left,
                right: spotlight.right,
                width: spotlight.width,
                height: spotlight.height,
                borderRadius: spotlight.borderRadius,
              }
            ]}
          >
            {/* Pulsing ring */}
            <Animated.View
              style={[
                StyleSheet.absoluteFillObject,
                styles.pulseRing,
                { borderRadius: spotlight.borderRadius },
                animatedPulseStyle
              ]}
            />

            {/* DSLR Camera viewfinder bracket indicators around spotlight */}
            <View style={styles.bracketTL} />
            <View style={styles.bracketTR} />
            <View style={styles.bracketBL} />
            <View style={styles.bracketBR} />
          </View>
        )}

        {renderTooltipCard()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    position: 'relative',
  },
  backdrop: {
    backgroundColor: 'rgba(26, 26, 15, 0.78)', // Dim overlay
  },
  spotlightCircle: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#ff4200',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ff4200',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 8,
  },
  pulseRing: {
    borderWidth: 1.5,
    borderColor: '#ff4200',
  },
  
  // DSLR Camera Brackets styling on lens focus
  bracketTL: { position: 'absolute', top: -6, left: -6, width: 8, height: 8, borderTopWidth: 2, borderLeftWidth: 2, borderColor: '#fff' },
  bracketTR: { position: 'absolute', top: -6, right: -6, width: 8, height: 8, borderTopWidth: 2, borderRightWidth: 2, borderColor: '#fff' },
  bracketBL: { position: 'absolute', bottom: -6, left: -6, width: 8, height: 8, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: '#fff' },
  bracketBR: { position: 'absolute', bottom: -6, right: -6, width: 8, height: 8, borderBottomWidth: 2, borderRightWidth: 2, borderColor: '#fff' },

  // Tooltip Card
  tooltipCard: {
    position: 'absolute',
    backgroundColor: '#fff7e1', // Cream background to match design tokens
    borderRadius: 20,
    padding: spacing[5],
    borderWidth: 2,
    borderColor: 'rgba(26, 26, 15, 0.1)',
    shadowColor: '#1a1a0f',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  tooltipTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '900',
    color: colors.dark,
    letterSpacing: 0.5,
    marginBottom: spacing[2],
  },
  tooltipBody: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: spacing[4],
  },
  paginationRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing[4],
  },
  pageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(26, 26, 15, 0.15)',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipBtn: {
    paddingVertical: spacing[1.5],
  },
  skipText: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
  },
  nextBtn: {
    backgroundColor: '#ff4200',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: 15,
  },
  nextText: {
    color: '#fff',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
});
