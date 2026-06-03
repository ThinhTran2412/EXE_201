import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Message } from '../api';
import { getMessageDisplayContent, getMessageImageUri, isImageMessage } from '../utils/messageDisplay';
import { colors } from '../../../app/theme/colors';
import { fontSizes } from '../../../app/theme/typography';
import { radius, spacing } from '../../../app/theme/spacing';

interface Props {
  msg: Message;
  isMe: boolean;
  onImagePress?: (uri: string) => void;
}

export default function ChatBubbleContent({ msg, isMe, onImagePress }: Props) {
  if (isImageMessage(msg)) {
    const uri = getMessageImageUri(msg);
    return (
      <Pressable onPress={() => onImagePress?.(getMessageDisplayContent(msg))}>
        <Image source={{ uri }} style={styles.chatImage} resizeMode="cover" />
      </Pressable>
    );
  }

  return (
    <Text style={[styles.text, isMe ? styles.textMe : styles.textThem]}>
      {msg.content}
    </Text>
  );
}

const styles = StyleSheet.create({
  chatImage: {
    width: 200,
    height: 200,
    borderRadius: radius.md,
    backgroundColor: colors.clayLight,
  },
  text: { fontSize: fontSizes.md, lineHeight: 21 },
  textMe: { color: colors.background },
  textThem: { color: colors.dark },
});
