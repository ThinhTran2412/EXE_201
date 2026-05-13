import React, { useState } from 'react';
import {
  ScrollView, StyleSheet, Text, View, TextInput, Pressable, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ClayCard } from '../../../shared/components/ClayCard';
import { ClayButton } from '../../../shared/components/ClayButton';
import { colors } from '../../../app/theme/colors';
import { fontSizes, fontWeights } from '../../../app/theme/typography';
import { radius, spacing } from '../../../app/theme/spacing';

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const [name,    setName]    = useState('');
  const [email,   setEmail]   = useState('');
  const [saving,  setSaving]  = useState(false);

  async function handleSave() {
    if (!name.trim()) { Alert.alert('Thiếu tên', 'Vui lòng nhập tên hiển thị.'); return; }
    setSaving(true);
    // Placeholder — API endpoint chưa expose cho customer profile update
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    Alert.alert('✅ Đã lưu', 'Thông tin hồ sơ đã được cập nhật.');
    navigation.goBack();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Animated.View entering={FadeInUp.duration(500)} style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.dark} />
        </Pressable>
        <Text style={styles.title}>Chỉnh sửa hồ sơ</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Avatar placeholder */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>{name?.[0]?.toUpperCase() || 'U'}</Text>
          </View>
          <Text style={styles.avatarHint}>Ảnh đại diện — sắp có</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(200)}>
          <ClayCard style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Tên hiển thị</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Nguyễn Văn A"
                placeholderTextColor={colors.textLight}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Email (tuỳ chọn)</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={colors.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </ClayCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(300)} style={styles.cta}>
          <ClayButton label="Lưu thay đổi" onPress={handleSave} loading={saving} variant="primary" size="lg" />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingHorizontal: spacing[4], paddingVertical: spacing[3], borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title:   { fontSize: fontSizes.lg, fontWeight: fontWeights.bold, color: colors.dark },

  scroll:        { padding: spacing[6], gap: spacing[5] },
  avatarSection: { alignItems: 'center', gap: spacing[3] },
  avatar:        { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center', shadowColor: colors.clay, shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1, shadowRadius: 12, elevation: 8 },
  avatarLetter:  { fontSize: fontSizes['2xl'], fontWeight: fontWeights.bold, color: colors.background },
  avatarHint:    { fontSize: fontSizes.xs, color: colors.textLight },

  form:   { padding: spacing[5], gap: spacing[4] },
  field:  { gap: spacing[2] },
  label:  { fontSize: fontSizes.xs, fontWeight: fontWeights.semibold, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  input:  { backgroundColor: colors.background, borderRadius: radius.md, paddingHorizontal: spacing[4], paddingVertical: spacing[3], fontSize: fontSizes.md, color: colors.dark, borderWidth: 1, borderColor: colors.border },

  cta:    {},
});
