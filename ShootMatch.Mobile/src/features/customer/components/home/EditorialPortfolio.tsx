import React, { memo } from 'react';
import { Image, Pressable, StyleSheet, View, ImageSourcePropType } from 'react-native';
import { MomentDisplay } from '../../utils/homeMedia';
import { resolveImageSource } from '../../../../shared/utils/resolveImageSource';
import { colors } from '../../../../app/theme/colors';
import { spacing } from '../../../../app/theme/spacing';

const PhotoCard = memo(function PhotoCard({
  source,
  height,
  onPress,
}: {
  source: ImageSourcePropType;
  height: number;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.card, { height }]} onPress={onPress}>
      <Image source={resolveImageSource(source)!} style={styles.img} resizeMode="cover" />
    </Pressable>
  );
});

export default function EditorialPortfolio({
  items,
  onPressItem,
}: {
  items: MomentDisplay[];
  onPressItem: (item: MomentDisplay) => void;
}) {
  if (items.length === 0) return null;

  const pick = (i: number) => items[i % items.length];

  return (
    <View style={styles.wrap}>
      <View style={styles.row1}>
        <View style={styles.colTall}>
          <PhotoCard source={pick(0).imageSource} height={280} onPress={() => onPressItem(pick(0))} />
        </View>
        <View style={styles.colStack}>
          <PhotoCard source={pick(1).imageSource} height={135} onPress={() => onPressItem(pick(1))} />
          <PhotoCard source={pick(2).imageSource} height={135} onPress={() => onPressItem(pick(2))} />
        </View>
      </View>
      <View style={styles.row2}>
        <View style={styles.colNarrow}>
          <PhotoCard source={pick(3).imageSource} height={160} onPress={() => onPressItem(pick(3))} />
        </View>
        <View style={styles.colWide}>
          <PhotoCard source={pick(4).imageSource} height={160} onPress={() => onPressItem(pick(4))} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing[5], gap: spacing[2] },
  row1: { flexDirection: 'row', gap: spacing[2] },
  colTall: { flex: 1.4 },
  colStack: { flex: 1, gap: spacing[2] },
  row2: { flexDirection: 'row', gap: spacing[2] },
  colNarrow: { flex: 1 },
  colWide: { flex: 1.4 },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.clay,
  },
  img: { width: '100%', height: '100%' },
});
