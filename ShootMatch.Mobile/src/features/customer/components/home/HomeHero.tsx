import React from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../app/theme/colors';
import { fontSizes, fontWeights } from '../../../../app/theme/typography';
import { spacing } from '../../../../app/theme/spacing';
import { ImageSourcePropType, Dimensions } from 'react-native';
import { localPicture } from '../../../../shared/assets/localPictures';
import { resolveImageSource } from '../../../../shared/utils/resolveImageSource';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeHero({
  coverSource,
  onDiscover,
  onSearch,
}: {
  coverSource?: ImageSourcePropType;
  onDiscover: () => void;
  onSearch: () => void;
}) {
  const bg = resolveImageSource(coverSource ?? localPicture(39))!;

  return (
    <View style={styles.wrap}>
      <ImageBackground source={bg} style={styles.banner} resizeMode="cover">
        <LinearGradient
          colors={['rgba(26,26,15,0.9)', 'rgba(26,26,15,0.6)', 'rgba(26,26,15,0.95)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.bannerContent}>
          <Text style={styles.eyebrow}>PIC KIC STUDIO</Text>
          <Text style={styles.headline}>
            PICK ĐÚNG <Text style={styles.orange}>NGƯỜI</Text>{'\n'}
            PICK ĐÚNG <Text style={styles.orange}>KHOẢNH KHẮC</Text>
          </Text>
        </View>
      </ImageBackground>

      <View style={styles.actions}>
        <Pressable style={styles.primaryChip} onPress={onDiscover}>
          <Ionicons name="compass" size={20} color={colors.background} />
          <Text style={styles.primaryChipText}>Khám phá</Text>
        </Pressable>
        <Pressable style={styles.secondaryChip} onPress={onSearch}>
          <Ionicons name="options-outline" size={22} color={colors.dark} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing[5], width: SCREEN_WIDTH },
  banner: {
    width: SCREEN_WIDTH,
    minHeight: 220,
    paddingVertical: spacing[10],
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[8],
    justifyContent: 'center',
  },
  bannerContent: { alignItems: 'center', maxWidth: 360, alignSelf: 'center', width: '100%' },
  eyebrow: {
    color: 'rgba(255,247,225,0.5)',
    fontSize: 10,
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginBottom: spacing[4],
  },
  headline: {
    color: colors.background,
    fontSize: 34,
    fontWeight: fontWeights.extrabold,
    textAlign: 'center',
    lineHeight: 42,
    letterSpacing: 0.3,
  },
  orange: { color: colors.accentOrange },
  actions: {
    flexDirection: 'row',
    gap: spacing[3],
    paddingHorizontal: spacing[5],
    marginTop: spacing[4],
  },
  primaryChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.dark,
    paddingVertical: spacing[4],
    borderRadius: 999,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  primaryChipText: {
    color: colors.background,
    fontSize: 11,
    fontWeight: fontWeights.bold,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  secondaryChip: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
});
