import * as ImageManipulator from 'expo-image-manipulator';

/** Chuẩn hóa ảnh về JPEG trước khi upload (tránh HEIC / lỗi server). */
export async function prepareChatImage(uri: string): Promise<{ uri: string; mimeType: string; filename: string }> {
  const manipulated = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1920 } }],
    { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
  );
  return {
    uri: manipulated.uri,
    mimeType: 'image/jpeg',
    filename: `chat_${Date.now()}.jpg`,
  };
}
