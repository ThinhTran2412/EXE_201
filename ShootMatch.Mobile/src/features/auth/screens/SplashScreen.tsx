import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withDelay, withTiming, withSequence, withRepeat,
} from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../app/navigation/types';
import { colors } from '../../../app/theme/colors';
import { fontSizes, fontWeights } from '../../../app/theme/typography';
import { spacing } from '../../../app/theme/spacing';

type Props = NativeStackScreenProps<AuthStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  const logoScale   = useSharedValue(0.3);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const dotScale    = useSharedValue(1);

  useEffect(() => {
    // Logo entrance
    logoOpacity.value = withTiming(1, { duration: 600 });
    logoScale.value   = withSpring(1, { damping: 12, stiffness: 100 });

    // Text fade-in
    textOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));

    // Dot pulse
    dotScale.value = withDelay(700, withRepeat(
      withSequence(
        withTiming(1.2, { duration: 600 }),
        withTiming(1.0, { duration: 600 }),
      ), -1
    ));

    // Navigate after 2.2s
    const t = setTimeout(() => navigation.replace('RoleSelect'), 2200);
    return () => clearTimeout(t);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const textStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value }));
  const dotStyle  = useAnimatedStyle(() => ({ transform: [{ scale: dotScale.value }] }));

  return (
    <View style={styles.container}>
      {/* Film grain overlay via pattern */}
      <View style={styles.grain} pointerEvents="none" />

      <Animated.View style={[styles.logoWrap, logoStyle]}>
        {/* Clay logo mark */}
        <View style={styles.logoCircle}>
          <Text style={styles.logoLetter}>S</Text>
        </View>
        <Animated.View style={[styles.dot, dotStyle]} />
      </Animated.View>

      <Animated.View style={[styles.textWrap, textStyle]}>
        <Text style={styles.brand}>ShootMatch</Text>
        <Text style={styles.tagline}>Kết nối. Sáng tạo. Ghi lại.</Text>
      </Animated.View>

      <Text style={styles.version}>v1.0 Beta</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grain: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.03,
    backgroundColor: '#8b7355',
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.clay,
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 12,
  },
  logoLetter: {
    fontSize: 52,
    fontWeight: fontWeights.bold,
    color: colors.background,
    lineHeight: 60,
  },
  dot: {
    marginTop: spacing[3],
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  textWrap: {
    alignItems: 'center',
    gap: spacing[2],
  },
  brand: {
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.extrabold,
    color: colors.dark,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  version: {
    position: 'absolute',
    bottom: 40,
    fontSize: fontSizes.xs,
    color: colors.textLight,
    letterSpacing: 1,
  },
});
