import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Message } from '../api';
import ChatBubbleContent from './ChatBubbleContent';
import ChatMessageAvatar from './ChatMessageAvatar';
import { formatClusterTime, MessageCluster } from '../utils/messageClusters';
import { colors } from '../../../app/theme/colors';
import { fontSizes } from '../../../app/theme/typography';
import { radius, spacing } from '../../../app/theme/spacing';

function ClusterBubble({
  msg,
  isMe,
  position,
  onImagePress,
}: {
  msg: Message;
  isMe: boolean;
  position: 'single' | 'first' | 'middle' | 'last';
  onImagePress: (uri: string) => void;
}) {
  const base = [bubbleStyles.bubble, isMe ? bubbleStyles.bubbleMe : bubbleStyles.bubbleThem];
  const shape = position === 'single'
    ? (isMe ? bubbleStyles.singleMe : bubbleStyles.singleThem)
    : position === 'first'
      ? (isMe ? bubbleStyles.firstMe : bubbleStyles.firstThem)
      : position === 'last'
        ? (isMe ? bubbleStyles.lastMe : bubbleStyles.lastThem)
        : bubbleStyles.middle;

  return (
    <View style={[...base, shape]}>
      <ChatBubbleContent msg={msg} isMe={isMe} onImagePress={onImagePress} />
    </View>
  );
}

interface Props {
  cluster: MessageCluster;
  expanded: boolean;
  onPress: () => void;
  myAvatar?: string;
  theirAvatar?: string;
  theirName: string;
  myName: string;
  onImagePress: (uri: string) => void;
}

export default function ChatMessageClusterView({
  cluster,
  expanded,
  onPress,
  myAvatar,
  theirAvatar,
  theirName,
  myName,
  onImagePress,
}: Props) {
  const count = cluster.messages.length;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.wrap, cluster.isMe ? styles.wrapMe : styles.wrapThem]}
    >
      {!cluster.isMe && (
        <View style={styles.avatarSlot}>
          <ChatMessageAvatar uri={theirAvatar} name={theirName} />
        </View>
      )}

      <View style={[styles.bubbles, cluster.isMe && styles.bubblesMe]}>
        {cluster.messages.map((item, index) => {
          const position: 'single' | 'first' | 'middle' | 'last' =
            count === 1 ? 'single'
              : index === 0 ? 'first'
                : index === count - 1 ? 'last'
                  : 'middle';
          return (
            <ClusterBubble
              key={item.msg.id}
              msg={item.msg}
              isMe={cluster.isMe}
              position={position}
              onImagePress={onImagePress}
            />
          );
        })}
        {expanded && (
          <Text style={[styles.time, cluster.isMe && styles.timeMe]}>
            {formatClusterTime(cluster.startedAt, cluster.endedAt)}
          </Text>
        )}
      </View>

      {cluster.isMe && (
        <View style={styles.avatarSlot}>
          <ChatMessageAvatar uri={myAvatar} name={myName} />
        </View>
      )}
    </Pressable>
  );
}

const bubbleStyles = StyleSheet.create({
  bubble: { paddingVertical: spacing[2.5], paddingHorizontal: spacing[4], maxWidth: '100%' },
  bubbleMe: { backgroundColor: colors.dark },
  bubbleThem: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  singleMe: { borderRadius: radius.lg, borderBottomRightRadius: 4 },
  singleThem: { borderRadius: radius.lg, borderBottomLeftRadius: 4 },
  firstMe: { borderRadius: radius.lg, borderBottomRightRadius: radius.md, marginBottom: 2 },
  firstThem: { borderRadius: radius.lg, borderBottomLeftRadius: radius.md, marginBottom: 2 },
  middle: { borderRadius: radius.md, marginBottom: 2 },
  lastMe: { borderRadius: radius.lg, borderTopRightRadius: radius.md, borderBottomRightRadius: 4 },
  lastThem: { borderRadius: radius.lg, borderTopLeftRadius: radius.md, borderBottomLeftRadius: 4 },
});

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing[2], maxWidth: '100%' },
  wrapMe: { justifyContent: 'flex-end' },
  wrapThem: { justifyContent: 'flex-start' },
  avatarSlot: { width: 32 },
  bubbles: { maxWidth: '76%', gap: 0 },
  bubblesMe: { alignItems: 'flex-end' },
  time: { fontSize: 10, color: colors.textLight, marginTop: spacing[1.5], marginHorizontal: spacing[1] },
  timeMe: { textAlign: 'right' },
});
