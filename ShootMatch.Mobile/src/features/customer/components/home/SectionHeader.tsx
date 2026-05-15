import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../../app/theme/colors';
import { fontSizes, fontWeights } from '../../../../app/theme/typography';
import { spacing } from '../../../../app/theme/spacing';

export default function SectionHeader({
  title,
  actionLabel,
  onAction,
  actionOrange,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  actionOrange?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={[styles.action, actionOrange && styles.actionOrange]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    marginBottom: spacing[3],
  },
  title: {
    fontSize: 22,
    fontWeight: fontWeights.bold,
    color: colors.dark,
    letterSpacing: 0.4,
  },
  action: {
    fontSize: 10,
    fontWeight: fontWeights.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: 'rgba(26,26,15,0.4)',
  },
  actionOrange: { color: colors.accentOrange },
});
