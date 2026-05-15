import React from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ImageSourcePropType } from 'react-native';
import { localPicture } from '../../../../shared/assets/localPictures';
import { resolveImageSource } from '../../../../shared/utils/resolveImageSource';
import { colors } from '../../../../app/theme/colors';
import { fontWeights } from '../../../../app/theme/typography';
import { spacing } from '../../../../app/theme/spacing';

export default function DiscoveryBanner({
  imageSource,
  onPress,
}: {
  imageSource?: ImageSourcePropType;
  onPress: () => void;
}) {
  const bg = resolveImageSource(imageSource ?? localPicture(39))!;

  return (
    <Pressable style={styles.wrap} onPress={onPress}>
      <ImageBackground source={bg} style={styles.bg} resizeMode="cover">
        <LinearGradient
          colors={['rgba(255,66,0,0.85)', 'rgba(26,26,15,0.55)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.content}>
          <Text style={styles.eyebrow}>Bắt đầu ngay hôm nay</Text>
          <Text style={styles.title}>SWIPE{'\n'}& MATCH</Text>
          <View style={styles.pill}>
            <Text style={styles.pillText}>Khám Phá</Text>
            <Ionicons name="arrow-forward" size={14} color="#fff" />
          </View>
        </View>
      </ImageBackground>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing[5],
    marginBottom: spacing[6],
    borderRadius: 16,
    overflow: 'hidden',
    height: 260,
  },
  bg: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing[6] },
  eyebrow: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: spacing[2],
  },
  title: {
    color: '#fff',
    fontSize: 40,
    fontWeight: fontWeights.extrabold,
    lineHeight: 42,
    marginBottom: spacing[4],
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: 999,
  },
  pillText: { color: '#fff', fontSize: 12, fontWeight: fontWeights.bold },
});
