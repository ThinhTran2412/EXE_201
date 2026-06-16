import React, { useState } from 'react';
import { ActivityIndicator, Image, ImageStyle, Pressable, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatImageUrl } from '../utils/formatImageUrl';

type Props = {
  uri: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  borderRadius?: number;
  /** Mặc định cover; dùng contain cho xem fullscreen */
  resizeMode?: 'cover' | 'contain';
  /** Blur cho background layer */
  blurRadius?: number;
};

/** Ảnh portfolio: chuẩn hóa URL, loading, lỗi tải → placeholder (tránh ô xám trống). */
export default function PortfolioImageCell({
  uri,
  onPress,
  style,
  imageStyle,
  borderRadius = 12,
  resizeMode = 'cover',
  blurRadius,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const finalUri = formatImageUrl(uri);

  if (!finalUri) {
    const inner = (
      <View style={[styles.wrap, { borderRadius }, style, styles.center, styles.fallback]}>
        <Ionicons name="image-outline" size={28} color="rgba(255,247,225,0.25)" />
      </View>
    );
    return onPress ? <Pressable onPress={onPress}>{inner}</Pressable> : inner;
  }

  const wrap = (
    <View style={[styles.wrap, { borderRadius }, style]}>
      {loading && !error ? (
        <View style={styles.center}>
          <ActivityIndicator size="small" color="rgba(255,247,225,0.35)" />
        </View>
      ) : null}
      {error ? (
        <View style={[styles.center, styles.fallback, { borderRadius }]}>
          <Ionicons name="image-outline" size={28} color="rgba(255,247,225,0.25)" />
        </View>
      ) : (
        <Image
          source={{ uri: finalUri }}
          style={[StyleSheet.absoluteFillObject, { borderRadius }, imageStyle]}
          resizeMode={resizeMode}
          resizeMethod="resize"
          blurRadius={blurRadius}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setError(true);
            setLoading(false);
          }}
        />
      )}
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.92 }]}>{wrap}</Pressable>;
  }
  return wrap;
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', backgroundColor: 'rgba(26,26,15,0.08)' },
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  fallback: { backgroundColor: 'rgba(26,26,15,0.12)' },
});
