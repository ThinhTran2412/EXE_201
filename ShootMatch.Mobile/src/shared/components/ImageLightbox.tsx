import React from 'react';
import { Modal, Pressable, StyleSheet, View, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatImageUrl } from '../utils/formatImageUrl';
import { colors } from '../../app/theme/colors';

interface Props {
  visible: boolean;
  uri: string;
  onClose: () => void;
}

export default function ImageLightbox({ visible, uri, onClose }: Props) {
  const src = formatImageUrl(uri);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={28} color={colors.background} />
        </Pressable>
        <Image
          source={{ uri: src }}
          style={styles.image}
          resizeMode="contain"
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 48,
    right: 20,
    zIndex: 2,
    padding: 8,
  },
  image: {
    width: '100%',
    height: '80%',
  },
});
