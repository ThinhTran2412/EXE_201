import React, { memo, useEffect, useMemo, useState } from 'react';
import {
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  View,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { MomentDisplay } from '../utils/homeMedia';
import { resolveImageSource } from '../../../shared/utils/resolveImageSource';
import { formatImageUrl } from '../../../shared/utils/formatImageUrl';
import { buildTwoColumnMasonry } from '../utils/masonryLayout';
import { colors } from '../../../app/theme/colors';
import { spacing } from '../../../app/theme/spacing';

const { width: SCREEN_W } = Dimensions.get('window');
/** Cùng công thức UploadPortfolioScreen: padding 16×2, gap 16 */
const PAD = spacing[4];
const GAP = spacing[4];
const COL_W = (SCREEN_W - PAD * 2 - GAP) / 2;

const ratioCache = new Map<string, number>();

function resolveUriAspectRatio(uri: string): Promise<number> {
  return new Promise(resolve => {
    Image.getSize(
      uri,
      (w, h) => resolve(w > 0 && h > 0 ? w / h : 0.75),
      () => resolve(0.75),
    );
  });
}

async function resolveMomentAspectRatio(item: MomentDisplay): Promise<number> {
  const cached = ratioCache.get(item.photoId);
  if (cached) return cached;

  const src = item.imageSource;

  if (typeof src === 'number') {
    const asset = Image.resolveAssetSource(src);
    const ratio =
      asset?.width && asset?.height && asset.height > 0
        ? asset.width / asset.height
        : 0.75;
    ratioCache.set(item.photoId, ratio);
    return ratio;
  }

  if (typeof src === 'object' && src && 'uri' in src && src.uri) {
    const ratio = await resolveUriAspectRatio(src.uri);
    ratioCache.set(item.photoId, ratio);
    return ratio;
  }

  if (item.imageUrl) {
    const ratio = await resolveUriAspectRatio(formatImageUrl(item.imageUrl));
    ratioCache.set(item.photoId, ratio);
    return ratio;
  }

  ratioCache.set(item.photoId, 0.75);
  return 0.75;
}

const MasonryTile = memo(function MasonryTile({
  source,
  width,
  height,
  onPress,
}: {
  source: ImageSourcePropType;
  width: number;
  height: number;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.tile, { width, height }]}>
      <Image
        source={resolveImageSource(source)!}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
        resizeMethod="resize"
      />
    </Pressable>
  );
});

export default function PortfolioMasonry({
  items,
  onPressItem,
  maxItems,
}: {
  items: MomentDisplay[];
  onPressItem: (item: MomentDisplay) => void;
  maxItems?: number;
}) {
  const visible = useMemo(
    () => (maxItems ? items.slice(0, maxItems) : items),
    [items, maxItems],
  );
  const [ratios, setRatios] = useState<Record<string, number>>({});
  const [measuring, setMeasuring] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (visible.length === 0) {
        setMeasuring(false);
        return;
      }
      setMeasuring(true);
      const entries = await Promise.all(
        visible.map(async item => [item.photoId, await resolveMomentAspectRatio(item)] as const),
      );
      if (!cancelled) {
        setRatios(Object.fromEntries(entries));
        setMeasuring(false);
      }
    })();
    return () => { cancelled = true; };
  }, [visible]);

  const layout = useMemo(() => {
    const inputs = visible.map(item => ({
      key: item.photoId,
      aspectRatio: ratios[item.photoId] ?? 0.75,
    }));
    return buildTwoColumnMasonry(inputs, COL_W, GAP);
  }, [visible, ratios]);

  const itemById = useMemo(() => {
    const map = new Map<string, MomentDisplay>();
    visible.forEach(i => map.set(i.photoId, i));
    return map;
  }, [visible]);

  if (visible.length === 0) return null;

  if (measuring) {
    return (
      <View style={styles.measuring}>
        <ActivityIndicator color={colors.accentOrange} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { height: layout.containerHeight }]}>
      {layout.positions.map(pos => {
        const item = itemById.get(pos.key);
        if (!item) return null;
        return (
          <View
            key={pos.key}
            style={{
              position: 'absolute',
              top: pos.top,
              left: pos.left,
              width: pos.width,
              height: pos.height,
            }}
          >
            <MasonryTile
              source={item.imageSource}
              width={pos.width}
              height={pos.height}
              onPress={() => onPressItem(item)}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: PAD,
    position: 'relative',
    width: SCREEN_W - PAD * 2,
  },
  measuring: { paddingVertical: spacing[10], alignItems: 'center' },
  tile: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(26,26,15,0.05)',
  },
  tileImage: { width: '100%', height: '100%' },
});
