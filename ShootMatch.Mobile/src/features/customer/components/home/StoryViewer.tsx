import React from 'react';
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  View,
  StatusBar,
  ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { resolveImageSource } from '../../../../shared/utils/resolveImageSource';

const HEADER_ZONE = 100;

export type StoryViewerState = {
  photographerId: string;
  avatarSource?: ImageSourcePropType;
  slides: ImageSourcePropType[];
  index: number;
};

export default function StoryViewer({
  screenHeight,
  state,
  onClose,
  onProfile,
  onIndexChange,
}: {
  screenHeight: number;
  state: StoryViewerState;
  onClose: () => void;
  onProfile: () => void;
  onIndexChange: (index: number) => void;
}) {
  const insets = useSafeAreaInsets();
  const current = state.slides[state.index];
  const headerTop = insets.top + 8;

  const goPrev = () => {
    if (state.index > 0) onIndexChange(state.index - 1);
  };
  const goNext = () => {
    if (state.index < state.slides.length - 1) onIndexChange(state.index + 1);
  };

  return (
    <Modal visible animationType="fade" transparent={false} onRequestClose={onClose}>
      <StatusBar barStyle="light-content" />
      <View style={styles.viewer}>
        {current ? (
          <Image
            source={resolveImageSource(current)!}
            style={[styles.viewerImage, { height: screenHeight * 0.85 }]}
            resizeMode="contain"
          />
        ) : null}

        <Pressable style={[styles.tapLeft, { top: headerTop + HEADER_ZONE }]} onPress={goPrev} />
        <Pressable style={[styles.tapRight, { top: headerTop + HEADER_ZONE }]} onPress={goNext} />

        <View style={[styles.viewerTop, { paddingTop: headerTop }]} pointerEvents="box-none">
          <Pressable onPress={onProfile} style={styles.viewerAvatarWrap} hitSlop={8}>
            {state.avatarSource ? (
              <Image source={resolveImageSource(state.avatarSource)!} style={styles.viewerAvatar} />
            ) : (
              <View style={[styles.viewerAvatar, styles.avatarPh]}>
                <Ionicons name="person" size={16} color="#fff" />
              </View>
            )}
          </Pressable>
          <View style={styles.progressRow} pointerEvents="none">
            {state.slides.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressSeg,
                  i < state.index && styles.progressDone,
                  i === state.index && styles.progressActive,
                ]}
              />
            ))}
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  viewer: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  viewerImage: { width: '100%' },
  viewerTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    elevation: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
  },
  viewerAvatarWrap: { borderWidth: 2, borderColor: '#fff', borderRadius: 20 },
  viewerAvatar: { width: 36, height: 36, borderRadius: 18 },
  avatarPh: { backgroundColor: '#333', alignItems: 'center', justifyContent: 'center' },
  progressRow: { flex: 1, flexDirection: 'row', gap: 4 },
  progressSeg: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)' },
  progressDone: { backgroundColor: 'rgba(255,255,255,0.85)' },
  progressActive: { backgroundColor: '#fff' },
  closeBtn: {
    padding: 8,
    zIndex: 30,
    elevation: 30,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 20,
  },
  tapLeft: { position: 'absolute', left: 0, bottom: 0, width: '35%', zIndex: 1 },
  tapRight: { position: 'absolute', right: 0, bottom: 0, width: '35%', zIndex: 1 },
});
