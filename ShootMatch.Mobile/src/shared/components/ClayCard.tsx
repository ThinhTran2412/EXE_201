import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { colors } from '../../app/theme/colors';
import { radius, shadows } from '../../app/theme/spacing';

interface ClayCardProps extends ViewProps {
  variant?: 'default' | 'inset' | 'flat';
  children: React.ReactNode;
}

export function ClayCard({ variant = 'default', style, children, ...rest }: ClayCardProps) {
  return (
    <View
      style={[
        styles.base,
        variant === 'inset' && styles.inset,
        variant === 'flat'  && styles.flat,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    // Clay neumorphic: dual shadow (iOS) / elevation (Android)
    shadowColor: colors.clay,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
    // Subtle border for Android definition
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  inset: {
    shadowColor: colors.clay,
    shadowOffset: { width: -4, height: -4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 0,
  },
  flat: {
    shadowOpacity: 0,
    elevation: 0,
    borderColor: colors.border,
    borderWidth: 1,
  },
});
