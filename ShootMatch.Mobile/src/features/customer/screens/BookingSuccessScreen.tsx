import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withDelay, withTiming, withSequence,
} from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ClayButton } from '../../../shared/components/ClayButton';
import { colors } from '../../../app/theme/colors';
import { fontSizes, fontWeights } from '../../../app/theme/typography';
import { spacing } from '../../../app/theme/spacing';

export default function BookingSuccessScreen() {
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const { photographerName } = route.params as { photographerName: string };

  const checkScale   = useSharedValue(0);
  const textOpacity  = useSharedValue(0);
  const confettiY    = useSharedValue(-20);

  useEffect(() => {
    checkScale.value   = withSpring(1, { damping: 10, stiffness: 120 });
    textOpacity.value  = withDelay(400, withTiming(1, { duration: 500 }));
    confettiY.value    = withDelay(300, withSpring(0, { damping: 15 }));
  }, []);

  const checkStyle    = useAnimatedStyle(() => ({ transform: [{ scale: checkScale.value }] }));
  const textStyle     = useAnimatedStyle(() => ({ opacity: textOpacity.value }));

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Animated.View style={[styles.checkWrap, checkStyle]}>
          <View style={styles.checkCircle}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.textSection, textStyle]}>
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.title}>Đặt lịch thành công!</Text>
          <Text style={styles.sub}>
            Yêu cầu của bạn đã được gửi đến{'\n'}
            <Text style={styles.bold}>{photographerName}</Text>.{'\n'}
            Bạn sẽ nhận thông báo khi họ xác nhận.
          </Text>

          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📅</Text>
              <Text style={styles.infoText}>Lịch chụp đang chờ xác nhận</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>💬</Text>
              <Text style={styles.infoText}>Chat với nhiếp ảnh gia để thảo luận chi tiết</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>🔔</Text>
              <Text style={styles.infoText}>Bật thông báo để không bỏ lỡ cập nhật</Text>
            </View>
          </View>
        </Animated.View>
      </View>

      <Animated.View style={[styles.cta, textStyle]}>
        <ClayButton
          label="Xem lịch hẹn"
          onPress={() => navigation.navigate('Bookings')}
          variant="primary"
          size="lg"
        />
        <ClayButton
          label="Nhắn tin ngay"
          onPress={() => navigation.navigate('Chat')}
          variant="secondary"
          size="lg"
        />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: colors.background },
  content:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing[6], gap: spacing[6] },

  checkWrap:   {},
  checkCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center', shadowColor: colors.success, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 10 },
  checkMark:   { fontSize: 48, color: colors.background, lineHeight: 56 },

  textSection: { alignItems: 'center', gap: spacing[3] },
  emoji:       { fontSize: 48 },
  title:       { fontSize: fontSizes['2xl'], fontWeight: fontWeights.extrabold, color: colors.dark, textAlign: 'center' },
  sub:         { fontSize: fontSizes.md, color: colors.textMuted, textAlign: 'center', lineHeight: 24 },
  bold:        { fontWeight: fontWeights.bold, color: colors.dark },

  infoBox:     { width: '100%', gap: spacing[3], backgroundColor: colors.surface, borderRadius: 16, padding: spacing[5], borderWidth: 1, borderColor: colors.border },
  infoRow:     { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  infoIcon:    { fontSize: 20 },
  infoText:    { flex: 1, fontSize: fontSizes.sm, color: colors.textMuted, lineHeight: 18 },

  cta: { paddingHorizontal: spacing[6], paddingVertical: spacing[4], gap: spacing[3], borderTopWidth: 1, borderTopColor: colors.border },
});
