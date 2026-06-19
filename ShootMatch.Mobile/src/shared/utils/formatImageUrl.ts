/** Chuẩn hóa URL ảnh — thay domain cũ thành EXPO_PUBLIC_API_URL */
export function formatImageUrl(url?: string | null): string {
  if (!url) return '';
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || '';
  
  if (url.includes('trycloudflare.com') || url.includes('localhost') || url.includes('127.0.0.1')) {
    try {
      const parsed = new URL(url);
      return `${apiUrl}${parsed.pathname}${parsed.search}`;
    } catch {
      return url;
    }
  }
  
  if (url.startsWith('/')) {
    return `${apiUrl}${url}`;
  }
  
  return url;
}
