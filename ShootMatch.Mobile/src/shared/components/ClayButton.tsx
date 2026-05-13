import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors } from '../../app/theme/colors';
import { radius, spacing } from '../../app/theme/spacing';
import { fontSizes, fontWeights } from '../../app/theme/typography';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ClayButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function ClayButton({
  label, onPress, variant = 'primary', size = 'md',
  loading, disabled, style, textStyle, fullWidth = true,
}: ClayButtonProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn  = () => { scale.value = withSpring(0.96, { damping: 15 }); };
  const handlePressOut = () => { scale.value = withSpring(1.00, { damping: 12 }); };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        styles.base,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        animStyle,
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator color={variant === 'primary' ? colors.textInverse : colors.text} />
        : <Text style={[styles.label, styles[`label_${variant}`], styles[`label_${size}`], textStyle]}>
            {label}
          </Text>
      }
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },

  // Variants
  primary: {
    backgroundColor: colors.dark,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.clay,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
  },
  danger: {
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 10,
    elevation: 5,
  },

  // Sizes
  sm: { paddingVertical: spacing[2], paddingHorizontal: spacing[4] },
  md: { paddingVertical: spacing[4], paddingHorizontal: spacing[6] },
  lg: { paddingVertical: spacing[5], paddingHorizontal: spacing[8] },

  // Labels
  label: {
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontWeight: fontWeights.semibold,
  },
  label_primary:   { color: colors.textInverse },
  label_secondary: { color: colors.text },
  label_ghost:     { color: colors.text },
  label_danger:    { color: colors.textInverse },
  label_sm:        { fontSize: fontSizes.xs },
  label_md:        { fontSize: fontSizes.sm },
  label_lg:        { fontSize: fontSizes.base },
});
