import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ChatHub from '../ChatHub';
import { prepareChatImage } from '../prepareChatImage';
import { logChatImageError, uploadChatImage } from '../uploadChatImage';

export function useSendChatImage(conversationId: string) {
  const [uploading, setUploading] = useState(false);

  const pickAndSend = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Quyền truy cập', 'Cần quyền thư viện ảnh để gửi hình.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    try {
      const asset = result.assets[0];
      const prepared = await prepareChatImage(asset.uri);
      const uploaded = await uploadChatImage(
        conversationId,
        prepared.uri,
        prepared.mimeType,
        prepared.filename,
      );
      await ChatHub.sendImageMessage(conversationId, uploaded.photoUrl, uploaded.previewUrl);
    } catch (err) {
      const msg = logChatImageError(err, 'pickAndSend');
      Alert.alert('Không gửi được ảnh', msg);
    } finally {
      setUploading(false);
    }
  }, [conversationId]);

  return { uploading, pickAndSend };
}
