import { Platform } from 'react-native';

/**
 * Appends a local URI file to a FormData object.
 * On Web, it fetches the URI (blob: or data:) and converts it to a native Blob before appending.
 * On Native, it uses the standard React Native object representation { uri, name, type }.
 */
export async function appendFileToFormData(
  form: FormData,
  fieldName: string,
  uri: string,
  filename: string,
  mimeType: string
): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      form.append(fieldName, blob, filename);
    } catch (error) {
      console.error('Failed to convert uri to blob on web', error);
      form.append(fieldName, {
        uri,
        name: filename,
        type: mimeType,
      } as any);
    }
  } else {
    form.append(fieldName, {
      uri,
      name: filename,
      type: mimeType,
    } as any);
  }
}
