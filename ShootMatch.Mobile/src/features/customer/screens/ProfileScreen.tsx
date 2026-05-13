import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../auth/AuthContext';
import { ClayCard } from '../../../shared/components/ClayCard';
import { colors } from '../../../app/theme/colors';
import { fontSizes, fontWeights } from '../../../app/theme/typography';
import { radius, spacing } from '../../../app/theme/spacing';

type MenuSection = {
  title: string;
  items: { icon: string; label: string; screen?: string; danger?: boolean; action?: () => void }[];
};

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { session, logout } = useAuth();

  function handleLogout() {
    Alert.alert('Đăng xuất', 'Bạn chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: logout },
    ]);
  }

  const MENU: MenuSection[] = [
    {
      title: 'Hoạt động',
      items: [
        { icon: 'calendar-outline',     label: 'Lịch hẹn của tôi',   screen: 'Bookings' },
        { icon: 'chatbubble-outline',   label: 'Tin nhắn',           screen: 'Chat' },
        { icon: 'star-outline',         label: 'Đánh giá của tôi',   screen: 'Reviews' },
        { icon: 'heart-outline',        label: 'Đã lưu',             screen: 'Favorites' },
      ],
    },
    {
      title: 'Tài khoản',
      items: [
        { icon: 'create-outline',       label: 'Chỉnh sửa hồ sơ',   screen: 'EditProfile' },
        { icon: 'notifications-outline', label: 'Thông báo',         screen: 'Notifications' },
        { icon: 'settings-outline',     label: 'Cài đặt',            screen: 'Settings' },
      ],
    },
    {
      title: '',
      items: [
        { icon: 'log-out-outline', label: 'Đăng xuất', danger: true, action: handleLogout },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Avatar Header */}
        <Animated.View entering={FadeInUp.duration(600)} style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>
              {session?.userId?.[0]?.toUpperCase() ?? 'U'}
            </Text>
          </View>
          <Text style={styles.name}>Khách hàng</Text>
          <View style={styles.rolePill}>
            <View style={styles.roleDot} />
            <Text style={styles.roleText}>Tài khoản khách hàng</Text>
          </View>
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInDown.duration(500).delay(150)} style={styles.stats}>
          {[
            { label: 'Lịch hẹn', value: '0' },
            { label: 'Matches',  value: '0' },
            { label: 'Đánh giá', value: '0' },
          ].map((s) => (
            <View key={s.label} style={styles.stat}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Menu Sections */}
        {MENU.map((sec, si) => (
          <Animated.View key={si} entering={FadeInDown.duration(500).delay(200 + si * 80)} style={styles.section}>
            {sec.title ? <Text style={styles.sectionTitle}>{sec.title}</Text> : null}
            <ClayCard style={styles.menuCard}>
              {sec.items.map((item, ii) => (
                <React.Fragment key={item.label}>
                  <Pressable
                    style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
                    onPress={item.action ?? (() => item.screen && navigation.navigate(item.screen))}
                  >
                    <View style={[styles.menuIcon, item.danger && styles.menuIconDanger]}>
                      <Ionicons name={item.icon as any} size={20} color={item.danger ? colors.accent : colors.dark} />
                    </View>
                    <Text style={[styles.menuLabel, item.danger && styles.menuLabelDanger]}>
                      {item.label}
                    </Text>
                    {!item.danger && <Ionicons name="chevron-forward" size={16} color={colors.textLight} />}
                  </Pressable>
                  {ii < sec.items.length - 1 && <View style={styles.sep} />}
                </React.Fragment>
              ))}
            </ClayCard>
          </Animated.View>
        ))}

        <Text style={styles.footer}>ShootMatch v1.0 Beta</Text>
        <View style={{ height: spacing[10] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  hero:         { alignItems: 'center', paddingVertical: spacing[8], gap: spacing[3] },
  avatar:       { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center', shadowColor: colors.clay, shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1, shadowRadius: 12, elevation: 8 },
  avatarLetter: { fontSize: fontSizes['3xl'], fontWeight: fontWeights.bold, color: colors.background },
  name:         { fontSize: fontSizes.xl, fontWeight: fontWeights.bold, color: colors.dark },
  rolePill:     { flexDirection: 'row', alignItems: 'center', gap: spacing[2], paddingHorizontal: spacing[4], paddingVertical: spacing[1.5], borderRadius: radius.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  roleDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.info },
  roleText:     { fontSize: fontSizes.xs, color: colors.textMuted, fontWeight: fontWeights.medium },

  stats:     { flexDirection: 'row', marginHorizontal: spacing[6], marginBottom: spacing[6], padding: spacing[4], borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  stat:      { flex: 1, alignItems: 'center', gap: spacing[1] },
  statValue: { fontSize: fontSizes.xl, fontWeight: fontWeights.bold, color: colors.dark },
  statLabel: { fontSize: fontSizes.xs, color: colors.textMuted },

  section:      { paddingHorizontal: spacing[6], marginBottom: spacing[4] },
  sectionTitle: { fontSize: fontSizes.xs, fontWeight: fontWeights.semibold, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing[3] },

  menuCard:        { overflow: 'hidden' },
  menuRow:         { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing[4], paddingHorizontal: spacing[4], gap: spacing[3] },
  menuRowPressed:  { backgroundColor: 'rgba(26,26,15,0.04)' },
  menuIcon:        { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  menuIconDanger:  { backgroundColor: colors.accent + '15' },
  menuLabel:       { flex: 1, fontSize: fontSizes.md, fontWeight: fontWeights.medium, color: colors.dark },
  menuLabelDanger: { color: colors.accent },
  sep:             { height: 1, marginHorizontal: spacing[4], backgroundColor: colors.border },

  footer: { textAlign: 'center', fontSize: fontSizes.xs, color: colors.textLight, marginTop: spacing[4] },
});
