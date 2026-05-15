import React, { memo, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  ImageSourcePropType,
} from 'react-native';
import { FeaturedDisplay } from '../../utils/homeMedia';
import { resolveImageSource } from '../../../../shared/utils/resolveImageSource';
import { formatImageUrl } from '../../../../shared/utils/formatImageUrl';
import { colors } from '../../../../app/theme/colors';
import { spacing } from '../../../../app/theme/spacing';
import StoryViewer, { StoryViewerState } from './StoryViewer';

const CARD_W = 140;
const CARD_H = 240;

const FeaturedCard = memo(function FeaturedCard({
  coverSource,
  onPress,
}: {
  coverSource: ImageSourcePropType;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <Image
        source={resolveImageSource(coverSource)!}
        style={styles.image}
        resizeMode="cover"
      />
    </Pressable>
  );
});

export default function FeaturedStrip({
  items,
  onOpenProfile,
}: {
  items: FeaturedDisplay[];
  onOpenProfile: (photographerId: string) => void;
}) {
  const { height: screenH } = useWindowDimensions();
  const [viewer, setViewer] = useState<StoryViewerState | null>(null);

  if (items.length === 0) return null;

  return (
    <>
      <FlatList
        data={items}
        keyExtractor={i => i.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        initialNumToRender={4}
        windowSize={5}
        removeClippedSubviews
        renderItem={({ item }) => (
          <FeaturedCard
            coverSource={item.coverSource}
            onPress={() => setViewer({
              photographerId: item.id,
              avatarSource: item.avatarUrl
                ? resolveImageSource({ uri: formatImageUrl(item.avatarUrl) })!
                : item.coverSource,
              slides: item.slideSources,
              index: 0,
            })}
          />
        )}
      />

      {viewer && (
        <StoryViewer
          screenHeight={screenH}
          state={viewer}
          onClose={() => setViewer(null)}
          onProfile={() => {
            const id = viewer.photographerId;
            setViewer(null);
            if (!id.startsWith('local-')) onOpenProfile(id);
          }}
          onIndexChange={index => setViewer(prev => (prev ? { ...prev, index } : null))}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: spacing[5], gap: spacing[3], paddingBottom: spacing[2] },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.clay,
  },
  image: { width: '100%', height: '100%' },
});
