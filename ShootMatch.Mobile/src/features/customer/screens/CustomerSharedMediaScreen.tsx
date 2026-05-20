import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../../app/theme/colors';
import { fontSizes, fontWeights } from '../../../app/theme/typography';
import { radius, spacing } from '../../../app/theme/spacing';

export default function CustomerSharedMediaScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.back} onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={colors.dark} />
        </Pressable>
        <Text style={styles.title}>Ảnh của bạn</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.body}>
        <View style={styles.iconCircle}>
          <Ionicons name="images" size={36} color={colors.accentOrange} />
        </View>
        <Text style={styles.headline}>Chưa có ảnh được đăng</Text>
        <Text style={styles.desc}>
          Khi photographer đăng ảnh có bạn và bạn xác nhận đồng ý, ảnh sẽ xuất hiện tại đây — chỉ những tấm đã được bạn chấp thuận.
        </Text>
        <View style={styles.note}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.success} />
          <Text style={styles.noteText}>Quyền riêng tư: không hiển thị ảnh chưa được bạn đồng ý.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: fontSizes.lg, fontWeight: fontWeights.bold, color: colors.dark },
  body: { flex: 1, paddingHorizontal: spacing[7], paddingTop: spacing[16], alignItems: 'center' },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,66,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[6],
  },
  headline: { fontSize: fontSizes.xl, fontWeight: fontWeights.bold, color: colors.dark, textAlign: 'center', marginBottom: spacing[3] },
  desc: { fontSize: fontSizes.sm, color: colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: spacing[8] },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radius.lg,
    backgroundColor: 'rgba(45,106,79,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(45,106,79,0.2)',
  },
  noteText: { flex: 1, fontSize: fontSizes.xs, color: colors.textMuted, lineHeight: 18 },
});
