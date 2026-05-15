/** Chuẩn hóa URL ảnh — thay localhost bằng IP LAN từ EXPO_PUBLIC_API_URL */
export function formatImageUrl(url?: string | null): string {
  if (!url) return '';
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || '';
  const ipMatch = apiUrl.match(/http:\/\/((\d+\.){3}\d+)/);
  if (ipMatch && (url.includes('localhost') || url.includes('127.0.0.1'))) {
    return url.replace(/localhost|127\.0\.0\.1/g, ipMatch[1]);
  }
  return url;
}
