import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withDelay, withTiming, withSequence, withRepeat, FadeInDown
} from 'react-native-reanimated';
import { LOCAL_PICTURES } from '../../../shared/assets/localPictures';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../app/navigation/types';
import { colors } from '../../../app/theme/colors';
import { fontSizes, fontWeights } from '../../../app/theme/typography';
import { spacing } from '../../../app/theme/spacing';

type Props = NativeStackScreenProps<AuthStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  const logoScale   = useSharedValue(0.3);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const dotScale    = useSharedValue(1);

  useEffect(() => {
    // Logo entrance
    logoOpacity.value = withTiming(1, { duration: 600 });
    logoScale.value   = withSpring(1, { damping: 12, stiffness: 100 });

    // Text fade-in
    textOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));

    // Dot pulse
    dotScale.value = withDelay(700, withRepeat(
      withSequence(
        withTiming(1.2, { duration: 600 }),
        withTiming(1.0, { duration: 600 }),
      ), -1
    ));

    // Navigate after 2.2s
    const t = setTimeout(() => navigation.replace('Login', { role: 'customer' }), 2200);
    return () => clearTimeout(t);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const textStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value }));
  const dotStyle  = useAnimatedStyle(() => ({ transform: [{ scale: dotScale.value }] }));

  return (
    <View style={styles.container}>
      {/* Film grain overlay via pattern */}
      <View style={styles.grain} pointerEvents="none" />

      {/* Background Collage of photography */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Animated.Image 
          entering={FadeInDown.delay(100).duration(800)}
          source={LOCAL_PICTURES[0]} 
          style={[styles.collagePhoto, styles.photoTL]} 
        />
        <Animated.Image 
          entering={FadeInDown.delay(200).duration(800)}
          source={LOCAL_PICTURES[1]} 
          style={[styles.collagePhoto, styles.photoTR]} 
        />
        <Animated.Image 
          entering={FadeInDown.delay(300).duration(800)}
          source={LOCAL_PICTURES[2]} 
          style={[styles.collagePhoto, styles.photoBL]} 
        />
        <Animated.Image 
          entering={FadeInDown.delay(400).duration(800)}
          source={LOCAL_PICTURES[3]} 
          style={[styles.collagePhoto, styles.photoBR]} 
        />
        <Animated.Image 
          entering={FadeInDown.delay(500).duration(800)}
          source={LOCAL_PICTURES[4]} 
          style={[styles.collagePhoto, styles.photoML]} 
        />
        <Animated.Image 
          entering={FadeInDown.delay(600).duration(800)}
          source={LOCAL_PICTURES[5]} 
          style={[styles.collagePhoto, styles.photoMR]} 
        />
        <Animated.Image 
          entering={FadeInDown.delay(700).duration(800)}
          source={LOCAL_PICTURES[6]} 
          style={[styles.collagePhoto, styles.photoC1]} 
        />
        <Animated.Image 
          entering={FadeInDown.delay(800).duration(800)}
          source={LOCAL_PICTURES[7]} 
          style={[styles.collagePhoto, styles.photoC2]} 
        />
      </View>

      <Animated.View style={[styles.logoWrap, logoStyle]}>
        {/* Logo mark (no circular container) */}
        <Image 
          source={require('../../../../assets/images/cream_original_square.png')} 
          style={styles.splashLogoImage}
          resizeMode="contain"
        />
        <Animated.View style={[styles.dot, dotStyle]} />
      </Animated.View>

      <Animated.View style={[styles.textWrap, textStyle]}>
        <Text style={styles.brand}>ShootMatch</Text>
        <Text style={styles.tagline}>Kết nối. Sáng tạo. Ghi lại.</Text>
      </Animated.View>

      <Text style={styles.version}>v1.0 Beta</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16160e', // Dark premium background
    alignItems: 'center',
    justifyContent: 'center',
  },
  grain: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.03,
    backgroundColor: '#8b7355',
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.clay,
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 12,
  },
  splashLogoImage: {
    width: 100,
    height: 100,
  },
  collagePhoto: {
    position: 'absolute',
    width: 140,
    height: 190,
    borderRadius: 8,
    borderWidth: 4,
    borderColor: '#2a2a1e',
    opacity: 0.18,
  },
  photoTL: {
    top: 20,
    left: -15,
    transform: [{ rotate: '-12deg' }],
  },
  photoTR: {
    top: 40,
    right: -20,
    transform: [{ rotate: '15deg' }],
  },
  photoBL: {
    bottom: 50,
    left: -10,
    transform: [{ rotate: '8deg' }],
  },
  photoBR: {
    bottom: 80,
    right: -15,
    transform: [{ rotate: '-10deg' }],
  },
  photoML: {
    top: '35%',
    left: -25,
    transform: [{ rotate: '-5deg' }],
  },
  photoMR: {
    top: '40%',
    right: -20,
    transform: [{ rotate: '12deg' }],
  },
  photoC1: {
    top: '15%',
    left: '25%',
    transform: [{ rotate: '-3deg' }],
    opacity: 0.12,
  },
  photoC2: {
    bottom: '20%',
    right: '22%',
    transform: [{ rotate: '6deg' }],
    opacity: 0.12,
  },
  logoLetter: {
    fontSize: 52,
    fontWeight: fontWeights.bold,
    color: colors.background,
    lineHeight: 60,
  },
  dot: {
    marginTop: spacing[3],
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  textWrap: {
    alignItems: 'center',
    gap: spacing[2],
  },
  brand: {
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.extrabold,
    color: '#faf5ee',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: fontSizes.sm,
    color: '#b5a895',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  version: {
    position: 'absolute',
    bottom: 40,
    fontSize: fontSizes.xs,
    color: '#555544',
    letterSpacing: 1,
  },
});
