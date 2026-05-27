import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { formatImageUrl } from '../../../shared/utils/formatImageUrl';
import { colors } from '../../../app/theme/colors';

interface Props {
  uri?: string;
  name: string;
  size?: number;
}

export default function ChatMessageAvatar({ uri, name, size = 32 }: Props) {
  const src = uri?.trim() ? formatImageUrl(uri) : '';
  const initial = (name.trim()[0] ?? '?').toUpperCase();

  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2 }]}>
      {src ? (
        <Image source={{ uri: src }} style={{ width: size, height: size, borderRadius: size / 2 }} />
      ) : (
        <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={{ fontSize: size * 0.38, fontWeight: '700', color: colors.dark }}>{initial}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderWidth: 1, borderColor: 'rgba(207,64,40,0.25)', overflow: 'hidden', backgroundColor: colors.clayLight },
  fallback: { backgroundColor: colors.clay, alignItems: 'center', justifyContent: 'center' },
});
