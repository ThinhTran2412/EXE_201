import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../app/theme/colors';
import { fontSizes, fontWeights } from '../../../../app/theme/typography';
import { spacing } from '../../../../app/theme/spacing';

export default function HomeTopBar({
  onSearch,
  onNotifications,
  onProfile,
}: {
  onSearch: () => void;
  onNotifications: () => void;
  onProfile: () => void;
}) {
  return (
    <View style={styles.bar}>
      <Text style={styles.logo}>PicKic</Text>
      <View style={styles.actions}>
        <Pressable style={styles.iconBtn} onPress={onSearch}>
          <Ionicons name="search" size={20} color={colors.dark} />
        </Pressable>
        <Pressable style={styles.iconBtn} onPress={onNotifications}>
          <Ionicons name="notifications-outline" size={20} color={colors.dark} />
          <View style={styles.dot} />
        </Pressable>
        <Pressable style={styles.profileBtn} onPress={onProfile}>
          <Ionicons name="person" size={18} color={colors.background} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26,26,15,0.08)',
    backgroundColor: 'rgba(255,247,225,0.92)',
  },
  logo: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.extrabold,
    color: colors.dark,
    letterSpacing: -0.5,
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  profileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
