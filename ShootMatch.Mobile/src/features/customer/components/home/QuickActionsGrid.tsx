import React, { memo, type ComponentProps } from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../app/theme/colors';
import { fontWeights } from '../../../../app/theme/typography';
import { spacing } from '../../../../app/theme/spacing';
import { ImageSourcePropType } from 'react-native';
import { resolveImageSource } from '../../../../shared/utils/resolveImageSource';

type Tile = {
  key: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  sub: string;
  screen: string;
  image?: ImageSourcePropType;
  dot?: boolean;
};

const ActionTile = memo(function ActionTile({
  tile,
  onPress,
}: {
  tile: Tile;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.tile} onPress={onPress}>
      {tile.image ? (
        <ImageBackground source={resolveImageSource(tile.image)!} style={styles.tileBg} resizeMode="cover">
          <View style={styles.tileDim} />
        </ImageBackground>
      ) : (
        <View style={[styles.tileBg, { backgroundColor: colors.dark }]} />
      )}
      <View style={styles.tileContent}>
        <View style={styles.tileTitleRow}>
          <Ionicons name={tile.icon} size={16} color="#fff" />
          <Text style={styles.tileLabel}>{tile.label}</Text>
          {tile.dot && <View style={styles.redDot} />}
        </View>
        <Text style={styles.tileSub}>{tile.sub}</Text>
      </View>
    </Pressable>
  );
});

export default function QuickActionsGrid({
  coverImages,
  onNavigate,
  unreadChats,
  activeBookings,
}: {
  coverImages: ImageSourcePropType[];
  onNavigate: (screen: string) => void;
  unreadChats?: number;
  activeBookings?: number;
}) {
  const img = (i: number) => coverImages[i];

  const tiles: Tile[] = [
    {
      key: 'chat',
      icon: 'chatbubbles',
      label: 'Tin Nhắn',
      sub: unreadChats ? `${unreadChats} chưa đọc` : 'Hội thoại',
      screen: 'Chat',
      image: img(0),
      dot: (unreadChats ?? 0) > 0,
    },
    {
      key: 'bookings',
      icon: 'calendar',
      label: 'Đặt Lịch',
      sub: activeBookings ? `${activeBookings} đang tiến hành` : 'Lịch hẹn',
      screen: 'Bookings',
      image: img(1),
    },
    {
      key: 'discover',
      icon: 'add-circle',
      label: 'Khám Phá',
      sub: 'Swipe & match',
      screen: 'Discover',
      image: img(2),
    },
    {
      key: 'profile',
      icon: 'camera',
      label: 'Hồ Sơ',
      sub: 'Tài khoản',
      screen: 'Profile',
      image: img(3),
    },
  ];

  return (
    <View style={styles.grid}>
      {tiles.map(tile => (
        <ActionTile key={tile.key} tile={tile} onPress={() => onNavigate(tile.screen)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing[5],
    gap: spacing[3],
  },
  tile: {
    width: '47.5%',
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.dark,
  },
  tileBg: { ...StyleSheet.absoluteFillObject },
  tileDim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  tileContent: { flex: 1, justifyContent: 'flex-end', padding: spacing[3] },
  tileTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  tileLabel: { color: '#fff', fontSize: 12, fontWeight: fontWeights.bold },
  tileSub: { color: 'rgba(255,255,255,0.6)', fontSize: 10 },
  redDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#f87171', marginLeft: 2 },
});
